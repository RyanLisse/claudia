import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

interface SanitizationOptions {
  xss?: boolean
  sql?: boolean
  pathTraversal?: boolean
  customSanitizers?: Array<(value: any) => any>
  skipFields?: string[]
  maxLength?: number
  allowedTags?: string[]
  allowedAttributes?: string[]
}

// XSS protection patterns
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /<object[^>]*>.*?<\/object>/gi,
  /<embed[^>]*>.*?<\/embed>/gi,
  /<link[^>]*>/gi,
  /<meta[^>]*>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /expression\s*\(/gi, // CSS expressions
  /url\s*\(/gi, // CSS url() functions
  /&lt;script/gi,
  /&lt;\/script&gt;/gi,
  /&#60;script/gi,
  /&#62;\/script&#60;/gi
]

// SQL injection patterns
const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(\b(OR|AND)\b.*['"])/gi,
  /(['"];\s*(DROP|DELETE|INSERT|UPDATE))/gi,
  /(\b(EXEC|EXECUTE|SP_|XP_)\b)/gi,
  /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/gi,
  /(--|\#|\/\*|\*\/)/g,
  /(\b(WAITFOR|DELAY)\b)/gi,
  /(\b(CONVERT|CAST|CHAR|NCHAR)\b)/gi,
  /(\b(OPENROWSET|OPENDATASOURCE)\b)/gi,
  /(\b(BULK|OPENXML)\b)/gi
]

// Path traversal patterns
const PATH_TRAVERSAL_PATTERNS = [
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e%5c/gi,
  /\.\.%2f/gi,
  /\.\.%5c/gi,
  /%2e%2e\//gi,
  /%2e%2e\\/gi,
  /\.\./g,
  /%252e%252e%252f/gi,
  /%c0%ae%c0%ae%c0%af/gi,
  /%c1%9c/gi
]

// Common dangerous file extensions
const DANGEROUS_EXTENSIONS = [
  '.php', '.asp', '.aspx', '.jsp', '.py', '.pl', '.rb', '.exe', '.bat', '.cmd', '.sh', '.ps1'
]

// HTML entity decode
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '='
}

function decodeHtmlEntities(str: string): string {
  return str.replace(/&[#\w]+;/g, (entity) => HTML_ENTITIES[entity] || entity)
}

function sanitizeXSS(value: string, allowedTags: string[] = [], allowedAttributes: string[] = []): string {
  if (typeof value !== 'string') return value

  // Decode HTML entities first
  let sanitized = decodeHtmlEntities(value)
  
  // Remove dangerous patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // If no tags are allowed, strip all HTML
  if (allowedTags.length === 0) {
    sanitized = sanitized.replace(/<[^>]*>/g, '')
  } else {
    // Remove non-allowed tags
    sanitized = sanitized.replace(/<(\/?)([\w-]+)([^>]*)>/g, (match, slash, tag, attrs) => {
      if (!allowedTags.includes(tag.toLowerCase())) {
        return ''
      }
      
      // Filter attributes if allowedAttributes is specified
      if (allowedAttributes.length > 0) {
        attrs = attrs.replace(/(\w+)=["']([^"']*)["']/g, (attrMatch, attrName, attrValue) => {
          return allowedAttributes.includes(attrName.toLowerCase()) ? attrMatch : ''
        })
      }
      
      return `<${slash}${tag}${attrs}>`
    })
  }
  
  return sanitized
}

function sanitizeSQL(value: string): string {
  if (typeof value !== 'string') return value
  
  let sanitized = value
  
  // Remove dangerous SQL patterns
  SQL_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Escape single quotes
  sanitized = sanitized.replace(/'/g, "''")
  
  return sanitized
}

function sanitizePathTraversal(value: string): string {
  if (typeof value !== 'string') return value
  
  let sanitized = value
  
  // Remove path traversal patterns
  PATH_TRAVERSAL_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '')
  })
  
  // Check for dangerous file extensions
  const hasDatangersExtension = DANGEROUS_EXTENSIONS.some(ext => 
    sanitized.toLowerCase().endsWith(ext)
  )
  
  if (hasDatangersExtension) {
    sanitized = sanitized.replace(/\.[^.]+$/, '.txt')
  }
  
  return sanitized
}

function sanitizeValue(
  value: any,
  options: SanitizationOptions,
  key?: string
): any {
  // Skip if field is in skipFields
  if (key && options.skipFields?.includes(key)) {
    return value
  }
  
  // Handle different types
  if (value === null || value === undefined) {
    return value
  }
  
  if (typeof value === 'string') {
    let sanitized = value
    
    // Apply length limit
    if (options.maxLength && sanitized.length > options.maxLength) {
      sanitized = sanitized.substring(0, options.maxLength)
    }
    
    // Apply XSS protection
    if (options.xss !== false) {
      sanitized = sanitizeXSS(sanitized, options.allowedTags, options.allowedAttributes)
    }
    
    // Apply SQL injection protection
    if (options.sql !== false) {
      sanitized = sanitizeSQL(sanitized)
    }
    
    // Apply path traversal protection
    if (options.pathTraversal !== false) {
      sanitized = sanitizePathTraversal(sanitized)
    }
    
    // Apply custom sanitizers
    if (options.customSanitizers) {
      options.customSanitizers.forEach(sanitizer => {
        sanitized = sanitizer(sanitized)
      })
    }
    
    return sanitized
  }
  
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item, options))
  }
  
  if (typeof value === 'object') {
    const sanitized: any = {}
    for (const [k, v] of Object.entries(value)) {
      sanitized[k] = sanitizeValue(v, options, k)
    }
    return sanitized
  }
  
  return value
}

export const inputSanitization = (options: SanitizationOptions = {}) => {
  const defaultOptions: SanitizationOptions = {
    xss: true,
    sql: true,
    pathTraversal: true,
    maxLength: 10000,
    allowedTags: [],
    allowedAttributes: [],
    skipFields: [],
    customSanitizers: [],
    ...options
  }
  
  return createMiddleware(async (c, next) => {
    try {
      // Sanitize query parameters
      const query = c.req.query()
      const sanitizedQuery = sanitizeValue(query, defaultOptions)
      
      // Sanitize request body (if present)
      let sanitizedBody: any = null
      const contentType = c.req.header('Content-Type')
      
      if (contentType?.includes('application/json')) {
        try {
          const body = await c.req.json()
          sanitizedBody = sanitizeValue(body, defaultOptions)
        } catch (error) {
          // Body is not valid JSON, skip sanitization
        }
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        try {
          const body = await c.req.parseBody()
          sanitizedBody = sanitizeValue(body, defaultOptions)
        } catch (error) {
          // Body parsing failed, skip sanitization
        }
      }
      
      // Sanitize URL parameters
      const params = c.req.param()
      const sanitizedParams = sanitizeValue(params, defaultOptions)
      
      // Store sanitized data in context
      c.set('sanitizedQuery', sanitizedQuery)
      c.set('sanitizedBody', sanitizedBody)
      c.set('sanitizedParams', sanitizedParams)
      
      await next()
    } catch (error) {
      throw new HTTPException(400, { 
        message: 'Request contains potentially dangerous content' 
      })
    }
  })
}

// Strict sanitization for user input
export const strictSanitization = inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: true,
  maxLength: 1000,
  allowedTags: [],
  allowedAttributes: []
})

