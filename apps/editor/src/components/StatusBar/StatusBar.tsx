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
        // Ignore codegen errors for stats
      }
    }

    const ramPercent = totalRam > 0 ? Math.round((estimatedRam / totalRam) * 100) : 0;
    const flashPercent = totalFlash > 0 ? Math.round((estimatedFlash / totalFlash) * 100) : 0;

    return { nodeCount, edgeCount, estimatedRam, estimatedFlash, ramPercent, flashPercent, totalRam, totalFlash };
  }, [nodes.length, edges.length, boardId, workflow]);

  const ramColor =
    stats.ramPercent > 80 ? "text-red-400" : stats.ramPercent > 50 ? "text-yellow-400" : "text-green-400";
  const flashColor =
    stats.flashPercent > 80 ? "text-red-400" : stats.flashPercent > 50 ? "text-yellow-400" : "text-green-400";

  return (
    <div className="flex items-center gap-4 px-4 py-1 border-t border-gray-800 bg-gray-900/80 text-[10px] text-gray-500 shrink-0">
      <span>
        {stats.nodeCount} bloc{stats.nodeCount !== 1 ? "s" : ""}
      </span>
      <span>
        {stats.edgeCount} connexion{stats.edgeCount !== 1 ? "s" : ""}
      </span>

      {stats.nodeCount > 0 && (
        <>
          <div className="w-px h-3 bg-gray-800" />
          <span>
            RAM :{" "}
            <span className={ramColor}>
              {stats.estimatedRam > 1024
                ? `${(stats.estimatedRam / 1024).toFixed(1)} Ko`
                : `${stats.estimatedRam} o`}
              {stats.totalRam > 0 ? ` (${stats.ramPercent}%)` : ""}
            </span>
          </span>
          <span>
            Flash :{" "}
            <span className={flashColor}>
              {stats.estimatedFlash > 1024
                ? `${(stats.estimatedFlash / 1024).toFixed(1)} Ko`
                : `${stats.estimatedFlash} o`}
              {stats.totalFlash > 0 ? ` (${stats.flashPercent}%)` : ""}
            </span>
          </span>
        </>
      )}

      <div className="flex-1" />
      <span className="text-gray-600">EmbedFlow v0.0.0</span>
    </div>
  );
}
