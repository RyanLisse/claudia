# Implementation Plan

## Slice 1: Core Next.js Migration and Static Export Setup

- [x] 1. Install Next.js 15 and configure static export with modern tooling
  - Install Next.js 15, react, react-dom, and @types/node dependencies using Bun
  - Remove Vite-specific dependencies and configurations
  - Create next.config.mjs with output: 'export' and images.unoptimized: true
  - Set up Biome.js for linting and formatting (replace ESLint/Prettier)
  - Configure Vitest for testing (replace Jest if present)
  - _Requirements: 1.1, 1.3, 1.5, 5.1, 5.2_

- [x] 2. Update Tauri configuration for Next.js integration
  - Modify src-tauri/tauri.conf.json to use http://localhost:3001 for devUrl
  - Set frontendDist to "../frontend/apps/web/out" for production builds
  - Update beforeDevCommand to "cd frontend && bun run dev:web" and beforeBuildCommand to "cd frontend && bun run build"
  - _Requirements: 1.2, 1.3, 3.1, 3.2_

- [x] 3. Create Next.js App Router structure
  - Create app/layout.tsx with root HTML structure and global providers
  - Create app/page.tsx for the welcome screen
  - Create app/globals.css and migrate existing styles
  - Set up basic routing structure for projects and agents pages
  - _Requirements: 2.2, 2.4, 5.4_

- [x] 4. Update package.json scripts and build process
  - Update dev script to run "next dev"
  - Update build script to run "next build"
  - Ensure tauri dev and tauri build commands work with new setup
  - Test that bun commands work correctly with Next.js
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

## Slice 2: Component Migration and UI Parity

- [x] 5. Migrate Topbar component and global providers to Next.js layout
  - Copy Topbar component from src/components/Topbar.tsx to frontend/apps/web/src/components/
  - Update app/layout.tsx to include Topbar and global providers (OutputCacheProvider, etc.)
  - Update import paths to work with Next.js structure
  - Replace Vite environment variables with Next.js equivalents
  - _Requirements: 2.1, 2.2, 5.3_

- [x] 6. Migrate core UI components from Vite app
  - Copy essential components from src/components/ to frontend/apps/web/src/components/
  - Focus on: ProjectList, SessionList, RunningClaudeSessions, Settings, CCAgents, ClaudeCodeSession
  - Update import paths and fix any Vite-specific code (import.meta.env, asset imports)
  - Ensure shadcn/ui components render correctly in Next.js
  - _Requirements: 2.1, 2.3_

- [x] 7. Migrate API and utility libraries
  - Copy src/lib/api.ts to frontend/apps/web/src/lib/ and update for Next.js
  - Copy other essential utilities from src/lib/ (outputCache, utils, etc.)
  - Update src/types/ and ensure TypeScript types are compatible
  - Replace Vite-specific asset handling with Next.js conventions
  - _Requirements: 2.1, 2.3_

- [x] 8. Implement functional CC Projects page
  - Update app/projects/page.tsx to include full project management functionality
  - Integrate ProjectList, SessionList, and RunningClaudeSessions components
  - Implement project selection, session browsing, and new session creation
  - Ensure all existing project management features work correctly
  - _Requirements: 2.2, 5.4_

- [ ] 9. Implement functional CC Agents page
  - Update app/agents/page.tsx to include full agent management functionality
  - Integrate CCAgents component and related agent management features
  - Ensure agent creation, editing, and execution features work correctly
  - Test agent workflow integration with Next.js routing
  - _Requirements: 2.2, 5.4_

## Slice 3: Asset Handling and Static Export Optimization

- [ ] 9. Configure static asset handling
  - Move public assets to Next.js public directory structure
  - Update asset import paths to use Next.js conventions
  - Ensure all images, icons, and static files load in static export mode
  - Test asset loading in both development and production
  - _Requirements: 2.3, 3.2_

- [ ] 10. Implement proper error handling and fallbacks
  - Create app/not-found.tsx for 404 handling in static export
  - Create app/error.tsx for error boundary handling
  - Ensure error states work correctly in Tauri environment
  - Test error handling in both development and production modes
  - _Requirements: 2.1, 3.3_

## Slice 4: Testing and Validation

- [ ] 11. Create Next.js-specific unit tests
  - Write tests for page components (layout, home, projects, agents)
  - Test Next.js configuration generates correct static output
  - Create snapshot tests for key components in Next.js environment
  - Ensure all existing tests continue to pass
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 12. Implement integration tests for Tauri compatibility
  - Test that Next.js dev server loads correctly in Tauri window
  - Verify static build files work when served by Tauri
  - Test navigation and routing in Tauri desktop environment
  - Validate that all Tauri APIs continue to work with Next.js
  - _Requirements: 3.3, 3.4, 4.1_

- [ ] 13. Add build process validation
  - Create tests to verify Next.js build produces expected static files
  - Test that all required assets are included in build output
  - Validate that build process works with existing CI/CD if applicable
  - Ensure linting passes with Next.js code structure
  - _Requirements: 3.2, 4.3_

## Slice 5: Performance Optimization and Final Validation

- [ ] 14. Optimize Next.js build for Tauri environment
  - Configure code splitting for optimal loading in desktop app
  - Optimize bundle size and remove unnecessary dependencies
  - Ensure fast startup times in Tauri environment
  - Test memory usage and performance characteristics
  - _Requirements: 1.1, 3.2_

- [ ] 15. Final end-to-end testing and cleanup
  - Test complete development workflow: bun run dev → Tauri loads
  - Test complete production workflow: bun run build → bun run tauri build
  - Verify all existing functionality works identically to Vite version
  - Remove any remaining Vite configurations and dependencies
  - _Requirements: 1.4, 3.3, 3.4, 4.1_

## Future Slices (Post-Migration)

### Slice 6: Project & Session Management Enhancement
- [ ] 16. Implement project browser with Next.js optimizations
  - Create optimized project listing with static generation where possible
  - Implement session management UI with improved performance
  - Add real-time chat interface using Next.js patterns
  - _Future enhancement based on PRD Slice 2_

### Slice 7: Custom AI Agent Management
- [ ] 17. Build agent management interface
  - Create agent CRUD interface with Next.js form handling
  - Implement agent execution tracking with optimized state management
  - Add agent output streaming with Next.js event handling patterns
  - _Future enhancement based on PRD Slice 3_