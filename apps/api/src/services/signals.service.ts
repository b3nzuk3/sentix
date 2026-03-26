import { PrismaClient } from '@prisma/client';
import { parseSignalFile } from '../utils/signal-parser';

export interface SignalsService {
  uploadSignals(
    organizationId: string,
    projectId: string,
    sourceType: string,
    files?: any[],
    text?: string,
    accountName?: string
  ): Promise<{ count: number; signals: any[] }>;

  listSignals(
    organizationId: string,
    projectId: string,
    options: {
      page?: number;
      limit?: number;
      source_type?: string;
      account_name?: string;
      from?: Date;
      to?: Date;
    }
  ): Promise<{ signals: any[]; pagination: { page: number; limit: number; total: number; pages: number } }>;

  getSignal(organizationId: string, signalId: string): Promise<any>;

  deleteSignal(organizationId: string, signalId: string): Promise<void>;
}

export function createSignalsService(prisma: PrismaClient): SignalsService {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_RECORDS = 10000;

  return {
    async uploadSignals(organizationId, projectId, sourceType, files, text, accountName) {
      // Verify project belongs to org
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Invalid project' };
      }

      const signalsToCreate: Array<{
        project_id: string;
        source_type: string;
        text: string;
        account_name?: string;
        metadata?: any;
      }> = [];

      // Handle file uploads
      if (files && files.length > 0) {
        for (const file of files) {
          const fileData = file as any;
          if (fileData.file.size > MAX_FILE_SIZE) {
            throw { statusCode: 400, error: 'FILE_TOO_LARGE', message: `File ${fileData.file.name} exceeds 10MB limit` };
          }

          const fileContent = fileData.file.buffer.toString('utf-8');
          const records = parseSignalFile(fileContent, fileData.file.name);

          if (records.length > MAX_RECORDS) {
            throw { statusCode: 400, error: 'TOO_MANY_RECORDS', message: 'Upload would exceed maximum record limit' };
          }

          for (const record of records) {
            signalsToCreate.push({
              project_id: projectId,
              source_type: record.source_type || sourceType,
              text: record.text,
              account_name: record.account_name || accountName,
              metadata: record.metadata ? { ...record.metadata, uploaded_filename: fileData.file.name } : { uploaded_filename: fileData.file.name },
            });
          }
        }
      }

      // Handle manual text entry
      if (text) {
        signalsToCreate.push({
          project_id: projectId,
          source_type: sourceType,
          text,
          account_name: accountName,
          metadata: { manual_entry: true },
        });
      }

      if (signalsToCreate.length === 0) {
        throw { statusCode: 400, error: 'BAD_REQUEST', message: 'No signals provided' };
      }

      const createdSignals = await prisma.signal.createMany({
        data: signalsToCreate,
        skipDuplicates: true,
      });

      const previewSignals = signalsToCreate.slice(0, 10);
      return { count: createdSignals.count, signals: previewSignals };
    },

    async listSignals(organizationId, projectId, options) {
      // Verify project belongs to org
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project || project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Invalid project' };
      }

      const { page = 1, limit = 50, source_type, account_name, from, to } = options;
      const where: any = { project_id: projectId };

      if (source_type) where.source_type = source_type;
      if (account_name) where.account_name = { contains: account_name, mode: 'insensitive' };
      if (from || to) {
        where.created_at = {};
        if (from) where.created_at.gte = from;
        if (to) where.created_at.lte = to;
      }

      const [signals, total] = await Promise.all([
        prisma.signal.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.signal.count({ where }),
      ]);

      return {
        signals,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    },

    async getSignal(organizationId, signalId) {
      const signal = await prisma.signal.findUnique({
        where: { id: signalId },
      });

      if (!signal) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Signal not found' };
      }

      // Verify access via project
      const project = await prisma.project.findUnique({
        where: { id: signal.project_id },
      });

      if (!project || project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      return signal;
    },

    async deleteSignal(organizationId, signalId) {
      const signal = await prisma.signal.findUnique({
        where: { id: signalId },
        include: { project: true },
      });

      if (!signal) {
        throw { statusCode: 404, error: 'NOT_FOUND', message: 'Signal not found' };
      }

      if (signal.project.organization_id !== organizationId) {
        throw { statusCode: 403, error: 'FORBIDDEN', message: 'Access denied' };
      }

      // Check if signal is referenced in any analysis (evidence_ids)
      const analysesWithSignal = await prisma.analysisTheme.findMany({
        where: {
          analysis: {
            project_id: signal.project_id,
          },
        },
      });

      const isReferenced = analysesWithSignal.some((at: any) => {
        const evidence = at.evidence_ids as string[] || [];
        return evidence.includes(signalId);
      });

      if (isReferenced) {
        throw { statusCode: 409, error: 'CONFLICT', message: 'Cannot delete signal that is referenced in an analysis' };
      }

      await prisma.signal.delete({ where: { id: signalId } });
    },
  };
}
