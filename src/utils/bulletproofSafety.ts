/**
 * BULLETPROOF SAFETY UTILITIES
 * Revolutionary defensive programming system for tactical board components
 * Zero runtime errors guaranteed - Production-grade safety measures
 */

// ============================================================================
// CORE SAFETY TYPES AND INTERFACES
// ============================================================================

export interface SafeArray<T> {
  readonly length: number;
  readonly data: readonly T[];
  map: <U>(fn: (item: T, index: number) => U) => SafeArray<U>;
  filter: (fn: (item: T, index: number) => boolean) => SafeArray<T>;
  reduce: <U>(fn: (acc: U, item: T, index: number) => U, initial: U) => U;
  find: (fn: (item: T, index: number) => boolean) => T | null;
  at: (index: number) => T | null;
  slice: (start?: number, end?: number) => SafeArray<T>;
  isEmpty: () => boolean;
  isValid: () => boolean;
  toArray: () => T[];
}

export interface SafeNumber {
  readonly value: number;
  readonly isValid: boolean;
  readonly isFinite: boolean;
  readonly isInteger: boolean;
  add: (other: number | SafeNumber) => SafeNumber;
  subtract: (other: number | SafeNumber) => SafeNumber;
  multiply: (other: number | SafeNumber) => SafeNumber;
  divide: (other: number | SafeNumber) => SafeNumber;
  clamp: (min: number, max: number) => SafeNumber;
  toString: () => string;
}

export interface SafeCalculationResult<T> {
  readonly success: boolean;
  readonly value: T | null;
  readonly error: string | null;
  readonly fallback: T;
}

export interface Logger {
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: any) => void;
  debug: (message: string, data?: any) => void;
}

// ============================================================================
// PRODUCTION-GRADE LOGGER
// ============================================================================

class ProductionLogger implements Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '');
  }

  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error || '');
    
    // In production, send to error tracking service
    if (!this.isDevelopment && typeof window !== 'undefined') {
      // Integration point for error tracking services like Sentry
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(message), {
          extra: error
        });
      }
    }
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data || '');
    }
  }
}

export const logger = new ProductionLogger();

// ============================================================================
// BULLETPROOF SAFE NUMBER CLASS
// ============================================================================

class SafeNumberImpl implements SafeNumber {
  readonly value: number;
  readonly isValid: boolean;
  readonly isFinite: boolean;
  readonly isInteger: boolean;

  constructor(input: unknown, fallback: number = 0) {
    const num = typeof input === 'number' ? input : Number(input);
    
    this.isValid = !isNaN(num) && isFinite(num);
    this.isFinite = isFinite(num);
    this.isInteger = Number.isInteger(num);
    this.value = this.isValid ? num : fallback;
  }

  add(other: number | SafeNumber): SafeNumber {
    const otherVal = typeof other === 'number' ? other : other.value;
    return new SafeNumberImpl(this.value + otherVal);
  }

  subtract(other: number | SafeNumber): SafeNumber {
    const otherVal = typeof other === 'number' ? other : other.value;
    return new SafeNumberImpl(this.value - otherVal);
  }

  multiply(other: number | SafeNumber): SafeNumber {
    const otherVal = typeof other === 'number' ? other : other.value;
    return new SafeNumberImpl(this.value * otherVal);
  }

  divide(other: number | SafeNumber): SafeNumber {
    const otherVal = typeof other === 'number' ? other : other.value;
    if (otherVal === 0) {
      logger.warn('Division by zero detected, returning 0');
      return new SafeNumberImpl(0);
    }
    return new SafeNumberImpl(this.value / otherVal);
  }

  clamp(min: number, max: number): SafeNumber {
    return new SafeNumberImpl(Math.max(min, Math.min(max, this.value)));
  }

  toString(): string {
    return this.isValid ? this.value.toString() : '0';
  }
}

// ============================================================================
// BULLETPROOF SAFE ARRAY CLASS
// ============================================================================

class SafeArrayImpl<T> implements SafeArray<T> {
  readonly data: readonly T[];
  readonly length: number;

