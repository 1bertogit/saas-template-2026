import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
vi.stubEnv('NEXT_PUBLIC_APP_NAME', 'SaaS Template Test');

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @clerk/nextjs
vi.mock('@clerk/nextjs', () => ({
  auth: () => Promise.resolve({ userId: 'test-user-id' }),
  currentUser: () => Promise.resolve({ id: 'test-user-id', email: 'test@example.com' }),
  useAuth: () => ({ isLoaded: true, userId: 'test-user-id', isSignedIn: true }),
  useUser: () => ({
    isLoaded: true,
    user: { id: 'test-user-id', primaryEmailAddress: { emailAddress: 'test@example.com' } },
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: () => null,
  SignUpButton: () => null,
  UserButton: () => null,
}));

// Mock @clerk/nextjs/server
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => ({ userId: 'test-user-id' }),
  currentUser: () => Promise.resolve({ id: 'test-user-id', email: 'test@example.com' }),
}));

// Global test utilities
declare global {
  var testUser: { id: string; email: string };
}

globalThis.testUser = { id: 'test-user-id', email: 'test@example.com' };
