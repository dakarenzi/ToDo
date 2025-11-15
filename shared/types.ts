export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type Priority = 'none' | 'low' | 'medium' | 'high';
export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
  dueDate?: string;
  startTime?: string;
  endTime?: string;
  order?: number;
  priority?: Priority;
  tags?: string[];
}