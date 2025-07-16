/**
 * Type definitions for test environment
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      PORT?: string;
      WS_PORT?: string;
      INNGEST_EVENT_KEY?: string;
      INNGEST_SIGNING_KEY?: string;
      OPENAI_API_KEY?: string;
      LOG_LEVEL?: string;
    }
  }

  // Bun runtime types
  namespace Bun {
    interface ServeOptions {
      port?: number;
      hostname?: string;
      fetch: (request: Request) => Response | Promise<Response>;
    }

    interface Server {
      stop(): void;
      port: number;
      hostname: string;
    }

    function serve(options: ServeOptions): Server;
  }

  // Console types for test environment
  interface Console {
    log(...args: any[]): void;
    error(...args: any[]): void;
    warn(...args: any[]): void;
    info(...args: any[]): void;
  }

  // Timer functions
  function setTimeout(callback: () => void, ms: number): number;
  function clearTimeout(id: number): void;
  function setInterval(callback: () => void, ms: number): number;
  function clearInterval(id: number): void;

  // Global objects
  const console: Console;
  const process: NodeJS.Process;
  const Bun: typeof Bun;
}

// Test framework types
declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): Matchers<T>;
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;

  interface Matchers<T> {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeUndefined(): void;
    toBeNull(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toContain(expected: any): void;
    toHaveLength(expected: number): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
    toThrow(expected?: string | RegExp): void;
    not: Matchers<T>;
    rejects: {
      toThrow(expected?: string | RegExp): Promise<void>;
    };
    resolves: {
      toBe(expected: T): Promise<void>;
      toEqual(expected: T): Promise<void>;
    };
  }
}

// Mock types for testing
export interface MockTask {
  id: string;
  type: string;
  payload: {
    prompt: string;
    context?: Record<string, any>;
    files?: string[];
  };
  agentId: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timeoutMs: number;
  maxRetries: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  sessionId?: string;
}

export interface MockAgent {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  maxConcurrentTasks: number;
  status: string;
  currentTasks: any[];
  metrics: {
    tasksCompleted: number;
    tasksInProgress: number;
    tasksFailed: number;
    averageTaskTime: number;
    uptime: number;
  };
}

export interface MockWebSocketClient {
  id: string;
  ws: {
    send: () => void;
    close: () => void;
    readyState: number;
  };
  channels: Set<string>;
  lastPing: Date;
  metadata: {
    userAgent: string;
    ip: string;
    connectedAt: Date;
    path?: string;
  };
}

export {};
