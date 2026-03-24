"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
async function registerRoutes(server) {
    // POST /signals/upload - Upload signals via file or manual entry
    server.post('/signals/upload', {
        preValidation: [server.authenticate],
        schema: {
            body: {
                project_id: true,
                source_type: true,
                files: true,
                text: true,
                account_name: true,
            },
            multipart: true,
        },
    }, async (request, reply) => {
        const user = request.user;
        const body = request.body;
        const { project_id, source_type, files, text, account_name } = body;
        // Verify project belongs to user's org
        const project = await request.prisma.project.findUnique({
            where: { id: project_id },
        });
        if (!project || project.organization_id !== user.organization_id) {
            throw reply.code(403).send({ error: 'Forbidden', message: 'Invalid project' });
        }
        const signalsToCreate = [];
        // Handle file uploads
        if (files && files.length > 0) {
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            const MAX_RECORDS = 10000;
            for (const file of files) {
                const fileData = file;
                if (fileData.file.size > MAX_FILE_SIZE) {
                    throw reply.code(400).send({
                        error: 'FileTooLarge',
                        message: `File ${fileData.file.name} exceeds 10MB limit`,
                    });
                }
                const fileContent = fileData.file.buffer.toString('utf-8');
                const records = parseSignalFile(fileContent, fileData.file.name);
                if (records.length > MAX_RECORDS) {
                    throw reply.code(400).send({
                        error: 'TooManyRecords',
                        message: 'Upload would exceed maximum record limit',
                    });
                }
                for (const record of records) {
                    signalsToCreate.push({
                        project_id,
                        source_type: record.source_type || source_type,
                        text: record.text,
                        account_name: record.account_name || account_name,
                        metadata: record.metadata ? { ...record.metadata, uploaded_filename: fileData.file.name } : { uploaded_filename: fileData.file.name },
                    });
                }
            }
        }
        // Handle manual text entry (single signal)
        if (text) {
            signalsToCreate.push({
                project_id,
                source_type,
                text,
                account_name,
                metadata: { manual_entry: true },
            });
        }
        if (signalsToCreate.length === 0) {
            throw reply.code(400).send({ error: 'BadRequest', message: 'No signals provided' });
        }
        const createdSignals = await request.prisma.signal.createMany({
            data: signalsToCreate,
            skipDuplicates: true,
        });
        // Return count and first 10 signals for preview
        const previewSignals = signalsToCreate.slice(0, 10);
        return reply.status(201).send({
            count: createdSignals.count,
            signals: previewSignals,
        });
    });
    // GET /signals/:projectId - List signals for a project
    server.get('/signals/:projectId', { preValidation: [server.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { projectId } = request.params;
        const { page = 1, limit = 50, source_type, account_name, from, to } = request.query;
        // Verify project belongs to user's org
        const project = await request.prisma.project.findUnique({
            where: { id: projectId },
        });
        if (!project || project.organization_id !== user.organization_id) {
            throw reply.code(403).send({ error: 'Forbidden', message: 'Invalid project' });
        }
        const where = { project_id: projectId };
        if (source_type) {
            where.source_type = source_type;
        }
        if (account_name) {
            where.account_name = { contains: account_name, mode: 'insensitive' };
        }
        if (from || to) {
            where.created_at = {};
            if (from)
                where.created_at.gte = new Date(from);
            if (to)
                where.created_at.lte = new Date(to);
        }
        const [signals, total] = await Promise.all([
            request.prisma.signal.findMany({
                where,
                orderBy: { created_at: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            request.prisma.signal.count({ where }),
        ]);
        return reply.send({
            signals,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    });
    // GET /signals/:id - Get single signal
    server.get('/signals/:id', { preValidation: [server.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const signal = await request.prisma.signal.findUnique({
            where: { id },
        });
        if (!signal) {
            throw reply.code(404).send({ error: 'NotFound', message: 'Signal not found' });
        }
        // Verify access via project
        const project = await request.prisma.project.findUnique({
            where: { id: signal.project_id },
        });
        if (!project || project.organization_id !== user.organization_id) {
            throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
        }
        return reply.send(signal);
    });
    // DELETE /signals/:id - Delete a signal
    server.delete('/signals/:id', { preValidation: [server.authenticate] }, async (request, reply) => {
        const user = request.user;
        const { id } = request.params;
        const signal = await request.prisma.signal.findUnique({
            where: { id },
            include: {
                project: true,
            },
        });
        if (!signal) {
            throw reply.code(404).send({ error: 'NotFound', message: 'Signal not found' });
        }
        if (signal.project.organization_id !== user.organization_id) {
            throw reply.code(403).send({ error: 'Forbidden', message: 'Access denied' });
        }
        // Check if signal is referenced in any analysis (evidence_ids)
        const analysesWithSignal = await request.prisma.analysisTheme.findMany({
            where: {
                analysis: {
                    project_id: signal.project_id,
                },
            },
        });
        const isReferenced = analysesWithSignal.some(at => {
            const evidence = at.evidence_ids || [];
            return evidence.includes(id);
        });
        if (isReferenced) {
            throw reply.code(400).send({
                error: 'Conflict',
                message: 'Cannot delete signal that is referenced in an analysis',
            });
        }
        await request.prisma.signal.delete({
            where: { id },
        });
        return reply.code(204).send();
    });
}
// Helper: parse signal file content (CSV, JSON, TXT)
function parseSignalFile(content, filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    try {
        if (ext === 'json') {
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                return data.map(item => ({
                    text: item.text || item.content || item.message || '',
                    source_type: item.source_type,
                    account_name: item.account_name,
                    metadata: item.metadata || item,
                })).filter(item => item.text);
            }
            // Single JSON object
            return [{
                    text: data.text || data.content || data.message || '',
                    source_type: data.source_type,
                    account_name: data.account_name,
                    metadata: data.metadata || data,
                }].filter(item => item.text);
        }
        if (ext === 'csv') {
            const lines = content.trim().split('\n');
            if (lines.length < 2)
                return [];
            // Check if first line is header
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const hasHeader = headers.includes('text') || headers.includes('content') || headers.includes('message');
            const records = [];
            if (hasHeader) {
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const obj = {};
                    headers.forEach((h, idx) => obj[h] = values[idx]);
                    records.push(obj);
                }
            }
            else {
                // Assume each line is a signal text
                return lines
                    .filter(line => line.trim())
                    .map(line => ({ text: line.trim() }));
            }
            return records
                .map(item => ({
                text: item.text || item.content || item.message || '',
                source_type: item.source_type,
                account_name: item.account_name,
                metadata: item,
            }))
                .filter(item => item.text);
        }
        // TXT or unknown - treat each non-empty line as a signal
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .map(text => ({ text }));
    }
    catch (error) {
        throw new Error(`Failed to parse ${filename}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
//# sourceMappingURL=signals.js.map