# Security Middleware Documentation

This document provides comprehensive guidance on using the security middleware components in the Claudia API.

## Overview

The security middleware system provides multiple layers of protection:

1. **CORS (Cross-Origin Resource Sharing)** - Controls which domains can access the API
2. **Security Headers** - Adds essential security headers to responses
3. **Rate Limiting** - Prevents abuse by limiting requests per time window
4. **Input Sanitization** - Cleanses user input to prevent XSS, SQL injection, and path traversal
5. **Authentication Enhancement** - Improved JWT and API key handling
6. **Threat Detection** - Identifies and blocks suspicious activity

## Quick Start

### Basic Usage

```typescript
import { Hono } from 'hono'
import { environmentSecurity } from './middleware/security.js'

const app = new Hono()

// Apply environment-based security (automatic based on NODE_ENV)
app.use('*', environmentSecurity())

// Your routes...
app.get('/api/users', (c) => c.json({ users: [] }))
```

### Preset Configurations

```typescript
import { securityPresets } from './middleware/security.js'

// For production APIs
app.use('/api/*', securityPresets.production)

// For development
app.use('/api/*', securityPresets.development)

// For public endpoints
app.use('/public/*', securityPresets.public)

// For admin endpoints
app.use('/admin/*', securityPresets.admin)

// For authentication endpoints
app.use('/auth/*', securityPresets.auth)

// For webhook endpoints
app.use('/webhook/*', securityPresets.webhook)
```

## Individual Middleware Components

### 1. CORS Middleware

```typescript
import { cors, strictCors, devCors, apiCors } from './middleware/cors.js'

// Basic CORS
app.use('*', cors())

// Environment-based CORS
app.use('*', environmentCors())

// Custom CORS
app.use('*', cors({
  origin: ['https://myapp.com', 'https://admin.myapp.com'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 2. Security Headers

```typescript
import { securityHeaders, strictSecurityHeaders } from './middleware/security-headers.js'

// Basic security headers
app.use('*', securityHeaders())

// Strict security headers for production
app.use('*', strictSecurityHeaders)

// Custom security headers
app.use('*', securityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'",
  xFrameOptions: 'DENY'
}))
```

### 3. Rate Limiting

```typescript
import { 
  rateLimiter, 
  strictRateLimit, 
  moderateRateLimit, 
  authRateLimit 
} from './middleware/rate-limiter.js'

// Basic rate limiting
app.use('/api/*', moderateRateLimit)

// Strict rate limiting for sensitive endpoints
app.use('/admin/*', strictRateLimit)

// Authentication-specific rate limiting
app.use('/auth/*', authRateLimit)

// Custom rate limiting
app.use('/uploads/*', rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Too many uploads, please try again later'
}))
```

### 4. Input Sanitization

```typescript
import { 
  inputSanitization, 
  strictSanitization, 
  moderateSanitization 
} from './middleware/input-sanitization.js'

// Strict sanitization (removes all HTML)
app.use('/api/*', strictSanitization)

// Moderate sanitization (allows some HTML tags)
app.use('/content/*', moderateSanitization)

// Custom sanitization
app.use('/search/*', inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: false,
  maxLength: 500,
  allowedTags: []
}))
```

### 5. Authentication Enhancement

```typescript
import { authMiddleware, apiKeyAuth } from './middleware/auth.js'

// Enhanced JWT authentication
app.use('/api/protected/*', authMiddleware)

// API key authentication
app.use('/api/public/*', apiKeyAuth)

// Combined authentication
app.use('/api/admin/*', authMiddleware, requireRole('admin'))
```

## Advanced Usage

### Custom Security Configuration

```typescript
import { security } from './middleware/security.js'

const customSecurity = security({
  enableCors: true,
  enableSecurityHeaders: true,
  enableRateLimit: true,
  enableInputSanitization: true,
  corsOptions: 'strict',
  securityHeadersOptions: 'strict',
  rateLimitOptions: 'moderate',
  sanitizationOptions: 'strict',
  maxRequestSize: 1024 * 1024, // 1MB
  enableRequestLogging: true
})

app.use('/api/*', customSecurity)
```

### Security Audit and Monitoring

```typescript
import { securityAudit, threatDetection } from './middleware/security.js'

// Enable security auditing
app.use('*', securityAudit)

// Enable threat detection
app.use('*', threatDetection)
```

### Route-Specific Security

```typescript
import { securityMiddleware } from './middleware/security.js'

