import { describe, it, expect } from 'vitest';
import { handler as healthHandler } from '../src/handlers/health.js';

describe('Health Handler', () => {
  it('returns 200 OK with healthy status and metadata', async () => {
    const result = await healthHandler();
    expect(result).toHaveProperty('statusCode', 200);

    const body = JSON.parse((result as { body: string }).body);
    expect(body).toHaveProperty('status', 'healthy');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('node');
  });
});
