import { FastifyInstance } from 'fastify';
export declare function getServer(): Promise<FastifyInstance> | null;
export declare function request(): {
    get: (url: string, options?: any) => Promise<any>;
    post: (url: string, options?: any) => Promise<any>;
    put: (url: string, options?: any) => Promise<any>;
    patch: (url: string, options?: any) => Promise<any>;
    delete: (url: string, options?: any) => Promise<any>;
};
export declare function authHeader(accessToken: string): {
    Authorization: string;
};
//# sourceMappingURL=test-utils.d.ts.map