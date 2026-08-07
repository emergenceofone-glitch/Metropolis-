import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { CitySnapshot } from '../services/firebaseService';

interface WeatherHeatmapProps {
  snapshots: CitySnapshot[];
}

export const WeatherHeatmap: React.FC<WeatherHeatmapProps> = ({ snapshots }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || snapshots.length === 0) return;

    const width = 900;
    const height = 700;
    const margin = { top: 60, right: 100, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Determine grid layout for snapshots
    const cols = Math.ceil(Math.sqrt(snapshots.length));
    const rows = Math.ceil(snapshots.length / cols) || 1;

    const cellWidth = innerWidth / cols;
    const cellHeight = innerHeight / rows;
    
    // Scale font size based on cell height, bounded
    const fontSizeName = Math.max(10, Math.min(16, cellHeight / 5));
    const fontSizeTemp = Math.max(8, Math.min(14, cellHeight / 6));

    // Generate simulated temperature data based on population and happiness
    const data = snapshots.map((snap, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      
      // Simulate temperature: base 15C + population effect + happiness effect
      const temp = 15 + (snap.stats.population / 20) - (snap.stats.happiness / 10);
      
      return {
        x: col * cellWidth + cellWidth / 2,
        y: row * cellHeight + cellHeight / 2,
        temp: temp,
        name: `Metropolis-${snap.id?.slice(0, 4) || 'Zero'}`,
        pop: snap.stats.population
      };
    });

    let minTemp = d3.min(data, d => d.temp) ?? 0;
    let maxTemp = d3.max(data, d => d.temp) ?? 30;
    if (minTemp === maxTemp) {
      minTemp -= 5;
      maxTemp += 5;
    }

    // Color scale for temperature
    const colorScale = d3.scaleSequential(d3.interpolateInferno)
      .domain([minTemp, maxTemp]);

    // Draw heatmap cells
    const cells = g.selectAll(".cell")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x - cellWidth/2}, ${d.y - cellHeight/2})`);

    cells.append("rect")
      .attr("width", cellWidth * 0.95)
      .attr("height", cellHeight * 0.95)
      .attr("fill", d => colorScale(d.temp))
      .attr("rx", 6)
      .attr("ry", 6)
      .attr("opacity", 0.9)
      .on("mouseover", function() {
        d3.select(this).attr("opacity", 1).attr("stroke", "rgba(255,255,255,0.8)").attr("stroke-width", 3);
      })
      .on("mouseout", function() {
        d3.select(this).attr("opacity", 0.9).attr("stroke", "none");
      });

    // Add labels
    cells.append("text")
      .attr("x", cellWidth / 2)
      .attr("y", cellHeight / 2 - fontSizeTemp / 2)
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .attr("font-size", `${fontSizeName}px`)
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text(d => d.name);
      
    cells.append("text")
      .attr("x", cellWidth / 2)
      .attr("y", cellHeight / 2 + fontSizeName)
      .attr("text-anchor", "middle")
      .attr("fill", "rgba(255,255,255,0.9)")
      .attr("font-size", `${fontSizeTemp}px`)
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text(d => `${d.temp.toFixed(1)}°C`);

    // --- Legend ---
    const legendHeight = innerHeight;
    const legendWidth = 20;
    const legendX = innerWidth + 30;
    const legendY = 0;

    const legendGroup = g.append("g")
      .attr("transform", `translate(${legendX}, ${legendY})`);

    // Define linear gradient
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "temp-gradient")
      .attr("x1", "0%")
      .attr("y1", "100%")
      .attr("x2", "0%")
      .attr("y2", "0%");

    // Interpolate colors for the gradient
    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const offset = i / numStops;
      linearGradient.append("stop")
        .attr("offset", `${offset * 100}%`)
        .attr("stop-color", colorScale(minTemp + offset * (maxTemp - minTemp)));
    }

    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .attr("rx", 4)
      .attr("ry", 4)
      .style("fill", "url(#temp-gradient)");

    // Legend axis
    const legendScale = d3.scaleLinear()
      .domain([minTemp, maxTemp])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d => `${d}°C`);

    legendGroup.append("g")
      .attr("transform", `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll("text")
      .attr("fill", "#cbd5e1")
      .style("font-size", "12px");
      
    legendGroup.selectAll(".domain, .tick line")
      .attr("stroke", "#475569");

    legendGroup.append("text")
      .attr("x", -20)
      .attr("y", -15)
      .attr("fill", "#f8fafc")
      .style("font-size", "14px")
      .style("font-weight", "bold")
      .text("Avg Temp");

  }, [snapshots]);

  return (
    <div className="w-full h-full flex items-center justify-center p-8 bg-slate-900/50 backdrop-blur-sm pointer-events-auto">
      <svg ref={svgRef} className="w-full max-w-5xl h-full drop-shadow-2xl" />
    </div>
  );
};
