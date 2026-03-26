import { test, expect } from '@playwright/test';
import { request, authHeader } from '../../utils/test-utils';

test.describe('Authentication', () => {
  test('POST /auth/register creates org and user', async () => {
    const response = await request().post('/auth/register', {
      body: {
        email: 'test@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('org');
    expect(response.body).toHaveProperty('tokens');
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.tokens).toHaveProperty('access_token');
    expect(response.body.tokens).toHaveProperty('refresh_token');
  });

  test('POST /auth/register with existing email returns 400', async () => {
    // First register
    await request().post('/auth/register', {
      body: {
        email: 'duplicate@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });

    // Second register with same email
    const response = await request().post('/auth/register', {
      body: {
        email: 'duplicate@example.com',
        password: 'password123',
        org_name: 'Test Org 2',
        user_name: 'Test User 2'
      }
    });

    expect(response.status).toBe(400);
  });

  test('POST /auth/login returns tokens for valid credentials', async () => {
    // Register first
    await request().post('/auth/register', {
      body: {
        email: 'login@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });

    const response = await request().post('/auth/login', {
      body: {
        email: 'login@example.com',
        password: 'password123'
      }
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tokens');
    expect(response.body.tokens).toHaveProperty('access_token');
    expect(response.body.tokens).toHaveProperty('refresh_token');
  });

  test('POST /auth/login with invalid password returns 401', async () => {
    await request().post('/auth/register', {
      body: {
        email: 'badlogin@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });

    const response = await request().post('/auth/login', {
      body: {
        email: 'badlogin@example.com',
        password: 'wrongpassword'
      }
    });

    expect(response.status).toBe(401);
  });

  test('POST /auth/refresh returns new access token', async () => {
    // Register and get refresh token
    const registerRes = await request().post('/auth/register', {
      body: {
        email: 'refresh@example.com',
        password: 'password123',
        org_name: 'Test Org',
        user_name: 'Test User'
      }
    });

    expect(registerRes.status).toBe(201);
    const refreshToken = registerRes.body.tokens.refresh_token;
    expect(refreshToken).toBeDefined();

    const response = await request().post('/auth/refresh', {
      body: { refresh_token: refreshToken }
    });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tokens');
    expect(response.body.tokens).toHaveProperty('access_token');
    expect(response.body.tokens).not.toHaveProperty('refresh_token'); // Only returns access token
  });

  test('POST /auth/refresh with invalid token returns 401', async () => {
    const response = await request().post('/auth/refresh', {
      body: { refresh_token: 'invalid-token' }
    });

    expect(response.status).toBe(401);
  });
});
