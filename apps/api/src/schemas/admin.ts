import { z } from 'zod';

export const queueNameParamSchema = z.object({
  queueName: z.string(),
});
