export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

export type LaneType = 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  key: string; // e.g. "LK-42"
  title: string;
  description: string;
  priority: TaskPriority;
  estimateMinutes?: number;
  dueDate?: string; // ISO 8601 string
  assigneeId?: string;
  laneId: string;
  rank: string; // Lexorank ordering string
  tags: string[];
  subtasks: Subtask[];
  timeSpentSeconds?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Lane {
  id: string;
  name: string;
  color: string;
  type: LaneType;
  wipLimit?: number;
}

export interface Project {
  id: string;
  name: string;
  prefix: string; // e.g. "LK"
  lanes: Record<string, Lane>;
  laneOrder: string[];
  taskCounter: number;
  leaseCounter: number;
}

export interface QuickParseResult {
  title: string;
  tags: string[];
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  estimateMinutes?: number;
}

export interface SyncRequest {
  workspaceId: string;
  projectId: string;
  stateVector?: string; // base64 encoded Yjs state vector
  updates?: string;     // base64 encoded client Yjs delta updates
}

export interface SyncResponse {
  serverDiff?: string;  // base64 encoded delta update from server
  serverStateVector: string; // base64 encoded current server state vector
}

export interface LeaseResponse {
  prefix: string;
  start: number;
  end: number;
}

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent?: string;
}
