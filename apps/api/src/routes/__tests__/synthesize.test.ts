import { test, expect } from '@playwright/test';
import { request, authHeader } from '../../utils/test-utils';

test.describe('Synthesize', () => {
  let authToken: string;
  let projectId: string;

  test.beforeAll(async () => {
    const res = await request().post('/auth/register', {
      body: {
        email: 'synth@example.com',
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

  test('POST /synthesize creates job and returns queued status', async () => {
    const response = await request().post('/synthesize', {
      headers: authHeader(authToken),
      body: { project_id: projectId }
    });

    expect(response.status).toBe(202);
    expect(response.body).toHaveProperty('job_id');
    expect(response.body).toHaveProperty('analysis_id');
    expect(response.body.status).toBe('queued');
  });

  test('GET /synthesize/:job_id returns job status', async () => {
    // First, create a synthesis job
    const synthRes = await request().post('/synthesize', {
      headers: authHeader(authToken),
      body: { project_id: projectId }
    });
    const jobId = synthRes.body.job_id;

    // Poll for status
    const response = await request().get(`/synthesize/${jobId}`, {
      headers: authHeader(authToken)
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    // Status could be 'waiting', 'active', 'completed', or 'failed'
    expect(['waiting', 'active', 'completed', 'failed']).toContain(response.body.status);
  });

  test('POST /synthesize without auth returns 401', async () => {
    const response = await request().post('/synthesize', {
      body: { project_id: projectId }
    });
    expect(response.status).toBe(401);
  });
});