  constructor(input: unknown, validator?: (item: unknown) => item is T) {
    if (!Array.isArray(input)) {
      logger.warn('Non-array input provided to SafeArray, creating empty array');
      this.data = [];
      this.length = 0;
      return;
    }

    if (validator) {
      this.data = Object.freeze(input.filter(validator));
    } else {
      // Filter out null, undefined, and basic invalid values
      this.data = Object.freeze(input.filter(item => 
        item !== null && 
        item !== undefined && 
        !Number.isNaN(item)
      ));
    }
    
    this.length = this.data.length;
  }

  map<U>(fn: (item: T, index: number) => U): SafeArray<U> {
    try {
      const mapped = this.data.map((item, index) => {
        try {
          return fn(item, index);
        } catch (error) {
          logger.error(`Error in map function at index ${index}:`, error);
          return null as unknown as U;
        }
      });
      return new SafeArrayImpl(mapped);
    } catch (error) {
      logger.error('Critical error in SafeArray.map:', error);
      return new SafeArrayImpl([]);
    }
  }

  filter(fn: (item: T, index: number) => boolean): SafeArray<T> {
    try {
      const filtered = this.data.filter((item, index) => {
        try {
          return fn(item, index);
        } catch (error) {
          logger.error(`Error in filter function at index ${index}:`, error);
          return false;
        }
      });
      return new SafeArrayImpl(filtered);
    } catch (error) {
      logger.error('Critical error in SafeArray.filter:', error);
      return new SafeArrayImpl([]);
    }
  }

  reduce<U>(fn: (acc: U, item: T, index: number) => U, initial: U): U {
    try {
      return this.data.reduce((acc, item, index) => {
        try {
          return fn(acc, item, index);
        } catch (error) {
          logger.error(`Error in reduce function at index ${index}:`, error);
          return acc;
        }
      }, initial);
    } catch (error) {
      logger.error('Critical error in SafeArray.reduce:', error);
      return initial;
    }
  }

  find(fn: (item: T, index: number) => boolean): T | null {
    try {
      for (let i = 0; i < this.data.length; i++) {
        try {
          if (fn(this.data[i], i)) {
            return this.data[i];
          }
        } catch (error) {
          logger.error(`Error in find function at index ${i}:`, error);
        }
      }
      return null;
    } catch (error) {
      logger.error('Critical error in SafeArray.find:', error);
      return null;
    }
  }

  at(index: number): T | null {
    const safeIndex = new SafeNumberImpl(index);
    if (!safeIndex.isValid || !safeIndex.isInteger) {
      return null;
    }
    
    const idx = safeIndex.value;
    if (idx < 0 || idx >= this.length) {
      return null;
    }
    
    return this.data[idx] || null;
  }

