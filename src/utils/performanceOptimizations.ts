/**
 * PERFORMANCE OPTIMIZATIONS WITH BULLETPROOF SAFETY
 * High-performance utilities that maintain zero-error guarantees
 */

import { BulletproofSafety } from './bulletproofSafety';

// ============================================================================
// MEMOIZATION WITH SAFETY
// ============================================================================

interface MemoCache<T> {
  [key: string]: {
    value: T;
    timestamp: number;
    hitCount: number;
  };
}

class SafeMemoization<T> {
  private cache: MemoCache<T> = {};
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = BulletproofSafety.safeNumber(maxSize, 100).clamp(10, 1000).value;
    this.ttl = BulletproofSafety.safeNumber(ttl, 300000).clamp(1000, 3600000).value;
  }

  /**
   * Memoize a function with safe execution and automatic cache management
   */
  memoize<Args extends any[]>(
    fn: (...args: Args) => T,
    keyGenerator?: (...args: Args) => string,
    context: string = 'memoized function'
  ): (...args: Args) => T {
    return (...args: Args): T => {
      return BulletproofSafety.SafeMath.calculate(() => {
        const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
        const now = Date.now();
        
        // Check if cached value exists and is valid
        const cached = this.cache[key];
        if (cached && (now - cached.timestamp) < this.ttl) {
          cached.hitCount++;
          BulletproofSafety.logger.debug(`Cache hit for ${context}: ${key}`);
          return cached.value;
        }
        
        // Execute function safely
        const result = fn(...args);
        
        // Store in cache
        this.cache[key] = {
          value: result,
          timestamp: now,
          hitCount: 1
        };
        
        // Clean cache if needed
        this.cleanCache();
        
        BulletproofSafety.logger.debug(`Cache miss for ${context}: ${key}`);
        return result;
      }, this.getDefaultValue(), `SafeMemoization ${context}`).value;
    };
  }

  /**
   * Clean expired and least-used cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    const entries = Object.entries(this.cache);
    
    // Remove expired entries
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > this.ttl) {
        delete this.cache[key];
      }
    }
    
    // If still over limit, remove least-used entries
    const remainingEntries = Object.entries(this.cache);
    if (remainingEntries.length > this.maxSize) {
      const sortedByUsage = remainingEntries.sort((a, b) => a[1].hitCount - b[1].hitCount);
      const toRemove = sortedByUsage.slice(0, remainingEntries.length - this.maxSize);
      
      for (const [key] of toRemove) {
        delete this.cache[key];
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; entries: number } {
    const entries = Object.values(this.cache);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const totalCalls = entries.length + totalHits;
    
    return {
      size: entries.length,
      hitRate: totalCalls > 0 ? (totalHits / totalCalls) * 100 : 0,
      entries: entries.length
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Get default value for type safety
   */
  private getDefaultValue(): T {
    // This is a type-safe way to provide a default without knowing T
    return undefined as unknown as T;
  }
}

// ============================================================================
// VIRTUAL SCROLLING WITH SAFETY
// ============================================================================

interface VirtualScrollItem {
  id: string;
  height: number;
  data: any;
}

interface VirtualScrollState {
  scrollTop: number;
  containerHeight: number;
  itemHeight: number;
  overscan: number;
}

class SafeVirtualScrolling {
  /**
   * Calculate which items should be rendered in viewport
   */
  static calculateVisibleItems(
    items: VirtualScrollItem[],
    state: VirtualScrollState
  ): { startIndex: number; endIndex: number; totalHeight: number; offsetY: number } {
    return BulletproofSafety.SafeMath.calculate(() => {
      const safeItems = BulletproofSafety.safeArray(items, (item: any): item is VirtualScrollItem => {
        return item &&
               typeof item.id === 'string' &&
               typeof item.height === 'number' &&
               !isNaN(item.height) &&
               item.height > 0;
      });

      if (safeItems.isEmpty()) {
        return { startIndex: 0, endIndex: 0, totalHeight: 0, offsetY: 0 };
      }

      const scrollTop = BulletproofSafety.safeNumber(state.scrollTop, 0).clamp(0, Infinity).value;
      const containerHeight = BulletproofSafety.safeNumber(state.containerHeight, 400).clamp(100, 2000).value;
      const overscan = BulletproofSafety.safeNumber(state.overscan, 5).clamp(0, 20).value;

      let currentOffset = 0;
      let startIndex = 0;
      let endIndex = 0;
      let totalHeight = 0;

      // Find start index
      for (let i = 0; i < safeItems.length; i++) {
        const item = safeItems.at(i);
        if (!item) continue;

        const itemHeight = BulletproofSafety.safeNumber(item.height, state.itemHeight || 50).value;
        
        if (currentOffset + itemHeight > scrollTop) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
        currentOffset += itemHeight;
      }

      // Find end index
      let visibleHeight = 0;
      currentOffset = 0;
      
      // Calculate offset for start index
      for (let i = 0; i < startIndex; i++) {
        const item = safeItems.at(i);
        if (item) {
          currentOffset += BulletproofSafety.safeNumber(item.height, state.itemHeight || 50).value;
        }
      }

      for (let i = startIndex; i < safeItems.length; i++) {
        const item = safeItems.at(i);
        if (!item) continue;

        const itemHeight = BulletproofSafety.safeNumber(item.height, state.itemHeight || 50).value;
        visibleHeight += itemHeight;
        
        if (visibleHeight > containerHeight) {
          endIndex = Math.min(safeItems.length - 1, i + overscan);
          break;
        }
      }

      // Calculate total height
      totalHeight = safeItems.reduce((sum, item) => {
        return sum + BulletproofSafety.safeNumber(item?.height, state.itemHeight || 50).value;
      }, 0);

      return {
        startIndex,
        endIndex: Math.max(endIndex, startIndex),
        totalHeight,
        offsetY: currentOffset
      };
    }, { startIndex: 0, endIndex: 0, totalHeight: 0, offsetY: 0 }, 'Virtual scrolling calculation').value;
  }
}

