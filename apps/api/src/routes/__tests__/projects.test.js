"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const test_utils_1 = require("../../utils/test-utils");
test_1.test.describe('Projects', () => {
    let authToken;
    test_1.test.beforeAll(async () => {
        const res = await (0, test_utils_1.request)().post('/auth/register', {
            body: {
                email: 'proj@example.com',
                password: 'password123',
                org_name: 'Test Org',
                user_name: 'Test User'
            }
        });
        authToken = res.body.tokens.access_token;
    });
    (0, test_1.test)('POST /projects creates project', async () => {
        const response = await (0, test_utils_1.request)().post('/projects', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { name: 'My Project', description: 'Test project' }
        });
        (0, test_1.expect)(response.status).toBe(201);
        (0, test_1.expect)(response.body).toHaveProperty('id');
        (0, test_1.expect)(response.body.name).toBe('My Project');
        (0, test_1.expect)(response.body.organization_id).toBeDefined();
    });
    (0, test_1.test)('GET /projects returns list', async () => {
        const response = await (0, test_utils_1.request)().get('/projects', { headers: (0, test_utils_1.authHeader)(authToken) });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(Array.isArray(response.body)).toBe(true);
    });
    (0, test_1.test)('GET /projects/:id returns single project', async () => {
        const createRes = await (0, test_utils_1.request)().post('/projects', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { name: 'Project 2' }
        });
        const projectId = createRes.body.id;
        const response = await (0, test_utils_1.request)().get(`/projects/${projectId}`, { headers: (0, test_utils_1.authHeader)(authToken) });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(response.body.id).toBe(projectId);
    });
    (0, test_1.test)('PATCH /projects/:id updates project', async () => {
        const createRes = await (0, test_utils_1.request)().post('/projects', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { name: 'Project 3' }
        });
        const projectId = createRes.body.id;
        const response = await (0, test_utils_1.request)().patch(`/projects/${projectId}`, {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { description: 'Updated description' }
        });
        (0, test_1.expect)(response.status).toBe(200);
        (0, test_1.expect)(response.body.description).toBe('Updated description');
        (0, test_1.expect)(response.body.name).toBe('Project 3');
    });
    (0, test_1.test)('DELETE /projects/:id removes project', async () => {
        const createRes = await (0, test_utils_1.request)().post('/projects', {
            headers: (0, test_utils_1.authHeader)(authToken),
            body: { name: 'To Delete' }
        });
        const projectId = createRes.body.id;
        const response = await (0, test_utils_1.request)().delete(`/projects/${projectId}`, { headers: (0, test_utils_1.authHeader)(authToken) });
        (0, test_1.expect)(response.status).toBe(204);
        const getRes = await (0, test_utils_1.request)().get(`/projects/${projectId}`, { headers: (0, test_utils_1.authHeader)(authToken) });
        (0, test_1.expect)(getRes.status).toBe(404);
    });
    (0, test_1.test)('POST /projects without auth returns 401', async () => {
        const response = await (0, test_utils_1.request)().post('/projects', {
            body: { name: 'No Auth Project' }
        });
        (0, test_1.expect)(response.status).toBe(401);
    });
});
//# sourceMappingURL=projects.test.js.map