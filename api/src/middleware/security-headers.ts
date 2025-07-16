import { createMiddleware } from 'hono/factory'

interface SecurityHeadersOptions {
  contentSecurityPolicy?: string | boolean
  crossOriginEmbedderPolicy?: string | boolean
  crossOriginOpenerPolicy?: string | boolean
  crossOriginResourcePolicy?: string | boolean
  originAgentCluster?: string | boolean
  referrerPolicy?: string | boolean
  strictTransportSecurity?: string | boolean
  xContentTypeOptions?: string | boolean
  xDnsPrefetchControl?: string | boolean
  xDownloadOptions?: string | boolean
  xFrameOptions?: string | boolean
  xPermittedCrossDomainPolicies?: string | boolean
  xPoweredBy?: boolean
  xXssProtection?: string | boolean
}

export const securityHeaders = (options: SecurityHeadersOptions = {}) => {
  const {
    contentSecurityPolicy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; media-src 'self'; object-src 'none'; child-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    crossOriginEmbedderPolicy = 'require-corp',
    crossOriginOpenerPolicy = 'same-origin',
    crossOriginResourcePolicy = 'same-origin',
    originAgentCluster = '?1',
    referrerPolicy = 'strict-origin-when-cross-origin',
    strictTransportSecurity = 'max-age=31536000; includeSubDomains; preload',
    xContentTypeOptions = 'nosniff',
    xDnsPrefetchControl = 'off',
    xDownloadOptions = 'noopen',
    xFrameOptions = 'DENY',
    xPermittedCrossDomainPolicies = 'none',
    xPoweredBy = false,
    xXssProtection = '1; mode=block'
  } = options

  return createMiddleware(async (c, next) => {
    // Content Security Policy
    if (contentSecurityPolicy) {
      c.header('Content-Security-Policy', typeof contentSecurityPolicy === 'string' ? contentSecurityPolicy : "default-src 'self'")
    }

    // Cross-Origin Embedder Policy
    if (crossOriginEmbedderPolicy) {
      c.header('Cross-Origin-Embedder-Policy', typeof crossOriginEmbedderPolicy === 'string' ? crossOriginEmbedderPolicy : 'require-corp')
    }

    // Cross-Origin Opener Policy
    if (crossOriginOpenerPolicy) {
      c.header('Cross-Origin-Opener-Policy', typeof crossOriginOpenerPolicy === 'string' ? crossOriginOpenerPolicy : 'same-origin')
    }

    // Cross-Origin Resource Policy
    if (crossOriginResourcePolicy) {
      c.header('Cross-Origin-Resource-Policy', typeof crossOriginResourcePolicy === 'string' ? crossOriginResourcePolicy : 'same-origin')
    }

    // Origin Agent Cluster
    if (originAgentCluster) {
      c.header('Origin-Agent-Cluster', typeof originAgentCluster === 'string' ? originAgentCluster : '?1')
    }

    // Referrer Policy
    if (referrerPolicy) {
      c.header('Referrer-Policy', typeof referrerPolicy === 'string' ? referrerPolicy : 'strict-origin-when-cross-origin')
    }

    // Strict Transport Security
    if (strictTransportSecurity) {
      c.header('Strict-Transport-Security', typeof strictTransportSecurity === 'string' ? strictTransportSecurity : 'max-age=31536000; includeSubDomains')
    }

    // X-Content-Type-Options
    if (xContentTypeOptions) {
      c.header('X-Content-Type-Options', typeof xContentTypeOptions === 'string' ? xContentTypeOptions : 'nosniff')
    }

    // X-DNS-Prefetch-Control
    if (xDnsPrefetchControl) {
      c.header('X-DNS-Prefetch-Control', typeof xDnsPrefetchControl === 'string' ? xDnsPrefetchControl : 'off')
    }

    // X-Download-Options
    if (xDownloadOptions) {
      c.header('X-Download-Options', typeof xDownloadOptions === 'string' ? xDownloadOptions : 'noopen')
    }

    // X-Frame-Options
    if (xFrameOptions) {
      c.header('X-Frame-Options', typeof xFrameOptions === 'string' ? xFrameOptions : 'DENY')
    }

    // X-Permitted-Cross-Domain-Policies
    if (xPermittedCrossDomainPolicies) {
      c.header('X-Permitted-Cross-Domain-Policies', typeof xPermittedCrossDomainPolicies === 'string' ? xPermittedCrossDomainPolicies : 'none')
    }

    // X-Powered-By (remove it for security)
    if (!xPoweredBy) {
      c.header('X-Powered-By', '')
    }

    // X-XSS-Protection
    if (xXssProtection) {
      c.header('X-XSS-Protection', typeof xXssProtection === 'string' ? xXssProtection : '1; mode=block')
    }

    await next()
  })
}

// Strict security headers for production
export const strictSecurityHeaders = securityHeaders({
  contentSecurityPolicy: "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',
  xFrameOptions: 'DENY',
  xXssProtection: '1; mode=block'
})

// Development security headers (more permissive)
export const devSecurityHeaders = securityHeaders({
  contentSecurityPolicy: "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self' data:; connect-src 'self' https: http: ws: wss:; media-src 'self'; object-src 'none'; child-src 'none'; frame-ancestors 'none'",
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  strictTransportSecurity: false,
  xFrameOptions: 'SAMEORIGIN'
})

// API-only security headers
export const apiSecurityHeaders = securityHeaders({
  contentSecurityPolicy: false, // Not relevant for API
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: 'cross-origin',
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff'
})

// Webhook security headers
export const webhookSecurityHeaders = securityHeaders({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'no-referrer'
})

// Environment-based security headers
export const environmentSecurityHeaders = () => {
  const env = process.env.NODE_ENV || 'development'
  
  switch (env) {
    case 'production':
      return strictSecurityHeaders
    case 'development':
      return devSecurityHeaders
    case 'test':
      return apiSecurityHeaders
    default:
      return devSecurityHeaders
  }
}

// Custom CSP builder
export const buildCSP = (directives: Record<string, string[]>) => {
  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ')
}

// CSP for different app types
export const appCSP = {
  // Web application CSP
  web: buildCSP({
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", 'https:', 'wss:'],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  }),
  
  // API-only CSP
  api: buildCSP({
    'default-src': ["'none'"],
    'connect-src': ["'self'"]
  }),
  
  // Admin panel CSP
  admin: buildCSP({
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", 'https:'],
    'object-src': ["'none'"],
    'child-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  })
}

// Security headers with custom CSP
export const securityHeadersWithCSP = (csp: string) => {
  return securityHeaders({
    contentSecurityPolicy: csp
  })
}

// Report-only CSP for testing
export const reportOnlyCSP = (csp: string, reportUri: string) => {
  return createMiddleware(async (c, next) => {
    c.header('Content-Security-Policy-Report-Only', `${csp}; report-uri ${reportUri}`)
    await next()
  })
}