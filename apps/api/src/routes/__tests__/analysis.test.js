"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_utils_1 = require("../../utils/test-utils");
test_1.test.describe('Analysis', () => {
    let authToken;
    let projectId;
    test_1.test.beforeAll(async () => {
        const res = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'analysis@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        authToken = res.body.tokens.access_token;
        const projRes = await (0, test_utils_1.request)().post('/projects', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { name: 'Test Project' }
        });
        projectId = projRes.body.id;
    });
    (0, test_1.test)('GET /analysis/:projectId returns 404 when no analysis exists', async () => {
        const response = await (0, test_utils_1.request)().get(`/analysis/${projectId}`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(response.status).toBe(404);
    });
    (0, test_1.test)('GET /analysis/history/:projectId returns empty array initially', async () => {
        const response = await (0, test_utils_1.request)().get(`/analysis/history/${projectId}`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(Array.isArray(response.body)).toBe(true);
        (0, test_1.expect)(response.body).toHaveLength(0);
    });
    (0, test_1.test)('GET /analysis/:id returns 404 for non-existent analysis', async () => {
        const response = await (0, test_utils_1.request)().get(`/analysis/nonexistent-id`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(response.status).toBe(404);
    });
});
//# sourceMappingURL=analysis.test.js.map