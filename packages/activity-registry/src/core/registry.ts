import type { ActivityDefinition } from "./types.js";

const registry = new Map<string, ActivityDefinition>();

export function registerActivity(definition: ActivityDefinition): void {
  registry.set(definition.id, definition);
}

export function getActivity(id: string): ActivityDefinition | undefined {
  return registry.get(id);
}

export function listActivities(): ActivityDefinition[] {
  return Array.from(registry.values());
}

export function listByCategory(category: string): ActivityDefinition[] {
  return Array.from(registry.values()).filter((a) => a.category === category);
}

export function getCategories(): string[] {
  const categories = new Set<string>();
  for (const activity of registry.values()) {
    categories.add(activity.category);
  }
  return Array.from(categories);
}

export function validateCompatibility(activityId: string, boardId: string): boolean {
  const activity = registry.get(activityId);
  if (!activity) return false;
  return activity.supportedBoards.includes(boardId);
}
