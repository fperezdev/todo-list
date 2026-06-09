export interface Task {
  id: string;
  title: string;
  description?: string;
  is_recurring: number; // 0 = one-time, 1 = recurring
  weekdays?: string; // JSON array de números 0-6 (domingo-sábado), default [0,1,2,3,4,5,6]
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface TaskCompletion {
  id: string;
  task_id: string;
  completion_date: string; // YYYY-MM-DD
  status: 'completed' | 'skipped';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface SyncPayload {
  last_sync_ts: string;
  full_replace?: boolean;
  tasks: Task[];
  task_completions: TaskCompletion[];
}

export interface SyncResponse {
  server_ts: string;
  tasks: Task[];
  task_completions: TaskCompletion[];
}

export interface AuthRequest {
  email: string;
  password: string;
  timezone?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  timezone?: string;
}
