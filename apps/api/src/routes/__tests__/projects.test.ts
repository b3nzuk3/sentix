import { request, authHeader } from '../../utils/test-utils';

describe('Projects', () => {
  let authToken: string;

  beforeAll(async () => {
    const res = await request().post('/auth/register', {
      body: {
        email: 'proj@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });
    authToken = res.body.tokens.access_token;
  });

  test('POST /projects creates project', async () => {
    const response = await request().post('/projects', {
      headers: authHeader(authToken),
      body: { name: 'My Project', description: 'Test project' }
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('My Project');
    expect(response.body.organization_id).toBeDefined();
  });

  test('GET /projects returns list', async () => {
    const response = await request().get('/projects', { headers: authHeader(authToken) });
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /projects/:id returns single project', async () => {
    const createRes = await request().post('/projects', {
      headers: authHeader(authToken),
      body: { name: 'Project 2' }
    });
    const projectId = createRes.body.id;

    const response = await request().get(`/projects/${projectId}`, { headers: authHeader(authToken) });
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(projectId);
  });

  test('PATCH /projects/:id updates project', async () => {
    const createRes = await request().post('/projects', {
      headers: authHeader(authToken),
      body: { name: 'Project 3' }
    });
    const projectId = createRes.body.id;

    const response = await request().patch(`/projects/${projectId}`, {
      headers: authHeader(authToken),
      body: { description: 'Updated description' }
    });

    expect(response.status).toBe(200);
    expect(response.body.description).toBe('Updated description');
    expect(response.body.name).toBe('Project 3');
  });

  test('DELETE /projects/:id removes project', async () => {
    const createRes = await request().post('/projects', {
      headers: authHeader(authToken),
      body: { name: 'To Delete' }
    });
    const projectId = createRes.body.id;

    const response = await request().delete(`/projects/${projectId}`, { headers: authHeader(authToken) });
    expect(response.status).toBe(204);

    const getRes = await request().get(`/projects/${projectId}`, { headers: authHeader(authToken) });
    expect(getRes.status).toBe(404);
  });

  test('POST /projects without auth returns 401', async () => {
    const response = await request().post('/projects', {
      body: { name: 'No Auth Project' }
    });
    expect(response.status).toBe(401);
  });
});