// Different security levels for different routes
app.use('/public/*', securityMiddleware.publicProtected)
app.use('/api/*', securityMiddleware.apiProtected)
app.use('/admin/*', securityMiddleware.adminProtected)
app.use('/auth/*', securityMiddleware.authProtected)
app.use('/webhook/*', securityMiddleware.webhookProtected)
```

## Environment Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-refresh-secret-here
JWT_REFRESH_EXPIRES_IN=7d
JWT_AUDIENCE=claudia-api
JWT_ISSUER=claudia-api

# API Keys
API_KEY=your-api-key-here

# Rate Limiting (optional - uses Redis if available)
REDIS_URL=redis://localhost:6379

# Security Settings
NODE_ENV=production
MAX_REQUEST_SIZE=1048576
ENABLE_REQUEST_LOGGING=true
```

### Environment-Based Security

The middleware automatically adjusts security settings based on `NODE_ENV`:

- **production**: Maximum security with strict settings
- **development**: Balanced security with developer-friendly settings
- **test**: Minimal security for testing environments

## Security Best Practices

### 1. Layered Security

Always use multiple security layers:

```typescript
app.use('*', cors()) // CORS protection
app.use('*', securityHeaders()) // Security headers
app.use('*', rateLimiter()) // Rate limiting
app.use('*', inputSanitization()) // Input sanitization
app.use('/api/*', authMiddleware) // Authentication
```

### 2. Route-Specific Protection

Apply appropriate security levels to different routes:

```typescript
// Public routes - basic protection
app.use('/public/*', securityPresets.public)

// API routes - standard protection
app.use('/api/*', securityPresets.api)

// Admin routes - strict protection
app.use('/admin/*', securityPresets.admin)

// Auth routes - special protection
app.use('/auth/*', securityPresets.auth)
```

### 3. Input Validation and Sanitization

Always validate and sanitize user input:

```typescript
import { validateBody, strictSanitization } from './middleware'

app.post('/api/users', 
  strictSanitization, // Sanitize first
  validateBody(userSchema), // Then validate
  async (c) => {
    const body = c.get('validatedBody')
    // Process sanitized and validated data
  }
)
```

### 4. Rate Limiting Strategy

Apply different rate limits based on endpoint sensitivity:

```typescript
// Strict limits for authentication
app.use('/auth/*', authRateLimit)

// Moderate limits for API endpoints
app.use('/api/*', moderateRateLimit)

// Lenient limits for public content
app.use('/public/*', lenientRateLimit)
```

### 5. Error Handling

Don't leak sensitive information in error messages:

```typescript
import { HTTPException } from 'hono/http-exception'

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  
  // Log the actual error for debugging
  console.error('Unexpected error:', err)
  
  // Return generic error message
  return c.json({ error: 'Internal server error' }, 500)
})
```

## Monitoring and Logging

### Security Event Logging

The middleware automatically logs security events:

```typescript
// Authentication failures
[SECURITY] Authentication failed: Invalid token

// API key attempts
[SECURITY] Invalid API key attempt from 192.168.1.100: abc12345...

// Rate limit violations
[SECURITY] Rate limit exceeded for IP: 192.168.1.100

// Suspicious activity
[THREAT DETECTION] Suspicious user agent from 192.168.1.100: sqlmap/1.0
```

### Custom Security Logging

```typescript
import { securityAudit } from './middleware/security.js'

// Enable detailed security audit logging
app.use('*', securityAudit)

// Custom security logging
app.use('*', async (c, next) => {
  const startTime = Date.now()
  
  await next()
  
  const duration = Date.now() - startTime
  console.log(`[SECURITY] ${c.req.method} ${c.req.url} - ${c.res.status} - ${duration}ms`)
})
```

## Production Deployment

### 1. Environment Setup

```bash
# Set production environment
export NODE_ENV=production

# Set strong secrets
export JWT_SECRET=$(openssl rand -base64 64)
export JWT_REFRESH_SECRET=$(openssl rand -base64 64)
export API_KEY=$(openssl rand -base64 32)
```

### 2. Security Headers

Ensure all security headers are properly configured:

```typescript
// Use strict security headers in production
app.use('*', strictSecurityHeaders)
```

### 3. Rate Limiting

Configure Redis for distributed rate limiting:

```typescript
// Use Redis for rate limiting in production
export REDIS_URL=redis://your-redis-server:6379
```

### 4. SSL/TLS

Always use HTTPS in production:

```typescript
// Force HTTPS redirect
app.use('*', async (c, next) => {
  if (c.req.header('x-forwarded-proto') !== 'https') {
    return c.redirect(`https://${c.req.header('host')}${c.req.url}`)
  }
  await next()
})
```

## Testing Security

### 1. Unit Tests

```typescript
import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { strictSanitization } from './middleware/input-sanitization.js'

