import type { Workflow } from "./index.js";

export interface Project {
  id: string;
  name: string;
  boardId: string;
  workflows: Workflow[];
  createdAt: string;
  updatedAt: string;
}
