/**
 * BULLETPROOF TACTICAL INTEGRATION TEST
 * Comprehensive test suite verifying all safety systems work together
 * in real tactical board scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BulletproofSafety } from '../../utils/bulletproofSafety';
import { BulletproofErrorBoundary } from '../../components/common/BulletproofErrorBoundary';
import LineChart from '../../components/charts/LineChart';
import ScatterPlot from '../../components/charts/ScatterPlot';
import { runTacticalSafetyTests } from '../../utils/tacticalSafetyTest';

// Mock data for testing
const mockValidChartData = [
  { x: 1, y: 10 },
  { x: 2, y: 20 },
  { x: 3, y: 15 },
  { x: 4, y: 30 },
  { x: 5, y: 25 }
];

const mockInvalidChartData = [
  { x: 1, y: 10 },
  { x: NaN, y: 20 },
  null,
  { x: 3, y: undefined },
  { x: 'invalid', y: 30 },
  { x: 5, y: 25 }
];

const mockScatterData = [
  { x: 10, y: 20, label: 'Player 1', color: '#ff0000' },
  { x: 30, y: 40, label: 'Player 2', color: '#00ff00' },
  { x: 50, y: 60, label: 'Player 3', color: '#0000ff' }
];

const mockInvalidScatterData = [
  { x: 10, y: 20, label: 'Player 1', color: '#ff0000' },
  { x: NaN, y: 40, label: 'Player 2', color: '#00ff00' },
  null,
  { x: 50, y: undefined, label: 'Player 3', color: '#0000ff' },
  { x: 70, y: 80, label: '', color: null }
];

const mockPlayerData = [
  {
    id: 'player1',
    name: 'John Doe',
    position: { x: 25, y: 70 },
    jerseyNumber: 10,
    team: 'home'
  },
  {
    id: 'player2',
    name: 'Jane Smith',
    position: { x: 50, y: 50 },
    jerseyNumber: 8,
    team: 'home'
  },
  {
    id: 'player3',
    name: 'Bob Wilson',
    position: { x: 75, y: 30 },
    jerseyNumber: 11,
    team: 'home'
  }
];

const mockInvalidPlayerData = [
  {
    id: 'player1',
    name: 'John Doe',
    position: { x: 25, y: 70 },
    jerseyNumber: 10,
    team: 'home'
  },
  {
    id: 'player2',
    name: 'Jane Smith',
    position: { x: NaN, y: 50 },
    jerseyNumber: 8,
    team: 'home'
  },
  null,
  {
    id: 'player4',
    name: '',
    position: { x: 75, y: undefined },
    jerseyNumber: 11,
    team: 'home'
  },
  {
    id: '',
    name: 'Invalid Player',
    position: null,
    jerseyNumber: 'invalid',
    team: 'home'
  }
];

// Test component that intentionally throws errors
const ErrorProneComponent: React.FC<{ shouldError?: boolean }> = ({ shouldError = false }) => {
  if (shouldError) {
    throw new Error('Intentional test error');
  }
  return <div data-testid="error-prone-component">Working correctly</div>;
};

describe('Bulletproof Tactical Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console errors for testing
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Chart Components Integration', () => {
    it('should render LineChart with valid data', async () => {
      render(
        <LineChart
          data={mockValidChartData}
          width={500}
          height={300}
          xAxisLabel="Week"
          yAxisLabel="Performance"
        />
      );

      // Chart should render successfully
      const svg = screen.getByRole('img', { hidden: true }); // SVG elements have img role
      expect(svg).toBeInTheDocument();
      
      // Should have rendered path for the line
      const path = svg.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path?.getAttribute('d')).toBeTruthy();
    });

    it('should handle invalid LineChart data gracefully', async () => {
      render(
        <LineChart
          data={mockInvalidChartData}
          width={500}
          height={300}
          xAxisLabel="Week"
          yAxisLabel="Performance"
        />
      );

      // Should still render, filtering out invalid data
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    it('should render ScatterPlot with valid data', async () => {
      render(
        <ScatterPlot
          data={mockScatterData}
          width={500}
          height={500}
          xAxisLabel="X Position"
          yAxisLabel="Y Position"
        />
      );

      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
      
      // Should have circles for each valid data point
      const circles = svg.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);
    });

    it('should handle invalid ScatterPlot data gracefully', async () => {
      render(
        <ScatterPlot
          data={mockInvalidScatterData}
          width={500}
          height={500}
          xAxisLabel="X Position"
          yAxisLabel="Y Position"
        />
      );

      // Should render only valid points
      const svg = screen.getByRole('img', { hidden: true });
      expect(svg).toBeInTheDocument();
    });

    it('should handle empty chart data', async () => {
      render(
        <LineChart
          data={[]}
          width={500}
          height={300}
          xAxisLabel="Week"
          yAxisLabel="Performance"
        />
      );

      // Should show fallback message
      expect(screen.getByText(/not enough data/i)).toBeInTheDocument();
    });

    it('should handle null chart data', async () => {
      render(
        <LineChart
          data={null as any}
          width={500}
          height={300}
          xAxisLabel="Week"
          yAxisLabel="Performance"
        />
      );

      // Should show fallback message
      expect(screen.getByText(/not enough data/i)).toBeInTheDocument();
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and display error boundary when component throws', async () => {
      render(
        <BulletproofErrorBoundary context="Test Error Boundary">
          <ErrorProneComponent shouldError={true} />
        </BulletproofErrorBoundary>
      );

      // Should show error boundary UI instead of crashing
      expect(screen.getByText(/component error detected/i)).toBeInTheDocument();
      expect(screen.getByText(/test error boundary/i)).toBeInTheDocument();
    });

    it('should render normally when no error occurs', async () => {
      render(
        <BulletproofErrorBoundary context="Test Error Boundary">
          <ErrorProneComponent shouldError={false} />
        </BulletproofErrorBoundary>
      );

      // Should render the component normally
      expect(screen.getByTestId('error-prone-component')).toBeInTheDocument();
      expect(screen.getByText('Working correctly')).toBeInTheDocument();
    });

    it('should provide retry functionality', async () => {
      let shouldError = true;
      const TestComponent = () => {
        if (shouldError) {
          throw new Error('Retryable error');
        }
        return <div data-testid="success">Success!</div>;
      };

      render(
        <BulletproofErrorBoundary context="Retry Test" maxRetries={2}>
          <TestComponent />
        </BulletproofErrorBoundary>
      );

      // Should show error boundary
      expect(screen.getByText(/component error detected/i)).toBeInTheDocument();
      
      // Click retry button
      const retryButton = screen.getByText(/try again/i);
      expect(retryButton).toBeInTheDocument();
      
      // Simulate fixing the error
      shouldError = false;
      fireEvent.click(retryButton);

      // Should now show success
      await waitFor(() => {
        expect(screen.getByTestId('success')).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation Integration', () => {
    it('should validate player data comprehensively', () => {
      const validPlayers = BulletproofSafety.DataValidators.validatePlayerData(mockPlayerData);
      expect(validPlayers).toHaveLength(3);
      expect(validPlayers[0].id).toBe('player1');
    });

    it('should filter invalid player data', () => {
      const validPlayers = BulletproofSafety.DataValidators.validatePlayerData(mockInvalidPlayerData);
      expect(validPlayers).toHaveLength(1); // Only the first player is valid
      expect(validPlayers[0].id).toBe('player1');
    });

    it('should validate chart data with mixed validity', () => {
      const validData = BulletproofSafety.DataValidators.validateChartData(mockInvalidChartData);
      expect(validData).toHaveLength(2); // Only 2 valid points
      expect(validData[0]).toEqual({ x: 1, y: 10 });
      expect(validData[1]).toEqual({ x: 5, y: 25 });
    });

    it('should extract coordinates safely', () => {
      const validCoords = BulletproofSafety.DataValidators.extractCoordinates(
        { x: 10, y: 20 },
        { x: 0, y: 0 }
      );
      expect(validCoords).toEqual({ x: 10, y: 20 });

      const invalidCoords = BulletproofSafety.DataValidators.extractCoordinates(
        { x: NaN, y: 20 },
        { x: 50, y: 50 }
      );
      expect(invalidCoords).toEqual({ x: 50, y: 50 });
    });
  });

  describe('Mathematical Operations Integration', () => {
    it('should perform safe mathematical operations', () => {
      const numbers = [1, 2, 3, NaN, 5, null as any, 6];
      
      const min = BulletproofSafety.SafeMath.min(numbers, 0);
      const max = BulletproofSafety.SafeMath.max(numbers, 0);
      const avg = BulletproofSafety.SafeMath.average(numbers, 0);
      
      expect(min).toBe(1);
      expect(max).toBe(6);
      expect(avg).toBe(3.4); // (1+2+3+5+6)/5
    });

    it('should handle empty arrays safely', () => {
      const min = BulletproofSafety.SafeMath.min([], 100);
      const max = BulletproofSafety.SafeMath.max([], 200);
      const avg = BulletproofSafety.SafeMath.average([], 300);
      
      expect(min).toBe(100);
      expect(max).toBe(200);
      expect(avg).toBe(300);
    });

    it('should calculate distances safely', () => {
      const distance1 = BulletproofSafety.SafeMath.distance(
        { x: 0, y: 0 },
        { x: 3, y: 4 }
      );
      expect(distance1).toBe(5);

      const distance2 = BulletproofSafety.SafeMath.distance(
        { x: NaN, y: 0 },
        { x: 3, y: 4 }
      );
      expect(isNaN(distance2)).toBe(false);
    });
  });

  describe('Array Operations Integration', () => {
    it('should perform safe array operations', () => {
      const mixedArray = [1, null, 2, undefined, 3, NaN, 4];
      const safeArr = BulletproofSafety.safeArray(mixedArray);
      
      expect(safeArr.length).toBe(4); // [1, 2, 3, 4]
      
      const doubled = safeArr.map(x => x * 2);
      expect(doubled.toArray()).toEqual([2, 4, 6, 8]);
      
      const filtered = safeArr.filter(x => x > 2);
      expect(filtered.toArray()).toEqual([3, 4]);
      
      const sum = safeArr.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(10);
    });

    it('should handle errors in array operations gracefully', () => {
      const arr = BulletproofSafety.safeArray([1, 2, 3, 4, 5]);
      
      // Map with error-prone function
      const result = arr.map(x => {
        if (x === 3) throw new Error('Map error');
        return x * 2;
      });
      
      // Should continue with other elements
      expect(result.length).toBeLessThan(5);
      expect(result.toArray()).toContain(2);
      expect(result.toArray()).toContain(4);
    });
  });

  describe('Chart Safety Integration', () => {
    it('should create safe scale functions', () => {
      const scale = BulletproofSafety.ChartSafety.createSafeScale([0, 100], [0, 500]);
      
      expect(scale(0)).toBe(0);
      expect(scale(50)).toBe(250);
      expect(scale(100)).toBe(500);
      expect(scale(NaN)).not.toBeNaN(); // Should handle NaN gracefully
    });

    it('should generate safe tick values', () => {
      const ticks = BulletproofSafety.ChartSafety.generateSafeTicks(0, 100, 5);
      
      expect(ticks).toHaveLength(5);
      expect(ticks[0]).toBe(0);
      expect(ticks[4]).toBe(100);
      
      // Handle invalid parameters
      const invalidTicks = BulletproofSafety.ChartSafety.generateSafeTicks(NaN, 100, 5);
      expect(invalidTicks.length).toBeGreaterThan(0);
    });

    it('should create safe SVG paths', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 20 },
        { x: NaN, y: 30 }, // Invalid point
        { x: 30, y: 40 }
      ];
      
      const path = BulletproofSafety.ChartSafety.createSafePath(points);
      
      expect(path).toBeTruthy();
      expect(path).toContain('M'); // Should start with move command
      expect(path).toContain('L'); // Should contain line commands
      // Should filter out invalid points
      expect(path.split(' ').filter(part => part.includes('NaN'))).toHaveLength(0);
    });
  });

  describe('Performance and Error Handling Integration', () => {
    it('should measure performance safely', () => {
      const result = BulletproofSafety.PerformanceMonitor.measureTime(
        () => {
          // Simulate some work
          let sum = 0;
          for (let i = 0; i < 1000; i++) {
            sum += i;
          }
          return sum;
        },
        'Test operation'
      );
      
      expect(result).toBe(499500); // Sum of 0 to 999
    });

    it('should handle async operations safely', async () => {
      const result = await BulletproofSafety.ErrorBoundaryHelpers.safeAsync(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async success';
        },
        'async fallback',
        'test async operation'
      );
      
      expect(result).toBe('async success');
    });

    it('should handle async errors safely', async () => {
      const result = await BulletproofSafety.ErrorBoundaryHelpers.safeAsync(
        async () => {
          throw new Error('Async error');
        },
        'async fallback',
        'test async operation'
      );
      
      expect(result).toBe('async fallback');
    });

    it('should create safe event handlers', () => {
      const mockFn = vi.fn(() => {
        throw new Error('Event handler error');
      });
      
      const safeHandler = BulletproofSafety.ErrorBoundaryHelpers.safeEventHandler(mockFn);
      
      // Should not throw
      expect(() => safeHandler()).not.toThrow();
      expect(mockFn).toHaveBeenCalled();
    });
  });

  describe('Tactical Safety Tests Integration', () => {
    it('should run all tactical safety tests successfully', () => {
      const result = runTacticalSafetyTests();
      expect(result).toBe(true); // All tests should pass
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle complete tactical board workflow', () => {
      // Simulate a complete workflow with mixed valid/invalid data
      const result = BulletproofSafety.SafeMath.calculate(() => {
        // 1. Validate player data
        const validPlayers = BulletproofSafety.DataValidators.validatePlayerData(mockInvalidPlayerData);
        
        // 2. Extract positions
        const positions = BulletproofSafety.safeArray(validPlayers)
          .map(player => BulletproofSafety.DataValidators.extractCoordinates(player.position, { x: 50, y: 50 }))
          .toArray();
        
        // 3. Calculate formation metrics
        const xCoords = positions.map(pos => pos.x);
        const yCoords = positions.map(pos => pos.y);
        
        const centerX = BulletproofSafety.SafeMath.average(xCoords, 50);
        const centerY = BulletproofSafety.SafeMath.average(yCoords, 50);
        const spreadX = BulletproofSafety.SafeMath.max(xCoords, 0) - BulletproofSafety.SafeMath.min(xCoords, 0);
        const spreadY = BulletproofSafety.SafeMath.max(yCoords, 0) - BulletproofSafety.SafeMath.min(yCoords, 0);
        
        // 4. Generate chart data
        const chartData = positions.map((pos, index) => ({
          x: index + 1,
          y: pos.x + pos.y // Simple metric
        }));
        
        const validChartData = BulletproofSafety.DataValidators.validateChartData(chartData);
        
        return {
          playerCount: validPlayers.length,
          center: { x: centerX, y: centerY },
          spread: { x: spreadX, y: spreadY },
          chartPoints: validChartData.length
        };
      }, null, 'Complete tactical workflow');
      
      expect(result.success).toBe(true);
      expect(result.value?.playerCount).toBe(1);
      expect(result.value?.center).toBeDefined();
      expect(result.value?.spread).toBeDefined();
      expect(result.value?.chartPoints).toBeGreaterThan(0);
    });

    it('should handle concurrent data processing safely', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        BulletproofSafety.ErrorBoundaryHelpers.safeAsync(
          async () => {
            // Simulate processing different datasets
            const data = mockValidChartData.map(point => ({
              ...point,
              y: point.y * (i + 1)
            }));
            
            if (i % 3 === 0) {
              // Introduce some errors
              throw new Error(`Processing error ${i}`);
            }
            
            return BulletproofSafety.DataValidators.validateChartData(data);
          },
          [],
          `Concurrent processing ${i}`
        )
      );
      
      const results = await Promise.all(promises);
      
      // Should have some successful results and some fallbacks
      const successCount = results.filter(r => r.length > 0).length;
      const errorCount = results.filter(r => r.length === 0).length;
      
      expect(successCount).toBeGreaterThan(0);
      expect(errorCount).toBeGreaterThan(0);
      expect(successCount + errorCount).toBe(10);
    });

    it('should maintain performance under stress', () => {
      const startTime = performance.now();
      
      // Process large amounts of data
      for (let i = 0; i < 100; i++) {
        const largeDataset = Array.from({ length: 1000 }, (_, j) => ({
          x: j,
          y: Math.random() * 100,
          z: i % 2 === 0 ? undefined : j * 2 // Mix valid/invalid
        }));
        
        const processed = BulletproofSafety.safeArray(largeDataset)
          .filter(item => item.z !== undefined)
          .map(item => BulletproofSafety.safeNumber(item.y).clamp(0, 100))
          .reduce((sum, num) => sum + num.value, 0);
        
        expect(processed).toBeGreaterThan(0);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(5000); // 5 seconds max
    });
  });
});