import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useWorkflowStore } from "./workflow-store";

export interface ProjectMeta {
  id: string;
  name: string;
  boardId: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectState {
  projects: ProjectMeta[];
  currentProjectId: string | null;

  syncCurrentProject: () => void;
  createProject: (name?: string) => void;
  switchProject: (id: string) => void;
  deleteProject: (id: string) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,

      syncCurrentProject: () => {
        const { workflow, nodes, edges, boardId, projectWorkflows, allWorkflowData, activeWorkflowId } = useWorkflowStore.getState();
        const projectId = workflow.id;

        // Save full project data including sub-workflows
        const projectData = JSON.stringify({
          workflow, nodes, edges, boardId,
          projectWorkflows, allWorkflowData, activeWorkflowId,
        });
        localStorage.setItem(`embedflow-project-${projectId}`, projectData);

        // Update metadata in projects list
        set((state) => {
          const meta: ProjectMeta = {
            id: projectId,
            name: workflow.name,
            boardId: workflow.boardId,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
          };

          const existing = state.projects.findIndex((p) => p.id === projectId);
          const updatedProjects =
            existing >= 0
              ? state.projects.map((p, i) => (i === existing ? meta : p))
              : [...state.projects, meta];

          return {
            projects: updatedProjects,
            currentProjectId: projectId,
          };
        });
      },

      createProject: (name) => {
        // Save the current project first
        get().syncCurrentProject();

        // Reset to a fresh workflow
        useWorkflowStore.getState().resetWorkflow();

        if (name) {
          useWorkflowStore.getState().setWorkflowName(name);
        }

        // Sync the new project immediately
        get().syncCurrentProject();
      },

      switchProject: (id) => {
        const { currentProjectId } = get();
        if (id === currentProjectId) return;

        // Save the current project
        get().syncCurrentProject();

        // Load the target project from localStorage
        const raw = localStorage.getItem(`embedflow-project-${id}`);
        if (!raw) return;

        try {
          const data = JSON.parse(raw);
          useWorkflowStore.getState().loadWorkflow(data.workflow, data.nodes, data.edges);

          // Restore multi-workflow state if available
          if (data.projectWorkflows) {
            useWorkflowStore.setState({
              projectWorkflows: data.projectWorkflows,
              allWorkflowData: data.allWorkflowData || {},
              activeWorkflowId: data.activeWorkflowId || data.workflow.id,
            });
          }

          set({ currentProjectId: id });
        } catch {
          console.error("Failed to load project", id);
        }
      },

      deleteProject: (id) => {
        const { currentProjectId, projects } = get();

        // Remove from localStorage
        localStorage.removeItem(`embedflow-project-${id}`);

        const remaining = projects.filter((p) => p.id !== id);
        set({ projects: remaining });

        // If deleting the current project, switch to another or create new
        if (id === currentProjectId) {
          if (remaining.length > 0) {
            get().switchProject(remaining[0].id);
          } else {
            useWorkflowStore.getState().resetWorkflow();
            get().syncCurrentProject();
          }
        }
      },
    }),
    {
      name: "embedflow-projects",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    },
  ),
);

// Auto-sync on workflow changes (debounced by checking updatedAt)
let lastSyncedAt = "";
useWorkflowStore.subscribe((state) => {
  const { updatedAt } = state.workflow;
  if (updatedAt !== lastSyncedAt) {
    lastSyncedAt = updatedAt;
    // Use microtask to avoid synchronous cross-store updates
    queueMicrotask(() => {
      useProjectStore.getState().syncCurrentProject();
    });
  }
});
