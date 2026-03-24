"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServer = getServer;
exports.request = request;
exports.authHeader = authHeader;
const server_1 = require("../server");
let server = null;
let serverPromise = null;
function getServer() {
    if (!serverPromise) {
        serverPromise = (async () => {
            server = await (0, server_1.createServer)();
            return server;
        })();
    }
    return serverPromise;
}
function request() {
    const fastifyPromise = getServer();
    return {
        get: (url, options = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'GET', url, ...options })),
        post: (url, options = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'POST', url, ...options })),
        put: (url, options = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'PUT', url, ...options })),
        patch: (url, options = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'PATCH', url, ...options })),
        delete: (url, options = {}) => fastifyPromise.then(fastify => fastify.inject({ method: 'DELETE', url, ...options }))
    };
}
function authHeader(accessToken) {
    return { Authorization: `Bearer ${accessToken}` };
}
//# sourceMappingURL=test-utils.js.map