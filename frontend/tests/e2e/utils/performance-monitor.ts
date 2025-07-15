import { Page } from "@playwright/test";

export interface PerformanceMetrics {
	// Core Web Vitals
	firstContentfulPaint: number;
	largestContentfulPaint: number;
	cumulativeLayoutShift: number;
	firstInputDelay: number;
	totalBlockingTime: number;
	
	// Additional metrics
	domContentLoaded: number;
	loadComplete: number;
	timeToInteractive: number;
	speedIndex: number;
	
	// Navigation timing
	navigationStart: number;
	domainLookupStart: number;
	domainLookupEnd: number;
	connectStart: number;
	connectEnd: number;
	requestStart: number;
	responseStart: number;
	responseEnd: number;
	domLoading: number;
	domInteractive: number;
	domComplete: number;
	loadEventStart: number;
	loadEventEnd: number;
	
	// Resource metrics
	resourceCount: number;
	resourceSize: number;
	imageCount: number;
	scriptCount: number;
	stylesheetCount: number;
	
	// Memory metrics
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
	
	// Custom metrics
	customMetrics: Record<string, number>;
}

export interface PerformanceThresholds {
	firstContentfulPaint: number;
	largestContentfulPaint: number;
	cumulativeLayoutShift: number;
	firstInputDelay: number;
	totalBlockingTime: number;
	timeToInteractive: number;
	speedIndex: number;
	loadComplete: number;
}

export class PerformanceMonitor {
	private page: Page;
	private metrics: PerformanceMetrics[] = [];
	private thresholds: PerformanceThresholds;
	private isMonitoring = false;
	
	constructor(page: Page, thresholds?: Partial<PerformanceThresholds>) {
		this.page = page;
		this.thresholds = {
			firstContentfulPaint: 1500,
			largestContentfulPaint: 2500,
			cumulativeLayoutShift: 0.1,
			firstInputDelay: 100,
			totalBlockingTime: 200,
			timeToInteractive: 3000,
			speedIndex: 2000,
			loadComplete: 3000,
			...thresholds,
		};
	}
	
	async startMonitoring(): Promise<void> {
		if (this.isMonitoring) return;
		
		this.isMonitoring = true;
		
		// Inject performance monitoring script
		await this.page.addInitScript(() => {
			// Store performance marks and measures
			(window as any).performanceMarks = [];
			(window as any).performanceMeasures = [];
			
			// Monitor Core Web Vitals
			if ('web-vitals' in window) {
				const { getCLS, getFCP, getFID, getLCP, getTTFB } = (window as any)['web-vitals'];
				
				getCLS((metric: any) => {
					(window as any).cls = metric.value;
				});
				
				getFCP((metric: any) => {
					(window as any).fcp = metric.value;
				});
				
				getFID((metric: any) => {
					(window as any).fid = metric.value;
				});
				
				getLCP((metric: any) => {
					(window as any).lcp = metric.value;
				});
				
				getTTFB((metric: any) => {
					(window as any).ttfb = metric.value;
				});
			}
			
			// Monitor layout shifts
			if ('LayoutShift' in window) {
				let clsValue = 0;
				new PerformanceObserver((entryList) => {
					for (const entry of entryList.getEntries()) {
						if (!(entry as any).hadRecentInput) {
							clsValue += (entry as any).value;
						}
					}
					(window as any).clsValue = clsValue;
				}).observe({ type: 'layout-shift', buffered: true });
			}
			
			// Monitor long tasks
			if ('PerformanceObserver' in window) {
				let totalBlockingTime = 0;
				new PerformanceObserver((entryList) => {
					for (const entry of entryList.getEntries()) {
						const duration = entry.duration;
						if (duration > 50) {
							totalBlockingTime += duration - 50;
						}
					}
					(window as any).totalBlockingTime = totalBlockingTime;
				}).observe({ type: 'longtask', buffered: true });
			}
			
			// Monitor first input delay
			if ('PerformanceObserver' in window) {
				new PerformanceObserver((entryList) => {
					for (const entry of entryList.getEntries()) {
						(window as any).firstInputDelay = (entry as any).processingStart - entry.startTime;
					}
				}).observe({ type: 'first-input', buffered: true });
			}
			
			// Monitor resource loading
			if ('PerformanceObserver' in window) {
				const resources: any[] = [];
				new PerformanceObserver((entryList) => {
					for (const entry of entryList.getEntries()) {
						resources.push({
							name: entry.name,
							type: (entry as any).initiatorType,
							size: (entry as any).transferSize,
							duration: entry.duration,
							startTime: entry.startTime,
						});
					}
					(window as any).resourceMetrics = resources;
				}).observe({ type: 'resource', buffered: true });
			}
			
			// Custom performance marking
			(window as any).markPerformance = (name: string) => {
				performance.mark(name);
				(window as any).performanceMarks.push({
					name,
					timestamp: performance.now(),
				});
			};
			
			(window as any).measurePerformance = (name: string, startMark: string, endMark?: string) => {
				const measure = performance.measure(name, startMark, endMark);
				(window as any).performanceMeasures.push({
					name,
					duration: measure.duration,
					startTime: measure.startTime,
				});
				return measure.duration;
			};
		});
		
		// Add web-vitals library for Core Web Vitals measurement
		await this.page.addScriptTag({
			url: 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js',
		});
	}
	