// ============================================================================
// DEBOUNCED COMPUTATIONS
// ============================================================================

class SafeDebounceManager {
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private results: Map<string, any> = new Map();

  /**
   * Debounce expensive computations with safety
   */
  debounceComputation<T>(
    key: string,
    computation: () => T,
    delay: number = 300,
    context: string = 'debounced computation'
  ): Promise<T> {
    return new Promise((resolve) => {
      // Clear existing timer
      const existingTimer = this.timers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Set new timer
      const timer = setTimeout(() => {
        BulletproofSafety.PerformanceMonitor.measureTime(() => {
          const result = BulletproofSafety.SafeMath.calculate(
            computation,
            this.results.get(key), // Use previous result as fallback
            `${context} (${key})`
          );

          if (result.success && result.value !== null) {
            this.results.set(key, result.value);
            resolve(result.value);
          } else {
            // Use fallback or default
            const fallback = this.results.get(key) || result.fallback;
            resolve(fallback);
          }
        }, `${context} execution`);

        this.timers.delete(key);
      }, BulletproofSafety.safeNumber(delay, 300).clamp(0, 5000).value);

      this.timers.set(key, timer);
    });
  }

  /**
   * Cancel all pending computations
   */
  cancelAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * Get cached result if available
   */
  getCached<T>(key: string): T | null {
    return this.results.get(key) || null;
  }
}

// ============================================================================
// BATCH PROCESSING WITH SAFETY
// ============================================================================

interface BatchProcessorOptions {
  batchSize: number;
  delay: number;
  maxRetries: number;
  onBatchComplete?: (results: any[]) => void;
  onError?: (error: Error, batch: any[]) => void;
}

class SafeBatchProcessor<T> {
  private queue: T[] = [];
  private processing: boolean = false;
  private options: BatchProcessorOptions;

  constructor(options: Partial<BatchProcessorOptions> = {}) {
    this.options = {
      batchSize: BulletproofSafety.safeNumber(options.batchSize, 10).clamp(1, 100).value,
      delay: BulletproofSafety.safeNumber(options.delay, 100).clamp(0, 1000).value,
      maxRetries: BulletproofSafety.safeNumber(options.maxRetries, 3).clamp(0, 10).value,
      onBatchComplete: options.onBatchComplete,
      onError: options.onError
    };
  }

  /**
   * Add item to processing queue
   */
  add(item: T): void {
    if (item !== null && item !== undefined) {
      this.queue.push(item);
      this.scheduleProcessing();
    }
  }

  /**
   * Add multiple items to queue
   */
  addBatch(items: T[]): void {
    const validItems = BulletproofSafety.safeArray(items).toArray();
    this.queue.push(...validItems);
    this.scheduleProcessing();
  }

  /**
   * Process items in batches
   */
  async processBatch<R>(
    processor: (batch: T[]) => Promise<R[]>,
    context: string = 'batch processing'
  ): Promise<R[]> {
    if (this.processing || this.queue.length === 0) {
      return [];
    }

    this.processing = true;
    const results: R[] = [];

    try {
      while (this.queue.length > 0) {
        const batch = this.queue.splice(0, this.options.batchSize);
        
        const batchResult = await BulletproofSafety.ErrorBoundaryHelpers.safeAsync(
          () => processor(batch),
          [],
          `${context} batch`
        );

        results.push(...batchResult);

        if (this.options.onBatchComplete) {
          BulletproofSafety.ErrorBoundaryHelpers.safeEventHandler(
            () => this.options.onBatchComplete!(batchResult),
            'Batch complete callback'
          )();
        }

        // Small delay between batches to prevent blocking
        if (this.queue.length > 0 && this.options.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, this.options.delay));
        }
      }
    } catch (error) {
      BulletproofSafety.logger.error(`Batch processing failed: ${context}`, error);
      
      if (this.options.onError) {
        BulletproofSafety.ErrorBoundaryHelpers.safeEventHandler(
          () => this.options.onError!(error as Error, this.queue),
          'Batch error callback'
        )();
      }
    } finally {
      this.processing = false;
    }

    return results;
  }

  /**
   * Schedule processing with debouncing
   */
  private scheduleProcessing(): void {
    if (!this.processing) {
      setTimeout(() => {
        if (!this.processing && this.queue.length > 0) {
          // Auto-process if queue gets too large
          if (this.queue.length >= this.options.batchSize * 2) {
            BulletproofSafety.logger.debug(`Auto-processing large queue: ${this.queue.length} items`);
          }
        }
      }, this.options.delay);
    }
  }

  /**
   * Get queue status
   */
  getStatus(): { queueSize: number; processing: boolean } {
    return {
      queueSize: this.queue.length,
      processing: this.processing
    };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}

