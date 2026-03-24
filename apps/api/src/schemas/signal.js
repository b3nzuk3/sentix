"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSignalsSchema = exports.createSignalSchema = exports.SignalCategorySchema = exports.SignalSourceSchema = void 0;
const zod_1 = require("zod");
exports.SignalSourceSchema = zod_1.z.enum(['TRANSCRIPT', 'SLACK', 'HUBSPOT', 'ZENDESK', 'JIRA', 'MANUAL']);
exports.SignalCategorySchema = zod_1.z.enum(['COMPLAINT', 'FEATURE_REQUEST', 'BUG', 'QUESTION', 'PRAISE']);
exports.createSignalSchema = zod_1.z.object({
    text: zod_1.z.string().min(1),
    source_type: exports.SignalSourceSchema,
    account_name: zod_1.z.string().optional(),
    signal_type: exports.SignalCategorySchema.optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
exports.uploadSignalsSchema = zod_1.z.object({
    project_id: zod_1.z.string(),
    source_type: exports.SignalSourceSchema,
    files: zod_1.z.array(zod_1.z.instanceof(File)).optional(), // handled by multer
    text: zod_1.z.string().optional(), // for manual entry
    account_name: zod_1.z.string().optional(),
});
//# sourceMappingURL=signal.js.map