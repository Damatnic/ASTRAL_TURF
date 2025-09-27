import React, { useMemo } from 'react';
import { BulletproofSafety, SafeComponent } from '../../utils/bulletproofSafety';
import { withErrorBoundary } from '../common/BulletproofErrorBoundary';

interface LineChartProps {
  data: { x: number; y: number }[];
  width?: number;
  height?: number;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 500,
  height = 250,
  color = '#2dd4bf',
  yAxisLabel = 'Value',
  xAxisLabel = 'Week',
}) => {
  const padding = useMemo(() => ({ top: 20, right: 20, bottom: 40, left: 40 }), []);
  
  // Bulletproof data validation
  const safeData = useMemo(() => {
    return BulletproofSafety.PerformanceMonitor.measureTime(
      () => BulletproofSafety.DataValidators.validateChartData(data || []),
      'LineChart data validation'
    );
  }, [data]);

  const { xScale, yScale, path, points } = useMemo(() => {
    return BulletproofSafety.SafeMath.calculate(() => {
      if (safeData.length === 0) {
        BulletproofSafety.logger.warn('LineChart: No valid data points available');
        return { xScale: () => 0, yScale: () => 0, path: '', points: [] };
      }

      // Extract coordinates safely
      const xCoordinates = BulletproofSafety.safeArray(safeData)
        .map(d => BulletproofSafety.safeNumber(d.x).value)
        .toArray();
      const yCoordinates = BulletproofSafety.safeArray(safeData)
        .map(d => BulletproofSafety.safeNumber(d.y).value)
        .toArray();

      // Safe min/max calculations
      const xMin = BulletproofSafety.SafeMath.min(xCoordinates, 0);
      const xMax = BulletproofSafety.SafeMath.max(xCoordinates, 100);
      const yMin = BulletproofSafety.SafeMath.min(yCoordinates, 0);
      const yMax = BulletproofSafety.SafeMath.max(yCoordinates, 100);

      // Create safe scale functions
      const xScale = BulletproofSafety.ChartSafety.createSafeScale(
        [xMin, xMax], 
        [padding.left, width - padding.right]
      );
      const yScale = BulletproofSafety.ChartSafety.createSafeScale(
        [yMin, yMax], 
        [height - padding.bottom, padding.top]
      );

      // Generate safe path
      const path = BulletproofSafety.ChartSafety.createSafePath(
        safeData.map(d => ({ x: xScale(d.x), y: yScale(d.y) }))
      );

      // Generate safe points
      const points = BulletproofSafety.safeArray(safeData)
        .map(d => ({
          x: xScale(d.x),
          y: yScale(d.y),
          originalX: d.x,
          originalY: d.y,
        }))
        .toArray();

      return { xScale, yScale, path, points };
    }, { xScale: () => 0, yScale: () => 0, path: '', points: [] }, 'LineChart scale calculation').value;
  }, [safeData, width, height, padding]);

  const yAxisTicks = useMemo(() => {
    return BulletproofSafety.SafeMath.calculate(() => {
      if (safeData.length === 0) {
        return [];
      }
      
      const yCoordinates = BulletproofSafety.safeArray(safeData)
        .map(d => BulletproofSafety.safeNumber(d.y).value)
        .toArray();
      
      const yMin = BulletproofSafety.SafeMath.min(yCoordinates, 0);
      const yMax = BulletproofSafety.SafeMath.max(yCoordinates, 100);
      
      const tickValues = BulletproofSafety.ChartSafety.generateSafeTicks(yMin, yMax, 5);
      
      return tickValues.map(value => ({
        value: Math.round(value),
        y: yScale(value)
      }));
    }, [], 'LineChart Y-axis ticks').value;
  }, [safeData, yScale]);

  const xAxisTicks = useMemo(() => {
    return BulletproofSafety.SafeMath.calculate(() => {
      if (safeData.length === 0) {
        return [];
      }
      
      const xValues = BulletproofSafety.safeArray(safeData)
        .map(d => BulletproofSafety.safeNumber(d.x).value)
        .toArray();
      
      const uniqueX = [...new Set(xValues)].sort((a, b) => a - b);
      
      return uniqueX.map(val => ({
        value: val,
        x: xScale(val)
      }));
    }, [], 'LineChart X-axis ticks').value;
  }, [safeData, xScale]);

  // Safe rendering with fallback
  if (safeData.length < 2) {
    return (
      <SafeComponent context="LineChart Fallback">
        <div
          style={{ width: BulletproofSafety.safeNumber(width, 500).value, height: BulletproofSafety.safeNumber(height, 250).value }}
          className="flex items-center justify-center text-sm text-gray-500 bg-gray-700/30 rounded-md"
        >
          Not enough data to display chart. Needs at least 2 valid data points.
        </div>
      </SafeComponent>
    );
  }

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* Axes and Grid */}
      <g className="text-gray-500">
        {yAxisTicks.map(tick => (
          <g key={tick.value}>
            <line
              x1={padding.left}
              y1={tick.y}
              x2={width - padding.right}
              y2={tick.y}
              stroke="currentColor"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
            <text
              x={padding.left - 8}
              y={tick.y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
            >
              {tick.value}
            </text>
          </g>
        ))}
        {xAxisTicks.map(tick => (
          <g key={tick.value}>
            <text x={tick.x} y={height - padding.bottom + 15} textAnchor="middle" fontSize="10">
              {tick.value}
            </text>
          </g>
        ))}
        <text
          x={width / 2}
          y={height - 5}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
          className="font-semibold"
        >
          {xAxisLabel}
        </text>
        <text
          transform={`rotate(-90)`}
          x={-(height / 2)}
          y={10}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
          className="font-semibold"
        >
          {yAxisLabel}
        </text>
      </g>

      {/* Line */}
      <path d={path} fill="none" stroke={color} strokeWidth="2" />

      {/* Points */}
      {points.map(p => (
        <circle key={`${p.originalX}-${p.originalY}`} cx={p.x} cy={p.y} r="3" fill={color}>
          <title>
            Week {p.originalX}: {p.originalY}
          </title>
        </circle>
      ))}
    </svg>
  );
};

// Export with error boundary protection
export default withErrorBoundary(LineChart, {
  context: 'LineChart',
  showErrorDetails: process.env.NODE_ENV === 'development',
  maxRetries: 2,
  autoRetry: true
});
