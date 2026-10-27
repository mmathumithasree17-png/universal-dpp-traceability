import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  Box,
  Cpu,
  QrCode,
  Truck,
  AlertTriangle,
  Minus,
  Plus,
} from 'lucide-react';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;
const TIER_X = {
  1: 60,
  2: 380,
  3: 700,
  4: 1020,
  5: 1340,
};

const TIER_COLORS = {
  BATCH: {
    border: 'border-emerald-500/60',
    bg: 'bg-emerald-950/40',
    text: 'text-emerald-300',
    icon: Layers,
    accent: '#10b981',
  },
  COMPONENT: {
    border: 'border-cyan-500/60',
    bg: 'bg-cyan-950/40',
    text: 'text-cyan-300',
    icon: Box,
    accent: '#06b6d4',
  },
  ASSEMBLY: {
    border: 'border-gold-500/60',
    bg: 'bg-gold-950/40',
    text: 'text-gold-300',
    icon: Cpu,
    accent: '#f59e0b',
  },
  PRODUCT: {
    border: 'border-sky-500/60',
    bg: 'bg-sky-950/40',
    text: 'text-sky-300',
    icon: QrCode,
    accent: '#38bdf8',
  },
  SHIPMENT: {
    border: 'border-indigo-500/60',
    bg: 'bg-indigo-950/40',
    text: 'text-indigo-300',
    icon: Truck,
    accent: '#818cf8',
  },
};

