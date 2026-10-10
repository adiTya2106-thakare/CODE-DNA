import { useState, useRef, useEffect } from 'react';
import { Network, Play, RefreshCw, Info } from 'lucide-react';
import * as d3 from 'd3';
// CodeEditor import retained for future use
// import { CodeEditor } from '../components/CodeEditor';
import { LoadingSpinner, ErrorBanner, DemoBanner, PageHeader } from '../components/ui';
import { analyzeImpact } from '../lib/api';
import { useAppStore } from '../lib/store';
import { DEMO_IMPACT_GRAPH } from '../lib/demoData';
import type { ImpactGraph, GraphNode, GraphEdge } from '../types';

const NODE_COLORS: Record<string, string> = {
  function: '#8b5cf6',
  variable: '#06b6d4',
  class: '#f59e0b',
  module: '#10b981',
  import: '#3d4455',
};

const EDGE_COLORS: Record<string, string> = {
  calls: '#8b5cf6',
  assigns: '#06b6d4',
  imports: '#10b981',
  defines: '#f59e0b',
  uses: '#555e72',
};

export default function ImpactGraph() {
  const { code } = useAppStore();
  const [graph, setGraph] = useState<ImpactGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  async function buildGraph() {
    setLoading(true);
    setError('');
    setSelectedNode(null);
    try {
      const g = await analyzeImpact(code);
      setGraph(g);
      setIsDemo(true);
    } catch (e: any) {
      setError(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  // Load demo on mount
  useEffect(() => {
    setGraph(DEMO_IMPACT_GRAPH);
    setIsDemo(true);
  }, []);

  // Render D3 graph
  useEffect(() => {
    if (!graph || !svgRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Defs for arrow markers
    const defs = svg.append('defs');
    Object.entries(EDGE_COLORS).forEach(([type, color]) => {
      defs.append('marker')
        .attr('id', `arrow-${type}`)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 20)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color)
        .attr('opacity', 0.6);
    });

    // Background
    svg.append('rect')
       .attr('width', width).attr('height', height)
       .attr('fill', '#0f1117');

    const nodes: (GraphNode & d3.SimulationNodeDatum)[] = graph.nodes.map(n => ({ ...n }));
    const edges: (GraphEdge & d3.SimulationLinkDatum<typeof nodes[0]>)[] = graph.edges.map(e => ({
      ...e,
      source: e.source,
      target: e.target,
    }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide(40));

    // Edges
    const link = svg.append('g').selectAll('line')
      .data(edges).enter()
      .append('line')
      .attr('stroke', (d: any) => EDGE_COLORS[d.type] ?? '#3d4455')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.5)
      .attr('marker-end', (d: any) => `url(#arrow-${d.type})`);

    // Edge labels
    const edgeLabel = svg.append('g').selectAll('text')
      .data(edges).enter()
      .append('text')
      .text((d: any) => d.type)
      .attr('font-size', 9)
      .attr('fill', (d: any) => EDGE_COLORS[d.type] ?? '#3d4455')
      .attr('opacity', 0.7)
      .attr('text-anchor', 'middle');

    // Nodes
    const node = svg.append('g').selectAll('g')
      .data(nodes).enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', (_: any, d: any) => setSelectedNode(d))
      .call(d3.drag<any, any>()
        .on('start', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event: any, d: any) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event: any, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    node.append('circle')
      .attr('r', (d: any) => d.type === 'function' ? 18 : d.type === 'variable' ? 12 : 15)
      .attr('fill', (d: any) => NODE_COLORS[d.type] ?? '#555e72')
      .attr('fill-opacity', 0.2)
      .attr('stroke', (d: any) => NODE_COLORS[d.type] ?? '#555e72')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d: any) => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('font-size', 10)
      .attr('fill', '#8b91a6');

    // Type icon text
    node.append('text')
      .text((d: any) => d.type === 'function' ? 'ƒ' : d.type === 'variable' ? 'x' : d.type === 'import' ? '↗' : '◆')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', 11)
      .attr('fill', (d: any) => NODE_COLORS[d.type] ?? '#555e72')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      edgeLabel
        .attr('x', (d: any) => ((d.source.x ?? 0) + (d.target.x ?? 0)) / 2)
        .attr('y', (d: any) => ((d.source.y ?? 0) + (d.target.y ?? 0)) / 2);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [graph]);

  // Compute selected node impact
  const affectedNodes = selectedNode && graph
    ? graph.edges
        .filter(e => e.source === selectedNode.id || e.target === selectedNode.id)
        .map(e => e.source === selectedNode.id ? e.target : e.source)
    : [];

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      <PageHeader
        icon={<Network size={18} />}
        title="Code Impact Graph"
        subtitle="Interactive visualization of functions, variables, and dependencies"
        accent="#06b6d4"
      />

      {isDemo && (
        <DemoBanner message="Showing statically-inferred dependency graph. All relationships are clearly labeled by type." />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graph */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Click any node to inspect relationships
            </span>
            <div className="flex-1" />
            <button onClick={buildGraph} disabled={loading} className="btn-primary flex items-center gap-2 text-xs">
              {loading ? <RefreshCw size={12} className="animate-spin" /> : <Play size={12} />}
              Rebuild Graph
            </button>
          </div>

          <div className="panel overflow-hidden" ref={containerRef}>
            {loading && <LoadingSpinner label="Analyzing dependencies…" />}
            {error && <ErrorBanner message={error} onDismiss={() => setError('')} />}
            <svg ref={svgRef} className="w-full" style={{ display: loading ? 'none' : 'block' }} />
          </div>

          {/* Legend */}
          <div className="panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>LEGEND</span>
              <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
                All dependencies are statically inferred from AST analysis
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>NODE TYPES</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, opacity: 0.8 }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>EDGE TYPES</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EDGE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-1 text-xs">
                      <div className="w-4 h-0.5" style={{ backgroundColor: color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inspector */}
        <div className="space-y-4">
          {selectedNode ? (
            <div className="panel p-4 fade-in">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                     style={{ backgroundColor: NODE_COLORS[selectedNode.type] + '20', color: NODE_COLORS[selectedNode.type] }}>
                  {selectedNode.type === 'function' ? 'ƒ' : selectedNode.type === 'variable' ? 'x' : '◆'}
                </div>
                <div>
                  <p className="text-sm font-semibold m-0" style={{ color: 'var(--text-primary)' }}>{selectedNode.label}</p>
                  <p className="text-xs m-0 capitalize" style={{ color: NODE_COLORS[selectedNode.type] }}>{selectedNode.type}</p>
                </div>
              </div>

              {selectedNode.defined_at && (
                <div className="text-xs mb-3">
                  <span style={{ color: 'var(--text-muted)' }}>Defined at line </span>
                  <span className="code-font" style={{ color: 'var(--accent-cyan)' }}>{selectedNode.defined_at}</span>
                </div>
              )}

              <div className="mb-3">
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  CONNECTED TO ({affectedNodes.length} node{affectedNodes.length !== 1 ? 's' : ''})
                </p>
                <div className="space-y-1">
                  {affectedNodes.length > 0 ? affectedNodes.map((nodeId) => {
                    const n = graph?.nodes.find(nd => nd.id === nodeId);
                    const edge = graph?.edges.find(e =>
                      (e.source === selectedNode.id && e.target === nodeId) ||
                      (e.target === selectedNode.id && e.source === nodeId)
                    );
                    return n ? (
                      <div key={nodeId} className="flex items-center gap-2 text-xs p-2 rounded"
                           style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div className="w-2 h-2 rounded-full shrink-0"
                             style={{ backgroundColor: NODE_COLORS[n.type] ?? '#555e72' }} />
                        <span style={{ color: 'var(--text-primary)' }}>{n.label}</span>
                        {edge && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded"
                                style={{ color: EDGE_COLORS[edge.type] ?? '#555e72', backgroundColor: (EDGE_COLORS[edge.type] ?? '#555e72') + '15' }}>
                            {edge.type}
                          </span>
                        )}
                      </div>
                    ) : null;
                  }) : (
                    <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>No direct connections</p>
                  )}
                </div>
              </div>

              <div className="text-xs p-3 rounded"
                   style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                <strong>Impact note:</strong> A change to <em>{selectedNode.label}</em> may affect {affectedNodes.length} directly connected component{affectedNodes.length !== 1 ? 's' : ''}.
                {selectedNode.type === 'function' && ' Functions that call this one may exhibit changed behavior.'}
                {selectedNode.type === 'variable' && ' Variables assigned here may produce incorrect values downstream.'}
              </div>
            </div>
          ) : (
            <div className="panel p-6 text-center">
              <Network size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Click any node</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Select a function, variable, or import to inspect its relationships and potential impact
              </p>
            </div>
          )}

          {/* Node summary */}
          {graph && (
            <div className="panel p-4">
              <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>GRAPH SUMMARY</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(
                  graph.nodes.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] ?? 0) + 1 }), {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 p-2 rounded"
                       style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] ?? '#555e72' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{count} {type}{count !== 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                  {graph.edges.length} edges · static analysis only
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