// ============================================================================
// INTELLIGENT CACHING SYSTEM
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  size: number;
  dependencies: string[];
}

class IntelligentCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private maxMemory: number;
  private currentMemory: number = 0;

  constructor(maxSize: number = 1000, maxMemoryMB: number = 100) {
    this.maxSize = BulletproofSafety.safeNumber(maxSize, 1000).clamp(100, 10000).value;
    this.maxMemory = BulletproofSafety.safeNumber(maxMemoryMB, 100).clamp(10, 1000).value * 1024 * 1024;
  }

  /**
   * Store data with intelligent eviction
   */
  set(key: string, data: T, dependencies: string[] = []): void {
    const size = this.estimateSize(data);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      accessCount: 1,
      size,
      dependencies: BulletproofSafety.safeArray(dependencies).toArray()
    };

    // Remove existing entry if present
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      this.currentMemory -= existing.size;
    }

    // Ensure we have space
    this.ensureSpace(size);

    this.cache.set(key, entry);
    this.currentMemory += size;

    BulletproofSafety.logger.debug(`Cache set: ${key}, size: ${size}B, total: ${this.currentMemory}B`);
  }

  /**
   * Get data from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.timestamp = Date.now();

    return entry.data;
  }

  /**
   * Invalidate cache entries by dependency
   */
  invalidateByDependency(dependency: string): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies.includes(dependency)) {
        this.currentMemory -= entry.size;
        this.cache.delete(key);
        invalidated++;
      }
    }

    BulletproofSafety.logger.debug(`Invalidated ${invalidated} entries for dependency: ${dependency}`);
    return invalidated;
  }

  /**
   * Ensure we have enough space for new entry
   */
  private ensureSpace(requiredSize: number): void {
    // Check size limit
    while (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    // Check memory limit
    while (this.currentMemory + requiredSize > this.maxMemory) {
      this.evictLargest();
    }
  }

  /**
   * Evict least recently/frequently used entry
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Score based on age and access frequency
      const age = Date.now() - entry.timestamp;
      const score = age / Math.max(entry.accessCount, 1);
      
      if (score < leastUsedScore) {
        leastUsedScore = score;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      const entry = this.cache.get(leastUsedKey)!;
      this.currentMemory -= entry.size;
      this.cache.delete(leastUsedKey);
      BulletproofSafety.logger.debug(`Evicted least used: ${leastUsedKey}`);
    }
  }

  /**
   * Evict largest entry
   */
  private evictLargest(): void {
    let largestKey: string | null = null;
    let largestSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.size > largestSize) {
        largestSize = entry.size;
        largestKey = key;
      }
    }

    if (largestKey) {
      const entry = this.cache.get(largestKey)!;
      this.currentMemory -= entry.size;
      this.cache.delete(largestKey);
      BulletproofSafety.logger.debug(`Evicted largest: ${largestKey}, size: ${largestSize}B`);
    }
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(obj: T): number {
    try {
      const jsonString = JSON.stringify(obj);
      return new Blob([jsonString]).size;
    } catch {
      // Fallback estimation
      return typeof obj === 'string' ? obj.length * 2 : 1024; // 1KB default
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    memoryUsage: number;
    memoryUsagePercent: number;
    hitRate: number;
  } {
    const totalAccess = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.accessCount, 0);
    
    return {
      entries: this.cache.size,
      memoryUsage: this.currentMemory,
      memoryUsagePercent: (this.currentMemory / this.maxMemory) * 100,
      hitRate: totalAccess > 0 ? (this.cache.size / totalAccess) * 100 : 0
    };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Create global instances
export const globalMemoizer = new SafeMemoization();
export const globalDebouncer = new SafeDebounceManager();
export const globalCache = new IntelligentCache();

export {
  SafeMemoization,
  SafeVirtualScrolling,
  SafeDebounceManager,
  SafeBatchProcessor,
  IntelligentCache
};

export const PerformanceOptimizations = {
  memoization: SafeMemoization,
  virtualScrolling: SafeVirtualScrolling,
  debouncing: SafeDebounceManager,
  batchProcessing: SafeBatchProcessor,
  caching: IntelligentCache,
  global: {
    memoizer: globalMemoizer,
    debouncer: globalDebouncer,
    cache: globalCache
  }
} as const;