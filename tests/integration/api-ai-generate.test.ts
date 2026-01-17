import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'test-user-123' })),
}));

vi.mock('@/lib/ai', () => ({
  generateText: vi.fn(() => 'Generated text response'),
}));

import { POST } from '@/app/api/ai/generate/route';
import { auth } from '@clerk/nextjs/server';
import { generateText } from '@/lib/ai';

describe('/api/ai/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthorized requests', async () => {
    vi.mocked(auth).mockReturnValueOnce({ userId: null } as unknown as ReturnType<typeof auth>);

    const req = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Hello' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject requests without prompt', async () => {
    const req = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing prompt');
  });

  it('should generate text successfully', async () => {
    const req = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Write a haiku' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toBe('Generated text response');
    expect(generateText).toHaveBeenCalledWith({ prompt: 'Write a haiku' });
  });

  it('should handle generation errors', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error('API error'));

    const req = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'Test prompt' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to generate text');
  });

  it('should handle invalid JSON body', async () => {
    const req = new Request('http://localhost:3000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing prompt');
  });
});
