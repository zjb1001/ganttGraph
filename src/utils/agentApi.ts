/**
 * API Client for Gantt Graph AI Agent Service
 */

const AGENT_SERVICE_URL = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8000';

// Legacy action format (for backward compatibility)
export interface AgentAction {
  type: string;
  params: Record<string, any>;
  description: string;
  requiresConfirmation?: boolean;
}

// New execution plan format
export interface TaskModification {
  operation: 'create' | 'update' | 'delete';
  id?: string;
  title?: string;
  startDateTime?: string;
  dueDateTime?: string;
  status?: string;
  priority?: string;
  progress?: number;
  bucketId?: string;
}

export interface MilestoneCreation {
  title: string;
  date: string;
  bucketId?: string;
  description?: string;
}

export interface BucketModification {
  operation: 'create' | 'update' | 'delete';
  id?: string;
  name?: string;
  bucketType?: 'task' | 'milestone';
  color?: string;
}

export interface ExecutionPlan {
  thoughts: string;
  taskModifications: TaskModification[];
  milestoneCreations: MilestoneCreation[];
  bucketModifications: BucketModification[];
  summary: string;
  needsConfirmation: boolean;
  clarificationMessage?: string;
}

export interface AgentRequest {
  message: string;
  context?: {
    currentProject?: string | null;
    currentProjectId?: string;
    buckets?: Array<{ id: string; name: string; color?: string; bucketType?: string }>;
    tasks?: Array<any>;
    taskCount?: number;
    bucketCount?: number;
  };
}

export interface AgentResponse {
  success: boolean;
  message: string;
  // Legacy format
  actions?: AgentAction[];
  // New format
  executionPlan?: ExecutionPlan;
  needs_clarification: boolean;
  clarification_questions: string[];
  requiresConfirmation?: boolean;
}

/**
 * Send a chat message to the agent service
 */
export async function sendChatMessage(request: AgentRequest): Promise<AgentResponse> {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    // The backend now always returns AgentResponse (even on errors),
    // so we can use the response directly
    if (!response.ok) {
      return {
        success: false,
        message: data?.message || data?.detail || `Agent service error: ${response.statusText}`,
        needs_clarification: false,
        clarification_questions: [],
      };
    }

    return data;
  } catch (error) {
    console.error('Failed to communicate with agent service:', error);
    return {
      success: false,
      message: '无法连接到 AI 服务。请确保 agent-service 正在运行。',
      needs_clarification: false,
      clarification_questions: [],
    };
  }
}

/**
 * Check if the agent service is available
 */
export async function checkAgentHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get agent service info
 */
export async function getAgentInfo(): Promise<any> {
  try {
    const response = await fetch(`${AGENT_SERVICE_URL}/`);
    return await response.json();
  } catch {
    return null;
  }
}
