
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SignalData } from '../types';

interface ProtocolVisualizerProps {
  data: SignalData[];
  color?: string;
}

export const ProtocolVisualizer: React.FC<ProtocolVisualizerProps> = ({ data, color = '#22d3ee' }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    svg.selectAll('*').remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.timestamp) as [number, number])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([-1, 1])
      .range([innerHeight, 0]);

    const line = d3.line<SignalData>()
      .x(d => x(d.timestamp))
      .y(d => y(d.value))
      .curve(d3.curveStepAfter);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Add some "scan lines" for aesthetic
    g.selectAll('.scan-line')
      .data(d3.range(0, innerWidth, 20))
      .enter()
      .append('line')
      .attr('x1', d => d)
      .attr('x2', d => d)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#ffffff10')
      .attr('stroke-width', 1);

  }, [data, color]);

  return (
    <div className="w-full h-full bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};
