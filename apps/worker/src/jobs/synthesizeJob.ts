import { Job } from 'bullmq';
import { prisma } from '../db';
import { OpenRouterClient } from '../clients/openRouter';
import { SignalLinker, findSimilarTheme } from '@sentix/core';
import {
  analyzeRevenue,
  analyzeChurn,
  estimate as effortEstimate,
  decide as priorityDecide
} from '@sentix/core';
import pino from 'pino';

const openRouterClient = new OpenRouterClient();
const signalLinker = new SignalLinker();

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export async function processSynthesizeJob(job: Job<any>) {
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
    await prisma.analysis.update({
      where: { id: analysis_id },
      data: { status: 'PROCESSING' }
    });

    const project = await prisma.project.findUnique({
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
          where: {
            deleted_at: null,
            status: { in: ['STABLE', 'IN_DEVELOPMENT'] }
          }
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
        ...(s.account_name !== null && { account_name: s.account_name })
      })),
      existing_themes: project.themes.map(t => ({
        title: t.title,
        summary: t.summary || ''
      })),
      past_decisions: project.decisions.map(d => ({
        title: d.title,
        description: d.description || ''
      })),
      personas: project.personas.map(p => ({
        name: p.name,
        description: p.description || ''
      })),
      architectureComponents: project.architectureComponents.map(ac => ({
        name: ac.name,
        status: ac.status,
        description: ac.description || ''
      }))
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
    const existingThemes = await prisma.theme.findMany({
      where: { project_id, deleted_at: null },
      orderBy: { created_at: 'desc' },
      take: 100
    });

    const analysisThemesData: any[] = [];

    for (let i = 0; i < extractedThemes.length; i++) {
      // Periodic cancellation check (every 5 themes)
      if (i % 5 === 0 && await checkCancellation(analysis_id)) {
        throw new Error('Job cancelled by user');
      }

      const extractedTheme = extractedThemes[i];

      // Deduplication: find existing theme with similar title
      const matchingExisting = findSimilarTheme(extractedTheme.title, existingThemes, 0.85);
      let themeId: string;
      const themeTitleSnapshot = extractedTheme.title;

      if (matchingExisting) {
        themeId = matchingExisting.id;
      } else {
        // Create new Theme
        const newTheme = await prisma.theme.create({
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
      const linkedSignalRefs = signalLinker.linkSignals(
        {
          title: extractedTheme.title,
          reason: extractedTheme.reason,
          evidence: extractedTheme.evidence
        },
        project.signals.map(s => ({ id: s.id, text: s.text }))
      );

      // Map back to full Signal objects from project.signals to include all fields (e.g., signal_type)
      const linkedSignalIds = new Set(linkedSignalRefs.map(s => s.id));
      const supportingSignals = project.signals
        .filter(s => linkedSignalIds.has(s.id))
        .map(s => ({
          id: s.id,
          text: s.text,
          account_name: s.account_name !== null ? s.account_name : undefined,
          created_at: s.created_at,
          project_id: s.project_id,
          source_type: s.source_type,
          signal_type: s.signal_type ?? undefined,
          metadata: s.metadata as any
        }));

      // Run engines in parallel
      const [revenue, churn, effort] = await Promise.all([
        analyzeRevenue(supportingSignals),
        analyzeChurn(supportingSignals),
        effortEstimate(
          { title: extractedTheme.title, summary: extractedTheme.reason },
          supportingSignals
        )
      ]);

      const priority = priorityDecide({
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

    await prisma.analysis.update({
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

  } catch (error) {
    jobLogger.error({ error: error instanceof Error ? error.message : error }, 'Synthesis failed');

    // Do not mark as FAILED if cancelled
    if ((error as Error).message === 'Job cancelled by user') {
      try {
        await prisma.analysis.update({
          where: { id: analysis_id },
          data: { status: 'CANCELLED' }
        });
      } catch (e) {
        jobLogger.error({ error: e }, 'Failed to mark analysis as cancelled');
      }
      throw new Error('Job cancelled'); // Will not be retried
    }

    try {
      await prisma.analysis.update({
        where: { id: analysis_id },
        data: {
          status: 'FAILED',
          error_message: error instanceof Error ? error.message : String(error)
        }
      });
    } catch (updateError) {
      jobLogger.error({ error: updateError }, 'Failed to update analysis status');
    }

    throw error; // BullMQ retries per job options
  }
}

async function checkCancellation(analysis_id: string): Promise<boolean> {
  const analysis = await prisma.analysis.findUnique({
    select: { status: true },
    where: { id: analysis_id }
  });
  return analysis?.status === 'CANCELLED';
}
