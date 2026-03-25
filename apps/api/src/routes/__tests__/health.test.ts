import { test, expect } from '@playwright/test';
import { request } from '../../utils/test-utils';

test('GET /health returns ok', async () => {
  const response = await request().get('/health');
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('status', 'ok');
  expect(response.body).toHaveProperty('timestamp');
});
