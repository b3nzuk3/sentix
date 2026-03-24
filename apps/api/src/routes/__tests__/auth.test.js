"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_utils_1 = require("../../utils/test-utils");
test_1.test.describe('Authentication', () => {
    (0, test_1.test)('POST /auth/register creates org and user', async () => {
        const response = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'test@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        (0, test_1.expect)(response.status).toBe(201);
        (0, test_1.expect)(response.body).toHaveProperty('user');
        (0, test_1.expect)(response.body).toHaveProperty('org');
        (0, test_1.expect)(response.body).toHaveProperty('tokens');
        (0, test_1.expect)(response.body.user).toHaveProperty('id');
        (0, test_1.expect)(response.body.tokens).toHaveProperty('access_token');
        (0, test_1.expect)(response.body.tokens).toHaveProperty('refresh_token');
    });
    (0, test_1.test)('POST /auth/register with existing email returns 400', async () => {
        // First register
        await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'duplicate@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        // Second register with same email
        const response = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'duplicate@example.com',
                password: 'password123',
                org_name: 'Test Org 2',
                user_name: 'Test User 2'
            }
        });
        (0, test_1.expect)(response.status).toBe(400);
    });
    (0, test_1.test)('POST /auth/login returns tokens for valid credentials', async () => {
        // Register first
        await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'login@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        const response = await (0, test_utils_1.request)().post('/auth/login', {
            body: {
                email: 'login@example.com',
                password: 'password123'
            }
        });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(response.body).toHaveProperty('tokens');
        (0, test_1.expect)(response.body.tokens).toHaveProperty('access_token');
        (0, test_1.expect)(response.body.tokens).toHaveProperty('refresh_token');
    });
    (0, test_1.test)('POST /auth/login with invalid password returns 401', async () => {
        await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'badlogin@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        const response = await (0, test_utils_1.request)().post('/auth/login', {
            body: {
                email: 'badlogin@example.com',
                password: 'wrongpassword'
            }
        });
        (0, test_1.expect)(response.status).toBe(401);
    });
    (0, test_1.test)('POST /auth/refresh returns new access token', async () => {
        // Register and get refresh token
        const registerRes = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'refresh@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        const refreshToken = registerRes.body.tokens.refresh_token;
        const response = await (0, test_utils_1.request)().post('/auth/refresh', {
            body: { refresh_token: refreshToken }
        });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(response.body).toHaveProperty('tokens');
        (0, test_1.expect)(response.body.tokens).toHaveProperty('access_token');
        (0, test_1.expect)(response.body.tokens).not.toHaveProperty('refresh_token'); // Only returns access token
    });
    (0, test_1.test)('POST /auth/refresh with invalid token returns 401', async () => {
        const response = await (0, test_utils_1.request)().post('/auth/refresh', {
            body: { refresh_token: 'invalid-token' }
        });
        (0, test_1.expect)(response.status).toBe(401);
    });
});
//# sourceMappingURL=auth.test.js.map