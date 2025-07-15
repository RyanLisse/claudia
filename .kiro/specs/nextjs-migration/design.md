# Design Document

## Overview

This design outlines the migration of Claudia's frontend from Vite-based React to Next.js 15 while maintaining full compatibility with the Tauri desktop environment. The migration will use Next.js's Static Site Generation (SSG) capabilities to produce static files that can be served by Tauri without requiring a Node.js runtime.

The current application is a single-page React application with client-side routing managed through view state. The migrated version will maintain this architecture while leveraging Next.js's build optimizations and developer experience improvements.

## Architecture

### Current Architecture
- **Build Tool**: Vite with React plugin
- **Routing**: Client-side state-based routing (`view` state)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Development Server**: Vite dev server on port 1420
- **Production Build**: Static files served by Tauri

### Target Architecture
- **Framework**: Next.js 15 with App Router
- **Runtime**: Bun for package management and script execution
- **Build Mode**: Static Site Generation (SSG) with `output: 'export'`
- **Routing**: Next.js App Router with static generation
- **Styling**: Tailwind CSS with shadcn/ui components (unchanged)
- **Development Server**: Next.js dev server on port 3000
- **Production Build**: Static files exported to `out/` directory
- **Testing**: Vitest for unit tests, Playwright for E2E
- **Linting**: Biome.js for formatting and linting

### Key Architectural Decisions

1. **SSG Over SSR**: Using static export mode ensures compatibility with Tauri's file-serving model
2. **App Router**: Leveraging Next.js 15's stable App Router for better developer experience
3. **Preserve Component Structure**: Maintaining existing React components with minimal changes
4. **Client-Side State Management**: Keeping existing state management patterns

## Components and Interfaces

### Next.js Configuration
```typescript
// next.config.mjs
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { 
    unoptimized: true 
  },
  experimental: {
    esmExternals: 'loose'
  }
}
```

### Directory Structure Migration
```
Current (Vite):           Target (Next.js):
src/                      src/
├── App.tsx              ├── app/
├── main.tsx             │   ├── layout.tsx
├── components/          │   ├── page.tsx
├── lib/                 │   ├── projects/
├── types/               │   │   └── page.tsx
└── styles.css           │   └── agents/
                         │       └── page.tsx
                         ├── components/ (unchanged)
                         ├── lib/ (unchanged)
                         ├── types/ (unchanged)
                         └── globals.css
```

### Routing Strategy

The current application uses a view-based routing system with a single `App.tsx` component managing different views. The migration will preserve this pattern while adapting it to Next.js:

1. **Root Layout** (`app/layout.tsx`): Contains the `Topbar` and global providers
2. **Home Page** (`app/page.tsx`): Welcome screen with navigation cards
3. **Projects Page** (`app/projects/page.tsx`): Project and session management
4. **Agents Page** (`app/agents/page.tsx`): CC Agents management

### Component Migration Strategy

1. **Preserve Existing Components**: All components in `src/components/` remain unchanged
2. **Update Import Paths**: Adjust imports to use Next.js conventions
3. **Environment Variables**: Migrate from Vite's `import.meta.env` to Next.js `process.env`
4. **Asset Handling**: Update asset imports to use Next.js static file serving

### Tauri Integration Points

1. **Development Configuration**:
   - Update `tauri.conf.json` to use `http://localhost:3000`
   - Modify `beforeDevCommand` to run `next dev`

2. **Production Configuration**:
   - Update `frontendDist` to point to `../out`
   - Modify `beforeBuildCommand` to run `next build`

3. **Build Process**:
   - Next.js build generates static files in `out/` directory
   - Tauri serves these files directly in production

## Data Models

### Build Configuration Model
```typescript
interface BuildConfig {
  development: {
    devServer: string;
    port: number;
    command: string;
  };
  production: {
    outputDir: string;
    buildCommand: string;
    staticExport: boolean;
  };
}
```

### Migration Checklist Model
```typescript
interface MigrationStep {
  id: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dependencies: string[];
  validation: () => Promise<boolean>;
}
```

## Error Handling

### Build-Time Error Handling
1. **Configuration Validation**: Ensure Next.js config is valid for SSG
2. **Import Resolution**: Handle any import path issues during migration
3. **Asset Path Validation**: Verify all assets are accessible in static export mode

### Runtime Error Handling
1. **Fallback Pages**: Implement 404 and error pages for static export
2. **Client-Side Error Boundaries**: Maintain existing error boundary components
3. **Tauri Integration Errors**: Handle cases where Tauri APIs are unavailable

### Development vs Production Differences
1. **Hot Reload**: Next.js dev server provides better hot reload than Vite
2. **Build Optimization**: Next.js provides better code splitting and optimization
3. **Static Asset Handling**: Different approaches between dev and production modes

## Testing Strategy

### Unit Testing
1. **Component Tests**: Verify all existing components render correctly in Next.js
2. **Configuration Tests**: Validate Next.js configuration produces expected output
3. **Build Process Tests**: Ensure build process generates correct static files

### Integration Testing
1. **Tauri Integration**: Test that Next.js app loads correctly in Tauri window
2. **Navigation Testing**: Verify routing works in both development and production
3. **Asset Loading**: Confirm all assets load correctly in static export mode

### End-to-End Testing
1. **Development Workflow**: Test `bun run dev` → Tauri window loads
2. **Production Build**: Test `bun run build` → `bun run tauri build` → Desktop app works
3. **Feature Parity**: Verify all existing functionality works after migration

### Performance Testing
1. **Bundle Size**: Compare bundle sizes before and after migration
2. **Load Times**: Measure application startup times
3. **Memory Usage**: Monitor memory consumption in Tauri environment

## Migration Phases

### Phase 1: Next.js Setup and Configuration
1. Install Next.js 15 and required dependencies
2. Create Next.js configuration with static export
3. Update Tauri configuration for new dev server
4. Create basic App Router structure

### Phase 2: Component Migration
1. Create root layout with existing Topbar
2. Migrate main App component to page components
3. Update import paths and environment variables
4. Test component rendering in Next.js environment

### Phase 3: Build Process Integration
1. Update package.json scripts
2. Configure static asset handling
3. Test development and production builds
4. Verify Tauri integration works correctly

### Phase 4: Testing and Validation
1. Run existing test suite
2. Add Next.js-specific tests
3. Perform end-to-end testing
4. Validate performance characteristics

## Risk Mitigation

### Technical Risks
1. **SSG Limitations**: Some dynamic features may not work in static export mode
   - Mitigation: Identify and adapt any server-side dependencies
2. **Asset Path Issues**: Static assets may not load correctly
   - Mitigation: Use Next.js recommended asset handling patterns
3. **Tauri Compatibility**: Next.js may introduce compatibility issues
   - Mitigation: Thorough testing in Tauri environment

### Development Risks
1. **Learning Curve**: Team may need time to adapt to Next.js patterns
   - Mitigation: Provide documentation and examples
2. **Build Time Changes**: Build process may be slower or faster
   - Mitigation: Monitor and optimize build performance

### Rollback Strategy
1. **Version Control**: Maintain separate branch for migration work
2. **Feature Flags**: Use environment variables to toggle between old and new builds
3. **Parallel Development**: Keep Vite build working until migration is complete