	async stopMonitoring(): Promise<void> {
		this.isMonitoring = false;
	}
	
	async captureMetrics(): Promise<PerformanceMetrics> {
		if (!this.isMonitoring) {
			throw new Error('Performance monitoring is not active');
		}
		
		const metrics = await this.page.evaluate(() => {
			const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
			const resources = performance.getEntriesByType('resource');
			const memory = (performance as any).memory;
			
			// Calculate resource metrics
			const resourceMetrics = resources.reduce(
				(acc, resource) => {
					const resourceTiming = resource as PerformanceResourceTiming;
					acc.count++;
					acc.size += resourceTiming.transferSize || 0;
					
					if (resourceTiming.initiatorType === 'img') acc.imageCount++;
					if (resourceTiming.initiatorType === 'script') acc.scriptCount++;
					if (resourceTiming.initiatorType === 'css') acc.stylesheetCount++;
					
					return acc;
				},
				{ count: 0, size: 0, imageCount: 0, scriptCount: 0, stylesheetCount: 0 }
			);
			
			// Calculate Time to Interactive (TTI)
			const tti = (window as any).timeToInteractive || navigation.loadEventEnd - navigation.navigationStart;
			
			// Calculate Speed Index (simplified)
			const speedIndex = (window as any).speedIndex || navigation.domContentLoadedEventEnd - navigation.navigationStart;
			
			return {
				// Core Web Vitals
				firstContentfulPaint: (window as any).fcp || 0,
				largestContentfulPaint: (window as any).lcp || 0,
				cumulativeLayoutShift: (window as any).clsValue || 0,
				firstInputDelay: (window as any).firstInputDelay || 0,
				totalBlockingTime: (window as any).totalBlockingTime || 0,
				
				// Additional metrics
				domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
				loadComplete: navigation.loadEventEnd - navigation.navigationStart,
				timeToInteractive: tti,
				speedIndex: speedIndex,
				
				// Navigation timing
				navigationStart: navigation.navigationStart,
				domainLookupStart: navigation.domainLookupStart,
				domainLookupEnd: navigation.domainLookupEnd,
				connectStart: navigation.connectStart,
				connectEnd: navigation.connectEnd,
				requestStart: navigation.requestStart,
				responseStart: navigation.responseStart,
				responseEnd: navigation.responseEnd,
				domLoading: navigation.domLoading,
				domInteractive: navigation.domInteractive,
				domComplete: navigation.domComplete,
				loadEventStart: navigation.loadEventStart,
				loadEventEnd: navigation.loadEventEnd,
				
				// Resource metrics
				resourceCount: resourceMetrics.count,
				resourceSize: resourceMetrics.size,
				imageCount: resourceMetrics.imageCount,
				scriptCount: resourceMetrics.scriptCount,
				stylesheetCount: resourceMetrics.stylesheetCount,
				
				// Memory metrics
				usedJSHeapSize: memory?.usedJSHeapSize || 0,
				totalJSHeapSize: memory?.totalJSHeapSize || 0,
				jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
				
				// Custom metrics
				customMetrics: (window as any).customMetrics || {},
			};
		});
		
		this.metrics.push(metrics);
		return metrics;
	}
	
	async markPerformance(name: string): Promise<void> {
		await this.page.evaluate((markName) => {
			(window as any).markPerformance(markName);
		}, name);
	}
	
	async measurePerformance(name: string, startMark: string, endMark?: string): Promise<number> {
		return await this.page.evaluate(
			({ measureName, start, end }) => {
				return (window as any).measurePerformance(measureName, start, end);
			},
			{ measureName: name, start: startMark, end: endMark }
		);
	}
	
	async waitForLCP(timeout = 10000): Promise<number> {
		return await this.page.waitForFunction(
			() => (window as any).lcp !== undefined,
			{},
			{ timeout }
		).then(async () => {
			return await this.page.evaluate(() => (window as any).lcp);
		});
	}
	
