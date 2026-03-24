import { z } from 'zod';
export declare const synthesizeSchema: z.ZodObject<{
    project_id: z.ZodString;
    options: z.ZodOptional<z.ZodObject<{
        signal_limit: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        signal_limit?: number | undefined;
    }, {
        signal_limit?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    options?: {
        signal_limit?: number | undefined;
    } | undefined;
}, {
    project_id: string;
    options?: {
        signal_limit?: number | undefined;
    } | undefined;
}>;
//# sourceMappingURL=analysis.d.ts.map