"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_utils_1 = require("../../utils/test-utils");
test_1.test.describe('Signals', () => {
    let authToken;
    let projectId;
    test_1.test.beforeAll(async () => {
        const res = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'signal@example.com',
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
    (0, test_1.test)('POST /signals/upload with text creates signal', async () => {
        const response = await (0, test_utils_1.request)().post('/signals/upload', {
            headers: {
                ...(0, test_utils_1.authHeader)(authToken),
                'Content-Type': 'application/json'
            },
            body: {
                project_id: projectId,
                source_type: 'MANUAL',
                text: 'Test signal content'
            }
        });
        (0, test_1.expect)(response.status).toBe(201);
        (0, test_1.expect)(response.body).toHaveProperty('count', 1);
        (0, test_1.expect)(response.body.signals).toHaveLength(1);
        (0, test_1.expect)(response.body.signals[0].text).toBe('Test signal content');
    });
    (0, test_1.test)('GET /signals/:projectId returns signals', async () => {
        const response = await (0, test_utils_1.request)().get(`/signals/${projectId}`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(response.body).toHaveProperty('signals');
        (0, test_1.expect)(response.body).toHaveProperty('pagination');
        (0, test_1.expect)(Array.isArray(response.body.signals)).toBe(true);
    });
    (0, test_1.test)('DELETE /signals/:id removes signal', async () => {
        // First create a signal
        const createRes = await (0, test_utils_1.request)().post('/signals/upload', {
            headers: {
                ...(0, test_utils_1.authHeader)(authToken),
                'Content-Type': 'application/json'
            },
            body: {
                project_id: projectId,
                source_type: 'MANUAL',
                text: 'To be deleted'
            }
        });
        const signalId = createRes.body.signals[0].id;
        const response = await (0, test_utils_1.request)().delete(`/signals/${signalId}`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(response.status).toBe(204);
        // Verify deleted
        const getRes = await (0, test_utils_1.request)().get(`/signals/${signalId}`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(getRes.status).toBe(404);
    });
    (0, test_1.test)('POST /signals/upload without auth returns 401', async () => {
        const response = await (0, test_utils_1.request)().post('/signals/upload', {
            headers: { 'Content-Type': 'application/json' },
            body: {
                project_id: projectId,
                source_type: 'MANUAL',
                text: 'Test'
            }
        });
        (0, test_1.expect)(response.status).toBe(401);
    });
});
//# sourceMappingURL=signals.test.js.map