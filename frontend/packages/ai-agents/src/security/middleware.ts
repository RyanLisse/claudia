import type { NextRequest, NextResponse } from 'next/server';

/**
 * Security middleware for XSS protection and CSP headers
 */
export class SecurityMiddleware {
  /**
   * Content Security Policy configuration
   */
  private static readonly CSP_DIRECTIVES = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for React development
      "'unsafe-eval'", // Required for React development
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'media-src': [
      "'self'",
      'blob:'
    ],
    'connect-src': [
      "'self'",
      'ws://localhost:*',
      'wss://localhost:*',
      'http://localhost:*',
      'https://api.openai.com',
      'https://api.anthropic.com'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': []
  };

  /**
   * Generate CSP header value
   */
  private static generateCSPHeader(): string {
    const directives = Object.entries(this.CSP_DIRECTIVES)
      .map(([key, values]) => {
        if (values.length === 0) {
          return key;
        }
        return `${key} ${values.join(' ')}`;
      })
      .join('; ');

    return directives;
  }

  /**
   * Apply security headers to response
   */
  public static applySecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    response.headers.set('Content-Security-Policy', this.generateCSPHeader());

    // XSS Protection
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // Content Type Options
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Frame Options
    response.headers.set('X-Frame-Options', 'DENY');

    // Referrer Policy
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    response.headers.set('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    // Strict Transport Security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains; preload');
    }

    return response;
  }

  /**
   * Validate request content for XSS attempts
   */
  public static validateRequest(request: NextRequest): { isValid: boolean; reason?: string } {
    const url = request.nextUrl;
    const searchParams = url.searchParams;
    const headers = request.headers;

    // Check for suspicious URL parameters
    for (const [key, value] of searchParams.entries()) {
      if (this.containsSuspiciousContent(value)) {
        return { isValid: false, reason: `Suspicious content in URL parameter: ${key}` };
      }
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
    for (const headerName of suspiciousHeaders) {
      const headerValue = headers.get(headerName);
      if (headerValue && this.containsSuspiciousContent(headerValue)) {
        return { isValid: false, reason: `Suspicious content in header: ${headerName}` };
      }
    }

    // Check for suspicious path segments
    const pathSegments = url.pathname.split('/');
    for (const segment of pathSegments) {
      if (this.containsSuspiciousContent(segment)) {
        return { isValid: false, reason: 'Suspicious content in URL path' };
      }
    }

    return { isValid: true };
  }

  /**
   * Check if content contains suspicious patterns
   */
  private static containsSuspiciousContent(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Convert to lowercase for case-insensitive matching
    const lowerContent = content.toLowerCase();

    // Suspicious patterns that might indicate XSS attempts
    const suspiciousPatterns = [
      /<script[^>]*>/,
      /<\/script>/,
      /javascript:/,
      /vbscript:/,
      /data:text\/html/,
      /data:application\/javascript/,
      /onload\s*=/,
      /onerror\s*=/,
      /onclick\s*=/,
      /onmouseover\s*=/,
      /onmouseout\s*=/,
      /onfocus\s*=/,
      /onblur\s*=/,
      /onchange\s*=/,
      /onsubmit\s*=/,
      /eval\s*\(/,
      /expression\s*\(/,
      /url\s*\(/,
      /import\s*\(/,
      /<iframe[^>]*>/,
      /<object[^>]*>/,
      /<embed[^>]*>/,
      /<form[^>]*>/,
      /<meta[^>]*>/,
      /<link[^>]*>/,
      /<style[^>]*>/,
      /document\.write/,
      /document\.writeln/,
      /window\.location/,
      /document\.location/,
      /document\.cookie/,
      /localStorage\./,
      /sessionStorage\./,
      /alert\s*\(/,
      /confirm\s*\(/,
      /prompt\s*\(/,
      /console\./,
      /\.innerHTML/,
      /\.outerHTML/,
      /\.insertAdjacentHTML/,
      /createRange\(/,
      /execCommand\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /requestAnimationFrame\s*\(/,
      /fetch\s*\(/,
      /XMLHttpRequest/,
      /WebSocket/,
      /EventSource/,
      /postMessage/,
      /addEventListener/,
      /removeEventListener/,
      /dispatchEvent/,
      /createEvent/,
      /initEvent/,
      /cloneNode/,
      /appendChild/,
      /insertBefore/,
      /replaceChild/,
      /removeChild/,
      /createElement/,
      /createTextNode/,
      /createDocumentFragment/,
      /document\.implementation/,
      /document\.domain/,
      /document\.URL/,
      /document\.referrer/,
      /window\.name/,
      /window\.status/,
      /window\.opener/,
      /window\.parent/,
      /window\.top/,
      /window\.self/,
      /window\.frames/,
      /window\.history/,
      /history\.pushState/,
      /history\.replaceState/,
      /location\.href/,
      /location\.replace/,
      /location\.assign/,
      /location\.reload/,
      /open\s*\(/,
      /close\s*\(/,
      /focus\s*\(/,
      /blur\s*\(/,
      /print\s*\(/,
      /stop\s*\(/,
      /escape\s*\(/,
      /unescape\s*\(/,
      /encodeURI/,
      /decodeURI/,
      /encodeURIComponent/,
      /decodeURIComponent/,
      /btoa\s*\(/,
      /atob\s*\(/,
      /String\.fromCharCode/,
      /String\.fromCodePoint/,
      /Array\.from/,
      /Object\.assign/,
      /Object\.create/,
      /Object\.defineProperty/,
      /Object\.getPrototypeOf/,
      /Object\.setPrototypeOf/,
      /Reflect\./,
      /Proxy\s*\(/,
      /Symbol\./,
      /Map\s*\(/,
      /Set\s*\(/,
      /WeakMap\s*\(/,
      /WeakSet\s*\(/,
      /Promise\./,
      /async\s+function/,
      /await\s+/,
      /yield\s+/,
      /generator\s+function/,
      /function\s*\*/,
      /=>\s*{/,
      /\$\{/,
      /`[^`]*\$\{/,
      /__proto__/,
      /constructor/,
      /prototype/,
      /\.call\s*\(/,
      /\.apply\s*\(/,
      /\.bind\s*\(/,
      /new\s+Function/,
      /new\s+Object/,
      /new\s+Array/,
      /new\s+Date/,
      /new\s+RegExp/,
      /new\s+Error/,
      /throw\s+/,
      /try\s*{/,
      /catch\s*\(/,
      /finally\s*{/,
      /with\s*\(/,
      /in\s+/,
      /of\s+/,
      /for\s*\(/,
      /while\s*\(/,
      /do\s*{/,
      /if\s*\(/,
      /else\s*{/,
      /switch\s*\(/,
      /case\s+/,
      /default\s*:/,
      /break\s*;/,
      /continue\s*;/,
      /return\s+/,
      /var\s+/,
      /let\s+/,
      /const\s+/,
      /class\s+/,
      /extends\s+/,
      /super\s*\(/,
      /this\./,
      /arguments\./,
      /import\s+/,
      /export\s+/,
      /require\s*\(/,
      /module\./,
      /exports\./,
      /global\./,
      /process\./,
      /Buffer\./,
      /__dirname/,
      /__filename/,
      /fs\./,
      /path\./,
      /os\./,
      /crypto\./,
      /child_process\./,
      /cluster\./,
      /worker_threads\./,
      /vm\./,
      /eval\s*\(/,
      /Function\s*\(/,
      /setTimeout\s*\(/,
      /setInterval\s*\(/,
      /setImmediate\s*\(/,
      /clearTimeout\s*\(/,
      /clearInterval\s*\(/,
      /clearImmediate\s*\(/,
      /requestIdleCallback\s*\(/,
      /cancelIdleCallback\s*\(/,
      /requestAnimationFrame\s*\(/,
      /cancelAnimationFrame\s*\(/,
      /performance\./,
      /console\./,
      /debug\s*\(/,
      /trace\s*\(/,
      /warn\s*\(/,
      /error\s*\(/,
      /info\s*\(/,
      /log\s*\(/,
      /assert\s*\(/,
      /count\s*\(/,
      /time\s*\(/,
      /timeEnd\s*\(/,
      /profile\s*\(/,
      /profileEnd\s*\(/,
      /table\s*\(/,
      /group\s*\(/,
      /groupEnd\s*\(/,
      /clear\s*\(/,
      /dir\s*\(/,
      /dirxml\s*\(/
    ];

    // Check against suspicious patterns
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(lowerContent)) {
        return true;
      }
    }

    // Check for encoded suspicious content
    try {
      const decodedContent = decodeURIComponent(content);
      if (decodedContent !== content) {
        return this.containsSuspiciousContent(decodedContent);
      }
    } catch {
      // Invalid URI encoding might be suspicious
      return true;
    }

    return false;
  }

  /**
   * Rate limiting middleware
   */
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  public static checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.rateLimitStore.get(identifier);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /**
   * Clean up old rate limit entries
   */
  public static cleanupRateLimit(): void {
    const now = Date.now();
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Main middleware function
   */
  public static async middleware(request: NextRequest): Promise<NextResponse> {
    // Get client IP for rate limiting
    const clientIP = request.ip || 
      request.headers.get('x-forwarded-for') || 
      request.headers.get('x-real-ip') || 
      'unknown';

    // Check rate limit
    if (!this.checkRateLimit(clientIP, 100, 60000)) {
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Validate request
    const validation = this.validateRequest(request);
    if (!validation.isValid) {
      console.warn('Security validation failed:', validation.reason);
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Continue with request
    const response = NextResponse.next();
    
    // Apply security headers
    return this.applySecurityHeaders(response);
  }
}

// Export for Next.js middleware
export async function middleware(request: NextRequest): Promise<NextResponse> {
  return SecurityMiddleware.middleware(request);
}

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico).*)',
  ]
};