	async waitForFCP(timeout = 10000): Promise<number> {
		return await this.page.waitForFunction(
			() => (window as any).fcp !== undefined,
			{},
			{ timeout }
		).then(async () => {
			return await this.page.evaluate(() => (window as any).fcp);
		});
	}
	
	async waitForCLS(timeout = 10000): Promise<number> {
		// Wait for a stable CLS value
		await this.page.waitForTimeout(2000);
		return await this.page.evaluate(() => (window as any).clsValue || 0);
	}
	
	async waitForTTI(timeout = 10000): Promise<number> {
		return await this.page.waitForLoadState('networkidle', { timeout })
			.then(() => this.page.evaluate(() => performance.now()));
	}
	
	validateMetrics(metrics: PerformanceMetrics): { passed: boolean; failures: string[] } {
		const failures: string[] = [];
		
		if (metrics.firstContentfulPaint > this.thresholds.firstContentfulPaint) {
			failures.push(`FCP: ${metrics.firstContentfulPaint}ms > ${this.thresholds.firstContentfulPaint}ms`);
		}
		
		if (metrics.largestContentfulPaint > this.thresholds.largestContentfulPaint) {
			failures.push(`LCP: ${metrics.largestContentfulPaint}ms > ${this.thresholds.largestContentfulPaint}ms`);
		}
		
		if (metrics.cumulativeLayoutShift > this.thresholds.cumulativeLayoutShift) {
			failures.push(`CLS: ${metrics.cumulativeLayoutShift} > ${this.thresholds.cumulativeLayoutShift}`);
		}
		
		if (metrics.firstInputDelay > this.thresholds.firstInputDelay) {
			failures.push(`FID: ${metrics.firstInputDelay}ms > ${this.thresholds.firstInputDelay}ms`);
		}
		
		if (metrics.totalBlockingTime > this.thresholds.totalBlockingTime) {
			failures.push(`TBT: ${metrics.totalBlockingTime}ms > ${this.thresholds.totalBlockingTime}ms`);
		}
		
		if (metrics.timeToInteractive > this.thresholds.timeToInteractive) {
			failures.push(`TTI: ${metrics.timeToInteractive}ms > ${this.thresholds.timeToInteractive}ms`);
		}
		
		if (metrics.speedIndex > this.thresholds.speedIndex) {
			failures.push(`Speed Index: ${metrics.speedIndex}ms > ${this.thresholds.speedIndex}ms`);
		}
		
		if (metrics.loadComplete > this.thresholds.loadComplete) {
			failures.push(`Load Complete: ${metrics.loadComplete}ms > ${this.thresholds.loadComplete}ms`);
		}
		
		return {
			passed: failures.length === 0,
			failures,
		};
	}
	
	getMetricsHistory(): PerformanceMetrics[] {
		return [...this.metrics];
	}
	
	getAverageMetrics(): PerformanceMetrics | null {
		if (this.metrics.length === 0) return null;
		
		const sum = this.metrics.reduce((acc, metrics) => {
			Object.keys(metrics).forEach((key) => {
				if (key === 'customMetrics') {
					Object.keys(metrics.customMetrics).forEach((customKey) => {
						acc.customMetrics[customKey] = (acc.customMetrics[customKey] || 0) + metrics.customMetrics[customKey];
					});
				} else {
					(acc as any)[key] = ((acc as any)[key] || 0) + (metrics as any)[key];
				}
			});
			return acc;
		}, {
			customMetrics: {} as Record<string, number>,
		} as PerformanceMetrics);
		
		const count = this.metrics.length;
		Object.keys(sum).forEach((key) => {
			if (key === 'customMetrics') {
				Object.keys(sum.customMetrics).forEach((customKey) => {
					sum.customMetrics[customKey] /= count;
				});
			} else {
				(sum as any)[key] /= count;
			}
		});
		
		return sum;
	}
	
