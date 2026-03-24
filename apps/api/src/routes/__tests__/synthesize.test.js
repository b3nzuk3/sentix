"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_utils_1 = require("../../utils/test-utils");
test_1.test.describe('Synthesize', () => {
    let authToken;
    let projectId;
    test_1.test.beforeAll(async () => {
        const res = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'synth@example.com',
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
    (0, test_1.test)('POST /synthesize creates job and returns queued status', async () => {
        const response = await (0, test_utils_1.request)().post('/synthesize', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { project_id: projectId }
        });
        (0, test_1.expect)(response.status).toBe(202);
        (0, test_1.expect)(response.body).toHaveProperty('job_id');
        (0, test_1.expect)(response.body).toHaveProperty('analysis_id');
        (0, test_1.expect)(response.body.status).toBe('queued');
    });
    (0, test_1.test)('GET /synthesize/:job_id returns job status', async () => {
        // First, create a synthesis job
        const synthRes = await (0, test_utils_1.request)().post('/synthesize', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { project_id: projectId }
        });
        const jobId = synthRes.body.job_id;
        // Poll for status
        const response = await (0, test_utils_1.request)().get(`/synthesize/${jobId}`, {
            headers: (0, test_utils_1.authHeader)(authToken)
        });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(response.body).toHaveProperty('status');
        // Status could be 'waiting', 'active', 'completed', or 'failed'
        (0, test_1.expect)(['waiting', 'active', 'completed', 'failed']).toContain(response.body.status);
    });
    (0, test_1.test)('POST /synthesize without auth returns 401', async () => {
        const response = await (0, test_utils_1.request)().post('/synthesize', {
            body: { project_id: projectId }
        });
        (0, test_1.expect)(response.status).toBe(401);
    });
});
//# sourceMappingURL=synthesize.test.js.map