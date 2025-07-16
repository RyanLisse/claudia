// Export all middleware for easy importing
export * from './auth.js'
export * from './cors.js'
export * from './error.js'
export * from './input-sanitization.js'
export * from './rate-limiter.js'
export * from './security-headers.js'
export * from './security.js'
export * from './validation.js'

// Export common middleware combinations
export {
  securityPresets,
  securityMiddleware,
  environmentSecurity,
  securityAudit,
  threatDetection
} from './security.js'

// Export rate limiting presets
export {
  strictRateLimit,
  moderateRateLimit,
  lenientRateLimit,
  authRateLimit,
  apiRateLimit,
  uploadRateLimit,
  userRateLimit
} from './rate-limiter.js'

// Export CORS presets
export {
  strictCors,
  devCors,
  apiCors,
  webhookCors,
  adminCors,
  environmentCors
} from './cors.js'

// Export security headers presets
export {
  strictSecurityHeaders,
  devSecurityHeaders,
  apiSecurityHeaders,
  webhookSecurityHeaders,
  environmentSecurityHeaders
} from './security-headers.js'

// Export input sanitization presets
export {
  strictSanitization,
  moderateSanitization,
  lenientSanitization,
  apiSanitization,
  fileUploadSanitization,
  searchSanitization,
  adminSanitization
} from './input-sanitization.js'

// Export validation middleware
export {
  validationMiddleware,
  paginationSchema
} from './validation.js'