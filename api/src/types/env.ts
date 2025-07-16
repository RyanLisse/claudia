export interface Env {
  // Database
  DATABASE_URL?: string
  
  // JWT
  JWT_SECRET?: string
  JWT_EXPIRES_IN?: string
  JWT_REFRESH_SECRET?: string
  JWT_REFRESH_EXPIRES_IN?: string
  
  // API Keys
  API_KEY?: string
  CLAUDE_API_KEY?: string
  OPENAI_API_KEY?: string

  // Inngest
  INNGEST_EVENT_KEY?: string
  INNGEST_SIGNING_KEY?: string
  
  // Environment
  NODE_ENV?: string
  PORT?: string
  WS_PORT?: string
  
  // Rate limiting
  REDIS_URL?: string
  
  // CORS
  CORS_ORIGIN?: string
  
  // Logging
  LOG_LEVEL?: string
}