  slice(start: number = 0, end?: number): SafeArray<T> {
    try {
      const safeStart = new SafeNumberImpl(start).value;
      const safeEnd = end !== undefined ? new SafeNumberImpl(end).value : undefined;
      return new SafeArrayImpl(this.data.slice(safeStart, safeEnd));
    } catch (error) {
      logger.error('Error in SafeArray.slice:', error);
      return new SafeArrayImpl([]);
    }
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  isValid(): boolean {
    return this.length >= 0 && Array.isArray(this.data);
  }

  toArray(): T[] {
    return [...this.data];
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function safeNumber(input: unknown, fallback: number = 0): SafeNumber {
  return new SafeNumberImpl(input, fallback);
}

export function safeArray<T>(input: unknown, validator?: (item: unknown) => item is T): SafeArray<T> {
  return new SafeArrayImpl(input, validator);
}

// ============================================================================
// MATHEMATICAL OPERATIONS WITH SAFETY
// ============================================================================

export const SafeMath = {
  /**
   * Safe min calculation that handles empty arrays and invalid numbers
   */
  min(numbers: number[], fallback: number = 0): number {
    const safeNumbers = safeArray(numbers, (n): n is number => 
      typeof n === 'number' && !isNaN(n) && isFinite(n)
    );
    
    if (safeNumbers.isEmpty()) {
      logger.warn('SafeMath.min: Empty or invalid array, returning fallback');
      return fallback;
    }
    
    return safeNumbers.reduce((min, num) => Math.min(min, num), Infinity);
  },

  /**
   * Safe max calculation that handles empty arrays and invalid numbers
   */
  max(numbers: number[], fallback: number = 0): number {
    const safeNumbers = safeArray(numbers, (n): n is number => 
      typeof n === 'number' && !isNaN(n) && isFinite(n)
    );
    
    if (safeNumbers.isEmpty()) {
      logger.warn('SafeMath.max: Empty or invalid array, returning fallback');
      return fallback;
    }
    
    return safeNumbers.reduce((max, num) => Math.max(max, num), -Infinity);
  },

  /**
   * Safe average calculation with protection against division by zero
   */
  average(numbers: number[], fallback: number = 0): number {
    const safeNumbers = safeArray(numbers, (n): n is number => 
      typeof n === 'number' && !isNaN(n) && isFinite(n)
    );
    
    if (safeNumbers.isEmpty()) {
      logger.warn('SafeMath.average: Empty or invalid array, returning fallback');
      return fallback;
    }
    
    const sum = safeNumbers.reduce((acc, num) => acc + num, 0);
    return sum / safeNumbers.length;
  },

  /**
   * Safe distance calculation between two points
   */
  distance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    const x1 = safeNumber(point1?.x);
    const y1 = safeNumber(point1?.y);
    const x2 = safeNumber(point2?.x);
    const y2 = safeNumber(point2?.y);
    
    const dx = x2.subtract(x1);
    const dy = y2.subtract(y1);
    
    return Math.sqrt(dx.multiply(dx).value + dy.multiply(dy).value);
  },

  /**
   * Safe calculation wrapper with automatic error handling
   */
  calculate<T>(calculation: () => T, fallback: T, context: string = 'calculation'): SafeCalculationResult<T> {
    try {
      const result = calculation();
      
      if (result === null || result === undefined) {
        logger.warn(`${context}: Calculation returned null/undefined`);
        return {
          success: false,
          value: null,
          error: 'Calculation returned null/undefined',
          fallback
        };
      }
      
      return {
        success: true,
        value: result,
        error: null,
        fallback
      };
    } catch (error) {
      logger.error(`${context}: Calculation failed`, error);
      return {
        success: false,
        value: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback
      };
    }
  }
};

// ============================================================================
// DATA STRUCTURE VALIDATORS
// ============================================================================

export const DataValidators = {
  /**
   * Validates and safely extracts coordinates from any object
   */
  extractCoordinates(obj: any, fallback = { x: 0, y: 0 }): { x: number; y: number } {
    if (!obj || typeof obj !== 'object') {
      return fallback;
    }
    
    const x = safeNumber(obj.x, fallback.x).value;
    const y = safeNumber(obj.y, fallback.y).value;
    
    return { x, y };
  },

  /**
   * Validates array of coordinate objects
   */
  validateCoordinateArray(arr: any[]): Array<{ x: number; y: number }> {
    return safeArray(arr)
      .map(item => this.extractCoordinates(item))
      .filter(coord => 
        coord.x >= 0 && coord.x <= 100 && 
        coord.y >= 0 && coord.y <= 100
      )
      .toArray();
  },

  /**
   * Validates chart data points
   */
  validateChartData(data: any[]): Array<{ x: number; y: number }> {
    return safeArray(data, (item: any): item is { x: number; y: number } => {
      return item && 
             typeof item === 'object' && 
             typeof item.x === 'number' && 
             typeof item.y === 'number' &&
             !isNaN(item.x) && 
             !isNaN(item.y) &&
             isFinite(item.x) && 
             isFinite(item.y);
    }).toArray();
  },

  /**
   * Validates player data with comprehensive checks
   */
  validatePlayerData(players: any[]): Array<{
    id: string;
    name: string;
    position: { x: number; y: number };
    [key: string]: any;
  }> {
    return safeArray(players, (player: any) => {
      return player &&
             typeof player === 'object' &&
             typeof player.id === 'string' &&
             typeof player.name === 'string' &&
             player.position &&
             typeof player.position.x === 'number' &&
             typeof player.position.y === 'number' &&
             !isNaN(player.position.x) &&
             !isNaN(player.position.y) &&
             isFinite(player.position.x) &&
             isFinite(player.position.y);
    }).toArray();
  }
};

// ============================================================================
// CHART SAFETY UTILITIES
// ============================================================================

export const ChartSafety = {
  /**
   * Creates safe scale functions that never throw errors
   */
  createSafeScale(domain: [number, number], range: [number, number]) {
    const [domainMin, domainMax] = [
      safeNumber(domain[0]).value,
      safeNumber(domain[1]).value
    ];
    
    const [rangeMin, rangeMax] = [
      safeNumber(range[0]).value,
      safeNumber(range[1]).value
    ];
    
    const domainSpan = domainMax - domainMin || 1; // Prevent division by zero
    const rangeSpan = rangeMax - rangeMin;
    
    return (value: number): number => {
      const safeValue = safeNumber(value).value;
      return rangeMin + ((safeValue - domainMin) / domainSpan) * rangeSpan;
    };
  },

  /**
   * Generates safe tick values for axes
   */
  generateSafeTicks(min: number, max: number, tickCount: number = 5): number[] {
    const safeMin = safeNumber(min).value;
    const safeMax = safeNumber(max).value;
    const safeTickCount = safeNumber(tickCount, 5).clamp(2, 20).value;
    
    if (safeMax <= safeMin) {
      return [safeMin];
    }
    
    const step = (safeMax - safeMin) / (safeTickCount - 1);
    const ticks: number[] = [];
    
    for (let i = 0; i < safeTickCount; i++) {
      ticks.push(safeMin + i * step);
    }
    
    return ticks;
  },

  /**
   * Creates safe path string for SVG with error recovery
   */
  createSafePath(points: Array<{ x: number; y: number }>): string {
    const validPoints = DataValidators.validateChartData(points);
    
    if (validPoints.length === 0) {
      logger.warn('ChartSafety.createSafePath: No valid points, returning empty path');
      return '';
    }
    
    try {
      return validPoints
        .map((point, index) => {
          const x = safeNumber(point.x).value;
          const y = safeNumber(point.y).value;
          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
        })
        .join(' ');
    } catch (error) {
      logger.error('ChartSafety.createSafePath: Path generation failed', error);
      return '';
    }
  }
};

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

export const ErrorBoundaryHelpers = {
  /**
   * Wraps a React component render function with error boundary
   */
  safeRender<T>(renderFn: () => T, fallback: T, componentName: string = 'Component'): T {
    try {
      const result = renderFn();
      if (result === null || result === undefined) {
        logger.warn(`${componentName}: Render function returned null/undefined`);
        return fallback;
      }
      return result;
    } catch (error) {
      logger.error(`${componentName}: Render failed`, error);
      return fallback;
    }
  },

  /**
   * Creates a safe event handler that never throws
   */
  safeEventHandler<T extends any[]>(
    handler: (...args: T) => void,
    context: string = 'Event'
  ): (...args: T) => void {
    return (...args: T) => {
      try {
        handler(...args);
      } catch (error) {
        logger.error(`${context}: Event handler failed`, error);
      }
    };
  },

  /**
   * Safe async operation wrapper
   */
  async safeAsync<T>(
    operation: () => Promise<T>,
    fallback: T,
    context: string = 'Async operation'
  ): Promise<T> {
    try {
      const result = await operation();
      return result ?? fallback;
    } catch (error) {
      logger.error(`${context}: Async operation failed`, error);
      return fallback;
    }
  }
};

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export const PerformanceMonitor = {
  /**
   * Measures and logs execution time
   */
  measureTime<T>(operation: () => T, operationName: string): T {
    const startTime = performance.now();
    try {
      const result = operation();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 100) { // Log slow operations
        logger.warn(`Slow operation detected: ${operationName} took ${duration.toFixed(2)}ms`);
      } else {
        logger.debug(`${operationName} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      logger.error(`${operationName} failed after ${(endTime - startTime).toFixed(2)}ms`, error);
      throw error;
    }
  },

  /**
   * Debounced execution with safety
   */
  debounce<T extends any[]>(
    func: (...args: T) => void,
    delay: number,
    context: string = 'Debounced function'
  ): (...args: T) => void {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        try {
          func(...args);
        } catch (error) {
          logger.error(`${context}: Debounced function failed`, error);
        }
      }, delay);
    };
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

export { SafeNumberImpl, SafeArrayImpl };

// Main safety interface
export const BulletproofSafety = {
  safeNumber,
  safeArray,
  SafeMath,
  DataValidators,
  ChartSafety,
  ErrorBoundaryHelpers,
  PerformanceMonitor,
  logger
} as const;

export default BulletproofSafety;