import { Inngest } from 'inngest';

export const inngest = new Inngest({ 
  id: 'claudia-api',
  name: 'Claudia API System',
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
});

export interface ApiEvents {
  'session/created': {
    data: {
      sessionId: string;
      userId: string;
      name: string;
      timestamp: string;
    };
  };
  
  'agent/created': {
    data: {
      agentId: string;
      sessionId: string;
      type: string;
      timestamp: string;
    };
  };
}

export type TypedInngest = typeof inngest;