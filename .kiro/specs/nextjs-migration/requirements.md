# Requirements Document

## Introduction

This feature involves migrating Claudia's existing Vite-based React frontend to Next.js 15 while maintaining compatibility with the Tauri desktop environment. The migration will use Static Site Generation (SSG) to ensure the application can be served via Tauri without requiring a Node.js server at runtime. The goal is to modernize the frontend framework while preserving all existing functionality and maintaining the monorepo structure.

## Requirements

### Requirement 1

**User Story:** As a developer, I want to migrate from Vite to Next.js 15 with modern tooling so that I can leverage Next.js features while maintaining Tauri compatibility.

#### Acceptance Criteria

1. WHEN the application is built THEN Next.js SHALL generate static files using SSG mode
2. WHEN the application runs in development THEN Next.js dev server SHALL be accessible via Tauri at localhost:3000
3. WHEN the application is built for production THEN Tauri SHALL serve the static Next.js output files
4. WHEN the migration is complete THEN all existing Vite configurations SHALL be removed or replaced with Next.js equivalents
5. WHEN using Bun runtime THEN all package management and scripts SHALL work with Bun instead of npm/yarn

### Requirement 2

**User Story:** As a developer, I want all existing React components to work in Next.js so that no functionality is lost during migration.

#### Acceptance Criteria

1. WHEN components are migrated THEN all existing UI components SHALL render correctly in Next.js
2. WHEN routing is implemented THEN navigation between "CC Projects" and "CC Agents" sections SHALL work as before
3. WHEN styling is applied THEN Tailwind CSS and shadcn/ui components SHALL function properly in Next.js
4. WHEN the app loads THEN the welcome screen SHALL detect ~/.claude and show the same two main options as before

### Requirement 3

**User Story:** As a developer, I want the build process to work seamlessly with Tauri so that desktop app generation continues to function.

#### Acceptance Criteria

1. WHEN running `bun run dev` THEN the Next.js development server SHALL start and be accessible via Tauri
2. WHEN running `bun run build` THEN Next.js SHALL produce static files that Tauri can serve
3. WHEN running `bun run tauri dev` THEN the application SHALL load in the Tauri window without errors
4. WHEN running `bun run tauri build` THEN a working desktop application SHALL be created

### Requirement 4

**User Story:** As a developer, I want proper testing coverage so that the migration doesn't introduce regressions.

#### Acceptance Criteria

1. WHEN tests are run THEN all existing tests SHALL continue to pass
2. WHEN new Next.js-specific code is added THEN it SHALL have appropriate unit tests
3. WHEN the application is built THEN linting SHALL pass without errors
4. WHEN components are rendered THEN snapshot tests SHALL verify consistent rendering

### Requirement 5

**User Story:** As a developer, I want clear configuration so that the Next.js setup is maintainable and follows best practices.

#### Acceptance Criteria

1. WHEN Next.js is configured THEN the config SHALL explicitly set `output: 'export'` for static generation
2. WHEN images are used THEN Next.js image optimization SHALL be disabled for SSG compatibility
3. WHEN environment variables are needed THEN they SHALL be properly configured for Next.js
4. WHEN the project structure is updated THEN it SHALL follow Next.js conventions while maintaining existing organization