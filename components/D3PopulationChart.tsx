import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Users, TrendingUp, TrendingDown, Minus, Sparkles, Activity } from 'lucide-react';

export interface HistoryDataPoint {
  day: number;
  population: number;
  income: number;
  happiness: number;
}

interface D3PopulationChartProps {
  history: HistoryDataPoint[];
  currentPopulation?: number;
  height?: number;
}

export const D3PopulationChart: React.FC<D3PopulationChartProps> = ({
  history,
  currentPopulation = 0,
  height = 260
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    day: number;
    population: number;
    delta: number;
    pctChange: number;
    x: number;
    y: number;
  } | null>(null);

  // Take the last 10 days of history
  const last10Days = React.useMemo(() => {
    if (!history || history.length === 0) {
      return [{ day: 1, population: currentPopulation, income: 0, happiness: 75 }];
    }
    const sliced = history.slice(-10);
    // Ensure we have at least 2 points for a nice line if needed
    if (sliced.length === 1) {
      const p = sliced[0];
      return [
        { day: Math.max(1, p.day - 1), population: Math.max(0, Math.round(p.population * 0.9)), income: p.income, happiness: p.happiness },
        p
      ];
    }
    return sliced;
  }, [history, currentPopulation]);

  // Calculations for summary banner
  const firstPoint = last10Days[0];
  const latestPoint = last10Days[last10Days.length - 1];
  const netGain = latestPoint.population - firstPoint.population;
  const pctGrowth = firstPoint.population > 0 
    ? ((netGain / firstPoint.population) * 100)
    : (netGain > 0 ? 100 : 0);
  const avgDailyGain = last10Days.length > 1 ? netGain / (last10Days.length - 1) : 0;

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 600;
    const margin = { top: 25, right: 30, bottom: 40, left: 55 };
    const width = containerWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous SVG contents
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Days)
    const dayExtent = d3.extent(last10Days, d => d.day) as [number, number];
    const xScale = d3.scaleLinear()
      .domain([
        dayExtent[0] === dayExtent[1] ? dayExtent[0] - 1 : dayExtent[0],
        dayExtent[1]
      ])
      .range([0, width]);

    // Y Scale (Population)
    const popMax = d3.max(last10Days, d => d.population) || 10;
    const popMin = d3.min(last10Days, d => d.population) || 0;
    const padding = Math.max(5, (popMax - popMin) * 0.15);

    const yScale = d3.scaleLinear()
      .domain([Math.max(0, popMin - padding), popMax + padding])
      .nice()
      .range([chartHeight, 0]);

    // Create Gradient Definition
    const defs = svg.append('defs');

    const areaGradient = defs.append('linearGradient')
      .attr('id', 'd3-pop-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.45);

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0284c7')
      .attr('stop-opacity', 0.0);

    // Glow Filter Definition
    const filter = defs.append('filter')
      .attr('id', 'd3-glow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '3')
      .attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Gridlines (Y-axis horizontal lines)
    const yGrid = d3.axisLeft(yScale)
      .ticks(5)
      .tickSize(-width)
      .tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-dasharray', '3 3');

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(Math.min(10, last10Days.length))
      .tickFormat(d => `Day ${d}`);

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => d3.format(',')(d as number));

    // Render X Axis
    const xAxisG = g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    xAxisG.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('dy', '10px');

    xAxisG.selectAll('line, path')
      .attr('stroke', '#475569');

    // Render Y Axis
    const yAxisG = g.append('g').call(yAxis);

    yAxisG.selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace');

    yAxisG.selectAll('line, path')
      .attr('stroke', '#475569');

    // Line & Area Generators
    const lineGenerator = d3.line<HistoryDataPoint>()
      .x(d => xScale(d.day))
      .y(d => yScale(d.population))
      .curve(d3.curveMonotoneX);

    const areaGenerator = d3.area<HistoryDataPoint>()
      .x(d => xScale(d.day))
      .y0(chartHeight)
      .y1(d => yScale(d.population))
      .curve(d3.curveMonotoneX);

    // Draw Filled Area
    g.append('path')
      .datum(last10Days)
      .attr('fill', 'url(#d3-pop-area-gradient)')
      .attr('d', areaGenerator);

    // Draw Line Stroke with Glow
    const path = g.append('path')
      .datum(last10Days)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('filter', 'url(#d3-glow)')
      .attr('d', lineGenerator);

    // Animate Line Path Entrance
    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
    if (totalLength > 0) {
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(750)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0);
    }

    // Data Circles (Interactive Dots)
    const dotsG = g.append('g').attr('class', 'data-dots');

    dotsG.selectAll('circle')
      .data(last10Days)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.day))
      .attr('cy', d => yScale(d.population))
      .attr('r', 4.5)
      .attr('fill', '#0284c7')
      .attr('stroke', '#60a5fa')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', 7)
          .attr('fill', '#38bdf8')
          .attr('stroke', '#ffffff');

        // Calculate delta from previous point
        const index = last10Days.findIndex(p => p.day === d.day);
        const prevPop = index > 0 ? last10Days[index - 1].population : d.population;
        const delta = d.population - prevPop;
        const pct = prevPop > 0 ? ((delta / prevPop) * 100) : 0;

        const [cx, cy] = d3.pointer(event, containerRef.current);
        setHoveredPoint({
          day: d.day,
          population: d.population,
          delta,
          pctChange: Math.round(pct * 10) / 10,
          x: cx,
          y: cy
        });
      })
      .on('mouseleave', (event) => {
        d3.select(event.currentTarget)
          .transition()
          .duration(150)
          .attr('r', 4.5)
          .attr('fill', '#0284c7')
          .attr('stroke', '#60a5fa');

        setHoveredPoint(null);
      });

  }, [last10Days, height]);

  return (
    <div className="w-full bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4 sm:p-5 text-slate-100 flex flex-col gap-3 relative shadow-xl">
      {/* Top Banner Metric Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/20 border border-blue-400/40 rounded-xl text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">10-Day Population Trend</h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                Real-Time D3 Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Live citizen accumulation analytics over last 10 game days</p>
          </div>
        </div>

        {/* Growth Stats Pills */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-400">Net 10D Gain:</span>
            <span className={`font-bold flex items-center gap-1 ${netGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netGain > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : netGain < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              {netGain >= 0 ? `+${netGain.toLocaleString()}` : netGain.toLocaleString()}
            </span>
          </div>

          <div className="bg-slate-900/90 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-slate-400">Growth Rate:</span>
            <span className={`font-bold ${pctGrowth >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {pctGrowth >= 0 ? `+${pctGrowth.toFixed(1)}%` : `${pctGrowth.toFixed(1)}%`}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div ref={containerRef} className="w-full relative min-h-[220px]">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-30 pointer-events-none bg-slate-950/95 border border-cyan-400/80 rounded-xl p-2.5 shadow-2xl text-xs font-mono text-white flex flex-col gap-1 -translate-x-1/2 -translate-y-full mb-3 backdrop-blur-md"
            style={{ left: hoveredPoint.x, top: hoveredPoint.y }}
          >
            <div className="flex items-center justify-between gap-3 text-slate-400 border-b border-white/10 pb-1">
              <span>Day {hoveredPoint.day}</span>
              <span className="text-cyan-400 font-bold">Telemetry Point</span>
            </div>
            <div className="flex justify-between gap-4 font-bold">
              <span>Population:</span>
              <span className="text-blue-300">{hoveredPoint.population.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4 text-[11px]">
              <span>Daily Shift:</span>
              <span className={hoveredPoint.delta >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {hoveredPoint.delta >= 0 ? `+${hoveredPoint.delta}` : hoveredPoint.delta} ({hoveredPoint.pctChange >= 0 ? `+${hoveredPoint.pctChange}%` : `${hoveredPoint.pctChange}%`})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Ribbon */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-white/10 pt-2">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
          Average growth velocity: <strong className="text-white">{avgDailyGain >= 0 ? `+${avgDailyGain.toFixed(1)}` : avgDailyGain.toFixed(1)} citizens/day</strong>
        </span>
        <span>Showing Day {firstPoint.day} — Day {latestPoint.day}</span>
      </div>
    </div>
  );
};
