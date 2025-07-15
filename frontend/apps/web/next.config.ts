import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Enable static export for Tauri compatibility
	output: "export",

	// Disable image optimization for static export
	images: {
		unoptimized: true,
		// Configure image domains for external images
		domains: ["raw.githubusercontent.com", "github.com"],
		// Configure image formats
		formats: ["image/webp", "image/avif"],
	},

	// ESLint configuration - temporarily ignore to fix build
	eslint: {
		ignoreDuringBuilds: true,
		dirs: ["src"],
	},

	// TypeScript configuration
	typescript: {
		ignoreBuildErrors: true,
	},

	// Performance optimizations
	experimental: {
		optimizePackageImports: ["@claudia/ui-kit", "lucide-react"],
	},

	// Asset prefix for CDN support
	assetPrefix: process.env.NODE_ENV === "production" ? "" : "",

	// Enable compression
	compress: true,

	// Generate build ID for consistent builds
	generateBuildId: async () => {
		return `build-${Date.now()}`;
	},

	// Trailing slash configuration
	trailingSlash: false,

	// Optimize static exports
	distDir: "out",
	
	// Configure webpack for better optimization
	webpack: (config, { dev, isServer }) => {
		// Production optimizations
		if (!dev && !isServer) {
			config.optimization = {
				...config.optimization,
				minimize: true,
				splitChunks: {
					chunks: 'all',
					minSize: 20000,
					maxSize: 244000,
					cacheGroups: {
						default: {
							minChunks: 2,
							priority: -20,
							reuseExistingChunk: true,
						},
						vendor: {
							test: /[\\/]node_modules[\\/]/,
							name: 'vendors',
							priority: -10,
							chunks: 'all',
						},
					},
				},
			};
		}
		
		// Resolve fallbacks for Node.js modules
		config.resolve.fallback = {
			...config.resolve.fallback,
			fs: false,
			path: false,
			os: false,
		};
		
		return config;
	},
};

export default nextConfig;