export default function GenealogyGraphCanvas({
  nodes = [],
  edges = [],
  selectedNodeId,
  highlightedNodeId,
  onSelectNode,
}) {
  const containerRef = useRef(null);

  // Pan and Zoom transform states
  const [transform, setTransform] = useState({ x: 40, y: 40, scale: 0.85 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Collapsed nodes state (tracks node IDs whose downstream branches are collapsed)
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());

  // Toggle Branch Collapse/Expand
  const toggleCollapse = (e, nodeId) => {
    e.stopPropagation();
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Determine hidden nodes based on collapsed state
  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set();
    collapsedNodes.forEach((collapsedId) => {
      // Find all downstream descendants
      const queue = [collapsedId];
      while (queue.length > 0) {
        const curr = queue.shift();
        const outgoing = edges.filter((e) => e.source === curr);
        outgoing.forEach((e) => {
          if (!hidden.has(e.target)) {
            hidden.add(e.target);
            queue.push(e.target);
          }
        });
      }
    });
    return hidden;
  }, [collapsedNodes, edges]);

  // Filter visible nodes and edges
  const visibleNodes = useMemo(() => {
    return nodes.filter((n) => !hiddenNodeIds.has(n.id));
  }, [nodes, hiddenNodeIds]);

  const visibleEdges = useMemo(() => {
    const visibleIdSet = new Set(visibleNodes.map((n) => n.id));
    return edges.filter((e) => visibleIdSet.has(e.source) && visibleIdSet.has(e.target));
  }, [edges, visibleNodes]);

  // Layout positions: Group visible nodes by tier and calculate (x, y) coordinates
  const nodePositions = useMemo(() => {
    const positions = {};
    const tiers = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    visibleNodes.forEach((node) => {
      const tier = node.tier || 1;
      if (!tiers[tier]) tiers[tier] = [];
      tiers[tier].push(node);
    });

    const verticalGap = 130;
    const maxNodesInAnyTier = Math.max(...Object.values(tiers).map((list) => list.length), 1);
    const totalMaxHeight = maxNodesInAnyTier * verticalGap;

    Object.entries(tiers).forEach(([tierNum, tierNodes]) => {
      const x = TIER_X[tierNum] || 100;
      const count = tierNodes.length;
      const tierHeight = count * verticalGap;
      const startY = 80 + Math.max(0, (totalMaxHeight - tierHeight) / 2);

      tierNodes.forEach((node, idx) => {
        const y = startY + idx * verticalGap;
        positions[node.id] = { x, y };
      });
    });

    return positions;
  }, [visibleNodes]);

  // Pan interaction handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-node') || e.target.closest('.canvas-controls')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setTransform((prev) => ({
      ...prev,
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Wheel zoom handler
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setTransform((prev) => {
      const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.4), 2.2);
      return { ...prev, scale: newScale };
    });
  };

  // Zoom control buttons
  const zoomIn = () => setTransform((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 2.2) }));
  const zoomOut = () => setTransform((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.4) }));
  const resetView = () => setTransform({ x: 40, y: 40, scale: 0.85 });
  const fitToScreen = () => {
    setTransform({ x: 20, y: 20, scale: 0.75 });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-[650px] bg-navy-950/90 rounded-2xl border border-navy-800 overflow-hidden cursor-grab active:cursor-grabbing select-none"
    >
      {/* Background industrial grid pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e3256" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 p-1.5 bg-navy-900/90 backdrop-blur-md rounded-xl border border-navy-700 shadow-xl canvas-controls">
        <button
          onClick={zoomIn}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={fitToScreen}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-navy-800 transition-colors"
          title="Reset Zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Tier Column Headers at Top */}
      <div
        style={{
          transform: `translate(${transform.x}px, 15px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        className="absolute z-10 pointer-events-none flex font-mono text-[11px] uppercase tracking-wider text-slate-400"
      >
        <span style={{ position: 'absolute', left: `${TIER_X[1]}px`, width: `${NODE_WIDTH}px` }} className="text-center text-emerald-400">
          Tier 1: Material Batches
        </span>
        <span style={{ position: 'absolute', left: `${TIER_X[2]}px`, width: `${NODE_WIDTH}px` }} className="text-center text-cyan-400">
          Tier 2: Components
        </span>
        <span style={{ position: 'absolute', left: `${TIER_X[3]}px`, width: `${NODE_WIDTH}px` }} className="text-center text-gold-400">
          Tier 3: Assemblies
        </span>
        <span style={{ position: 'absolute', left: `${TIER_X[4]}px`, width: `${NODE_WIDTH}px` }} className="text-center text-sky-400">
          Tier 4: Finished Products
        </span>
        <span style={{ position: 'absolute', left: `${TIER_X[5]}px`, width: `${NODE_WIDTH}px` }} className="text-center text-indigo-400">
          Tier 5: Shipments
        </span>
      </div>

      {/* Main SVG Layer for Edges and SVG elements */}
      <svg
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 w-[2000px] h-[1600px] overflow-visible pointer-events-none"
      >
        <defs>
          {/* Arrow markers */}
          <marker
            id="arrowNormal"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#00f2fe" opacity="0.8" />
          </marker>

          <marker
            id="arrowQuarantine"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
          </marker>
        </defs>

        {/* Render Connecting Edges */}
        {visibleEdges.map((edge) => {
          const srcPos = nodePositions[edge.source];
          const tgtPos = nodePositions[edge.target];
          if (!srcPos || !tgtPos) return null;

          const startX = srcPos.x + NODE_WIDTH;
          const startY = srcPos.y + NODE_HEIGHT / 2;
          const endX = tgtPos.x;
          const endY = tgtPos.y + NODE_HEIGHT / 2;

          // Cubic Bezier curve
          const deltaX = Math.abs(endX - startX) * 0.45;
          const d = `M ${startX} ${startY} C ${startX + deltaX} ${startY}, ${endX - deltaX} ${endY}, ${endX} ${endY}`;
          const isQuarantineEdge = edge.isQuarantined;

          return (
            <g key={edge.id} className="transition-all">
              {/* Outer glow line */}
              <path
                d={d}
                fill="none"
                stroke={isQuarantineEdge ? '#f43f5e' : '#00f2fe'}
                strokeWidth={isQuarantineEdge ? '3' : '2'}
                strokeOpacity={isQuarantineEdge ? '0.7' : '0.35'}
                className={isQuarantineEdge ? 'animate-pulse' : ''}
              />
              {/* Core line with arrow */}
              <path
                d={d}
                fill="none"
                stroke={isQuarantineEdge ? '#f43f5e' : '#0891b2'}
                strokeWidth={isQuarantineEdge ? '2' : '1.5'}
                markerEnd={isQuarantineEdge ? 'url(#arrowQuarantine)' : 'url(#arrowNormal)'}
              />
            </g>
          );
        })}
      </svg>

      {/* Render HTML Nodes Layer for crisp text and clickable buttons */}
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 w-[2000px] h-[1600px] pointer-events-none"
      >
        {visibleNodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const cfg = TIER_COLORS[node.type] || TIER_COLORS.PRODUCT;
          const Icon = cfg.icon;
          const isSelected = selectedNodeId === node.id;
          const isHighlighted = highlightedNodeId === node.id;
          const isQuarantined = node.isQuarantined;
          const isCollapsed = collapsedNodes.has(node.id);

          // Check if node has outgoing edges
          const hasChildren = edges.some((e) => e.source === node.id);

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node)}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${NODE_WIDTH}px`,
                height: `${NODE_HEIGHT}px`,
              }}
              className={`interactive-node pointer-events-auto p-3 rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                isQuarantined
                  ? 'bg-rose-950/60 border-rose-500/80 shadow-2xl shadow-rose-950 animate-pulse'
                  : `${cfg.bg} ${cfg.border} hover:border-cyan-400 hover:shadow-glow-cyan/20`
              } ${
                isSelected
                  ? 'ring-2 ring-gold-400 shadow-glow-gold/40 scale-105 z-30'
                  : isHighlighted
                  ? 'ring-2 ring-cyan-400 scale-105 z-30'
                  : 'z-10'
              }`}
            >
              {/* Node Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 truncate">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isQuarantined ? 'text-rose-400' : cfg.text}`} />
                  <span className="font-mono font-bold text-xs text-white truncate">{node.id}</span>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  {isQuarantined ? (
                    <span className="flex items-center space-x-0.5 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>HOLD</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-navy-950 border border-navy-800 text-slate-300">
                      {node.status}
                    </span>
                  )}

                  {/* Branch Expand / Collapse Toggle Button */}
                  {hasChildren && (
                    <button
                      onClick={(e) => toggleCollapse(e, node.id)}
                      className="p-1 rounded bg-navy-950 hover:bg-navy-800 text-slate-400 hover:text-white border border-navy-800 transition-colors"
                      title={isCollapsed ? 'Expand downstream branches' : 'Collapse downstream branches'}
                    >
                      {isCollapsed ? <Plus className="w-2.5 h-2.5 text-cyan-400" /> : <Minus className="w-2.5 h-2.5 text-slate-400" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Node Body / Label */}
              <p className="text-[11px] font-sans text-slate-300 font-medium truncate mt-1">
                {node.label}
              </p>

              {/* Node Footer info */}
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 pt-1 border-t border-navy-800/80">
                <span className="uppercase">{node.type}</span>
                <span className="text-slate-500">{isCollapsed ? '[Collapsed]' : 'Active'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
