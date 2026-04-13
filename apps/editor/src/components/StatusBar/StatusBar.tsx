import { useMemo } from "react";
import { useWorkflowStore } from "../../stores/workflow-store";
import { generateCode } from "@embedflow/codegen";
import type { TargetPlatform } from "@embedflow/codegen";
import { getBoard } from "@embedflow/hardware-db";

export default function StatusBar() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const boardId = useWorkflowStore((s) => s.boardId);

  const stats = useMemo(() => {
    const board = getBoard(boardId);
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    let estimatedRam = 0;
    let estimatedFlash = 0;
    let totalRam = board?.ram ?? 0;
    let totalFlash = board?.flash ?? 0;

    if (nodeCount > 0) {
      try {
        const result = generateCode(workflow, {
          target: boardId as TargetPlatform,
          comments: false,
          language: "fr",
        });
        estimatedRam = result.estimatedRam;
        estimatedFlash = result.estimatedFlash;
      } catch {
        // ignore
      }
    }

    const ramPercent = totalRam > 0 ? Math.round((estimatedRam / totalRam) * 100) : 0;
    const flashPercent = totalFlash > 0 ? Math.round((estimatedFlash / totalFlash) * 100) : 0;

    return { nodeCount, edgeCount, estimatedRam, estimatedFlash, ramPercent, flashPercent, totalRam, totalFlash };
  }, [nodes.length, edges.length, boardId, workflow]);

  const ramColor =
    stats.ramPercent > 80 ? "var(--error)" : stats.ramPercent > 50 ? "var(--warning)" : "var(--success)";
  const flashColor =
    stats.flashPercent > 80 ? "var(--error)" : stats.flashPercent > 50 ? "var(--warning)" : "var(--success)";

  return (
    <div
      className="flex items-center gap-3 px-3 shrink-0 font-mono"
      style={{
        height: "22px",
        borderTop: "1px solid var(--border-dim)",
        background: "var(--color-raised)",
        color: "var(--text-tertiary)",
        fontSize: "10px",
      }}
    >
      <span>{stats.nodeCount} bloc{stats.nodeCount !== 1 ? "s" : ""}</span>
      <span style={{ color: "var(--border-strong)" }}>·</span>
      <span>{stats.edgeCount} connexion{stats.edgeCount !== 1 ? "s" : ""}</span>

      {stats.nodeCount > 0 && (
        <>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span>
            RAM{" "}
            <span style={{ color: ramColor }}>
              {stats.estimatedRam > 1024
                ? `${(stats.estimatedRam / 1024).toFixed(1)}K`
                : `${stats.estimatedRam}B`}
              {stats.totalRam > 0 ? ` (${stats.ramPercent}%)` : ""}
            </span>
          </span>
          <span style={{ color: "var(--border-strong)" }}>·</span>
          <span>
            Flash{" "}
            <span style={{ color: flashColor }}>
              {stats.estimatedFlash > 1024
                ? `${(stats.estimatedFlash / 1024).toFixed(1)}K`
                : `${stats.estimatedFlash}B`}
              {stats.totalFlash > 0 ? ` (${stats.flashPercent}%)` : ""}
            </span>
          </span>
        </>
      )}

      <div className="flex-1" />
      <span style={{ color: "var(--text-tertiary)", opacity: 0.5 }}>EmbedFlow</span>
    </div>
  );
}
