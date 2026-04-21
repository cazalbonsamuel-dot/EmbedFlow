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
import NodeContextMenu from "./NodeContextMenu";
import { useWorkflowStore } from "../../stores/workflow-store";
import { useSimulationStore } from "../../stores/simulation-store";
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
  const [contextMenu, setContextMenu] = useState<{ nodeId: string; position: { x: number; y: number } } | null>(null);
  const simStatus = useSimulationStore((s) => s.simulationStatus);
  const isSimRunning = simStatus === "running";

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
    setContextMenu(null);
  }, [setSelectedNode]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: { id: string }) => {
    event.preventDefault();
    setContextMenu({
      nodeId: node.id,
      position: { x: event.clientX, y: event.clientY },
    });
  }, []);

  const handleAutoLayout = useCallback(() => {
    const currentNodes = useWorkflowStore.getState().nodes;
    const currentEdges = useWorkflowStore.getState().edges;
    if (currentNodes.length === 0) return;

    const layoutedNodes = autoLayout(currentNodes, currentEdges, layoutDir);

    const changes = layoutedNodes.map((n) => ({
      type: "position" as const,
      id: n.id,
      position: n.position,
    }));
    onNodesChange(changes);

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
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative"
      style={{ background: "var(--color-base)" }}
    >
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
        onNodeContextMenu={onNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        selectionOnDrag
        multiSelectionKeyCode="Shift"
        deleteKeyCode={["Backspace", "Delete"]}
        defaultEdgeOptions={{
          style: {
            stroke: isSimRunning ? "#4B7CF3" : "#303036",
            strokeWidth: 1.5,
          },
          animated: isSimRunning,
        }}
        style={{ background: "var(--color-base)" }}
      >
        {/* Subtle dot grid */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="rgba(255,255,255,0.04)"
        />

        {/* Controls */}
        <Controls
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "4px",
          }}
          className="[&>button]:!bg-transparent [&>button]:!border-0 [&>button]:!text-[var(--text-tertiary)] [&>button:hover]:!bg-[var(--color-overlay)] [&>button:hover]:!text-[var(--text-secondary)]"
        />

        {/* MiniMap */}
        <MiniMap
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "4px",
          }}
          nodeColor={(node) => {
            const d = node.data as { color?: string } | undefined;
            return d?.color || "#303036";
          }}
          maskColor="rgba(9,9,11,0.7)"
        />

        {/* Auto-layout controls */}
        {nodes.length > 1 && (
          <Panel position="top-right" className="flex items-center gap-1">
            <button
              onClick={handleAutoLayout}
              className="px-2.5 py-1 text-xs rounded transition-colors duration-100"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-secondary)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
              title="Organiser automatiquement"
            >
              ✦ Auto-layout
            </button>
            <button
              onClick={toggleDirection}
              className="w-7 h-7 flex items-center justify-center rounded transition-colors duration-100"
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--border-default)",
                color: "var(--text-tertiary)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-overlay)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
              title={layoutDir === "TB" ? "Vertical → Horizontal" : "Horizontal → Vertical"}
            >
              {layoutDir === "TB" ? "↕" : "↔"}
            </button>
          </Panel>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="!top-1/3">
            <div
              className="text-center px-8 py-6 rounded max-w-xs"
              style={{
                background: "var(--color-raised)",
                border: "1px solid var(--border-default)",
              }}
            >
              <div
                className="text-3xl mb-3"
                style={{ opacity: 0.3 }}
              >
                ⬡
              </div>
              <h3
                className="text-xs font-semibold mb-1"
                style={{ color: "var(--text-primary)" }}
              >
                Commencez votre projet
              </h3>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: "var(--text-tertiary)" }}
              >
                Glissez un bloc depuis le panneau de gauche, ou utilisez un template pour démarrer rapidement.
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
