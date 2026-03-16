// Shared TypeScript types — mirrors Prisma models and GraphQL schema

export interface User {
  id: string;
  email: string;
  boards: Board[];
  createdAt: string;
}

export interface Board {
  id: string;
  name: string;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  name: string;
  color: string;
  order: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  columnId: string;
  column: Column;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  taskId: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}

// Input types for forms
export interface ColumnInput {
  id?: string;
  name: string;
  color?: string;
}

export interface SubtaskInput {
  id?: string;
  title: string;
  isCompleted?: boolean;
}

export interface CreateBoardInput {
  name: string;
  columns: ColumnInput[];
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  columnId: string;
  subtasks: SubtaskInput[];
}
