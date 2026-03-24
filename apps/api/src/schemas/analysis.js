"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeSchema = void 0;
const zod_1 = require("zod");
exports.synthesizeSchema = zod_1.z.object({
    project_id: zod_1.z.string(),
    options: zod_1.z.object({
        signal_limit: zod_1.z.number().int().positive().optional(),
    }).optional(),
});
//# sourceMappingURL=analysis.js.map