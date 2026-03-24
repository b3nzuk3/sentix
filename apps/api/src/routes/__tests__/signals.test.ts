import { test, expect } from '@playwright/test';
import { request, authHeader } from '../../utils/test-utils';

test.describe('Signals', () => {
  let authToken: string;
  let projectId: string;

  test.beforeAll(async () => {
    const res = await request().post('/auth/register', {
      body: {
        email: 'signal@example.com',
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

  test('POST /signals/upload with text creates signal', async () => {
    const response = await request().post('/signals/upload', {
      headers: {
        ...authHeader(authToken),
        'Content-Type': 'application/json'
      },
      body: {
        project_id: projectId,
        source_type: 'MANUAL',
        text: 'Test signal content'
      }
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('count', 1);
    expect(response.body.signals).toHaveLength(1);
    expect(response.body.signals[0].text).toBe('Test signal content');
  });

  test('GET /signals/:projectId returns signals', async () => {
    const response = await request().get(`/signals/${projectId}`, {
      headers: authHeader(authToken)
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('signals');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.signals)).toBe(true);
  });

  test('DELETE /signals/:id removes signal', async () => {
    // First create a signal
    const createRes = await request().post('/signals/upload', {
      headers: {
        ...authHeader(authToken),
        'Content-Type': 'application/json'
      },
      body: {
        project_id: projectId,
        source_type: 'MANUAL',
        text: 'To be deleted'
      }
    });
    const signalId = createRes.body.signals[0].id;

    const response = await request().delete(`/signals/${signalId}`, {
      headers: authHeader(authToken)
    });
    expect(response.status).toBe(204);

    // Verify deleted
    const getRes = await request().get(`/signals/${signalId}`, {
      headers: authHeader(authToken)
    });
    expect(getRes.status).toBe(404);
  });

  test('POST /signals/upload without auth returns 401', async () => {
    const response = await request().post('/signals/upload', {
      headers: { 'Content-Type': 'application/json' },
      body: {
        project_id: projectId,
        source_type: 'MANUAL',
        text: 'Test'
      }
    });
    expect(response.status).toBe(401);
  });
});
