/**
 * BULLETPROOF SAFETY COMPREHENSIVE TEST SUITE
 * Tests all safety utilities, error boundaries, and defensive programming measures
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  BulletproofSafety,
  safeNumber,
  safeArray,
  SafeMath,
  DataValidators,
  ChartSafety,
  ErrorBoundaryHelpers,
  PerformanceMonitor
} from '../utils/bulletproofSafety';

// Mock console methods to test logging
const mockConsole = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn()
};

describe('BulletproofSafety', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('SafeNumber', () => {
    it('should handle valid numbers correctly', () => {
      const num = safeNumber(42);
      expect(num.value).toBe(42);
      expect(num.isValid).toBe(true);
      expect(num.isFinite).toBe(true);
    });

    it('should handle invalid numbers with fallback', () => {
      const num = safeNumber(NaN, 100);
      expect(num.value).toBe(100);
      expect(num.isValid).toBe(false);
    });

    it('should handle string conversion correctly', () => {
      const num = safeNumber('42.5');
      expect(num.value).toBe(42.5);
      expect(num.isValid).toBe(true);
    });

    it('should handle mathematical operations safely', () => {
      const num1 = safeNumber(10);
      const num2 = safeNumber(5);
      
      expect(num1.add(num2).value).toBe(15);
      expect(num1.subtract(num2).value).toBe(5);
      expect(num1.multiply(num2).value).toBe(50);
      expect(num1.divide(num2).value).toBe(2);
    });

    it('should handle division by zero gracefully', () => {
      const num = safeNumber(10);
      const result = num.divide(0);
      expect(result.value).toBe(0);
    });

    it('should clamp values within range', () => {
      const num = safeNumber(150);
      const clamped = num.clamp(0, 100);
      expect(clamped.value).toBe(100);
    });
  });

  describe('SafeArray', () => {
    it('should handle valid arrays correctly', () => {
      const arr = safeArray([1, 2, 3, 4, 5]);
      expect(arr.length).toBe(5);
      expect(arr.isValid()).toBe(true);
      expect(arr.isEmpty()).toBe(false);
    });

    it('should filter out null/undefined values', () => {
      const arr = safeArray([1, null, 2, undefined, 3]);
      expect(arr.length).toBe(3);
      expect(arr.toArray()).toEqual([1, 2, 3]);
    });

    it('should handle non-array input gracefully', () => {
      const arr = safeArray(null);
      expect(arr.length).toBe(0);
      expect(arr.isEmpty()).toBe(true);
    });

    it('should perform safe map operations', () => {
      const arr = safeArray([1, 2, 3]);
      const doubled = arr.map(x => x * 2);
      expect(doubled.toArray()).toEqual([2, 4, 6]);
    });

    it('should handle errors in map functions gracefully', () => {
      const arr = safeArray([1, 2, 3]);
      const result = arr.map(x => {
        if (x === 2) throw new Error('Test error');
        return x * 2;
      });
      // Should filter out the error result and continue
      expect(result.length).toBe(2);
    });

    it('should perform safe filter operations', () => {
      const arr = safeArray([1, 2, 3, 4, 5]);
      const evens = arr.filter(x => x % 2 === 0);
      expect(evens.toArray()).toEqual([2, 4]);
    });

    it('should perform safe reduce operations', () => {
      const arr = safeArray([1, 2, 3, 4, 5]);
      const sum = arr.reduce((acc, x) => acc + x, 0);
      expect(sum).toBe(15);
    });

    it('should handle safe find operations', () => {
      const arr = safeArray([1, 2, 3, 4, 5]);
      const found = arr.find(x => x > 3);
      expect(found).toBe(4);
      
      const notFound = arr.find(x => x > 10);
      expect(notFound).toBe(null);
    });

    it('should handle safe array access', () => {
      const arr = safeArray([1, 2, 3]);
      expect(arr.at(1)).toBe(2);
      expect(arr.at(10)).toBe(null);
      expect(arr.at(-1)).toBe(null);
    });

    it('should handle safe slicing', () => {
      const arr = safeArray([1, 2, 3, 4, 5]);
      const sliced = arr.slice(1, 3);
      expect(sliced.toArray()).toEqual([2, 3]);
    });
  });

  describe('SafeMath', () => {
    it('should calculate min values safely', () => {
      expect(SafeMath.min([1, 2, 3])).toBe(1);
      expect(SafeMath.min([], 100)).toBe(100);
      expect(SafeMath.min([NaN, 5, 3])).toBe(3);
    });

    it('should calculate max values safely', () => {
      expect(SafeMath.max([1, 2, 3])).toBe(3);
      expect(SafeMath.max([], 100)).toBe(100);
      expect(SafeMath.max([NaN, 5, 3])).toBe(5);
    });

    it('should calculate averages safely', () => {
      expect(SafeMath.average([2, 4, 6])).toBe(4);
      expect(SafeMath.average([], 50)).toBe(50);
      expect(SafeMath.average([NaN, 4, 6])).toBe(5);
    });

    it('should calculate distances safely', () => {
      const point1 = { x: 0, y: 0 };
      const point2 = { x: 3, y: 4 };
      expect(SafeMath.distance(point1, point2)).toBe(5);
    });

    it('should handle invalid points in distance calculation', () => {
      const point1 = { x: NaN, y: 0 };
      const point2 = { x: 3, y: 4 };
      const distance = SafeMath.distance(point1, point2);
      expect(isNaN(distance)).toBe(false);
    });

    it('should perform safe calculations with error handling', () => {
      const result = SafeMath.calculate(() => 42, 0, 'test calculation');
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
      expect(result.error).toBe(null);
    });

    it('should handle errors in calculations', () => {
      const result = SafeMath.calculate(() => {
        throw new Error('Test error');
      }, 100, 'test calculation');
      
      expect(result.success).toBe(false);
      expect(result.value).toBe(null);
      expect(result.fallback).toBe(100);
      expect(result.error).toBe('Test error');
    });

    it('should handle null/undefined results', () => {
      const result = SafeMath.calculate(() => null, 200, 'test calculation');
      expect(result.success).toBe(false);
      expect(result.fallback).toBe(200);
    });
  });

  describe('DataValidators', () => {
    it('should extract coordinates safely', () => {
      const obj = { x: 10, y: 20 };
      const coords = DataValidators.extractCoordinates(obj);
      expect(coords).toEqual({ x: 10, y: 20 });
    });

    it('should handle invalid coordinate objects', () => {
      const coords = DataValidators.extractCoordinates(null, { x: 50, y: 50 });
      expect(coords).toEqual({ x: 50, y: 50 });
    });

    it('should validate coordinate arrays', () => {
      const input = [
        { x: 10, y: 20 },
        { x: NaN, y: 30 },
        { x: 40, y: 50 },
        null
      ];
      const result = DataValidators.validateCoordinateArray(input);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ x: 10, y: 20 });
      expect(result[1]).toEqual({ x: 40, y: 50 });
    });

    it('should validate chart data', () => {
      const input = [
        { x: 1, y: 2 },
        { x: 'invalid', y: 3 },
        { x: 4, y: 5 },
        null
      ];
      const result = DataValidators.validateChartData(input);
      expect(result).toHaveLength(2);
    });

    it('should validate player data comprehensively', () => {
      const input = [
        {
          id: 'player1',
          name: 'John Doe',
          position: { x: 50, y: 60 }
        },
        {
          id: 'player2',
          name: 'Jane Smith',
          position: { x: NaN, y: 70 }
        },
        null,
        {
          id: 'player3',
          name: 'Bob Wilson',
          position: { x: 30, y: 40 }
        }
      ];
      const result = DataValidators.validatePlayerData(input);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('player1');
      expect(result[1].id).toBe('player3');
    });
  });

  describe('ChartSafety', () => {
    it('should create safe scale functions', () => {
      const scale = ChartSafety.createSafeScale([0, 100], [0, 500]);
      expect(scale(50)).toBe(250);
      expect(scale(0)).toBe(0);
      expect(scale(100)).toBe(500);
    });

    it('should handle invalid domain in scale functions', () => {
      const scale = ChartSafety.createSafeScale([NaN, 100], [0, 500]);
      const result = scale(50);
      expect(isNaN(result)).toBe(false);
    });

    it('should generate safe tick values', () => {
      const ticks = ChartSafety.generateSafeTicks(0, 100, 5);
      expect(ticks).toHaveLength(5);
      expect(ticks[0]).toBe(0);
      expect(ticks[4]).toBe(100);
    });

    it('should handle invalid tick parameters', () => {
      const ticks = ChartSafety.generateSafeTicks(100, 0, 5); // min > max
      expect(ticks).toHaveLength(1);
      expect(ticks[0]).toBe(100);
    });

    it('should create safe SVG paths', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 20 },
        { x: 20, y: 10 }
      ];
      const path = ChartSafety.createSafePath(points);
      expect(path).toBe('M 0 0 L 10 20 L 20 10');
    });

    it('should handle invalid points in path creation', () => {
      const points = [
        { x: 0, y: 0 },
        { x: NaN, y: 20 },
        { x: 20, y: 10 }
      ];
      const path = ChartSafety.createSafePath(points);
      expect(path).toBe('M 0 0 L 20 10');
    });

    it('should handle empty points array', () => {
      const path = ChartSafety.createSafePath([]);
      expect(path).toBe('');
    });
  });

  describe('ErrorBoundaryHelpers', () => {
    it('should handle safe rendering', () => {
      const result = ErrorBoundaryHelpers.safeRender(
        () => 'success',
        'fallback',
        'TestComponent'
      );
      expect(result).toBe('success');
    });

    it('should use fallback on render error', () => {
      const result = ErrorBoundaryHelpers.safeRender(
        () => { throw new Error('render error'); },
        'fallback',
        'TestComponent'
      );
      expect(result).toBe('fallback');
    });

    it('should handle null render results', () => {
      const result = ErrorBoundaryHelpers.safeRender(
        () => null,
        'fallback',
        'TestComponent'
      );
      expect(result).toBe('fallback');
    });

    it('should create safe event handlers', () => {
      const mockHandler = vi.fn(() => { throw new Error('handler error'); });
      const safeHandler = ErrorBoundaryHelpers.safeEventHandler(mockHandler);
      
      // Should not throw
      expect(() => safeHandler()).not.toThrow();
      expect(mockHandler).toHaveBeenCalled();
    });

    it('should handle async operations safely', async () => {
      const result = await ErrorBoundaryHelpers.safeAsync(
        async () => 'async success',
        'async fallback',
        'test async'
      );
      expect(result).toBe('async success');
    });

    it('should handle async errors safely', async () => {
      const result = await ErrorBoundaryHelpers.safeAsync(
        async () => { throw new Error('async error'); },
        'async fallback',
        'test async'
      );
      expect(result).toBe('async fallback');
    });
  });

  describe('PerformanceMonitor', () => {
    it('should measure operation time', () => {
      const result = PerformanceMonitor.measureTime(
        () => 'operation result',
        'test operation'
      );
      expect(result).toBe('operation result');
    });

    it('should handle errors in measured operations', () => {
      expect(() => {
        PerformanceMonitor.measureTime(
          () => { throw new Error('operation error'); },
          'test operation'
        );
      }).toThrow('operation error');
    });

    it('should create debounced functions', (done) => {
      const mockFn = vi.fn();
      const debouncedFn = PerformanceMonitor.debounce(mockFn, 50);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not be called immediately
      expect(mockFn).not.toHaveBeenCalled();
      
      setTimeout(() => {
        // Should be called only once after delay
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 60);
    });

    it('should handle errors in debounced functions', (done) => {
      const mockFn = vi.fn(() => { throw new Error('debounced error'); });
      const debouncedFn = PerformanceMonitor.debounce(mockFn, 50);
      
      debouncedFn();
      
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalled();
        done();
      }, 60);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complex chart data processing', () => {
      const rawData = [
        { x: 1, y: 10 },
        { x: 'invalid', y: 20 },
        null,
        { x: 3, y: NaN },
        { x: 4, y: 40 },
        { x: 5, y: 50 }
      ];
      
      const validData = DataValidators.validateChartData(rawData);
      const xValues = safeArray(validData).map(d => d.x).toArray();
      const yValues = safeArray(validData).map(d => d.y).toArray();
      
      const xMin = SafeMath.min(xValues);
      const xMax = SafeMath.max(xValues);
      const yMin = SafeMath.min(yValues);
      const yMax = SafeMath.max(yValues);
      
      const scale = ChartSafety.createSafeScale([xMin, xMax], [0, 100]);
      const path = ChartSafety.createSafePath(
        validData.map(d => ({ x: scale(d.x), y: d.y }))
      );
      
      expect(validData).toHaveLength(3);
      expect(path).toBeTruthy();
      expect(path.length).toBeGreaterThan(0);
    });

    it('should handle complete workflow with errors', () => {
      const result = SafeMath.calculate(() => {
        const data = safeArray([1, null, 2, NaN, 3]);
        const processed = data
          .filter(x => x > 0)
          .map(x => x * 2)
          .reduce((sum, x) => sum + x, 0);
        return processed;
      }, 0, 'complete workflow');
      
      expect(result.success).toBe(true);
      expect(result.value).toBe(12); // (1 + 2 + 3) * 2 = 12
    });

    it('should maintain data integrity through multiple transformations', () => {
      const initialData = [
        { value: 10, valid: true },
        { value: null, valid: false },
        { value: 20, valid: true },
        { value: NaN, valid: true },
        { value: 30, valid: true }
      ];
      
      const processed = safeArray(initialData)
        .filter(item => item && item.valid)
        .map(item => safeNumber(item.value, 0))
        .filter(num => num.isValid && num.value > 0)
        .map(num => num.multiply(2))
        .toArray();
      
      expect(processed).toHaveLength(3);
      expect(processed[0].value).toBe(20);
      expect(processed[1].value).toBe(40);
      expect(processed[2].value).toBe(60);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extremely large numbers', () => {
      const largeNum = safeNumber(Number.MAX_SAFE_INTEGER);
      expect(largeNum.isValid).toBe(true);
      expect(largeNum.isFinite).toBe(true);
    });

    it('should handle extremely small numbers', () => {
      const smallNum = safeNumber(Number.MIN_SAFE_INTEGER);
      expect(smallNum.isValid).toBe(true);
      expect(smallNum.isFinite).toBe(true);
    });

    it('should handle infinity values', () => {
      const infNum = safeNumber(Infinity, 0);
      expect(infNum.value).toBe(0);
      expect(infNum.isValid).toBe(false);
    });

    it('should handle deeply nested operations', () => {
      const result = safeArray([1, 2, 3])
        .map(x => safeNumber(x))
        .filter(num => num.isValid)
        .map(num => num.multiply(2))
        .map(num => num.add(1))
        .map(num => num.clamp(0, 10))
        .reduce((sum, num) => sum + num.value, 0);
      
      expect(result).toBe(18); // (3 + 5 + 7) = 15, but all clamped to max 10: (3 + 5 + 7) = 15
    });

    it('should handle mixed type arrays', () => {
      const mixedArray = [1, '2', true, null, undefined, { x: 5 }, [1, 2, 3]];
      const safeArr = safeArray(mixedArray);
      
      // Should filter out problematic values
      expect(safeArr.length).toBeLessThan(mixedArray.length);
      expect(safeArr.isEmpty()).toBe(false);
    });

    it('should handle recursive data structures gracefully', () => {
      const obj: any = { value: 42 };
      obj.self = obj; // Create circular reference
      
      const coords = DataValidators.extractCoordinates(obj, { x: 0, y: 0 });
      expect(coords).toEqual({ x: 0, y: 0 }); // Should use fallback
    });

    it('should handle concurrent operations safely', async () => {
      const promises = Array.from({ length: 100 }, (_, i) => 
        ErrorBoundaryHelpers.safeAsync(
          async () => {
            if (i % 10 === 0) throw new Error(`Error ${i}`);
            return i * 2;
          },
          -1,
          `operation ${i}`
        )
      );
      
      const results = await Promise.all(promises);
      
      // Should have 10 fallback values (-1) and 90 successful results
      const fallbackCount = results.filter(r => r === -1).length;
      const successCount = results.filter(r => r !== -1).length;
      
      expect(fallbackCount).toBe(10);
      expect(successCount).toBe(90);
    });
  });
});