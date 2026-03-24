"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.authenticateRequest = authenticateRequest;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.API_SECRET_KEY, { expiresIn: '15m' });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, process.env.API_SECRET_KEY, { expiresIn: '30d' });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, process.env.API_SECRET_KEY);
}
async function authenticateRequest(request, _token) {
    const token = request.headers.authorization?.split(' ')[1];
    if (!token)
        throw new Error('Missing token');
    const payload = verifyAccessToken(token);
    // Verify user still exists
    const user = await request.prisma.user.findUnique({
        where: { id: payload.user_id },
        select: { id: true, organization_id: true, role: true }
    });
    if (!user)
        throw new Error('User not found');
    // Attach user to request
    request.user = user;
}
//# sourceMappingURL=auth.js.map