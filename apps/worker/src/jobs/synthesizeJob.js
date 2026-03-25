"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processSynthesizeJob = processSynthesizeJob;
const db_1 = require("../db");
const openRouter_1 = require("../clients/openRouter");
const signalLinker_1 = require("../utils/signalLinker");
const core_1 = require("@sentix/core");
const pino_1 = __importDefault(require("pino"));
const openRouterClient = new openRouter_1.OpenRouterClient();
const signalLinker = new signalLinker_1.SignalLinker();
const logger = (0, pino_1.default)({ level: process.env.LOG_LEVEL || 'info' });
async function processSynthesizeJob(job) {
    const { analysis_id, project_id, user_id } = job.data;
    const jobLogger = logger.child({ job_id: job.id, analysis_id, project_id, user_id });
    const phases = ['Fetching context', 'AI extraction', 'Running engines', 'Saving results'];
    const totalPhases = phases.length;
    try {
        // Check for cancellation at start
        if (await checkCancellation(analysis_id)) {
            jobLogger.info('Job cancelled before start');
            return { analysis_id, status: 'cancelled' };
        }
        // --- Phase 1: Fetch project context (0-25%)
        job.updateProgress({ current: 1, total: totalPhases });
        jobLogger.info('Phase: Fetching context', { phase: 1 });
        await db_1.prisma.analysis.update({
            where: { id: analysis_id },
            data: { status: 'PROCESSING' }
        });
        const project = await db_1.prisma.project.findUnique({
            where: { id: project_id },
            include: {
                signals: {
                    orderBy: { created_at: 'desc' },
                    take: 500,
                    where: { deleted_at: null }
                },
                themes: { where: { deleted_at: null } },
                decisions: { orderBy: { created_at: 'desc' }, take: 20 },
                personas: { where: { deleted_at: null } },
                architectureComponents: {
                    where: { deleted_at: null },
                    status: { in: ['STABLE', 'IN_DEVELOPMENT'] }
                }
            }
        });
        if (!project) {
            throw new Error('Project not found');
        }
        // Build context for AI
        const context = {
            project: {
                name: project.name,
                description: project.description || ''
            },
            signals: project.signals.map(s => ({
                id: s.id,
                text: s.text,
                source: s.source_type,
                account: s.account_name
            })),
            existing_themes: project.themes.map(t => ({
                title: t.title,
                summary: t.summary
            })),
            past_decisions: project.decisions.map(d => ({
                title: d.title,
                description: d.description
            })),
            personas: project.personas,
            architectureComponents: project.architectureComponents
        };
        // Check cancellation before expensive AI call
        if (await checkCancellation(analysis_id)) {
            return { analysis_id, status: 'cancelled' };
        }
        // --- Phase 2: AI extraction (25-50%)
        job.updateProgress({ current: 2, total: totalPhases });
        jobLogger.info('Phase: AI extraction', { signal_count: project.signals.length });
        const extractedThemes = await openRouterClient.extractThemes(context);
        // Check cancellation before engines
        if (await checkCancellation(analysis_id)) {
            return { analysis_id, status: 'cancelled' };
        }
        // --- Phase 3: Run deterministic engines (50-75%)
        job.updateProgress({ current: 3, total: totalPhases });
        jobLogger.info('Phase: Running engines', { theme_count: extractedThemes.length });
        // Fetch existing themes for deduplication
        const existingThemes = await db_1.prisma.theme.findMany({
            where: { project_id, deleted_at: null },
            orderBy: { created_at: 'desc' },
            take: 100
        });
        const analysisThemesData = [];
        for (let i = 0; i < extractedThemes.length; i++) {
            // Periodic cancellation check (every 5 themes)
            if (i % 5 === 0 && await checkCancellation(analysis_id)) {
                throw new Error('Job cancelled by user');
            }
            const extractedTheme = extractedThemes[i];
            // Deduplication: find existing theme with similar title
            const matchingExisting = findSimilarTheme(extractedTheme.title, existingThemes, 0.85);
            let themeId;
            const themeTitleSnapshot = extractedTheme.title;
            if (matchingExisting) {
                themeId = matchingExisting.id;
            }
            else {
                // Create new Theme
                const newTheme = await db_1.prisma.theme.create({
                    data: {
                        project_id,
                        title: extractedTheme.title,
                        summary: extractedTheme.reason,
                        confidence: extractedTheme.confidence
                    }
                });
                themeId = newTheme.id;
            }
            // Link supporting signals using TF-IDF + AI evidence
            // First link using simplified signal objects (id, text only)
            const linkedSignalRefs = signalLinker.linkSignals({
                title: extractedTheme.title,
                reason: extractedTheme.reason,
                evidence: extractedTheme.evidence
            }, project.signals.map(s => ({ id: s.id, text: s.text })));
            // Map back to full Signal objects from project.signals to include all fields (e.g., signal_type)
            const linkedSignalIds = new Set(linkedSignalRefs.map(s => s.id));
            const supportingSignals = project.signals.filter(s => linkedSignalIds.has(s.id));
            // Run engines in parallel
            const [revenue, churn, effort] = await Promise.all([
                revenueEngine.analyzeRevenue(supportingSignals),
                churnEngine.analyzeChurn(supportingSignals),
                effortEngine.estimate({ title: extractedTheme.title, summary: extractedTheme.reason }, supportingSignals)
            ]);
            const priority = (0, core_1.decide)({
                revenue_lost: revenue.total_lost,
                revenue_at_risk: revenue.at_risk,
                churn_probability: churn.risk,
                effort_bucket: effort.bucket
            });
            analysisThemesData.push({
                title: themeTitleSnapshot,
                theme: { connect: { id: themeId } },
                roadmap_bucket: priority.bucket,
                revenue_lost: revenue.total_lost,
                revenue_at_risk: revenue.at_risk,
                churn_probability: churn.risk,
                effort_days: effort.estimate,
                effort_bucket: effort.bucket,
                confidence: priority.confidence,
                evidence_ids: supportingSignals.map(s => s.id),
                engine_outputs: {
                    revenue: { total_lost: revenue.total_lost, at_risk: revenue.at_risk },
                    churn: { risk: churn.risk },
                    effort: { bucket: effort.bucket, estimate: effort.estimate },
                    priority: { bucket: priority.bucket, confidence: priority.confidence }
                }
            });
        }
        // --- Phase 4: Persist results (75-100%)
        job.updateProgress({ current: 4, total: totalPhases });
        jobLogger.info('Phase: Saving results', { theme_count: analysisThemesData.length });
        const total_revenue_lost = analysisThemesData.reduce((sum, t) => sum + (t.revenue_lost || 0), 0);
        const total_revenue_at_risk = analysisThemesData.reduce((sum, t) => sum + (t.revenue_at_risk || 0), 0);
        await db_1.prisma.analysis.update({
            where: { id: analysis_id },
            data: {
                status: 'COMPLETED',
                total_revenue_lost,
                total_revenue_at_risk,
                themes: { create: analysisThemesData }
            }
        });
        job.updateProgress({ current: totalPhases, total: totalPhases });
        jobLogger.info('Synthesis complete', { analysis_id, theme_count: analysisThemesData.length });
        return { analysis_id, theme_count: analysisThemesData.length };
    }
    catch (error) {
        jobLogger.error({ error: error instanceof Error ? error.message : error }, 'Synthesis failed');
        // Do not mark as FAILED if cancelled
        if (error.message === 'Job cancelled by user') {
            try {
                await db_1.prisma.analysis.update({
                    where: { id: analysis_id },
                    data: { status: 'CANCELLED' }
                });
            }
            catch (e) {
                jobLogger.error({ error: e }, 'Failed to mark analysis as cancelled');
            }
            throw new Error('Job cancelled'); // Will not be retried
        }
        try {
            await db_1.prisma.analysis.update({
                where: { id: analysis_id },
                data: {
                    status: 'FAILED',
                    error_message: error instanceof Error ? error.message : String(error)
                }
            });
        }
        catch (updateError) {
            jobLogger.error({ error: updateError }, 'Failed to update analysis status');
        }
        throw error; // BullMQ retries per job options
    }
}
async function checkCancellation(analysis_id) {
    const analysis = await db_1.prisma.analysis.findUnique({
        select: { status: true },
        where: { id: analysis_id }
    });
    return analysis?.status === 'CANCELLED';
}
function findSimilarTheme(title, existingThemes, threshold) {
    const normalize = (t) => t.toLowerCase().trim();
    const titleNorm = normalize(title);
    if (!titleNorm)
        return null;
    for (const theme of existingThemes) {
        const themeNorm = normalize(theme.title);
        if (!themeNorm)
            continue;
        // Simple Jaccard similarity on token sets
        const titleTokens = new Set(titleNorm.split(/\s+/).filter(t => t.length > 2));
        const themeTokens = new Set(themeNorm.split(/\s+/).filter(t => t.length > 2));
        if (titleTokens.size === 0 || themeTokens.size === 0)
            continue;
        const intersection = new Set([...titleTokens].filter(t => themeTokens.has(t)));
        const union = new Set([...titleTokens, ...themeTokens]);
        const jaccard = intersection.size / union.size;
        if (jaccard >= threshold) {
            return theme;
        }
    }
    return null;
}
//# sourceMappingURL=synthesizeJob.js.map