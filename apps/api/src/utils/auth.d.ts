import { FastifyRequest } from 'fastify';
export interface TokenPayload {
    user_id: string;
    org_id: string;
    role: string;
}
export declare function signAccessToken(payload: TokenPayload): string;
export declare function signRefreshToken(payload: TokenPayload): string;
export declare function verifyAccessToken(token: string): TokenPayload;
export declare function authenticateRequest(request: FastifyRequest, _token: string): Promise<void>;
//# sourceMappingURL=auth.d.ts.map