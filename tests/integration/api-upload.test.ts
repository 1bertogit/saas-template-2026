// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing route
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'test-user-123' })),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now() + 60000,
  })),
}));

vi.mock('@/lib/storage', () => ({
  uploadToR2: vi.fn(async () => 'https://example.r2.dev/uploads/test-file.png'),
  generateUniqueFilename: vi.fn((name: string, userId: string) => `${userId}/${Date.now()}-${name}`),
}));

import { POST } from '@/app/api/upload/route';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@clerk/nextjs/server';

describe('/api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject unauthorized requests', async () => {
    vi.mocked(auth).mockReturnValueOnce(Promise.resolve({ userId: null }) as ReturnType<typeof auth>);

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: new FormData(),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should reject requests without file', async () => {
    const formData = new FormData();

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('File is required');
  });

  it('should reject files larger than 10MB', async () => {
    const largeBuffer = new ArrayBuffer(11 * 1024 * 1024); // 11MB
    const file = new Blob([largeBuffer], { type: 'application/octet-stream' });

    const formData = new FormData();
    formData.append('file', file, 'large-file.bin');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('File too large');
  }, 15000);

  it('should return 429 when rate limited', async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 60000,
    });

    const file = new Blob(['test content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file, 'test.txt');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Too many uploads');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('should upload file successfully', async () => {
    const file = new Blob(['test content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file, 'test.txt');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://example.r2.dev/uploads/test-file.png');
    expect(data.key).toContain('test-user-123');
  }, 15000);
});
