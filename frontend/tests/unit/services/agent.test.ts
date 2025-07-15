import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentService } from '../../../apps/api/src/services/agent';
import { db } from '@claudia/db';

vi.mock('@claudia/db');

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(() => {
    agentService = new AgentService(db);
    vi.clearAllMocks();
  });

  describe('createAgent', () => {
    it('should create an agent with default status', async () => {
      // Arrange
      const input = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        type: 'coder' as const,
        capabilities: ['typescript', 'react']
      };

      const expectedAgent = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        ...input,
        status: 'idle',
        memory: {},
        currentTask: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.insert).mockResolvedValueOnce([expectedAgent]);

      // Act
      const result = await agentService.createAgent(input);

      // Assert
      expect(result).toEqual(expectedAgent);
      expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: input.sessionId,
        type: input.type,
        capabilities: input.capabilities,
        status: 'idle'
      }));
    });

    it('should throw error for invalid input', async () => {
      // Arrange
      const invalidInput = {
        sessionId: 'not-a-uuid',
        type: 'invalid-type'
      };

      // Act & Assert
      await expect(agentService.createAgent(invalidInput as any))
        .rejects.toThrow('Invalid agent input');
    });
  });

  describe('getAgent', () => {
    it('should return agent by id', async () => {
      // Arrange
      const agentId = '123e4567-e89b-12d3-a456-426614174000';
      const expectedAgent = {
        id: agentId,
        sessionId: '123e4567-e89b-12d3-a456-426614174001',
        type: 'coder',
        status: 'idle',
        capabilities: ['typescript'],
        memory: {},
        currentTask: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(expectedAgent);

      // Act
      const result = await agentService.getAgent(agentId);

      // Assert
      expect(result).toEqual(expectedAgent);
      expect(db.query.agents.findFirst).toHaveBeenCalledWith({
        where: expect.any(Function)
      });
    });

    it('should return null for non-existent agent', async () => {
      // Arrange
      const agentId = '123e4567-e89b-12d3-a456-426614174000';
      vi.mocked(db.query.agents.findFirst).mockResolvedValueOnce(undefined);

      // Act
      const result = await agentService.getAgent(agentId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('updateAgentStatus', () => {
    it('should update agent status', async () => {
      // Arrange
      const agentId = '123e4567-e89b-12d3-a456-426614174000';
      const newStatus = 'busy';
      const updatedAgent = {
        id: agentId,
        status: newStatus,
        updatedAt: new Date()
      };

      vi.mocked(db.update).mockResolvedValueOnce([updatedAgent]);

      // Act
      const result = await agentService.updateAgentStatus(agentId, newStatus);

      // Assert
      expect(result).toEqual(updatedAgent);
      expect(db.update).toHaveBeenCalledWith(
        expect.any(Object),
        { 
          status: newStatus,
          updatedAt: expect.any(Date)
        }
      );
    });
  });
});