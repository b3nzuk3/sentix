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
  files: z.array(z.instanceof(File)).optional(), // handled by multer
  text: z.string().optional(), // for manual entry
  account_name: z.string().optional(),
});
