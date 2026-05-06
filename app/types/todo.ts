export type FilterType = "all" | "active" | "completed";

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}
