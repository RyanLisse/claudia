# Claudia API Server

High-performance API server built with Hono and Bun runtime, featuring comprehensive authentication, rate limiting, and extensive validation.

## Features

### 🚀 Performance
- **Hono Framework** - Ultra-fast web framework for edge computing
- **Bun Runtime** - Lightning-fast JavaScript runtime and package manager
- **WASM SIMD** - Enhanced performance for CPU-intensive operations
- **Built-in Rate Limiting** - Protect against abuse and DDoS attacks

### 🔐 Security
- **JWT Authentication** - Secure token-based authentication with refresh tokens
- **Role-based Access Control** - Fine-grained permissions system
- **API Key Authentication** - Additional security layer for external access
- **Input Validation** - Comprehensive Zod-based validation
- **Security Headers** - Helmet.js integration for secure headers
- **Password Hashing** - bcrypt for secure password storage

### 📡 API Features
- **RESTful Design** - Clean, predictable API endpoints
- **OpenAPI Documentation** - Auto-generated API documentation
- **Error Handling** - Comprehensive error responses with request tracking
- **Request Logging** - Detailed request/response logging
- **CORS Support** - Cross-origin resource sharing configuration
- **Compression** - Gzip compression for optimal performance

### 🧪 Testing & Quality
- **Comprehensive Test Suite** - Unit and integration tests with Bun test runner
- **TypeScript** - Full type safety and modern JavaScript features
- **ESLint** - Code linting and style enforcement
- **Health Checks** - Kubernetes-ready health and readiness endpoints

## Quick Start

### Prerequisites
- [Bun](https://bun.sh/) v1.0 or higher
- Node.js v18+ (for development tools)

### Installation

1. **Clone and setup**
   ```bash
   cd api
   bun install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   bun run dev
   ```

4. **Build for production**
   ```bash
   bun run build
   bun run start
   ```

## API Endpoints

### Health & Status
- `GET /` - API information and status
- `GET /api/health` - Health check with system metrics
- `GET /api/health/ready` - Readiness probe (Kubernetes)
- `GET /api/health/live` - Liveness probe (Kubernetes)
- `GET /api/health/detailed` - Detailed health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify token validity
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Users
- `GET /api/users` - List users (admin only)
- `POST /api/users` - Create user (admin only)
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `POST /api/users/me/change-password` - Change password
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/stats` - User statistics (admin only)

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/duplicate` - Duplicate project
- `GET /api/projects/stats` - Project statistics
- `GET /api/projects/:id/settings` - Get project settings
- `PUT /api/projects/:id/settings` - Update project settings

### Agents
- `GET /api/agents` - List agents
- `POST /api/agents` - Create agent
- `GET /api/agents/:id` - Get agent by ID
- `PUT /api/agents/:id` - Update agent
- `DELETE /api/agents/:id` - Delete agent
- `POST /api/agents/:id/execute` - Execute agent task
- `GET /api/agents/types` - Get available agent types
- `GET /api/agents/stats` - Agent statistics

## Authentication

### JWT Tokens
The API uses JWT tokens for authentication with the following flow:

1. **Login** - Exchange credentials for access + refresh tokens
2. **Access Token** - Short-lived (1h default) for API requests
3. **Refresh Token** - Long-lived (7d default) for token renewal
4. **Token Verification** - Validate tokens and extract user context

### Authorization Headers
```bash
Authorization: Bearer <access-token>
```

### API Key Authentication
For external services:
```bash
X-API-Key: <your-api-key>
```

## Rate Limiting

### Default Limits
- **General API**: 1000 requests per 15 minutes per IP
- **Auth Endpoints**: 10 requests per 15 minutes per IP
- **Configurable**: Customize limits via environment variables

### Headers
Rate limit information is included in response headers:
- `X-RateLimit-Limit` - Request limit
- `X-RateLimit-Remaining` - Remaining requests
- `X-RateLimit-Reset` - Reset time

## Validation

### Input Validation
All inputs are validated using Zod schemas:

```typescript
// Example: User creation
{
  email: "user@example.com",      // Valid email format
  password: "SecurePass123",      // Min 8 chars, mixed case + numbers
  confirmPassword: "SecurePass123", // Must match password
  acceptTerms: true               // Must be true
}
```

### Error Responses
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Invalid request data",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "requestId": "req_123456",
  "data": [
    {
      "path": ["email"],
      "message": "Invalid email format"
    }
  ]
}
```

## Environment Variables

### Required Configuration
```bash
# Core
NODE_ENV=production
PORT=3001

# Security
JWT_SECRET=your-32-char-secret
API_KEY=your-api-key

# Database
DATABASE_URL=postgresql://...
```

### Optional Configuration
```bash
# Rate Limiting
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

## Development

### Running Tests
```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage
```

### Code Quality
```bash
# Linting
bun run lint
bun run lint:fix

# Type checking
bun run type-check
```

### Development Workflow
1. **Feature Development** - Create feature branch
2. **Testing** - Write tests for new functionality
3. **Validation** - Run linting and type checking
4. **Integration** - Test with main application

## Deployment

### Production Build
```bash
# Build optimized bundle
bun run build

# Start production server
bun run start
```

### Docker Deployment
```dockerfile
FROM oven/bun:1-alpine

WORKDIR /app
COPY package*.json ./
RUN bun install --production

COPY src ./src
COPY tsconfig.json ./

EXPOSE 3001
CMD ["bun", "run", "start"]
```

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=secure-production-secret
REDIS_URL=redis://...
```

## Monitoring

### Health Checks
- `/api/health` - Basic health status
- `/api/health/ready` - Kubernetes readiness
- `/api/health/live` - Kubernetes liveness
- `/api/health/detailed` - Comprehensive status

### Metrics
- Request/response times
- Error rates
- Memory usage
- System performance

### Logging
- Request logging with unique IDs
- Error tracking and reporting
- Performance monitoring
- Security event logging

## Security Considerations

### Best Practices
1. **Environment Variables** - Never commit secrets
2. **HTTPS Only** - Use TLS in production
3. **Rate Limiting** - Implement appropriate limits
4. **Input Validation** - Validate all user inputs
5. **Error Handling** - Don't expose sensitive information
6. **Regular Updates** - Keep dependencies updated

### Security Headers
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

## Contributing

1. **Fork Repository** - Create your own fork
2. **Feature Branch** - Create feature branch from main
3. **Development** - Implement features with tests
4. **Pull Request** - Submit PR with description
5. **Review** - Address feedback and merge

## License

AGPL-3.0 - See LICENSE file for details

## Support

- **Documentation**: [API Docs](/docs)
- **Issues**: [GitHub Issues](https://github.com/claudia/api/issues)
- **Community**: [Discussions](https://github.com/claudia/api/discussions)