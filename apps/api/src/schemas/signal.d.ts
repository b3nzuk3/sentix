import { z } from 'zod';
export declare const SignalSourceSchema: z.ZodEnum<["TRANSCRIPT", "SLACK", "HUBSPOT", "ZENDESK", "JIRA", "MANUAL"]>;
export declare const SignalCategorySchema: z.ZodEnum<["COMPLAINT", "FEATURE_REQUEST", "BUG", "QUESTION", "PRAISE"]>;
export declare const createSignalSchema: z.ZodObject<{
    text: z.ZodString;
    source_type: z.ZodEnum<["TRANSCRIPT", "SLACK", "HUBSPOT", "ZENDESK", "JIRA", "MANUAL"]>;
    account_name: z.ZodOptional<z.ZodString>;
    signal_type: z.ZodOptional<z.ZodEnum<["COMPLAINT", "FEATURE_REQUEST", "BUG", "QUESTION", "PRAISE"]>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    source_type: "TRANSCRIPT" | "SLACK" | "HUBSPOT" | "ZENDESK" | "JIRA" | "MANUAL";
    text: string;
    account_name?: string | undefined;
    signal_type?: "COMPLAINT" | "FEATURE_REQUEST" | "BUG" | "QUESTION" | "PRAISE" | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    source_type: "TRANSCRIPT" | "SLACK" | "HUBSPOT" | "ZENDESK" | "JIRA" | "MANUAL";
    text: string;
    account_name?: string | undefined;
    signal_type?: "COMPLAINT" | "FEATURE_REQUEST" | "BUG" | "QUESTION" | "PRAISE" | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export declare const uploadSignalsSchema: z.ZodObject<{
    project_id: z.ZodString;
    source_type: z.ZodEnum<["TRANSCRIPT", "SLACK", "HUBSPOT", "ZENDESK", "JIRA", "MANUAL"]>;
    files: z.ZodOptional<z.ZodArray<z.ZodType<import("buffer").File, z.ZodTypeDef, import("buffer").File>, "many">>;
    text: z.ZodOptional<z.ZodString>;
    account_name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    source_type: "TRANSCRIPT" | "SLACK" | "HUBSPOT" | "ZENDESK" | "JIRA" | "MANUAL";
    project_id: string;
    text?: string | undefined;
    account_name?: string | undefined;
    files?: import("buffer").File[] | undefined;
}, {
    source_type: "TRANSCRIPT" | "SLACK" | "HUBSPOT" | "ZENDESK" | "JIRA" | "MANUAL";
    project_id: string;
    text?: string | undefined;
    account_name?: string | undefined;
    files?: import("buffer").File[] | undefined;
}>;
//# sourceMappingURL=signal.d.ts.map