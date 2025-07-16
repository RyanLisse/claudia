/**
 * Security utilities for file handling and path validation
 * Prevents path traversal attacks and enforces secure file access patterns
 */

import { resolve, normalize, join, extname, basename } from 'path';
import { HTTPException } from 'hono/http-exception';

// Configuration for file security
export const FILE_SECURITY_CONFIG = {
  // Maximum file size in bytes (10MB)
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  
  // Allowed file extensions for different contexts
  ALLOWED_EXTENSIONS: {
    code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp'],
    config: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'],
    documentation: ['.md', '.txt', '.rst', '.adoc'],
    web: ['.html', '.css', '.scss', '.less'],
    all: [] // Will be populated by combining all above
  },
  
  // Blocked file extensions that should never be allowed
  BLOCKED_EXTENSIONS: ['.exe', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.scr', '.com', '.pif', '.vbs', '.jar'],
  
  // Maximum path length
  MAX_PATH_LENGTH: 255,
  
  // Base directory for file operations (relative to project root)
  BASE_DIRECTORY: process.cwd(),
  
  // Allowed directories for file operations
  ALLOWED_DIRECTORIES: [
    'src',
    'lib',
    'utils',
    'components',
    'pages',
    'api',
    'tests',
    'docs',
    'config',
    'public',
    'assets',
    'types',
    'hooks',
    'services',
    'middleware',
    'routes'
  ],
  
  // Blocked path patterns
  BLOCKED_PATTERNS: [
    /\.\./,           // Parent directory traversal
    /^\/+/,           // Absolute paths
    /~+/,             // Home directory references
    /\$\{.*\}/,       // Variable substitution
    /%[0-9a-f]{2}/i,  // URL encoding
    /\0/,             // Null bytes
    /[<>"|*?]/,       // Invalid filename characters
    /node_modules/,   // Node modules directory
    /\.git/,          // Git directory
    /\.env/,          // Environment files
    /\.key/,          // Key files
    /\.pem/,          // Certificate files
    /\.p12/,          // Certificate files
    /\.jks/,          // Java keystore files
    /password/i,      // Password-related files
    /secret/i,        // Secret-related files
    /private/i,       // Private key files
    /config.*\.json$/, // Configuration files with sensitive data
    /\/{2,}/,         // Multiple consecutive slashes
    /\\\\/,           // Windows UNC paths
    /\s/,             // Whitespace characters
    /[\x00-\x1f\x7f-\x9f]/, // Control characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i, // Windows reserved names
  ]
};

// Populate the 'all' extensions array
FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS.all = [
  ...FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS.code,
  ...FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS.config,
  ...FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS.documentation,
  ...FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS.web
];

/**
 * Validates if a file path is secure and within allowed boundaries
 */
export function validateFilePath(filePath: string): { isValid: boolean; error?: string; normalizedPath?: string } {
  if (!filePath || typeof filePath !== 'string') {
    return { isValid: false, error: 'File path must be a non-empty string' };
  }

  // Check path length
  if (filePath.length > FILE_SECURITY_CONFIG.MAX_PATH_LENGTH) {
    return { isValid: false, error: `File path exceeds maximum length of ${FILE_SECURITY_CONFIG.MAX_PATH_LENGTH} characters` };
  }

  // Check for blocked patterns
  for (const pattern of FILE_SECURITY_CONFIG.BLOCKED_PATTERNS) {
    if (pattern.test(filePath)) {
      return { isValid: false, error: `File path contains blocked pattern: ${pattern.source}` };
    }
  }

  // Normalize the path to prevent traversal attacks
  const normalizedPath = normalize(filePath);
  
  // Check if the normalized path still contains parent directory references
  if (normalizedPath.includes('..')) {
    return { isValid: false, error: 'Path traversal detected in normalized path' };
  }

  // Resolve the full path to check if it's within allowed boundaries
  const resolvedPath = resolve(FILE_SECURITY_CONFIG.BASE_DIRECTORY, normalizedPath);
  
  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(FILE_SECURITY_CONFIG.BASE_DIRECTORY)) {
    return { isValid: false, error: 'Path resolves outside of allowed base directory' };
  }

  // Check if the path is within allowed directories
  const relativePath = resolvedPath.substring(FILE_SECURITY_CONFIG.BASE_DIRECTORY.length + 1);
  const firstDirectory = relativePath.split('/')[0];
  
  if (!FILE_SECURITY_CONFIG.ALLOWED_DIRECTORIES.includes(firstDirectory)) {
    return { isValid: false, error: `Access to directory '${firstDirectory}' is not allowed` };
  }

  return { isValid: true, normalizedPath };
}

/**
 * Validates if a file extension is allowed for the given context
 */
export function validateFileExtension(
  filePath: string, 
  context: keyof typeof FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS = 'all'
): { isValid: boolean; error?: string } {
  const extension = extname(filePath).toLowerCase();
  
  if (!extension) {
    return { isValid: false, error: 'File must have an extension' };
  }

  // Check if extension is explicitly blocked
  if (FILE_SECURITY_CONFIG.BLOCKED_EXTENSIONS.includes(extension)) {
    return { isValid: false, error: `File extension '${extension}' is not allowed` };
  }

  // Check if extension is allowed for the given context
  const allowedExtensions = FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS[context];
  if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
    return { isValid: false, error: `File extension '${extension}' is not allowed for context '${context}'` };
  }

  return { isValid: true };
}

