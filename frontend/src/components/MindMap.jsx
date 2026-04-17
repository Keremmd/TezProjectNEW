import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Position,
  useEdgesState,
  useNodesState,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';

const LEVEL_X_GAP = 260;
const NODE_Y_GAP = 70;
const LEVEL_COLORS = [
  { bg: 'linear-gradient(135deg,#6366f1,#8b5cf6)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#10b981,#059669)', text: '#ffffff' },
  { bg: 'linear-gradient(135deg,#f59e0b,#f97316)', text: '#ffffff' },
];

function MindMapNodeBody({ data }) {
  const colors = LEVEL_COLORS[Math.min(data.depth, LEVEL_COLORS.length - 1)];
  const isRoot = data.depth === 0;
  return (
    <div
      onClick={() => data.onNodeClick?.(data)}
      title={data.summary || data.label}
      style={{
        background: colors.bg,
        color: colors.text,
        padding: isRoot ? '14px 20px' : '10px 16px',
        borderRadius: 14,
        minWidth: isRoot ? 200 : 160,
        maxWidth: 260,
        boxShadow:
          '0 10px 25px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.25)',
        cursor: data.page ? 'pointer' : 'default',
        textAlign: 'center',
        fontSize: isRoot ? 15 : 13,
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: 'transparent', border: 'none' }}
      />
      <div>{data.label}</div>
      {data.page && (
        <div
          style={{
            marginTop: 6,
            fontSize: 10,
            opacity: 0.85,
            fontWeight: 500,
            letterSpacing: 0.3,
          }}
        >
          p.{data.page}
        </div>
      )}
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: 'transparent', border: 'none' }}
      />
    </div>
  );
}

const nodeTypes = { mindmap: MindMapNodeBody };

/**
 * Walk the mindmap tree and produce react-flow nodes/edges with a tidy
 * horizontal layout. We compute leaf counts per subtree so siblings don't
 * overlap. Coordinates are in px; parent x is fixed per depth.
 */
function layoutTree(root, onNodeClick) {
  if (!root) return { nodes: [], edges: [] };

  const nodes = [];
  const edges = [];
  let cursorY = 0;

  const countLeaves = (n) => {
    if (!n.children || n.children.length === 0) return 1;
    return n.children.reduce((s, c) => s + countLeaves(c), 0);
  };

  const place = (node, depth, parentId) => {
    const leaves = countLeaves(node);
    const subtreeHeight = leaves * NODE_Y_GAP;
    const yCenter = cursorY + subtreeHeight / 2 - NODE_Y_GAP / 2;

    nodes.push({
      id: node.id,
      type: 'mindmap',
      position: { x: depth * LEVEL_X_GAP, y: yCenter },
      data: {
        label: node.label,
        summary: node.summary,
        page: node.page,
        depth,
        onNodeClick,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: true,
    });

    if (parentId) {
      edges.push({
        id: `${parentId}->${node.id}`,
        source: parentId,
        target: node.id,
        type: 'smoothstep',
        animated: false,
        style: { stroke: '#9ca3af', strokeWidth: 1.5 },
      });
    }

    if (!node.children || node.children.length === 0) {
      cursorY += NODE_Y_GAP;
      return;
    }

    for (const child of node.children) {
      place(child, depth + 1, node.id);
    }
  };

  place(root, 0, null);
  return { nodes, edges };
}

export default function MindMap({
  mindmap,
  onNodeClick,
  className = '',
  compact = false,
}) {
  const handleNodeClick = useCallback(
    (data) => {
      if (data?.page && onNodeClick) onNodeClick(data);
    },
    [onNodeClick]
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => layoutTree(mindmap?.root, handleNodeClick),
    [mindmap, handleNodeClick]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [showSummary, setShowSummary] = useState(true);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (!mindmap?.root) return null;

  const selected = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)?.data
    : null;

  return (
    <div className={`relative w-full h-full ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setShowSummary(true);
          handleNodeClick(node.data);
        }}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: compact ? 0.12 : 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={compact ? 18 : 24} size={1} color="#d4d4d8" />
        <Controls
          showInteractive={false}
          position="bottom-left"
          style={compact ? { transform: 'scale(0.8)', transformOrigin: 'bottom left' } : undefined}
        />
        {!compact && (
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => {
              const d = n.data?.depth ?? 0;
              const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b'];
              return palette[Math.min(d, palette.length - 1)];
            }}
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
            }}
          />
        )}
      </ReactFlow>

      {selected?.summary && showSummary && (
        <div
          className={`absolute rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur shadow-lg text-xs ${
            compact
              ? 'top-2 left-2 right-2 px-3 py-2'
              : 'bottom-4 left-4 max-w-md px-4 py-3 text-sm'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSummary(false);
            }}
            className="absolute top-1 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs leading-none"
            aria-label="Close summary"
          >
            ×
          </button>
          <div className="font-semibold text-gray-900 dark:text-white mb-0.5 pr-4">
            {selected.label}
            {selected.page && (
              <span className="ml-2 text-[10px] font-medium text-blue-600 dark:text-blue-400">
                p.{selected.page}
              </span>
            )}
          </div>
          <div className="text-gray-600 dark:text-gray-300 leading-snug line-clamp-3">
            {selected.summary}
          </div>
        </div>
      )}
    </div>
  );
}
