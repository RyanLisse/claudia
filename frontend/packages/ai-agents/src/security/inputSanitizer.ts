import DOMPurify from 'isomorphic-dompurify';

/**
 * Comprehensive input sanitization utility for XSS protection
 */
export class InputSanitizer {
  private static readonly ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'u', 'i', 'b', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote'
  ];

  private static readonly ALLOWED_ATTRIBUTES = {
    'code': ['class'],
    'pre': ['class'],
    'blockquote': ['class']
  };

  private static readonly MAX_INPUT_LENGTH = 10000;
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  public static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Basic length check
    if (input.length > this.MAX_INPUT_LENGTH) {
      throw new Error('Input too long');
    }

    // Configure DOMPurify
    const cleanHtml = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: this.ALLOWED_TAGS,
      ALLOWED_ATTR: Object.values(this.ALLOWED_ATTRIBUTES).flat(),
      FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'button'],
      FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'style'],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SANITIZE_DOM: true,
      WHOLE_DOCUMENT: false
    });

    return cleanHtml;
  }

  /**
   * Sanitize plain text to prevent script injection
   */
  public static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Basic length check
    if (input.length > this.MAX_INPUT_LENGTH) {
      throw new Error('Input too long');
    }

    // Remove potential script tags and escape HTML entities
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize code content for syntax highlighting
   */
  public static sanitizeCode(code: string, language?: string): string {
    if (!code || typeof code !== 'string') {
      return '';
    }

    // Validate language parameter
    const allowedLanguages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'html', 'css', 'json', 'markdown'];
    if (language && !allowedLanguages.includes(language.toLowerCase())) {
      language = 'text';
    }

    // Remove potential script injections while preserving code structure
    const sanitizedCode = code
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<\/script>/gi, '')
      .replace(/<script[^>]*>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .replace(/vbscript:/gi, '');

    return sanitizedCode;
  }

  /**
   * Validate file uploads for security
   */
  public static validateFileUpload(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return { isValid: false, error: 'File too large' };
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/pdf',
      'application/json'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'File type not allowed' };
    }

    // Check file extension
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.txt', '.pdf', '.json'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return { isValid: false, error: 'File extension not allowed' };
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(file.name)) {
        return { isValid: false, error: 'Suspicious file type' };
      }
    }

    return { isValid: true };
  }

  /**
   * Sanitize URL to prevent javascript: and data: scheme attacks
   */
  public static sanitizeUrl(url: string): string {
    if (!url || typeof url !== 'string') {
      return '';
    }

    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return '';
      }
    }

    // Only allow http, https, mailto, and tel protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    const hasValidProtocol = allowedProtocols.some(protocol => lowerUrl.startsWith(protocol));
    
    if (lowerUrl.includes(':') && !hasValidProtocol) {
      return '';
    }

    return url;
  }

  /**
   * Sanitize JSON to prevent prototype pollution
   */
  public static sanitizeJson(jsonString: string): any {
    if (!jsonString || typeof jsonString !== 'string') {
      return null;
    }

    try {
      const parsed = JSON.parse(jsonString);
      return this.sanitizeObject(parsed);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }

  /**
   * Recursively sanitize object properties to prevent prototype pollution
   */
  private static sanitizeObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const key in obj) {
      // Skip prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      sanitized[key] = this.sanitizeObject(obj[key]);
    }

    return sanitized;
  }

  /**
   * Validate message content for chat
   */
  public static validateChatMessage(message: string): { isValid: boolean; sanitized: string; error?: string } {
    if (!message || typeof message !== 'string') {
      return { isValid: false, sanitized: '', error: 'Invalid message' };
    }

    // Check length
    if (message.length > 5000) {
      return { isValid: false, sanitized: '', error: 'Message too long' };
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script[^>]*>/gi,
      /<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /onload=/gi,
      /onerror=/gi,
      /onclick=/gi,
      /onmouseover=/gi,
      /onmouseout=/gi,
      /onfocus=/gi,
      /onblur=/gi,
      /onchange=/gi,
      /onsubmit=/gi,
      /onkeydown=/gi,
      /onkeyup=/gi,
      /onkeypress=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<form[^>]*>/gi,
      /<input[^>]*>/gi,
      /<button[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /<style[^>]*>/gi,
      /expression\s*\(/gi,
      /url\s*\(/gi,
      /import\s*\(/gi,
      /@import/gi,
      /\beval\s*\(/gi,
      /\bsetTimeout\s*\(/gi,
      /\bsetInterval\s*\(/gi,
      /\bFunction\s*\(/gi,
      /\bdocument\./gi,
      /\bwindow\./gi,
      /\blocation\./gi,
      /\bnavigator\./gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(message)) {
        return { isValid: false, sanitized: '', error: 'Suspicious content detected' };
      }
    }

    // Additional checks for encoded attacks
    const decodedMessage = this.decodeHtmlEntities(message);
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(decodedMessage)) {
        return { isValid: false, sanitized: '', error: 'Suspicious content detected' };
      }
    }

    // Sanitize the message
    const sanitized = this.sanitizeText(message);

    return { isValid: true, sanitized };
  }

  /**
   * Decode HTML entities to check for encoded attacks
   */
  private static decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * Enhanced content security policy validation
   */
  public static validateCSP(content: string): boolean {
    const dangerousPatterns = [
      /data:text\/html/gi,
      /data:application\/javascript/gi,
      /data:text\/javascript/gi,
      /blob:/gi,
      /filesystem:/gi,
      /chrome-extension:/gi,
      /moz-extension:/gi,
      /ms-browser-extension:/gi
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }
}