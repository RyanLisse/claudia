/**
 * Performance optimization utilities for Claudia
 * Provides tools for measuring and improving app performance
 */

export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  entries?: PerformanceEntry[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observer: PerformanceObserver | null = null;

  constructor() {
    this.initializeObserver();
  }

  private initializeObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordEntry(entry);
        }
      });

      try {
        this.observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  private recordEntry(entry: PerformanceEntry) {
    const existing = this.metrics.get(entry.name);
    if (existing) {
      existing.entries = existing.entries || [];
      existing.entries.push(entry);
    } else {
      this.metrics.set(entry.name, {
        name: entry.name,
        startTime: entry.startTime,
        endTime: entry.startTime + entry.duration,
        duration: entry.duration,
        entries: [entry],
      });
    }
  }

  /**
   * Start measuring performance for a specific operation
   */
  startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = performance.now();
      this.metrics.set(name, {
        name,
        startTime,
      });
      
      // Create performance mark for better DevTools integration
      if (window.performance.mark) {
        window.performance.mark(`${name}-start`);
      }
    }
  }

  /**
   * End measuring performance for a specific operation
   */
  endMeasure(name: string): number | null {
    if (typeof window === 'undefined' || !window.performance) {
      return null;
    }

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance measure "${name}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Create performance measure for better DevTools integration
    if (window.performance.measure && window.performance.mark) {
      try {
        window.performance.mark(`${name}-end`);
        window.performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (error) {
        console.warn('Failed to create performance measure:', error);
      }
    }

    return duration;
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get specific metric by name
   */
  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
    if (typeof window !== 'undefined' && window.performance.clearMarks) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  }

  /**
   * Get Web Vitals metrics
   */
  getWebVitals(): Promise<any> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve({});
        return;
      }

      const vitals: any = {};

      // Collect Core Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.lcp = entry.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            vitals.fid = entry.processingStart - entry.startTime;
          }
        }).observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          vitals.cls = clsValue;
        }).observe({ type: 'layout-shift', buffered: true });
      }

      // Resolve after a short delay to allow metrics to be collected
      setTimeout(() => resolve(vitals), 100);
    });
  }

  /**
   * Report performance metrics to analytics
   */
  reportMetrics(): void {
    if (typeof window === 'undefined') return;

    const metrics = this.getMetrics();
    
    // Report to Google Analytics if available
    if (window.gtag) {
      metrics.forEach(metric => {
        if (metric.duration) {
          window.gtag('event', 'timing_complete', {
            name: metric.name,
            value: Math.round(metric.duration),
          });
        }
      });
    }

    // Report to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('Performance Metrics');
      metrics.forEach(metric => {
        if (metric.duration) {
          console.log(`${metric.name}: ${metric.duration.toFixed(2)}ms`);
        }
      });
      console.groupEnd();
    }
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Higher-order function to measure component render performance
 */
export function withPerformanceMonitoring<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  name?: string
): React.ComponentType<T> {
  const componentName = name || Component.displayName || Component.name || 'Component';
  
  return function PerformanceMonitoredComponent(props: T) {
    React.useEffect(() => {
      performanceMonitor.startMeasure(`${componentName}-render`);
      return () => {
        performanceMonitor.endMeasure(`${componentName}-render`);
      };
    }, []);

    return React.createElement(Component, props);
  };
}

/**
 * Hook to measure custom performance metrics
 */
export function usePerformanceMetric(name: string, dependencies: any[] = []) {
  React.useEffect(() => {
    performanceMonitor.startMeasure(name);
    return () => {
      performanceMonitor.endMeasure(name);
    };
  }, dependencies);
}

/**
 * Utility to measure async operations
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  performanceMonitor.startMeasure(name);
  try {
    const result = await operation();
    return result;
  } finally {
    performanceMonitor.endMeasure(name);
  }
}

/**
 * Utility to measure sync operations
 */
export function measureSync<T>(
  name: string,
  operation: () => T
): T {
  performanceMonitor.startMeasure(name);
  try {
    const result = operation();
    return result;
  } finally {
    performanceMonitor.endMeasure(name);
  }
}

// Re-export React for convenience
import React from 'react';