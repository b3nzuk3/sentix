import { z } from 'zod';

export const SignalSourceSchema = z.enum(['TRANSCRIPT', 'SLACK', 'HUBSPOT', 'ZENDESK', 'JIRA', 'MANUAL']);
export const SignalCategorySchema = z.enum(['COMPLAINT', 'FEATURE_REQUEST', 'BUG', 'QUESTION', 'PRAISE']);

export const createSignalSchema = z.object({
  text: z.string().min(1),
  source_type: SignalSourceSchema,
  account_name: z.string().optional(),
  signal_type: SignalCategorySchema.optional(),
  metadata: z.record(z.any()).optional(),
});

export const uploadSignalsSchema = z.object({
  project_id: z.string(),
  source_type: SignalSourceSchema,
  // files validated manually for size/type; any shape accepted
  files: z.any().optional(),
  text: z.string().optional(),
  account_name: z.string().optional(),
});

export const signalQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().optional().default(50),
  source_type: SignalSourceSchema.optional(),
  account_name: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export const projectIdParamSchema = z.object({
  projectId: z.string(),
});

export const signalIdParamSchema = z.object({
  id: z.string(),
});
