// Frontend Performance Configuration
// Used by bundlers and performance monitoring tools

export const performanceConfig = {
	// Bundle size limits (bytes)
	bundleSizeThresholds: {
		// Main application bundle
		main: 500 * 1024, // 500KB
		// Vendor dependencies
		vendor: 800 * 1024, // 800KB
		// Individual route chunks
		chunk: 200 * 1024, // 200KB
	},

	// Core Web Vitals targets
	coreWebVitals: {
		// Largest Contentful Paint (ms)
		lcp: 2500,
		// First Input Delay (ms)
		fid: 100,
		// Cumulative Layout Shift
		cls: 0.1,
		// First Contentful Paint (ms)
		fcp: 1800,
		// Time to Interactive (ms)
		tti: 3800,
	},

	// Lighthouse performance budget
	lighthouseThresholds: {
		performance: 90,
		accessibility: 100,
		bestPractices: 95,
		seo: 95,
		pwa: 80,
	},

	// Build performance targets
	buildPerformance: {
		// Maximum build time (ms)
		maxBuildTime: 120000, // 2 minutes
		// TypeScript check time (ms)
		maxTypeCheckTime: 30000, // 30 seconds
		// Test suite time (ms)
		maxTestTime: 60000, // 1 minute
	},

	// Runtime performance monitoring
	monitoring: {
		// Enable performance monitoring
		enabled: true,
		// Sample rate (0-1)
		sampleRate: 0.1,
		// Report threshold (ms)
		slowThreshold: 3000,
	},

	// Memory usage limits
	memoryLimits: {
		// Node.js heap size (MB)
		nodeHeap: 2048,
		// Browser memory warning (MB)
		browserWarning: 100,
		// Browser memory critical (MB)
		browserCritical: 200,
	},

	// Network performance
	network: {
		// Resource size warnings (bytes)
		imageWarning: 500 * 1024, // 500KB
		fontWarning: 100 * 1024, // 100KB
		// Critical resource timeout (ms)
		criticalTimeout: 3000,
	},
};

export default performanceConfig;