describe('Input Sanitization', () => {
  it('should remove XSS attempts', async () => {
    const app = new Hono()
    app.use('*', strictSanitization)
    app.post('/test', (c) => c.json({ body: c.get('sanitizedBody') }))
    
    const res = await app.request('/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '<script>alert("xss")</script>' })
    })
    
    const data = await res.json()
    expect(data.body.content).not.toContain('<script>')
  })
})
```

### 2. Integration Tests

```typescript
describe('Security Integration', () => {
  it('should apply all security middleware', async () => {
    const app = new Hono()
    app.use('*', securityPresets.production)
    app.get('/test', (c) => c.json({ message: 'ok' }))
    
    const res = await app.request('/test')
    
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(res.headers.get('X-Frame-Options')).toBe('DENY')
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block')
  })
})
```

## Security Checklist

- [ ] Enable CORS with specific origins (not '*' in production)
- [ ] Set strong JWT secrets and proper expiration times
- [ ] Configure rate limiting based on endpoint sensitivity
- [ ] Enable input sanitization on all user inputs
- [ ] Set security headers appropriate for your application
- [ ] Use HTTPS in production
- [ ] Log security events for monitoring
- [ ] Regular security audits and penetration testing
- [ ] Keep dependencies updated
- [ ] Monitor for suspicious activity
- [ ] Implement proper error handling
- [ ] Use environment-specific configurations

## Common Security Issues and Solutions

### 1. CORS Misconfiguration

**Problem**: Allowing all origins in production
```typescript
// DON'T DO THIS in production
app.use('*', cors({ origin: '*' }))
```

**Solution**: Specify allowed origins
```typescript
app.use('*', cors({ 
  origin: ['https://myapp.com', 'https://admin.myapp.com'] 
}))
```

### 2. Weak Rate Limiting

**Problem**: No rate limiting on authentication endpoints
```typescript
app.post('/auth/login', loginHandler)
```

**Solution**: Apply strict rate limiting
```typescript
app.post('/auth/login', authRateLimit, loginHandler)
```

### 3. Missing Input Sanitization

**Problem**: Direct use of user input
```typescript
app.post('/api/users', async (c) => {
  const body = await c.req.json()
  // Using body directly without sanitization
})
```

**Solution**: Always sanitize input
```typescript
app.post('/api/users', 
  strictSanitization,
  async (c) => {
    const body = c.get('sanitizedBody')
    // Use sanitized data
  }
)
```

### 4. Information Disclosure

**Problem**: Detailed error messages
```typescript
app.onError((err, c) => {
  return c.json({ error: err.stack }, 500)
})
```

**Solution**: Generic error messages
```typescript
app.onError((err, c) => {
  console.error('Error:', err) // Log for debugging
  return c.json({ error: 'Internal server error' }, 500)
})
```

## Performance Considerations

### 1. Rate Limiting Storage

Use Redis for better performance in production:

```typescript
// In-memory storage (development only)
const rateLimitStore = new Map()

// Redis storage (production)
import Redis from 'ioredis'
const redis = new Redis(process.env.REDIS_URL)
```

### 2. Input Sanitization

Balance security with performance:

```typescript
// For high-traffic endpoints, use lighter sanitization
app.use('/api/search', searchSanitization)

// For user-generated content, use strict sanitization
app.use('/api/posts', strictSanitization)
```

### 3. Security Headers

Cache security headers to improve performance:

```typescript
const securityHeadersCache = new Map()

export const cachedSecurityHeaders = createMiddleware(async (c, next) => {
  const cacheKey = c.req.url
  let headers = securityHeadersCache.get(cacheKey)
  
  if (!headers) {
    headers = generateSecurityHeaders()
    securityHeadersCache.set(cacheKey, headers)
  }
  
  // Apply cached headers
  await next()
})
```

## Support and Maintenance

### 1. Regular Updates

Keep security middleware updated:

```bash
# Update dependencies regularly
bun update

# Check for vulnerabilities
bun audit
```

### 2. Security Monitoring

Monitor security events:

```typescript
// Set up alerts for security events
app.use('*', async (c, next) => {
  try {
    await next()
  } catch (err) {
    if (err instanceof HTTPException && err.status === 401) {
      // Alert on authentication failures
      await sendSecurityAlert('Authentication failure', err.message)
    }
    throw err
  }
})
```

### 3. Documentation

Keep security documentation updated and accessible to your team.

For more information, see individual middleware files and their TypeScript definitions.