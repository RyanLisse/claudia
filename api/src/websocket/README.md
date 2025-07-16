# WebSocket Security Implementation

This document describes the security features implemented in the WebSocket manager for Claudia.

## Security Features

### 1. Authentication Required
- **JWT Token Validation**: All WebSocket connections must authenticate with a valid JWT token
- **Authentication Timeout**: Clients have 30 seconds to authenticate after connecting
- **Token Structure Validation**: Tokens must contain valid user ID and structure
- **User Role Support**: Token roles are extracted and stored in client metadata

### 2. Rate Limiting
- **Message Rate Limiting**: Maximum 100 messages per minute per client
- **Rate Limit Enforcement**: Exceeding limits results in error messages
- **Automatic Cleanup**: Rate limit counters reset after 1 minute of inactivity
- **Background Cleanup**: Periodic cleanup of stale rate limit data

### 3. Message Validation
- **JSON Schema Validation**: All messages validated against Zod schemas
- **Message Size Limits**: Maximum 64KB per message
- **Channel Name Validation**: Channels must be alphanumeric with underscores/hyphens
- **Data Format Validation**: Published data must conform to expected structure

### 4. Connection Management
- **Connection Limits**: Maximum 1000 concurrent connections
- **Channel Limits**: Maximum 50 channels per client
- **Secure Client IDs**: Cryptographically secure client ID generation
- **Connection Timeout**: Inactive connections automatically closed

### 5. Channel Security
- **Subscription Validation**: Must be subscribed to publish to a channel
- **Channel Name Sanitization**: Strict regex validation for channel names
- **Channel Cleanup**: Empty channels automatically removed

### 6. Error Handling
- **Secure Error Messages**: No sensitive information in error responses
- **Connection Termination**: Failed auth attempts result in connection closure
- **Graceful Degradation**: Invalid messages don't crash the connection

## Usage

### Client Authentication
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  // Must authenticate within 30 seconds
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token-here'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.eventType === 'authenticated') {
    console.log('Successfully authenticated!');
    // Now can subscribe to channels
    ws.send(JSON.stringify({
      type: 'subscribe',
      channel: 'my-channel'
    }));
  }
};
```

### Channel Operations
```javascript
// Subscribe to a channel (after authentication)
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'valid-channel-name'
}));

// Publish to a channel (must be subscribed first)
ws.send(JSON.stringify({
  type: 'publish',
  channel: 'valid-channel-name',
  data: {
    type: 'chat',
    message: 'Hello, world!'
  }
}));

// Unsubscribe from a channel
ws.send(JSON.stringify({
  type: 'unsubscribe',
  channel: 'valid-channel-name'
}));
```

## Configuration

### Environment Variables
- `JWT_SECRET`: Secret key for JWT token verification (required)

### Connection Limits
- `maxConnections`: 1000 (configurable in constructor)
- `maxChannelsPerClient`: 50 (configurable in constructor)
- `maxMessageRate`: 100 messages/minute (configurable in constructor)
- `maxMessageSize`: 64KB (configurable in constructor)
- `authTimeout`: 30 seconds (configurable in constructor)

## Security Best Practices

### Token Management
- Use short-lived JWT tokens (1 hour recommended)
- Implement token refresh mechanism
- Store JWT secret securely
- Rotate JWT secrets regularly

### Channel Security
- Use descriptive, non-guessable channel names
- Implement authorization checks for sensitive channels
- Monitor channel usage patterns
- Implement channel-specific permissions

### Rate Limiting
- Monitor rate limit violations
- Implement exponential backoff on client side
- Log suspicious activity patterns
- Consider IP-based rate limiting for additional security

### Connection Monitoring
- Monitor connection patterns
- Implement connection health checks
- Log authentication failures
- Set up alerts for unusual activity

## Testing

Run the security test suite:
```bash
bun run src/websocket/test-security.ts
```

The test suite validates:
- Authentication flow
- Token validation
- Message format validation
- Channel name validation
- Rate limiting behavior
- Error handling

## Error Codes and Messages

### Authentication Errors
- `auth_required`: Client must authenticate within 30 seconds
- `auth_failed`: Invalid JWT token provided
- `Authentication timeout`: Client failed to authenticate in time
- `Authentication failed`: Connection closed after auth failure

### Message Validation Errors
- `Message too large`: Message exceeds 64KB limit
- `Rate limit exceeded`: Client exceeded 100 messages/minute
- `Invalid message format`: JSON parsing or schema validation failed
- `Authentication required`: Unauthenticated client attempted action

### Channel Errors
- `Invalid channel name`: Channel name doesn't match regex pattern
- `Max channels per client exceeded`: Client subscribed to more than 50 channels
- `Must be subscribed to channel to publish`: Publish attempt to unsubscribed channel
- `Invalid channel or data format`: Channel or data validation failed

## Monitoring and Metrics

The WebSocket manager provides detailed statistics:
```javascript
const stats = wsManager.getStats();
console.log(stats);
```

Returns:
- Total client count
- Authenticated vs unauthenticated clients
- Channel subscription counts
- Client connection details
- Rate limiting statistics
- Configuration limits

## Security Audit Checklist

- [ ] JWT tokens properly validated
- [ ] Rate limiting implemented and tested
- [ ] Message size limits enforced
- [ ] Connection limits enforced
- [ ] Channel validation working
- [ ] Error handling doesn't leak sensitive data
- [ ] Client IDs generated securely
- [ ] Authentication timeout enforced
- [ ] Cleanup processes running
- [ ] Monitoring and logging in place