import { test, expect } from '@playwright/test';
import { request, authHeader } from '../../utils/test-utils';

test.describe('Analysis', () => {
  let authToken: string;
  let projectId: string;

  test.beforeAll(async () => {
    const res = await request().post('/auth/register', {
      body: {
        email: 'analysis@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });
    authToken = res.body.tokens.access_token;

    const projRes = await request().post('/projects', {
      headers: authHeader(authToken),
      body: { name: 'Test Project' }
    });
    projectId = projRes.body.id;
  });

  test('GET /projects/:projectId/analysis returns 404 when no analysis exists', async () => {
    const response = await request().get(`/projects/${projectId}/analysis`, {
      headers: authHeader(authToken)
    });
    expect(response.status).toBe(404);
  });

  test('GET /analysis/history/:projectId returns empty array initially', async () => {
    const response = await request().get(`/analysis/history/${projectId}`, {
      headers: authHeader(authToken)
    });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  test('GET /analysis/:id returns 404 for non-existent analysis', async () => {
    const response = await request().get(`/analysis/nonexistent-id`, {
      headers: authHeader(authToken)
    });
    expect(response.status).toBe(404);
  });
});
