import { describe, it, expect } from 'vitest';
import {
  cn,
  formatCurrency,
  isValidEmail,
  generateRandomString,
  truncate,
  getInitials,
  sleep,
} from '@/lib/utils';

describe('cn (class name merger)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', true && 'included', false && 'excluded')).toBe('base included');
  });

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('formatCurrency', () => {
  it('should format BRL currency from cents', () => {
    const result = formatCurrency(1999);
    expect(result).toContain('19,99');
  });

  it('should format USD currency', () => {
    const result = formatCurrency(1000, 'USD');
    expect(result).toContain('10,00');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });
});

describe('isValidEmail', () => {
  it('should validate correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
  });

  it('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('invalid@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('no spaces@domain.com')).toBe(false);
  });
});

describe('generateRandomString', () => {
  it('should generate string of specified length', () => {
    expect(generateRandomString(10)).toHaveLength(10);
    expect(generateRandomString(5)).toHaveLength(5);
    expect(generateRandomString(20)).toHaveLength(20);
  });

  it('should generate default length of 10', () => {
    expect(generateRandomString()).toHaveLength(10);
  });

  it('should only contain alphanumeric characters', () => {
    const result = generateRandomString(100);
    expect(result).toMatch(/^[A-Za-z0-9]+$/);
  });
});

describe('truncate', () => {
  it('should truncate long text', () => {
    const longText = 'a'.repeat(150);
    const result = truncate(longText, 100);
    expect(result).toHaveLength(103); // 100 + '...'
    expect(result.endsWith('...')).toBe(true);
  });

  it('should not truncate short text', () => {
    const shortText = 'short';
    expect(truncate(shortText, 100)).toBe(shortText);
  });

  it('should handle exact length', () => {
    const text = 'exact';
    expect(truncate(text, 5)).toBe('exact');
  });
});

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Jane Smith')).toBe('JS');
  });

  it('should handle single name', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should limit to 2 characters', () => {
    expect(getInitials('John Robert Doe')).toBe('JR');
  });

  it('should uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

describe('sleep', () => {
  it('should wait for specified time', async () => {
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});
