/**
 * Inngest endpoint for the AI Agent System
 */

import { serve } from 'inngest/hono';
import { inngest } from '../../../../src/agents/inngest/client';
import { 
  assignTask,
  monitorTaskExecution,
  retryFailedTask,
  monitorAgentHealth,
  scaleAgents,
  routeMessage
} from '../../../../src/agents/inngest/functions';

// Export all Inngest functions for the agent system
export const inngestFunctions = [
  assignTask,
  monitorTaskExecution,
  retryFailedTask,
  monitorAgentHealth,
  scaleAgents,
  routeMessage,
];

// Create the Inngest serve handler
export const inngestHandler = serve({
  client: inngest,
  functions: inngestFunctions,
});

export default inngestHandler;