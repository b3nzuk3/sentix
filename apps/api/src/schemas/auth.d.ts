import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    org_name: z.ZodString;
    user_name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    org_name: string;
    user_name: string;
}, {
    email: string;
    password: string;
    org_name: string;
    user_name: string;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const refreshSchema: z.ZodObject<{
    refresh_token: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refresh_token: string;
}, {
    refresh_token: string;
}>;
//# sourceMappingURL=auth.d.ts.map