	generateReport(): string {
		const avgMetrics = this.getAverageMetrics();
		if (!avgMetrics) return 'No metrics collected';
		
		const validation = this.validateMetrics(avgMetrics);
		
		let report = '# Performance Report\n\n';
		
		report += '## Core Web Vitals\n';
		report += `- **First Contentful Paint (FCP)**: ${avgMetrics.firstContentfulPaint.toFixed(2)}ms\n`;
		report += `- **Largest Contentful Paint (LCP)**: ${avgMetrics.largestContentfulPaint.toFixed(2)}ms\n`;
		report += `- **Cumulative Layout Shift (CLS)**: ${avgMetrics.cumulativeLayoutShift.toFixed(3)}\n`;
		report += `- **First Input Delay (FID)**: ${avgMetrics.firstInputDelay.toFixed(2)}ms\n`;
		report += `- **Total Blocking Time (TBT)**: ${avgMetrics.totalBlockingTime.toFixed(2)}ms\n\n`;
		
		report += '## Additional Metrics\n';
		report += `- **DOM Content Loaded**: ${avgMetrics.domContentLoaded.toFixed(2)}ms\n`;
		report += `- **Load Complete**: ${avgMetrics.loadComplete.toFixed(2)}ms\n`;
		report += `- **Time to Interactive**: ${avgMetrics.timeToInteractive.toFixed(2)}ms\n`;
		report += `- **Speed Index**: ${avgMetrics.speedIndex.toFixed(2)}ms\n\n`;
		
		report += '## Resource Metrics\n';
		report += `- **Total Resources**: ${avgMetrics.resourceCount}\n`;
		report += `- **Resource Size**: ${(avgMetrics.resourceSize / 1024).toFixed(2)}KB\n`;
		report += `- **Images**: ${avgMetrics.imageCount}\n`;
		report += `- **Scripts**: ${avgMetrics.scriptCount}\n`;
		report += `- **Stylesheets**: ${avgMetrics.stylesheetCount}\n\n`;
		
		report += '## Memory Metrics\n';
		report += `- **Used JS Heap**: ${(avgMetrics.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB\n`;
		report += `- **Total JS Heap**: ${(avgMetrics.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB\n`;
		report += `- **JS Heap Limit**: ${(avgMetrics.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB\n\n`;
		
		if (Object.keys(avgMetrics.customMetrics).length > 0) {
			report += '## Custom Metrics\n';
			Object.entries(avgMetrics.customMetrics).forEach(([key, value]) => {
				report += `- **${key}**: ${value.toFixed(2)}ms\n`;
			});
			report += '\n';
		}
		
		report += '## Validation\n';
		if (validation.passed) {
			report += '✅ All performance thresholds passed\n';
		} else {
			report += '❌ Performance threshold failures:\n';
			validation.failures.forEach((failure) => {
				report += `- ${failure}\n`;
			});
		}
		
		report += `\n**Total Measurements**: ${this.metrics.length}\n`;
		
		return report;
	}
	
	async captureNetworkMetrics(): Promise<{
		requestCount: number;
		responseSize: number;
		failedRequests: number;
		slowRequests: number;
		cachedRequests: number;
	}> {
		const networkMetrics = await this.page.evaluate(() => {
			const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
			
			let requestCount = 0;
			let responseSize = 0;
			let failedRequests = 0;
			let slowRequests = 0;
			let cachedRequests = 0;
			
			resources.forEach((resource) => {
				requestCount++;
				responseSize += resource.transferSize || 0;
				
				if (resource.duration > 1000) {
					slowRequests++;
				}
				
				if (resource.transferSize === 0 && resource.decodedBodySize > 0) {
					cachedRequests++;
				}
				
				// Check for failed requests (simplified)
				if (resource.duration === 0 && resource.transferSize === 0) {
					failedRequests++;
				}
			});
			
			return {
				requestCount,
				responseSize,
				failedRequests,
				slowRequests,
				cachedRequests,
			};
		});
		
		return networkMetrics;
	}
	
	async captureUserTimingMetrics(): Promise<{
		marks: Array<{ name: string; timestamp: number }>;
		measures: Array<{ name: string; duration: number; startTime: number }>;
	}> {
		return await this.page.evaluate(() => {
			const marks = performance.getEntriesByType('mark').map((mark) => ({
				name: mark.name,
				timestamp: mark.startTime,
			}));
			
			const measures = performance.getEntriesByType('measure').map((measure) => ({
				name: measure.name,
				duration: measure.duration,
				startTime: measure.startTime,
			}));
			
			return { marks, measures };
		});
	}
	
	async addCustomMetric(name: string, value: number): Promise<void> {
		await this.page.evaluate(
			({ metricName, metricValue }) => {
				(window as any).customMetrics = (window as any).customMetrics || {};
				(window as any).customMetrics[metricName] = metricValue;
			},
			{ metricName: name, metricValue: value }
		);
	}
	
	async waitForStablePerformance(timeout = 5000): Promise<void> {
		await this.page.waitForLoadState('networkidle', { timeout });
		await this.page.waitForTimeout(1000); // Additional stability wait
	}
	
	clearMetrics(): void {
		this.metrics = [];
	}
	
	updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
		this.thresholds = { ...this.thresholds, ...newThresholds };
	}
}