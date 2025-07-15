import { db, agents, insertAgentSchema, type Agent, type NewAgent } from '@claudia/db';
import { eq } from 'drizzle-orm';

export class AgentService {
  constructor(private database: typeof db) {}

  async createAgent(input: NewAgent): Promise<Agent> {
    // Validate input
    const validated = insertAgentSchema.parse(input);
    
    // Set default status
    const agentData = {
      ...validated,
      status: 'idle' as const,
      memory: {},
      currentTask: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [agent] = await this.database.insert(agents).values(agentData).returning();
    
    if (!agent) {
      throw new Error('Failed to create agent');
    }

    return agent;
  }

  async getAgent(id: string): Promise<Agent | null> {
    const agent = await this.database.query.agents.findFirst({
      where: eq(agents.id, id)
    });

    return agent || null;
  }

  async updateAgentStatus(id: string, status: 'idle' | 'busy' | 'error'): Promise<Agent> {
    const [updatedAgent] = await this.database
      .update(agents)
      .set({ 
        status, 
        updatedAt: new Date() 
      })
      .where(eq(agents.id, id))
      .returning();

    if (!updatedAgent) {
      throw new Error('Agent not found');
    }

    return updatedAgent;
  }

  async listAgents(sessionId?: string): Promise<Agent[]> {
    if (sessionId) {
      return await this.database.query.agents.findMany({
        where: eq(agents.sessionId, sessionId)
      });
    }

    return await this.database.query.agents.findMany({
      orderBy: (agents, { desc }) => [desc(agents.createdAt)]
    });
  }

  async deleteAgent(id: string): Promise<boolean> {
    const result = await this.database.delete(agents).where(eq(agents.id, id));
    return result.rowCount > 0;
  }
}