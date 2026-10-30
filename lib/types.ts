import type { Timestamp } from "firebase/firestore";

export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Timestamp | null;
};

export type Filter = "all" | "active" | "completed";
