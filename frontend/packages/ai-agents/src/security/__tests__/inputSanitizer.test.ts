import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { InputSanitizer } from '../inputSanitizer';

describe('InputSanitizer', () => {
  beforeEach(() => {
    // Reset any global state if needed
  });

  afterEach(() => {
    // Clean up after each test
  });

  describe('sanitizeHtml', () => {
    it('should sanitize basic XSS attempts', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const result = InputSanitizer.sanitizeHtml(maliciousInput);
      expect(result).toBe('');
      expect(result).not.toContain('<script>');
    });

    it('should allow safe HTML tags', () => {
      const safeInput = '<p>This is <strong>safe</strong> content</p>';
      const result = InputSanitizer.sanitizeHtml(safeInput);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('safe');
    });

    it('should remove dangerous attributes', () => {
      const maliciousInput = '<img src="x" onerror="alert(1)" />';
      const result = InputSanitizer.sanitizeHtml(maliciousInput);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should handle javascript: URLs', () => {
      const maliciousInput = '<a href="javascript:alert(1)">Click</a>';
      const result = InputSanitizer.sanitizeHtml(maliciousInput);
      expect(result).not.toContain('javascript:');
    });

    it('should handle data: URLs safely', () => {
      const maliciousInput = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const result = InputSanitizer.sanitizeHtml(maliciousInput);
      expect(result).not.toContain('data:text/html');
    });

    it('should throw error for overly long input', () => {
      const longInput = 'x'.repeat(100001);
      expect(() => InputSanitizer.sanitizeHtml(longInput)).toThrow('Input too long');
    });

    it('should handle null and undefined input', () => {
      expect(InputSanitizer.sanitizeHtml(null as any)).toBe('');
      expect(InputSanitizer.sanitizeHtml(undefined as any)).toBe('');
    });

    it('should handle non-string input', () => {
      expect(InputSanitizer.sanitizeHtml(123 as any)).toBe('');
      expect(InputSanitizer.sanitizeHtml({} as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = InputSanitizer.sanitizeText(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should handle special characters', () => {
      const input = 'Hello & welcome to "our" site!';
      const result = InputSanitizer.sanitizeText(input);
      expect(result).toBe('Hello & welcome to &quot;our&quot; site!');
    });

    it('should preserve safe text', () => {
      const input = 'This is safe text with numbers 123 and symbols $%';
      const result = InputSanitizer.sanitizeText(input);
      expect(result).toContain('This is safe text');
      expect(result).toContain('123');
    });
  });

  describe('sanitizeCode', () => {
    it('should preserve code formatting', () => {
      const code = 'function test() {\n  console.log("hello");\n}';
      const result = InputSanitizer.sanitizeCode(code);
      expect(result).toContain('function test()');
      expect(result).toContain('console.log');
    });

    it('should remove script tags from code', () => {
      const code = 'const html = "<script>alert(1)</script>";';
      const result = InputSanitizer.sanitizeCode(code);
      expect(result).not.toContain('<script>');
      expect(result).toContain('const html = ""');
    });

    it('should handle code blocks with backticks', () => {
      const code = '```javascript\nfunction test() {\n  return "hello";\n}\n```';
      const result = InputSanitizer.sanitizeCode(code);
      expect(result).toContain('function test()');
      expect(result).toContain('return');
    });
  });

  describe('validateFileUpload', () => {
    it('should validate allowed file types', () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const result = InputSanitizer.validateFileUpload(file);
      expect(result.isValid).toBe(true);
    });

    it('should reject dangerous file types', () => {
      const file = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const result = InputSanitizer.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should validate file size limits', () => {
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'large.txt', { type: 'text/plain' });
      const result = InputSanitizer.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('should reject suspicious file extensions', () => {
      const file = new File(['content'], 'malicious.exe', { type: 'text/plain' });
      const result = InputSanitizer.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('extension not allowed');
    });

    it('should reject JavaScript files', () => {
      const file = new File(['content'], 'script.js', { type: 'text/plain' });
      const result = InputSanitizer.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('extension not allowed');
    });

    it('should validate file extension matches type', () => {
      const file = new File(['content'], 'test.xyz', { type: 'text/plain' });
      const result = InputSanitizer.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('extension not allowed');
    });
  });

  describe('validateChatMessage', () => {
    it('should validate safe chat messages', () => {
      const message = 'Hello world!';
      const result = InputSanitizer.validateChatMessage(message);
      expect(result.isValid).toBe(true);
    });

    it('should reject messages with XSS attempts', () => {
      const message = '<script>alert("xss")</script>';
      const result = InputSanitizer.validateChatMessage(message);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Suspicious content');
    });

    it('should validate message length limits', () => {
      const longMessage = 'x'.repeat(5001);
      const result = InputSanitizer.validateChatMessage(longMessage);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should handle missing content', () => {
      const result = InputSanitizer.validateChatMessage(null as any);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid message');
    });
  });

  describe('URL sanitization', () => {
    it('should sanitize safe URLs', () => {
      expect(InputSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(InputSanitizer.sanitizeUrl('http://localhost:3000')).toBe('http://localhost:3000');
    });

    it('should reject dangerous URLs', () => {
      expect(InputSanitizer.sanitizeUrl('javascript:alert(1)')).toBe('');
      expect(InputSanitizer.sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
      expect(InputSanitizer.sanitizeUrl('file:///etc/passwd')).toBe('');
    });

    it('should handle malformed URLs', () => {
      expect(InputSanitizer.sanitizeUrl('not-a-url')).toBe('not-a-url');
      expect(InputSanitizer.sanitizeUrl('')).toBe('');
      expect(InputSanitizer.sanitizeUrl(null as any)).toBe('');
    });
  });

  describe('Performance', () => {
    it('should handle multiple sanitization calls efficiently', () => {
      const inputs = [
        '<p>Test content 1</p>',
        '<p>Test content 2</p>',
        '<p>Test content 3</p>'
      ];
      
      const results = inputs.map(input => InputSanitizer.sanitizeHtml(input));
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toContain('<p>');
      });
    });

    it('should handle large volumes of sanitization', () => {
      // Process many sanitization calls
      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(InputSanitizer.sanitizeHtml(`<p>Content ${i}</p>`));
      }
      
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result).toContain('<p>');
      });
    });
  });

  describe('Error handling', () => {
    it('should handle invalid input types', () => {
      // Test with various invalid inputs
      expect(InputSanitizer.sanitizeHtml(null as any)).toBe('');
      expect(InputSanitizer.sanitizeHtml(undefined as any)).toBe('');
      expect(InputSanitizer.sanitizeHtml(123 as any)).toBe('');
      expect(InputSanitizer.sanitizeHtml({} as any)).toBe('');
    });

    it('should handle long input gracefully', () => {
      const longInput = 'x'.repeat(20000);
      expect(() => InputSanitizer.sanitizeHtml(longInput)).toThrow('Input too long');
    });
  });
});