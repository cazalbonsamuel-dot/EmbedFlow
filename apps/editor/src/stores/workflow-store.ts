import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { getActivity } from "@embedflow/activity-registry";
import type { Workflow, ValidationMessage } from "@embedflow/workflow-engine";
import { createWorkflow, validateWorkflow } from "@embedflow/workflow-engine";

export interface ActivityNodeData {
  activityId: string;
  label: string;
  icon: string;
  color: string;
  category: string;
  properties: Record<string, unknown>;
  [key: string]: unknown;
}

interface WorkflowState {
  workflow: Workflow;
  nodes: Node<ActivityNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  boardId: string;
  validationMessages: ValidationMessage[];
  showCodePanel: boolean;

  // Actions
  addNode: (activityId: string, position: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => void;
  updateNodeProperties: (nodeId: string, properties: Record<string, unknown>) => void;
  onNodesChange: OnNodesChange<Node<ActivityNodeData>>;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setBoardId: (boardId: string) => void;
  setWorkflowName: (name: string) => void;
  toggleCodePanel: () => void;
  validate: () => void;
  loadWorkflow: (workflow: Workflow, nodes: Node<ActivityNodeData>[], edges: Edge[]) => void;
  resetWorkflow: () => void;
  pasteNodes: (newNodes: Node<ActivityNodeData>[], newEdges: Edge[]) => void;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    temporal(
      (set, get) => ({
        workflow: createWorkflow("Projet sans titre", "arduino-uno"),
        nodes: [],
        edges: [],
        selectedNodeId: null,
        boardId: "arduino-uno",
        validationMessages: [],
        showCodePanel: false,

        addNode: (activityId, position) => {
          const activity = getActivity(activityId);
          if (!activity) return;

          const nodeId = crypto.randomUUID();
          const defaultProps: Record<string, unknown> = {};
          for (const prop of activity.properties) {
            if (prop.default !== undefined) {
              defaultProps[prop.name] = prop.default;
            }
          }

          const newNode: Node<ActivityNodeData> = {
            id: nodeId,
            type: "activity",
            position,
            data: {
              activityId,
              label: activity.label,
              icon: activity.icon,
              color: activity.color,
              category: activity.category,
              properties: defaultProps,
            },
          };

          set((state) => {
            const workflowNode = {
              id: nodeId,
              activityId,
              position,
              properties: defaultProps,
            };
            return {
              nodes: [...state.nodes, newNode],
              workflow: {
                ...state.workflow,
                nodes: [...state.workflow.nodes, workflowNode],
                updatedAt: new Date().toISOString(),
              },
            };
          });

          get().validate();
        },

        removeNode: (nodeId) => {
          set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== nodeId),
            edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
            selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            workflow: {
              ...state.workflow,
              nodes: state.workflow.nodes.filter((n) => n.id !== nodeId),
              edges: state.workflow.edges.filter(
                (e) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId,
              ),
              updatedAt: new Date().toISOString(),
            },
          }));
          get().validate();
        },

        updateNodeProperties: (nodeId, properties) => {
          set((state) => ({
            nodes: state.nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, properties } } : n,
            ),
            workflow: {
              ...state.workflow,
              nodes: state.workflow.nodes.map((n) =>
                n.id === nodeId ? { ...n, properties } : n,
              ),
              updatedAt: new Date().toISOString(),
            },
          }));
          get().validate();
        },

        onNodesChange: (changes) => {
          set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes),
          }));
        },

        onEdgesChange: (changes) => {
          set((state) => ({
            edges: applyEdgeChanges(changes, state.edges),
          }));
        },

        onConnect: (connection) => {
          const edgeId = crypto.randomUUID();
          const newEdge: Edge = {
            id: edgeId,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            animated: false,
          };

          set((state) => ({
            edges: [...state.edges, newEdge],
            workflow: {
              ...state.workflow,
              edges: [
                ...state.workflow.edges,
                {
                  id: edgeId,
                  sourceNodeId: connection.source,
                  sourcePortId: connection.sourceHandle || "",
                  targetNodeId: connection.target,
                  targetPortId: connection.targetHandle || "",
                },
              ],
              updatedAt: new Date().toISOString(),
            },
          }));
          get().validate();
        },

        setSelectedNode: (nodeId) => {
          set({ selectedNodeId: nodeId });
        },

        setBoardId: (boardId) => {
          set((state) => ({
            boardId,
            workflow: { ...state.workflow, boardId, updatedAt: new Date().toISOString() },
          }));
          get().validate();
        },

        toggleCodePanel: () => {
          set((state) => ({ showCodePanel: !state.showCodePanel }));
        },

        setWorkflowName: (name) => {
          set((state) => ({
            workflow: { ...state.workflow, name, updatedAt: new Date().toISOString() },
          }));
        },

        validate: () => {
          const state = get();
          const result = validateWorkflow(state.workflow);
          set({ validationMessages: result.messages });
        },

        loadWorkflow: (workflow, nodes, edges) => {
          set({
            workflow,
            nodes,
            edges,
            boardId: workflow.boardId,
            selectedNodeId: null,
            validationMessages: [],
          });
          get().validate();
        },

        resetWorkflow: () => {
          const fresh = createWorkflow("Projet sans titre", "arduino-uno");
          set({
            workflow: fresh,
            nodes: [],
            edges: [],
            boardId: "arduino-uno",
            selectedNodeId: null,
            validationMessages: [],
          });
        },

        pasteNodes: (newNodes, newEdges) => {
          set((state) => {
            const workflowNodes = newNodes.map((n) => ({
              id: n.id,
              activityId: n.data.activityId,
              position: n.position,
              properties: n.data.properties,
            }));

            const workflowEdges = newEdges.map((e) => ({
              id: e.id,
              sourceNodeId: e.source,
              sourcePortId: e.sourceHandle || "",
              targetNodeId: e.target,
              targetPortId: e.targetHandle || "",
            }));

            return {
              nodes: [...state.nodes, ...newNodes],
              edges: [...state.edges, ...newEdges],
              workflow: {
                ...state.workflow,
                nodes: [...state.workflow.nodes, ...workflowNodes],
                edges: [...state.workflow.edges, ...workflowEdges],
                updatedAt: new Date().toISOString(),
              },
            };
          });
          get().validate();
        },
      }),
      {
        partialize: (state) => ({
          workflow: state.workflow,
          nodes: state.nodes,
          edges: state.edges,
        }),
        limit: 50,
        equality: (pastState, currentState) =>
          pastState.workflow.updatedAt === currentState.workflow.updatedAt,
      },
    ),
    {
      name: "embedflow-current-workflow",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workflow: state.workflow,
        nodes: state.nodes,
        edges: state.edges,
        boardId: state.boardId,
      }),
    },
  ),
);
