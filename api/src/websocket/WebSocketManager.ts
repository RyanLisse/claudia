import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import * as jose from 'jose';
import { createHash, randomBytes } from 'crypto';
import { z } from 'zod';

export interface WebSocketClient {
  id: string;
  ws: WebSocket;
  channels: Set<string>;
  lastPing: Date;
  userId?: string;
  authenticated: boolean;
  messageCount: number;
  lastMessageTime: Date;
  connectTime: Date;
  metadata: Record<string, any>;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'publish' | 'ping' | 'pong' | 'event' | 'auth';
  channel?: string;
  data?: any;
  eventType?: string;
  timestamp?: string;
  source?: string;
  token?: string;
}

// Message validation schemas
const MessageSchema = z.object({
  type: z.enum(['subscribe', 'unsubscribe', 'publish', 'ping', 'pong', 'event', 'auth']),
  channel: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  data: z.any().optional(),
  eventType: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  timestamp: z.string().datetime().optional(),
  source: z.string().min(1).max(20).optional(),
  token: z.string().min(10).max(2048).optional(),
}).refine((data) => {
  // Additional validation based on message type
  if (data.type === 'subscribe' || data.type === 'unsubscribe' || data.type === 'publish') {
    return !!data.channel;
  }
  if (data.type === 'auth') {
    return !!data.token;
  }
  return true;
}, {
  message: "Invalid message structure for the given type"
});

const ChannelSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
const PublishDataSchema = z.object({
  type: z.string().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/).optional(),
}).passthrough().refine((data) => {
  // Prevent prototype pollution
  return !('__proto__' in data || 'constructor' in data || 'prototype' in data);
}, {
  message: "Invalid data structure"
});

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients = new Map<string, WebSocketClient>();
  private channels = new Map<string, Set<string>>(); // channel -> client IDs
  private heartbeatInterval!: NodeJS.Timeout;
  private readonly maxConnections: number = 1000;
  private readonly maxChannelsPerClient: number = 50;
  private readonly maxMessageRate: number = 100; // messages per minute
  private readonly maxMessageSize: number = 64 * 1024; // 64KB
  private readonly authTimeout: number = 30000; // 30 seconds
  private readonly jwtSecret: Uint8Array;
  private rateLimitCleanupInterval!: NodeJS.Timeout;

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ 
      port,
      path: '/ws',
      maxPayload: this.maxMessageSize,
    });

    this.jwtSecret = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key');
    this.setupWebSocketServer();
    this.startHeartbeat();
    this.startRateLimitCleanup();

    console.log(`WebSocket server started on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      // Check connection limits
      if (this.clients.size >= this.maxConnections) {
        console.warn('Max connections reached, rejecting new connection');
        ws.close(1013, 'Server overloaded');
        return;
      }

      const clientId = this.generateSecureClientId();
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const connectTime = new Date();
      
      const client: WebSocketClient = {
        id: clientId,
        ws,
        channels: new Set(),
        lastPing: connectTime,
        authenticated: false,
        messageCount: 0,
        lastMessageTime: connectTime,
        connectTime,
        metadata: {
          userAgent: request.headers['user-agent'],
          ip: request.socket.remoteAddress,
          connectedAt: connectTime,
          path: url.pathname,
        },
      };

      this.clients.set(clientId, client);
      console.log(`Client ${clientId} connected. Total clients: ${this.clients.size}`);

      // Send auth required message
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'auth_required',
        data: { 
          clientId,
          timeout: this.authTimeout,
          message: 'Authentication required within 30 seconds'
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      });

      // Set auth timeout
      const authTimer = setTimeout(() => {
        const currentClient = this.clients.get(clientId);
        if (currentClient && !currentClient.authenticated) {
          console.warn(`Client ${clientId} authentication timeout`);
          ws.close(1008, 'Authentication timeout');
          this.handleClientDisconnect(clientId);
        }
      }, this.authTimeout);

      ws.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        clearTimeout(authTimer);
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        clearTimeout(authTimer);
        this.handleClientDisconnect(clientId);
      });

      ws.on('pong', () => {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPing = new Date();
        }
      });
    });
  }

  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Check message size
    if (data.length > this.maxMessageSize) {
      console.warn(`Message too large from client ${clientId}: ${data.length} bytes`);
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Message too large' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
      return;
    }

    // Rate limiting
    if (!this.checkRateLimit(client)) {
      console.warn(`Rate limit exceeded for client ${clientId}`);
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Rate limit exceeded' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
      return;
    }

    let message: WebSocketMessage;
    try {
      const rawMessage = JSON.parse(data.toString());
      message = MessageSchema.parse(rawMessage);
    } catch (error) {
      console.error(`Invalid message from client ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Invalid message format' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
      return;
    }

    // Handle authentication first
    if (message.type === 'auth') {
      this.handleAuth(clientId, message.token!);
      return;
    }

    // Require authentication for all other message types
    if (!client.authenticated) {
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Authentication required' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
      return;
    }

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message.channel!);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message.channel!);
        break;
      
      case 'publish':
        this.handlePublish(clientId, message.channel!, message.data);
        break;
      
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        client.lastPing = new Date();
        break;
      
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private handleSubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const validChannel = ChannelSchema.parse(channel);
      
      // Check channel limits
      if (client.channels.size >= this.maxChannelsPerClient) {
        this.sendToClient(clientId, {
          type: 'event',
          eventType: 'error',
          data: { error: 'Max channels per client exceeded' },
          timestamp: new Date().toISOString(),
          source: 'server',
        });
        return;
      }

      client.channels.add(validChannel);

      if (!this.channels.has(validChannel)) {
        this.channels.set(validChannel, new Set());
      }
      this.channels.get(validChannel)!.add(clientId);

      // Send confirmation
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'subscribed',
        data: { channel: validChannel },
        timestamp: new Date().toISOString(),
        source: 'server',
      });

      console.log(`Client ${clientId} subscribed to channel: ${validChannel}`);
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Invalid channel name' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }
  }

  private handleUnsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const validChannel = ChannelSchema.parse(channel);
      
      client.channels.delete(validChannel);
      this.channels.get(validChannel)?.delete(clientId);

      // Clean up empty channels
      if (this.channels.get(validChannel)?.size === 0) {
        this.channels.delete(validChannel);
      }

      // Send confirmation
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'unsubscribed',
        data: { channel: validChannel },
        timestamp: new Date().toISOString(),
        source: 'server',
      });

      console.log(`Client ${clientId} unsubscribed from channel: ${validChannel}`);
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Invalid channel name' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }
  }

  private handlePublish(clientId: string, channel: string, data: any): void {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) return;

    try {
      const validChannel = ChannelSchema.parse(channel);
      const validData = PublishDataSchema.parse(data);

      // Check if client is subscribed to the channel
      if (!client.channels.has(validChannel)) {
        this.sendToClient(clientId, {
          type: 'event',
          eventType: 'error',
          data: { error: 'Must be subscribed to channel to publish' },
          timestamp: new Date().toISOString(),
          source: 'server',
        });
        return;
      }

      // Additional security checks for published data
      if (this.containsSuspiciousContent(validData)) {
        this.sendToClient(clientId, {
          type: 'event',
          eventType: 'error',
          data: { error: 'Message contains suspicious content' },
          timestamp: new Date().toISOString(),
          source: 'server',
        });
        return;
      }

      // Sanitize data before broadcasting
      const sanitizedData = this.sanitizePublishData(validData);

      this.broadcast(validChannel, {
        type: 'event',
        channel: validChannel,
        eventType: sanitizedData.type || 'message',
        data: sanitizedData,
        timestamp: new Date().toISOString(),
        source: client.userId || clientId,
      });
    } catch (error) {
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'error',
        data: { error: 'Invalid channel or data format' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
    }
  }

  private handleClientDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all channels
    client.channels.forEach(channel => {
      this.channels.get(channel)?.delete(clientId);
      if (this.channels.get(channel)?.size === 0) {
        this.channels.delete(channel);
      }
    });

    this.clients.delete(clientId);
    console.log(`Client ${clientId} disconnected. Total clients: ${this.clients.size}`);
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Failed to send message to client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
    }
  }

  public broadcast(channel: string, message: WebSocketMessage): void {
    const clientIds = this.channels.get(channel);
    if (!clientIds) return;

    clientIds.forEach(clientId => {
      this.sendToClient(clientId, message);
    });
  }

  public broadcastToAll(message: WebSocketMessage): void {
    this.clients.forEach((client, clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 60000; // 60 seconds

      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastPing.getTime() > timeout) {
          console.log(`Client ${clientId} timed out`);
          client.ws.terminate();
          this.handleClientDisconnect(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      });
    }, 30000); // Check every 30 seconds
  }

  private generateSecureClientId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes(16).toString('hex');
    const hash = createHash('sha256').update(`${timestamp}${randomPart}${Math.random()}`).digest('hex').slice(0, 16);
    return `client_${timestamp}_${hash}`;
  }

  private checkRateLimit(client: WebSocketClient): boolean {
    const now = new Date();
    const timeDiff = now.getTime() - client.lastMessageTime.getTime();
    
    // Reset counter if more than a minute has passed
    if (timeDiff > 60000) {
      client.messageCount = 0;
    }
    
    client.messageCount++;
    client.lastMessageTime = now;
    
    return client.messageCount <= this.maxMessageRate;
  }

  private async handleAuth(clientId: string, token: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || client.authenticated) return;

    try {
      const { payload } = await jose.jwtVerify(token, this.jwtSecret);
      
      // Verify token structure
      if (!payload.sub || typeof payload.sub !== 'string') {
        throw new Error('Invalid token structure');
      }

      client.authenticated = true;
      client.userId = payload.sub;
      client.metadata.authenticatedAt = new Date();
      client.metadata.userRole = payload.role || 'user';

      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'authenticated',
        data: { 
          clientId,
          userId: client.userId,
          authenticatedAt: client.metadata.authenticatedAt
        },
        timestamp: new Date().toISOString(),
        source: 'server',
      });

      console.log(`Client ${clientId} authenticated as user ${client.userId}`);
    } catch (error) {
      console.error(`Authentication failed for client ${clientId}:`, error);
      
      this.sendToClient(clientId, {
        type: 'event',
        eventType: 'auth_failed',
        data: { error: 'Authentication failed' },
        timestamp: new Date().toISOString(),
        source: 'server',
      });
      
      // Close connection after failed auth
      setTimeout(() => {
        client.ws.close(1008, 'Authentication failed');
        this.handleClientDisconnect(clientId);
      }, 1000);
    }
  }

  private startRateLimitCleanup(): void {
    this.rateLimitCleanupInterval = setInterval(() => {
      const now = new Date();
      this.clients.forEach(client => {
        const timeDiff = now.getTime() - client.lastMessageTime.getTime();
        if (timeDiff > 60000) {
          client.messageCount = 0;
        }
      });
    }, 60000); // Clean up every minute
  }

  public getStats() {
    const authenticatedClients = Array.from(this.clients.values()).filter(c => c.authenticated);
    const unauthenticatedClients = Array.from(this.clients.values()).filter(c => !c.authenticated);
    
    return {
      totalClients: this.clients.size,
      authenticatedClients: authenticatedClients.length,
      unauthenticatedClients: unauthenticatedClients.length,
      totalChannels: this.channels.size,
      maxConnections: this.maxConnections,
      maxChannelsPerClient: this.maxChannelsPerClient,
      maxMessageRate: this.maxMessageRate,
      channels: Array.from(this.channels.entries()).map(([channel, clients]) => ({
        channel,
        subscribers: clients.size,
      })),
      clients: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        userId: client.userId,
        authenticated: client.authenticated,
        channels: Array.from(client.channels),
        messageCount: client.messageCount,
        connectedAt: client.metadata.connectedAt,
        lastPing: client.lastPing,
        lastMessageTime: client.lastMessageTime,
      })),
    };
  }

  public close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.rateLimitCleanupInterval) {
      clearInterval(this.rateLimitCleanupInterval);
    }
    
    this.clients.forEach(client => {
      client.ws.close();
    });
    
    this.wss.close();
    console.log('WebSocket server closed');
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function createWebSocketManager(port?: number): WebSocketManager {
  if (!wsManager) {
    wsManager = new WebSocketManager(port);
  }
  return wsManager;
}

export function getWebSocketManager(): WebSocketManager | null {
  return wsManager;
}

export default WebSocketManager;
