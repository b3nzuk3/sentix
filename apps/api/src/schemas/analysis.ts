import { z } from 'zod';

// Synthesize schemas (moved to separate file)
// Kept here temporarily until synthesize.ts is created

export const projectIdParamSchema = z.object({
  projectId: z.string(),
});

export const analysisIdParamSchema = z.object({
  id: z.string(),
});

export const analysisThemeIdParamSchema = z.object({
  analysisThemeId: z.string(),
});
