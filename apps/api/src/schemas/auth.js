"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    org_name: zod_1.z.string().min(1).max(100),
    user_name: zod_1.z.string().min(1).max(100)
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string()
});
exports.refreshSchema = zod_1.z.object({
    refresh_token: zod_1.z.string()
});
//# sourceMappingURL=auth.js.map