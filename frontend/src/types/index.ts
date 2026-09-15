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
  dueDate?: string; // ISO string
  assigneeId?: string;
  laneId: string;
  rank: string;
  tags: string[];
  subtasks: Subtask[];
  timeSpentSeconds?: number;
  isTimerRunning?: boolean;
  timerStartedAt?: number;
  archived?: boolean;
  archivedAt?: string;
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

export interface ProjectMetadata {
  id: string;
  name: string;
  prefix: string;
}

export interface QuickParseResult {
  title: string;
  tags: string[];
  priority: TaskPriority;
  dueDate?: string;
  assignee?: string;
  estimateMinutes?: number;
}

export interface AuthSession {
  userId: string;
  email: string;
  idToken: string;
  accessToken: string;
  refreshToken: string;
}

export interface MfaChallengeData {
  session: string;
  username: string;
  secretCode?: string; // For MFA_SETUP
}