// Moderate sanitization (allows some HTML)
export const moderateSanitization = inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: true,
  maxLength: 5000,
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b'],
  allowedAttributes: ['class', 'id']
})

// Lenient sanitization (for rich content)
export const lenientSanitization = inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: true,
  maxLength: 50000,
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: ['href', 'title', 'class', 'id', 'target']
})

// API sanitization (strict, no HTML)
export const apiSanitization = inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: true,
  maxLength: 10000,
  allowedTags: [],
  allowedAttributes: []
})

// File upload sanitization
export const fileUploadSanitization = inputSanitization({
  xss: true,
  sql: false,
  pathTraversal: true,
  maxLength: 255,
  allowedTags: [],
  allowedAttributes: [],
  skipFields: ['file', 'buffer', 'stream']
})

// Search sanitization
export const searchSanitization = inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: false,
  maxLength: 500,
  allowedTags: [],
  allowedAttributes: []
})

// Admin sanitization (more permissive)
export const adminSanitization = inputSanitization({
  xss: true,
  sql: true,
  pathTraversal: true,
  maxLength: 100000,
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 'i', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span'],
  allowedAttributes: ['href', 'title', 'class', 'id', 'target', 'src', 'alt', 'width', 'height']
})

// Custom sanitizers
export const customSanitizers = {
  // Remove all numbers
  removeNumbers: (value: string) => value.replace(/\d/g, ''),
  
  // Normalize whitespace
  normalizeWhitespace: (value: string) => value.replace(/\s+/g, ' ').trim(),
  
  // Remove special characters
  removeSpecialChars: (value: string) => value.replace(/[^a-zA-Z0-9\s]/g, ''),
  
  // Convert to lowercase
  toLowerCase: (value: string) => value.toLowerCase(),
  
  // Remove URLs
  removeUrls: (value: string) => value.replace(/https?:\/\/[^\s]+/g, ''),
  
  // Remove email addresses
  removeEmails: (value: string) => value.replace(/[^\s]+@[^\s]+\.[^\s]+/g, ''),
  
  // Escape JSON
  escapeJson: (value: string) => JSON.stringify(value).slice(1, -1)
}

// Validation helpers
export const validateSanitizedInput = (value: any, maxLength?: number) => {
  if (typeof value === 'string') {
    if (maxLength && value.length > maxLength) {
      throw new HTTPException(400, { message: `Input too long (max ${maxLength} characters)` })
    }
    
    // Check for remaining dangerous content
    if (XSS_PATTERNS.some(pattern => pattern.test(value))) {
      throw new HTTPException(400, { message: 'Input contains dangerous content' })
    }
  }
  
  return true
}