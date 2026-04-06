import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ActivityNode from "./ActivityNode";
import { useWorkflowStore } from "../../stores/workflow-store";
import { autoLayout } from "../../services/auto-layout";

const nodeTypes = { activity: ActivityNode };

export default function WorkflowCanvas() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const onConnect = useWorkflowStore((s) => s.onConnect);
  const addNode = useWorkflowStore((s) => s.addNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();

  const [layoutDir, setLayoutDir] = useState<"TB" | "LR">("TB");

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const activityId = event.dataTransfer.getData("application/embedflow-activity");
      if (!activityId) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = {
        x: event.clientX - bounds.left - 90,
        y: event.clientY - bounds.top - 20,
      };

      addNode(activityId, position);
    },
    [addNode],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode],
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  const handleAutoLayout = useCallback(() => {
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;
    if (currentNodes.length === 0) return;

    const layoutedNodes = autoLayout(currentNodes, currentEdges, layoutDir);

    // Apply positions via onNodesChange
    const changes = layoutedNodes.map((n) => ({
      type: "position" as const,
      id: n.id,
      position: n.position,
    }));
    onNodesChange(changes);

    // Also update workflow positions
    const state = useWorkflowStore.getState();
    const updatedWorkflowNodes = state.workflow.nodes.map((wn) => {
      const layouted = layoutedNodes.find((ln) => ln.id === wn.id);
      return layouted ? { ...wn, position: layouted.position } : wn;
    });

    useWorkflowStore.setState({
      workflow: {
        ...state.workflow,
        nodes: updatedWorkflowNodes,
        updatedAt: new Date().toISOString(),
      },
    });

    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [layoutDir, onNodesChange, fitView]);

  const toggleDirection = useCallback(() => {
    setLayoutDir((d) => (d === "TB" ? "LR" : "TB"));
  }, []);

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        selectionOnDrag
        multiSelectionKeyCode="Shift"
        deleteKeyCode={["Backspace", "Delete"]}
        defaultEdgeOptions={{
          style: { stroke: "#6b7280", strokeWidth: 2 },
          animated: false,
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
        <Controls className="!bg-gray-800 !border-gray-700 !shadow-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700" />
        <MiniMap
          className="!bg-gray-900 !border-gray-700"
          nodeColor={(node) => {
            const data = node.data as { color?: string } | undefined;
            return data?.color || "#6b7280";
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
        />

        {/* Auto-layout controls */}
        {nodes.length > 1 && (
          <Panel position="top-right" className="flex items-center gap-1">
            <button
              onClick={handleAutoLayout}
              className="px-2.5 py-1.5 text-xs rounded-md bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 shadow-md transition-colors backdrop-blur-sm"
              title="Organiser automatiquement"
            >
              ✨ Auto-layout
            </button>
            <button
              onClick={toggleDirection}
              className="px-2 py-1.5 text-xs rounded-md bg-gray-800/90 hover:bg-gray-700 text-gray-400 border border-gray-700 shadow-md transition-colors backdrop-blur-sm"
              title={layoutDir === "TB" ? "Vertical → Horizontal" : "Horizontal → Vertical"}
            >
              {layoutDir === "TB" ? "↕" : "↔"}
            </button>
          </Panel>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="!top-1/3">
            <div className="text-center px-8 py-6 rounded-xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-sm max-w-sm">
              <div className="text-4xl mb-3 opacity-40">🔌</div>
              <h3 className="text-sm font-semibold text-gray-300 mb-1">
                Commencez votre projet
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Glissez un bloc depuis le panneau de gauche, ou utilisez un template pour démarrer rapidement.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
