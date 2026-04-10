import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { temporal } from "zundo";
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from "@xyflow/react";
import { applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import { getActivity } from "@embedflow/activity-registry";
import type { Workflow, ValidationMessage, WorkflowArgument } from "@embedflow/workflow-engine";
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

export interface SubWorkflowMeta {
  id: string;
  name: string;
  isMain: boolean;
}

interface WorkflowState {
  workflow: Workflow;
  nodes: Node<ActivityNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  boardId: string;
  validationMessages: ValidationMessage[];
  showCodePanel: boolean;

  // Multi-workflow
  projectWorkflows: SubWorkflowMeta[];
  allWorkflowData: Record<string, { workflow: Workflow; nodes: Node<ActivityNodeData>[]; edges: Edge[] }>;
  activeWorkflowId: string;

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

  // Sub-workflow actions
  addSubWorkflow: (name: string) => void;
  deleteSubWorkflow: (id: string) => void;
  switchWorkflow: (id: string) => void;
  renameWorkflow: (id: string, name: string) => void;
  updateWorkflowArguments: (args: WorkflowArgument[]) => void;
  getAllWorkflows: () => Workflow[];
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    temporal(
      (set, get) => {
        const initialWorkflow = createWorkflow("Projet sans titre", "arduino-uno", true);
        return ({
        workflow: initialWorkflow,
        nodes: [],
        edges: [],
        selectedNodeId: null,
        boardId: "arduino-uno",
        validationMessages: [],
        showCodePanel: false,

        // Multi-workflow initial state
        projectWorkflows: [{ id: initialWorkflow.id, name: initialWorkflow.name, isMain: true }],
        allWorkflowData: {},
        activeWorkflowId: initialWorkflow.id,

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
          set((state) => {
            const newNodes = applyNodeChanges(changes, state.nodes);
            const removedIds = changes.filter((c) => c.type === "remove").map((c) => c.id);
            if (removedIds.length === 0) return { nodes: newNodes };
            return {
              nodes: newNodes,
              workflow: {
                ...state.workflow,
                nodes: state.workflow.nodes.filter((n) => !removedIds.includes(n.id)),
                edges: state.workflow.edges.filter(
                  (e) => !removedIds.includes(e.sourceNodeId) && !removedIds.includes(e.targetNodeId),
                ),
                updatedAt: new Date().toISOString(),
              },
            };
          });
        },

        onEdgesChange: (changes) => {
          set((state) => {
            const newEdges = applyEdgeChanges(changes, state.edges);
            const removedIds = changes.filter((c) => c.type === "remove").map((c) => c.id);
            if (removedIds.length === 0) return { edges: newEdges };
            return {
              edges: newEdges,
              workflow: {
                ...state.workflow,
                edges: state.workflow.edges.filter((e) => !removedIds.includes(e.id)),
                updatedAt: new Date().toISOString(),
              },
            };
          });
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
          // Migrate old workflows without isMain/arguments
          if (workflow.isMain === undefined) workflow.isMain = true;
          if (!workflow.arguments) workflow.arguments = [];

          set({
            workflow,
            nodes,
            edges,
            boardId: workflow.boardId,
            selectedNodeId: null,
            validationMessages: [],
            activeWorkflowId: workflow.id,
            projectWorkflows: [{ id: workflow.id, name: workflow.name, isMain: true }],
            allWorkflowData: {},
          });
          get().validate();
        },

        resetWorkflow: () => {
          const fresh = createWorkflow("Projet sans titre", "arduino-uno", true);
          set({
            workflow: fresh,
            nodes: [],
            edges: [],
            boardId: "arduino-uno",
            selectedNodeId: null,
            validationMessages: [],
            activeWorkflowId: fresh.id,
            projectWorkflows: [{ id: fresh.id, name: fresh.name, isMain: true }],
            allWorkflowData: {},
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

        // --- Sub-workflow actions ---

        addSubWorkflow: (name) => {
          const state = get();
          // Save current workflow data
          const allData = { ...state.allWorkflowData };
          allData[state.activeWorkflowId] = {
            workflow: state.workflow,
            nodes: state.nodes,
            edges: state.edges,
          };

          const newWf = createWorkflow(name, state.boardId, false);
          const newMeta: SubWorkflowMeta = { id: newWf.id, name: newWf.name, isMain: false };

          set({
            workflow: newWf,
            nodes: [],
            edges: [],
            selectedNodeId: null,
            activeWorkflowId: newWf.id,
            projectWorkflows: [...state.projectWorkflows, newMeta],
            allWorkflowData: allData,
            validationMessages: [],
          });
        },

        deleteSubWorkflow: (id) => {
          const state = get();
          const meta = state.projectWorkflows.find((w) => w.id === id);
          if (!meta || meta.isMain) return; // Cannot delete Main

          const allData = { ...state.allWorkflowData };
          delete allData[id];

          const updatedList = state.projectWorkflows.filter((w) => w.id !== id);

          if (state.activeWorkflowId === id) {
            // Switch to Main
            const mainMeta = updatedList.find((w) => w.isMain)!;
            const mainData = allData[mainMeta.id];
            delete allData[mainMeta.id];

            if (mainData) {
              set({
                workflow: mainData.workflow,
                nodes: mainData.nodes,
                edges: mainData.edges,
                activeWorkflowId: mainMeta.id,
                projectWorkflows: updatedList,
                allWorkflowData: allData,
                selectedNodeId: null,
              });
            } else {
              set({
                projectWorkflows: updatedList,
                allWorkflowData: allData,
              });
            }
          } else {
            set({
              projectWorkflows: updatedList,
              allWorkflowData: allData,
            });
          }
          get().validate();
        },

        switchWorkflow: (id) => {
          const state = get();
          if (id === state.activeWorkflowId) return;

          // Check the target exists in the project
          if (!state.projectWorkflows.some((w) => w.id === id)) return;

          // Save current workflow to allWorkflowData
          const allData = { ...state.allWorkflowData };
          allData[state.activeWorkflowId] = {
            workflow: state.workflow,
            nodes: state.nodes,
            edges: state.edges,
          };

          // Load target from allWorkflowData
          const targetData = allData[id];
          if (!targetData) {
            // Target not cached — create an empty workflow for it
            // This can happen after a page reload where data wasn't properly saved
            const meta = state.projectWorkflows.find((w) => w.id === id);
            const emptyWf = createWorkflow(meta?.name || "Sans titre", state.boardId, meta?.isMain ?? false);
            emptyWf.id = id;
            emptyWf.arguments = [];

            set({
              workflow: emptyWf,
              nodes: [],
              edges: [],
              activeWorkflowId: id,
              allWorkflowData: allData,
              selectedNodeId: null,
              validationMessages: [],
            });
            get().validate();
            return;
          }

          delete allData[id];

          set({
            workflow: targetData.workflow,
            nodes: targetData.nodes,
            edges: targetData.edges,
            activeWorkflowId: id,
            allWorkflowData: allData,
            selectedNodeId: null,
            validationMessages: [],
          });
          get().validate();
        },

        renameWorkflow: (id, name) => {
          set((state) => {
            const updatedList = state.projectWorkflows.map((w) =>
              w.id === id ? { ...w, name } : w,
            );

            if (id === state.activeWorkflowId) {
              return {
                projectWorkflows: updatedList,
                workflow: { ...state.workflow, name, updatedAt: new Date().toISOString() },
              };
            }

            // Update in allWorkflowData
            const allData = { ...state.allWorkflowData };
            if (allData[id]) {
              allData[id] = {
                ...allData[id],
                workflow: { ...allData[id].workflow, name, updatedAt: new Date().toISOString() },
              };
            }

            return { projectWorkflows: updatedList, allWorkflowData: allData };
          });
        },

        updateWorkflowArguments: (args) => {
          set((state) => ({
            workflow: {
              ...state.workflow,
              arguments: args,
              updatedAt: new Date().toISOString(),
            },
          }));
        },

        getAllWorkflows: () => {
          const state = get();
          const workflows: Workflow[] = [state.workflow];
          for (const [id, data] of Object.entries(state.allWorkflowData)) {
            if (id !== state.activeWorkflowId) {
              workflows.push(data.workflow);
            }
          }
          return workflows;
        },
      });
      },
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
        projectWorkflows: state.projectWorkflows,
        allWorkflowData: state.allWorkflowData,
        activeWorkflowId: state.activeWorkflowId,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<WorkflowState> | undefined;
        if (!p) return current;

        // Migrate workflow: ensure isMain and arguments exist
        const wf = p.workflow ?? current.workflow;
        if (wf.isMain === undefined) (wf as Workflow).isMain = true;
        if (!(wf as Workflow).arguments) (wf as Workflow).arguments = [];

        // Migrate: ensure projectWorkflows exists
        let projectWorkflows = p.projectWorkflows;
        if (!projectWorkflows || !Array.isArray(projectWorkflows) || projectWorkflows.length === 0) {
          projectWorkflows = [{ id: wf.id, name: wf.name, isMain: true }];
        }

        // Migrate: ensure allWorkflowData exists
        const allWorkflowData = p.allWorkflowData && typeof p.allWorkflowData === "object"
          ? p.allWorkflowData
          : {};

        // Migrate workflows inside allWorkflowData
        for (const data of Object.values(allWorkflowData)) {
          if (data.workflow) {
            if (data.workflow.isMain === undefined) data.workflow.isMain = false;
            if (!data.workflow.arguments) data.workflow.arguments = [];
          }
        }

        const activeWorkflowId = p.activeWorkflowId || wf.id;

        return {
          ...current,
          ...p,
          workflow: wf as Workflow,
          projectWorkflows,
          allWorkflowData,
          activeWorkflowId,
        };
      },
    },
  ),
);