/**
 * Sanitizes a filename by removing potentially dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Filename must be a non-empty string');
  }

  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid characters
    .replace(/^\.+/, '') // Remove leading dots
    .replace(/\.+$/, '') // Remove trailing dots
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 100); // Limit length
}

/**
 * Validates an array of file paths
 */
export function validateFilePaths(filePaths: string[]): { 
  isValid: boolean; 
  errors: string[]; 
  validPaths: string[];
  invalidPaths: string[];
} {
  if (!Array.isArray(filePaths)) {
    return { 
      isValid: false, 
      errors: ['File paths must be an array'], 
      validPaths: [],
      invalidPaths: []
    };
  }

  const errors: string[] = [];
  const validPaths: string[] = [];
  const invalidPaths: string[] = [];

  for (const filePath of filePaths) {
    const pathValidation = validateFilePath(filePath);
    const extensionValidation = validateFileExtension(filePath);

    if (pathValidation.isValid && extensionValidation.isValid) {
      validPaths.push(pathValidation.normalizedPath!);
    } else {
      invalidPaths.push(filePath);
      if (pathValidation.error) errors.push(`${filePath}: ${pathValidation.error}`);
      if (extensionValidation.error) errors.push(`${filePath}: ${extensionValidation.error}`);
    }
  }

  return {
    isValid: invalidPaths.length === 0,
    errors,
    validPaths,
    invalidPaths
  };
}

/**
 * Creates a secure file path by joining base directory with validated path
 */
export function createSecureFilePath(filePath: string): string {
  const validation = validateFilePath(filePath);
  
  if (!validation.isValid) {
    throw new HTTPException(400, { message: `Invalid file path: ${validation.error}` });
  }

  return join(FILE_SECURITY_CONFIG.BASE_DIRECTORY, validation.normalizedPath!);
}

/**
 * Validates file size (when size is known)
 */
export function validateFileSize(size: number): { isValid: boolean; error?: string } {
  if (typeof size !== 'number' || size < 0) {
    return { isValid: false, error: 'File size must be a non-negative number' };
  }

  if (size > FILE_SECURITY_CONFIG.MAX_FILE_SIZE) {
    return { isValid: false, error: `File size exceeds maximum allowed size of ${FILE_SECURITY_CONFIG.MAX_FILE_SIZE} bytes` };
  }

  return { isValid: true };
}

/**
 * Comprehensive file validation function that combines all security checks
 */
export function validateFileAccess(
  filePath: string, 
  context: keyof typeof FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS = 'all',
  fileSize?: number
): { isValid: boolean; error?: string; secureFilePath?: string } {
  // Validate file path
  const pathValidation = validateFilePath(filePath);
  if (!pathValidation.isValid) {
    return { isValid: false, error: pathValidation.error };
  }

  // Validate file extension
  const extensionValidation = validateFileExtension(filePath, context);
  if (!extensionValidation.isValid) {
    return { isValid: false, error: extensionValidation.error };
  }

  // Validate file size if provided
  if (fileSize !== undefined) {
    const sizeValidation = validateFileSize(fileSize);
    if (!sizeValidation.isValid) {
      return { isValid: false, error: sizeValidation.error };
    }
  }

  // Create secure file path
  const secureFilePath = createSecureFilePath(filePath);

  return { isValid: true, secureFilePath };
}

/**
 * Middleware function to validate file access in request handlers
 */
export function validateFileAccessMiddleware(
  files: string[] | undefined,
  context: keyof typeof FILE_SECURITY_CONFIG.ALLOWED_EXTENSIONS = 'all'
): void {
  if (!files || !Array.isArray(files)) {
    return; // No files to validate
  }

  if (files.length === 0) {
    return; // Empty array is valid
  }

  // Validate each file path
  const validation = validateFilePaths(files);
  
  if (!validation.isValid) {
    throw new HTTPException(400, { 
      message: `Invalid file paths detected: ${validation.errors.join(', ')}` 
    });
  }

  // Additional context-specific validation
  for (const filePath of files) {
    const fileValidation = validateFileExtension(filePath, context);
    if (!fileValidation.isValid) {
      throw new HTTPException(400, { 
        message: `File validation failed for ${filePath}: ${fileValidation.error}` 
      });
    }
  }
}

/**
 * Rate limiting for file operations to prevent abuse
 */
export class FileOperationRateLimiter {
  private static requests: Map<string, number[]> = new Map();
  private static readonly WINDOW_MS = 60000; // 1 minute
  private static readonly MAX_REQUESTS = 100; // Max 100 file operations per minute per IP

  static isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.WINDOW_MS);
    
    if (validRequests.length >= this.MAX_REQUESTS) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  static getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.WINDOW_MS);
    
    return Math.max(0, this.MAX_REQUESTS - validRequests.length);
  }
}

/**
 * Audit logger for file operations
 */
export class FileOperationAuditLogger {
  static log(
    operation: string,
    filePath: string,
    identifier: string,
    result: 'success' | 'failure',
    error?: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      operation,
      filePath,
      identifier,
      result,
      error
    };

    // In production, this should log to a secure audit system
    console.log(`[FILE_AUDIT] ${JSON.stringify(logEntry)}`);
  }
}