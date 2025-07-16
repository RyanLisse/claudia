import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SecurityMiddleware } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock Next.js modules
vi.mock('next/server', () => ({
  NextRequest: vi.fn(),
  NextResponse: {
    next: vi.fn(() => ({
      headers: new Map(),
      set: vi.fn(),
    })),
  },
}));

describe('SecurityMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    SecurityMiddleware.cleanupRateLimit();
  });

  describe('CSP Header Generation', () => {
    it('should generate proper CSP headers', () => {
      const response = {
        headers: {
          set: vi.fn(),
        },
      } as any;

      const result = SecurityMiddleware.applySecurityHeaders(response);
      
      expect(response.headers.set).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(response.headers.set).toHaveBeenCalledWith(
        'X-XSS-Protection',
        '1; mode=block'
      );
      expect(response.headers.set).toHaveBeenCalledWith(
        'X-Content-Type-Options',
        'nosniff'
      );
      expect(response.headers.set).toHaveBeenCalledWith(
        'X-Frame-Options',
        'DENY'
      );
    });

    it('should include HSTS headers in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = {
        headers: {
          set: vi.fn(),
        },
      } as any;

      SecurityMiddleware.applySecurityHeaders(response);
      
      expect(response.headers.set).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include HSTS headers in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = {
        headers: {
          set: vi.fn(),
        },
      } as any;

      SecurityMiddleware.applySecurityHeaders(response);
      
      expect(response.headers.set).not.toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.any(String)
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Request Validation', () => {
    it('should validate safe requests', () => {
      const request = {
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams('q=hello&page=1'),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0 (safe user agent)'),
        },
      } as any;

      const result = SecurityMiddleware.validateRequest(request);
      expect(result.isValid).toBe(true);
    });

    it('should reject requests with XSS in URL parameters', () => {
      const request = {
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams('q=<script>alert(1)</script>'),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as any;

      const result = SecurityMiddleware.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Suspicious content in URL parameter');
    });

    it('should reject requests with XSS in path', () => {
      const request = {
        nextUrl: {
          pathname: '/path/<script>alert(1)</script>',
          searchParams: new URLSearchParams(),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as any;

      const result = SecurityMiddleware.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Suspicious content in URL path');
    });

    it('should reject requests with XSS in headers', () => {
      const request = {
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams(),
        },
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            if (header === 'user-agent') {
              return '<script>alert(1)</script>';
            }
            return null;
          }),
        },
      } as any;

      const result = SecurityMiddleware.validateRequest(request);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Suspicious content in header');
    });
  });

  describe('Suspicious Content Detection', () => {
    const testCases = [
      { input: '<script>alert(1)</script>', expected: true },
      { input: 'javascript:alert(1)', expected: true },
      { input: 'vbscript:msgbox(1)', expected: true },
      { input: 'data:text/html,<script>alert(1)</script>', expected: true },
      { input: 'onload="alert(1)"', expected: true },
      { input: 'document.cookie', expected: true },
      { input: 'eval(malicious)', expected: true },
      { input: 'Hello world!', expected: false },
      { input: 'This is safe content', expected: false },
      { input: 'user@example.com', expected: false },
    ];

    testCases.forEach(({ input, expected }) => {
      it(`should ${expected ? 'detect' : 'not detect'} suspicious content in: "${input}"`, () => {
        const request = {
          nextUrl: {
            pathname: '/safe/path',
            searchParams: new URLSearchParams(`q=${encodeURIComponent(input)}`),
          },
          headers: {
            get: vi.fn().mockReturnValue('Mozilla/5.0'),
          },
        } as any;

        const result = SecurityMiddleware.validateRequest(request);
        expect(result.isValid).toBe(!expected);
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const identifier = 'test-ip';
      
      for (let i = 0; i < 50; i++) {
        const result = SecurityMiddleware.checkRateLimit(identifier, 100, 60000);
        expect(result).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const identifier = 'test-ip-blocked';
      
      // Fill up the rate limit
      for (let i = 0; i < 100; i++) {
        SecurityMiddleware.checkRateLimit(identifier, 100, 60000);
      }
      
      // Next request should be blocked
      const result = SecurityMiddleware.checkRateLimit(identifier, 100, 60000);
      expect(result).toBe(false);
    });

    it('should reset rate limit after window expires', () => {
      const identifier = 'test-ip-reset';
      
      // Fill up the rate limit
      for (let i = 0; i < 100; i++) {
        SecurityMiddleware.checkRateLimit(identifier, 100, 1); // 1ms window
      }
      
      // Wait for window to expire
      return new Promise((resolve) => {
        setTimeout(() => {
          const result = SecurityMiddleware.checkRateLimit(identifier, 100, 1);
          expect(result).toBe(true);
          resolve(undefined);
        }, 2);
      });
    });

    it('should handle different identifiers separately', () => {
      const id1 = 'ip-1';
      const id2 = 'ip-2';
      
      // Fill up rate limit for id1
      for (let i = 0; i < 100; i++) {
        SecurityMiddleware.checkRateLimit(id1, 100, 60000);
      }
      
      // id1 should be blocked
      expect(SecurityMiddleware.checkRateLimit(id1, 100, 60000)).toBe(false);
      
      // id2 should still work
      expect(SecurityMiddleware.checkRateLimit(id2, 100, 60000)).toBe(true);
    });
  });

  describe('Rate Limit Cleanup', () => {
    it('should clean up expired rate limit entries', () => {
      const identifier = 'test-cleanup';
      
      // Create entry with short window
      SecurityMiddleware.checkRateLimit(identifier, 100, 1);
      
      // Wait for expiration
      return new Promise((resolve) => {
        setTimeout(() => {
          SecurityMiddleware.cleanupRateLimit();
          
          // Entry should be cleaned up and reset
          const result = SecurityMiddleware.checkRateLimit(identifier, 1, 60000);
          expect(result).toBe(true);
          resolve(undefined);
        }, 2);
      });
    });
  });

  describe('URL Encoding Handling', () => {
    it('should detect XSS in URL-encoded parameters', () => {
      const encodedScript = encodeURIComponent('<script>alert(1)</script>');
      const request = {
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams(`q=${encodedScript}`),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as any;

      const result = SecurityMiddleware.validateRequest(request);
      expect(result.isValid).toBe(false);
    });

    it('should handle double encoding attempts', () => {
      const doubleEncoded = encodeURIComponent(encodeURIComponent('<script>alert(1)</script>'));
      const request = {
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams(`q=${doubleEncoded}`),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as any;

      const result = SecurityMiddleware.validateRequest(request);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Middleware Integration', () => {
    it('should handle complete middleware flow', async () => {
      const request = {
        ip: '127.0.0.1',
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams('q=hello'),
        },
        headers: {
          get: vi.fn().mockImplementation((header: string) => {
            switch (header) {
              case 'x-forwarded-for':
                return '127.0.0.1';
              case 'user-agent':
                return 'Mozilla/5.0';
              default:
                return null;
            }
          }),
        },
      } as any;

      const mockResponse = {
        headers: {
          set: vi.fn(),
        },
      };

      vi.mocked(NextResponse.next).mockReturnValue(mockResponse as any);

      const result = await SecurityMiddleware.middleware(request);
      
      expect(NextResponse.next).toHaveBeenCalled();
      expect(mockResponse.headers.set).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.any(String)
      );
    });

    it('should block requests exceeding rate limit', async () => {
      const request = {
        ip: '127.0.0.1',
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams(),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as any;

      // Fill up rate limit
      for (let i = 0; i < 100; i++) {
        await SecurityMiddleware.middleware(request);
      }

      // Next request should be blocked
      const result = await SecurityMiddleware.middleware(request);
      expect(result.status).toBe(429);
    });

    it('should block requests with suspicious content', async () => {
      const request = {
        ip: '127.0.0.1',
        nextUrl: {
          pathname: '/safe/path',
          searchParams: new URLSearchParams('q=<script>alert(1)</script>'),
        },
        headers: {
          get: vi.fn().mockReturnValue('Mozilla/5.0'),
        },
      } as any;

      const result = await SecurityMiddleware.middleware(request);
      expect(result.status).toBe(400);
    });
  });
});