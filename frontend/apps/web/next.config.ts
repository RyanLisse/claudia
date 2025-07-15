import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Tauri compatibility
  output: 'export',
  
  // Disable image optimization for static export
  images: {
    unoptimized: true
  },
  
  // Add trailing slash for better static file serving
  trailingSlash: true,
};

export default nextConfig;
