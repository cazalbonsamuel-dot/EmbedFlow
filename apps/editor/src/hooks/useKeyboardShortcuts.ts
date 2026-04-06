import { useEffect } from "react";
import { useWorkflowStore } from "../stores/workflow-store";
import { useClipboardStore } from "../stores/clipboard-store";
import { useProjectStore } from "../stores/project-store";
import { exportWorkflow } from "../services/workflow-io";

interface ShortcutCallbacks {
  onToggleShortcutDialog: () => void;
  onTriggerImport: () => void;
  onSave: () => void;
}

export function useKeyboardShortcuts(callbacks: ShortcutCallbacks) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture shortcuts when typing in form fields
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        // Allow Ctrl+S even in inputs
        if (!(e.ctrlKey && e.key === "s")) return;
      }

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z — Undo
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        useWorkflowStore.temporal.getState().undo();
        return;
      }

      // Ctrl+Y or Ctrl+Shift+Z — Redo
      if ((ctrl && e.key === "y") || (ctrl && e.shiftKey && e.key === "z") || (ctrl && e.shiftKey && e.key === "Z")) {
        e.preventDefault();
        useWorkflowStore.temporal.getState().redo();
        return;
      }

      // Ctrl+S — Save
      if (ctrl && e.key === "s") {
        e.preventDefault();
        useProjectStore.getState().syncCurrentProject();
        callbacks.onSave();
        return;
      }

      // Ctrl+C — Copy
      if (ctrl && e.key === "c") {
        e.preventDefault();
        useClipboardStore.getState().copySelection();
        return;
      }

      // Ctrl+V — Paste
      if (ctrl && e.key === "v") {
        e.preventDefault();
        useClipboardStore.getState().paste();
        return;
      }

      // Ctrl+E — Export
      if (ctrl && e.key === "e") {
        e.preventDefault();
        exportWorkflow();
        return;
      }

      // Ctrl+/ — Toggle shortcut dialog
      if (ctrl && e.key === "/") {
        e.preventDefault();
        callbacks.onToggleShortcutDialog();
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [callbacks]);
}
