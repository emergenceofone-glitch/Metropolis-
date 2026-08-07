import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import {
  X,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  DollarSign,
  Sparkles,
  BarChart2,
  Sliders,
  Maximize2,
  Flame,
  Info,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  LineChart as LineIcon
} from 'lucide-react';
import { AetheriumMarketState, AetheriumMarketPoint } from '../types';

interface MarketTrendsPanelProps {
  marketState: AetheriumMarketState;
  onClose: () => void;
  onInjectCapital?: (amount: number) => void;
  onSpeculateMarket?: (amount: number) => void;
  playerMoney?: number;
}

export const MarketTrendsPanel: React.FC<MarketTrendsPanelProps> = ({
  marketState,
  onClose,
  onInjectCapital,
  onSpeculateMarket,
  playerMoney = 0
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Timeframe and Overlay Toggles
  const [timeframe, setTimeframe] = useState<'all' | '30' | '14'>('all');
  const [showVolatilityBand, setShowVolatilityBand] = useState<boolean>(true);
  const [showMA5, setShowMA5] = useState<boolean>(true);
  const [showMA10, setShowMA10] = useState<boolean>(true);
  const [showEventMarkers, setShowEventMarkers] = useState<boolean>(true);
  
  // Interactive Hover State
  const [hoveredPoint, setHoveredPoint] = useState<{
    point: AetheriumMarketPoint;
    ma5?: number;
    ma10?: number;
    volatilityRange?: [number, number];
    xPos: number;
    yPos: number;
  } | null>(null);

  const [feedback, setFeedback] = useState<string | null>(null);

  // Ensure dataset is rich (pad with previous simulated days if history is under 10 points)
  const processedData = useMemo(() => {
    let raw = [...marketState.priceHistory];
    
    if (raw.length === 0) {
      // Fallback base history
      raw = Array.from({ length: 15 }, (_, i) => ({
        day: i + 1,
        price: 100 + Math.sin(i * 0.5) * 12 + (Math.random() * 6 - 3),
        changePercent: 0
      }));
    } else if (raw.length < 5) {
      const firstDay = raw[0].day;
      const firstPrice = raw[0].price;
      const padded: AetheriumMarketPoint[] = [];
      for (let i = 8; i > 0; i--) {
        const p = firstPrice + Math.sin(i * 0.7) * 8 + (Math.random() * 4 - 2);
        padded.push({
          day: Math.max(1, firstDay - i),
          price: Math.max(20, p),
          changePercent: 0
        });
      }
      raw = [...padded, ...raw];
    }

    // Sort by day ascending
    raw.sort((a, b) => a.day - b.day);

    // Apply Timeframe filter
    let filtered = raw;
    if (timeframe === '14') {
      filtered = raw.slice(-14);
    } else if (timeframe === '30') {
      filtered = raw.slice(-30);
    }

    // Calculate 5-Day & 10-Day Moving Averages and Volatility Band (Bollinger-style Std Dev)
    return filtered.map((pt, idx, arr) => {
      // 5D Moving Average
      const start5 = Math.max(0, idx - 4);
      const slice5 = arr.slice(start5, idx + 1);
      const ma5 = slice5.reduce((sum, p) => sum + p.price, 0) / slice5.length;

      // 10D Moving Average
      const start10 = Math.max(0, idx - 9);
      const slice10 = arr.slice(start10, idx + 1);
      const ma10 = slice10.reduce((sum, p) => sum + p.price, 0) / slice10.length;

      // Local Standard Deviation for Volatility Band
      const variance = slice5.reduce((sum, p) => sum + Math.pow(p.price - ma5, 2), 0) / slice5.length;
      const stdDev = Math.sqrt(variance);

      const upperBand = ma5 + stdDev * 1.5;
      const lowerBand = Math.max(10, ma5 - stdDev * 1.5);

      return {
        ...pt,
        ma5,
        ma10,
        upperBand,
        lowerBand,
        stdDev
      };
    });
  }, [marketState.priceHistory, timeframe]);

  // Statistical Highlights
  const stats = useMemo(() => {
    if (processedData.length === 0) return { high: 0, low: 0, avg: 0, stdDevAvg: 0, rsi: 50 };

    const prices = processedData.map(d => d.price);
    const high = d3.max(prices) || 0;
    const low = d3.min(prices) || 0;
    const avg = d3.mean(prices) || 0;
    const stdDevAvg = d3.mean(processedData.map(d => d.stdDev)) || 0;

    // Simple Relative Strength Indicator (RSI 14)
    let gains = 0;
    let losses = 0;
    for (let i = 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    const rs = losses === 0 ? 100 : gains / losses;
    const rsi = Math.round(100 - (100 / (1 + rs)));

    return { high, low, avg, stdDevAvg, rsi };
  }, [processedData]);

  // D3 Chart Rendering Engine
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || processedData.length === 0) return;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 700;
    const containerHeight = 320;

    const margin = { top: 25, right: 35, bottom: 40, left: 45 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    svg
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .attr('viewBox', `0 0 ${containerWidth} ${containerHeight}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // --- Scales ---
    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(processedData, d => d.day) as [number, number])
      .range([0, width]);

    const minP = d3.min(processedData, d => Math.min(d.price, showVolatilityBand ? d.lowerBand : d.price)) || 50;
    const maxP = d3.max(processedData, d => Math.max(d.price, showVolatilityBand ? d.upperBand : d.price)) || 150;

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, minP * 0.9), maxP * 1.1])
      .nice()
      .range([height, 0]);

    // --- Gradients ---
    const defs = svg.append('defs');

    // Price Gradient Area Fill
    const priceGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-price-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    priceGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#a855f7')
      .attr('stop-opacity', 0.45);

    priceGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#a855f7')
      .attr('stop-opacity', 0.0);

    // Volatility Band Gradient
    const volGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-volatility-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    volGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.15);

    volGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 0.03);

    // --- Grid Lines ---
    const xGrid = d3.axisBottom(xScale).ticks(8).tickSize(-height).tickFormat(() => '');
    const yGrid = d3.axisLeft(yScale).ticks(6).tickSize(-width).tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid-lines')
      .attr('transform', `translate(0,${height})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-dasharray', '3,3');

    g.append('g')
      .attr('class', 'grid-lines')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-opacity', 0.25)
      .attr('stroke-dasharray', '3,3');

    // --- Axes ---
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d => `Day ${d}`);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => `$${d}`);

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Remove domain axis lines for cleaner look
    g.selectAll('.domain').attr('stroke', '#475569').attr('stroke-opacity', 0.5);

    // --- 1. Volatility Band Area (Bollinger Range) ---
    if (showVolatilityBand) {
      const volAreaGenerator = d3
        .area<any>()
        .x(d => xScale(d.day))
        .y0(d => yScale(d.lowerBand))
        .y1(d => yScale(d.upperBand))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(processedData)
        .attr('fill', 'url(#d3-volatility-gradient)')
        .attr('stroke', '#06b6d4')
        .attr('stroke-opacity', 0.3)
        .attr('stroke-dasharray', '2,2')
        .attr('stroke-width', 1)
        .attr('d', volAreaGenerator);
    }

    // --- 2. Price Area Fill ---
    const priceAreaGenerator = d3
      .area<any>()
      .x(d => xScale(d.day))
      .y0(height)
      .y1(d => yScale(d.price))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(processedData)
      .attr('fill', 'url(#d3-price-gradient)')
      .attr('d', priceAreaGenerator);

    // --- 3. 10-Day Moving Average Line ---
    if (showMA10) {
      const ma10Line = d3
        .line<any>()
        .x(d => xScale(d.day))
        .y(d => yScale(d.ma10))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(processedData)
        .attr('fill', 'none')
        .attr('stroke', '#eab308') // Amber
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3')
        .attr('opacity', 0.8)
        .attr('d', ma10Line);
    }

    // --- 4. 5-Day Moving Average Line ---
    if (showMA5) {
      const ma5Line = d3
        .line<any>()
        .x(d => xScale(d.day))
        .y(d => yScale(d.ma5))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(processedData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8') // Sky Blue
        .attr('stroke-width', 1.8)
        .attr('opacity', 0.9)
        .attr('d', ma5Line);
    }

    // --- 5. Main Price Line ---
    const priceLineGenerator = d3
      .line<any>()
      .x(d => xScale(d.day))
      .y(d => yScale(d.price))
      .curve(d3.curveMonotoneX);

    const pricePath = g
      .append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#c084fc') // Bright Purple
      .attr('stroke-width', 2.5)
      .attr('d', priceLineGenerator);

    // Animate line drawing with D3 transition
    const totalLength = (pricePath.node() as SVGPathElement)?.getTotalLength() || 0;
    pricePath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(900)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // --- 6. Data Points & Event Markers ---
    g.selectAll('.price-point')
      .data(processedData)
      .enter()
      .append('circle')
      .attr('class', 'price-point')
      .attr('cx', d => xScale(d.day))
      .attr('cy', d => yScale(d.price))
      .attr('r', d => (d.eventTitle && showEventMarkers ? 5 : 3))
      .attr('fill', d => (d.eventTitle ? '#f59e0b' : '#c084fc'))
      .attr('stroke', '#090d16')
      .attr('stroke-width', 1.5);

    if (showEventMarkers) {
      processedData.forEach(d => {
        if (d.eventTitle) {
          const x = xScale(d.day);
          const y = yScale(d.price);

          g.append('line')
            .attr('x1', x)
            .attr('y1', y - 6)
            .attr('x2', x)
            .attr('y2', y - 22)
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '2,2');

          g.append('circle')
            .attr('cx', x)
            .attr('cy', y - 22)
            .attr('r', 8)
            .attr('fill', '#f59e0b')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);

          g.append('text')
            .attr('x', x)
            .attr('y', y - 19)
            .attr('text-anchor', 'middle')
            .attr('fill', '#000')
            .attr('font-size', '9px')
            .attr('font-weight', 'bold')
            .attr('font-family', 'sans-serif')
            .text('⚡');
        }
      });
    }

    // --- 7. Interactive Crosshair Overlay ---
    const overlay = g
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    const crosshairX = g
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const crosshairY = g
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const activePointCircle = g
      .append('circle')
      .attr('r', 6)
      .attr('fill', '#e0e7ff')
      .attr('stroke', '#a855f7')
      .attr('stroke-width', 2.5)
      .style('opacity', 0);

    const bisectDay = d3.bisector((d: any) => d.day).center;

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX);
      const index = bisectDay(processedData, x0);
      const d = processedData[index];

      if (d) {
        const cx = xScale(d.day);
        const cy = yScale(d.price);

        crosshairX.attr('x1', cx).attr('y1', 0).attr('x2', cx).attr('y2', height).style('opacity', 0.8);
        crosshairY.attr('x1', 0).attr('y1', cy).attr('x2', width).attr('y2', cy).style('opacity', 0.8);
        activePointCircle.attr('cx', cx).attr('cy', cy).style('opacity', 1);

        setHoveredPoint({
          point: d,
          ma5: d.ma5,
          ma10: d.ma10,
          volatilityRange: [d.lowerBand, d.upperBand],
          xPos: cx + margin.left,
          yPos: cy + margin.top
        });
      }
    });

    overlay.on('mouseleave', () => {
      crosshairX.style('opacity', 0);
      crosshairY.style('opacity', 0);
      activePointCircle.style('opacity', 0);
      setHoveredPoint(null);
    });

  }, [processedData, timeframe, showVolatilityBand, showMA5, showMA10, showEventMarkers]);

  // Handle Interventions
  const handleInject = () => {
    if (playerMoney < 2500) {
      setFeedback('Insufficient Treasury funds ($2,500 required).');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (onInjectCapital) {
      onInjectCapital(2500);
      setFeedback('⚡ Capital injected into Aetherium Stabilizers (+10% Price Boost).');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleSpeculate = () => {
    if (playerMoney < 1000) {
      setFeedback('Insufficient Treasury funds ($1,000 required).');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    if (onSpeculateMarket) {
      onSpeculateMarket(1000);
      setFeedback('📈 Futures Hedge Option executed ($1,000). Risk mitigated!');
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const priceDiff = marketState.currentPrice - marketState.previousPrice;
  const pctChange = marketState.previousPrice > 0 ? ((priceDiff / marketState.previousPrice) * 100).toFixed(1) : '0.0';
  const isUp = priceDiff >= 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="w-full max-w-5xl bg-slate-900 border border-purple-500/40 rounded-3xl shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-[92vh] text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-purple-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 border border-purple-400/40 rounded-2xl text-purple-300 shadow-lg shadow-purple-500/20">
              <LineIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono text-white tracking-wide uppercase">
                  Aetherium Market Volatility Trends
                </h2>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  D3 Technical Analysis
                </span>
              </div>
              <p className="text-xs text-slate-400">
                High-frequency price volatility, moving average overlays & Bollinger risk envelopes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            aria-label="Close Market Trends"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Index Banner */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Index Spot Price</span>
              <div className="flex items-baseline gap-2 font-mono">
                <span className="text-2xl font-black text-white">${marketState.currentPrice.toFixed(2)}</span>
                <span className={`text-xs font-bold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {isUp ? '+' : ''}{pctChange}%
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden sm:block" />

            <div className="hidden sm:block">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Vol. Index (StdDev)</span>
              <span className="text-base font-bold font-mono text-amber-300">
                ±${stats.stdDevAvg.toFixed(2)} / tick
              </span>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="hidden md:block">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Range (Low - High)</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                ${stats.low.toFixed(1)} - ${stats.high.toFixed(1)}
              </span>
            </div>

            <div className="h-8 w-px bg-white/10 hidden lg:block" />

            <div className="hidden lg:block">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Market RSI (14D)</span>
              <span className={`text-xs font-mono font-bold ${stats.rsi > 70 ? 'text-rose-400' : stats.rsi < 30 ? 'text-emerald-400' : 'text-cyan-300'}`}>
                {stats.rsi} ({stats.rsi > 70 ? 'Overbought' : stats.rsi < 30 ? 'Oversold' : 'Neutral'})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              marketState.volatility === 'Extreme' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
              marketState.volatility === 'High' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
              'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {marketState.volatility} Risk
            </span>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 py-2 bg-purple-500/20 border-b border-purple-500/30 text-purple-200 text-xs font-mono font-bold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>{feedback}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Controls & Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-2xl text-xs font-mono">
            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-white/10">
              <span className="text-[10px] text-slate-500 px-2 uppercase font-bold">Range:</span>
              <button
                onClick={() => setTimeframe('14')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${timeframe === '14' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                14 Days
              </button>
              <button
                onClick={() => setTimeframe('30')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${timeframe === '30' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeframe('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${timeframe === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All History
              </button>
            </div>

            {/* D3 Overlays Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowVolatilityBand(!showVolatilityBand)}
                className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showVolatilityBand ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>Volatility Envelope</span>
              </button>

              <button
                onClick={() => setShowMA5(!showMA5)}
                className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showMA5 ? 'bg-sky-950 text-sky-300 border-sky-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>5-Day MA</span>
              </button>

              <button
                onClick={() => setShowMA10(!showMA10)}
                className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showMA10 ? 'bg-amber-950 text-amber-300 border-amber-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>10-Day MA</span>
              </button>

              <button
                onClick={() => setShowEventMarkers(!showEventMarkers)}
                className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                  showEventMarkers ? 'bg-purple-950 text-purple-300 border-purple-500/50' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>Events</span>
              </button>
            </div>
          </div>

          {/* D3 SVG Interactive Canvas Container */}
          <div ref={containerRef} className="relative bg-slate-950 border border-slate-800 rounded-3xl p-2 sm:p-4 shadow-xl overflow-hidden min-h-[320px]">
            <svg ref={svgRef} className="w-full h-auto overflow-visible" />

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div
                style={{
                  left: `${Math.min(hoveredPoint.xPos, (containerRef.current?.clientWidth || 600) - 180)}px`,
                  top: `${Math.max(10, hoveredPoint.yPos - 90)}px`
                }}
                className="absolute z-30 pointer-events-none bg-slate-950/95 border border-purple-500/60 rounded-2xl p-3 shadow-2xl text-[11px] font-mono space-y-1.5 w-48 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-1">
                  <span className="text-slate-400 font-bold">Simulation Day {hoveredPoint.point.day}</span>
                  <span className="text-purple-300 font-bold">${hoveredPoint.point.price.toFixed(2)}</span>
                </div>

                {hoveredPoint.ma5 !== undefined && showMA5 && (
                  <div className="flex justify-between text-sky-300 text-[10px]">
                    <span>5D Moving Avg:</span>
                    <span className="font-bold">${hoveredPoint.ma5.toFixed(2)}</span>
                  </div>
                )}

                {hoveredPoint.ma10 !== undefined && showMA10 && (
                  <div className="flex justify-between text-amber-300 text-[10px]">
                    <span>10D Moving Avg:</span>
                    <span className="font-bold">${hoveredPoint.ma10.toFixed(2)}</span>
                  </div>
                )}

                {hoveredPoint.volatilityRange && showVolatilityBand && (
                  <div className="flex justify-between text-cyan-300 text-[10px]">
                    <span>Risk Range:</span>
                    <span className="font-bold">
                      ${hoveredPoint.volatilityRange[0].toFixed(1)} - ${hoveredPoint.volatilityRange[1].toFixed(1)}
                    </span>
                  </div>
                )}

                {hoveredPoint.point.eventTitle && (
                  <div className="pt-1 text-amber-400 font-bold text-[10px] flex items-center gap-1 border-t border-white/10 mt-1">
                    <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{hoveredPoint.point.eventTitle}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Strategic Interventions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleInject}
              className="p-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-2xl text-left transition-all cursor-pointer group flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-purple-200 group-hover:text-white mb-1">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <span>Inject Capital ($2,500)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Stabilize local energy grids to artificially drive Aetherium market demand up +10%.
                </p>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                +10% Boost
              </span>
            </button>

            <button
              onClick={handleSpeculate}
              className="p-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl text-left transition-all cursor-pointer group flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-200 group-hover:text-white mb-1">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Execute Hedge Option ($1,000)</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Lock in futures contracts to shield municipal revenue from high market price dips.
                </p>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                Risk Shield
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400 animate-pulse" />
            <span>D3 Analytics Engine Connected</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-md shadow-purple-500/20"
          >
            Close Trends
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
