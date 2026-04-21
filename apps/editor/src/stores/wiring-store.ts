import { create } from "zustand";
import { useWorkflowStore } from "./workflow-store";

interface WiringState {
  showWiringPanel: boolean;
  checkedConnections: Set<string>;

  toggleWiringPanel: () => void;
  toggleConnection: (id: string) => void;
  resetChecklist: () => void;
}

export const useWiringStore = create<WiringState>((set) => ({
  showWiringPanel: false,
  checkedConnections: new Set(),

  toggleWiringPanel: () => {
    set((s) => {
      const next = !s.showWiringPanel;
      // Mutual exclusion: close code panel and simulator
      if (next) {
        useWorkflowStore.setState({ showCodePanel: false });
        // simulation-store is imported dynamically to avoid circular dependency
        import("./simulation-store").then(({ useSimulationStore }) => {
          if (useSimulationStore.getState().showSimulator) {
            useSimulationStore.setState({ showSimulator: false });
          }
        });
      }
      return { showWiringPanel: next };
    });
  },

  toggleConnection: (id) => {
    set((s) => {
      const next = new Set(s.checkedConnections);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { checkedConnections: next };
    });
  },

  resetChecklist: () => {
    set({ checkedConnections: new Set() });
  },
}));
