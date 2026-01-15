import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => Promise.resolve({ userId: 'test-user-123' })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => ({
    success: true,
    limit: 20,
    remaining: 19,
    reset: Date.now() + 60000,
  })),
}));

vi.mock('@/lib/ai-sdk', () => ({
  generateTextStream: vi.fn(() => ({
    toDataStreamResponse: () =>
      new Response('data: {"text":"Hello!"}\n\n', {
        headers: { 'Content-Type': 'text/event-stream' },
      }),
  })),
}));

import { POST } from '@/app/api/ai/chat/route';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

describe('/api/ai/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthorized requests', async () => {
    vi.mocked(auth).mockResolvedValueOnce({ userId: null } as Awaited<ReturnType<typeof auth>>);

    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject requests without messages', async () => {
    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing messages');
  });

  it('should reject non-array messages', async () => {
    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: 'not an array' }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing messages');
  });

  it('should return 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('Rate limit exceeded');
  });

  it('should stream response successfully', async () => {
    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  });
});
