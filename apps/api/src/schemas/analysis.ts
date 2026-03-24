import { z } from 'zod';

export const synthesizeSchema = z.object({
  project_id: z.string(),
  options: z.object({
    signal_limit: z.number().int().positive().optional(),
  }).optional(),
});
