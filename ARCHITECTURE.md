# Claudia AI Development Platform - System Architecture

## 🏗️ Worktrees Development Strategy

### Git Worktrees Setup
```
claudia/                          # Main repository (branch: main)
├── worktrees/
│   ├── slice01/                  # Foundation & TDD Setup (branch: slice01-dev)
│   ├── slice02/                  # Real-time Sync (branch: tdd-slice02)
│   ├── slice03/                  # AI Agent System (branch: feature-slice03)
│   ├── slice04/                  # Component Library (branch: testing-slice04)
│   └── slice05/                  # E2E Testing (branch: integration-slice05)
└── claudia-worktrees/            # External worktrees (outside security boundary)
    ├── slice02/                  # (branch: slice02-dev)
    ├── slice03/                  # (branch: slice03-dev)
    ├── slice04/                  # (branch: slice04-dev)
    └── slice05/                  # (branch: slice05-dev)
```

### Branch Strategy
- **main**: Production-ready code, protected branch
- **slice##-dev**: Development branches for each vertical slice
- **tdd-slice##**: TDD-focused development branches
- **feature-slice##**: Feature-specific development branches
- **testing-slice##**: Testing-focused branches
- **integration-slice##**: Integration work branches

## 📁 Optimal Folder Structure

```
claudia/
├── .git/                         # Git repository
├── .swarm/                       # Swarm coordination data
│   ├── memory.db                # Agent memory & coordination
│   └── metrics/                 # Performance & analytics
├── .github/                      # GitHub Actions workflows
│   ├── workflows/
│   │   ├── ci.yml              # Continuous integration
│   │   ├── test.yml            # Test automation
│   │   └── deploy.yml          # Deployment pipeline
├── .claude/                      # Claude Code configuration
│   ├── settings.json           # Claude settings
│   └── commands/               # Custom slash commands
├── apps/                         # Application layer
│   ├── web/                     # Next.js frontend application
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # Page-specific components
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── stores/         # Zustand state management
│   │   │   └── utils/          # Frontend utilities
│   │   ├── tests/              # Frontend tests
│   │   ├── .storybook/         # Storybook configuration
│   │   └── package.json
│   ├── desktop/                 # Tauri desktop application
│   │   ├── src-tauri/          # Rust backend
│   │   ├── src/                # Frontend (shares web code)
│   │   └── package.json
│   └── api/                     # Hono API server
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   ├── middleware/     # API middleware
│       │   ├── services/       # Business logic
│       │   └── types/          # API types
│       ├── tests/              # API tests
│       └── package.json
├── packages/                     # Shared packages
│   ├── ui/                      # UI component library
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── hooks/          # Shared hooks
│   │   │   ├── styles/         # Design tokens & themes
│   │   │   └── utils/          # UI utilities
│   │   ├── tests/              # Component tests
│   │   ├── .storybook/         # Component docs
│   │   └── package.json
│   ├── db/                      # Database layer
│   │   ├── src/
│   │   │   ├── schema/         # Drizzle schemas
│   │   │   ├── migrations/     # Database migrations
│   │   │   ├── repositories/   # Data access layer
│   │   │   └── electric/       # ElectricSQL sync
│   │   ├── tests/              # Database tests
│   │   └── package.json
│   ├── auth/                    # Authentication package
│   │   ├── src/
│   │   │   ├── providers/      # Auth providers
│   │   │   ├── middleware/     # Auth middleware
│   │   │   └── utils/          # Auth utilities
│   │   └── package.json
│   ├── ai-agents/               # AI agent system
│   │   ├── src/
│   │   │   ├── agents/         # Agent implementations
│   │   │   ├── orchestration/  # Agent coordination
│   │   │   ├── communication/  # Inter-agent messaging
│   │   │   └── monitoring/     # Agent performance
│   │   ├── tests/              # Agent tests
│   │   └── package.json
│   └── shared/                  # Shared utilities
│       ├── src/
│       │   ├── types/          # Shared TypeScript types
│       │   ├── utils/          # Common utilities
│       │   ├── constants/      # Application constants
│       │   └── schemas/        # Zod validation schemas
│       ├── tests/              # Shared tests
│       └── package.json
├── tests/                        # Project-wide tests
│   ├── e2e/                     # End-to-end tests
│   │   ├── specs/              # Test specifications
│   │   ├── fixtures/           # Test fixtures
│   │   └── utils/              # Test utilities
│   ├── integration/             # Integration tests
│   ├── performance/             # Performance tests
│   └── setup/                   # Test setup & configuration
├── docs/                         # Documentation
│   ├── api/                     # API documentation
│   ├── architecture/            # Architecture docs
│   ├── deployment/              # Deployment guides
│   └── development/             # Development guides
├── scripts/                      # Build & deployment scripts
│   ├── build/                   # Build scripts
│   ├── deploy/                  # Deployment scripts
│   └── dev/                     # Development scripts
├── config/                       # Configuration files
│   ├── biome.json              # Code formatting
│   ├── turbo.json              # Monorepo configuration
│   ├── tsconfig.json           # TypeScript base config
│   └── vitest.config.ts        # Test configuration
├── worktrees/                    # Local worktrees for parallel development
├── coordination/                 # Agent coordination (legacy)
├── cc_agents/                   # Claude Code agents
└── package.json                 # Root package.json
```

## 🧠 Component Library Architecture

### Design System Foundation
```typescript
// packages/ui/src/design-tokens/
├── colors.ts                    # Color palette
├── typography.ts               # Font scales & families
├── spacing.ts                  # Spacing scale
├── shadows.ts                  # Shadow definitions
├── borders.ts                  # Border radius & widths
└── breakpoints.ts              # Responsive breakpoints
```

### Component Organization
```typescript
// packages/ui/src/components/
├── primitives/                  # Base components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Input/
│   ├── Card/
│   └── Modal/
├── composite/                   # Composite components
│   ├── DataTable/
│   ├── Navigation/
│   ├── Forms/
│   └── Chat/
├── layout/                      # Layout components
│   ├── Container/
│   ├── Grid/
│   ├── Stack/
│   └── Sidebar/
└── feedback/                    # Feedback components
    ├── Toast/
    ├── Loading/
    ├── ErrorBoundary/
    └── ProgressBar/
```

### Component Design Patterns
1. **Compound Components**: For complex UI patterns
2. **Render Props**: For flexible composition
3. **Polymorphic Components**: For element flexibility
4. **Controlled/Uncontrolled**: Support both patterns
5. **Accessibility First**: WCAG 2.1 AA compliance

## 🔄 TDD Workflow Architecture

### Testing Strategy
```
Testing Pyramid:
┌─────────────────────────────┐ ← E2E Tests (Playwright + Stagehand)
│         Integration         │ ← API + DB + UI Integration (Vitest)
│        Unit Tests           │ ← Component + Logic Tests (Vitest)
└─────────────────────────────┘ ← Static Analysis (TypeScript + Biome)
```

### Test Organization
```
tests/
├── unit/                       # Unit tests (fast, isolated)
│   ├── components/            # React component tests
│   ├── hooks/                 # Custom hook tests
│   ├── utils/                 # Utility function tests
│   └── services/              # Service layer tests
├── integration/               # Integration tests (slower, realistic)
│   ├── api/                   # API endpoint tests
│   ├── database/              # Database operation tests
│   ├── auth/                  # Authentication flow tests
│   └── realtime/              # Real-time sync tests
├── e2e/                       # End-to-end tests (slowest, complete)
│   ├── user-journeys/         # Critical user paths
│   ├── ai-workflows/          # AI agent workflows
│   ├── performance/           # Performance benchmarks
│   └── accessibility/         # A11y compliance tests
└── fixtures/                  # Shared test data
    ├── users.ts              # User test data
    ├── agents.ts             # Agent test data
    └── sessions.ts           # Session test data
```

### Development Branch Strategy

#### Slice-Based Development
Each slice operates independently with its own branch and can be developed in parallel:

**Slice 01: Foundation & TDD Setup** (branch: slice01-dev)
- Project setup with Bun runtime
- Vitest configuration
- Basic API endpoints
- Database connection
- CI/CD pipeline

**Slice 02: Real-time Sync** (branch: tdd-slice02)
- ElectricSQL integration
- TanStack Query setup
- Optimistic updates
- Conflict resolution
- Sync monitoring

**Slice 03: AI Agent System** (branch: feature-slice03)
- Agent base classes
- Inngest background jobs
- Agent communication
- Task orchestration
- Performance monitoring

**Slice 04: Component Library** (branch: testing-slice04)
- UI component creation
- Storybook documentation
- Design token system
- Accessibility testing
- Visual regression tests

**Slice 05: E2E Testing** (branch: integration-slice05)
- Playwright configuration
- Stagehand AI testing
- Critical user journeys
- Performance testing
- CI/CD integration

## 🔧 Development Environment Setup

### Prerequisites
```bash
# Required tools
bun >= 1.0.0                   # JavaScript runtime
node >= 18.0.0                 # Node.js (fallback)
git >= 2.40.0                  # Version control
docker >= 20.0.0               # Containerization
```

### Quick Start
```bash
# Clone and setup
git clone <repository>
cd claudia
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
bun run db:migrate
bun run db:seed

# Start development
bun run dev

# Run tests
bun run test
bun run test:e2e
```

### Worktree Workflow
```bash
# Switch to different slices for parallel development
git worktree list

# Work on slice 1 (Foundation)
cd worktrees/slice01
bun run dev

# Work on slice 2 (Real-time) in another terminal
cd worktrees/slice02
bun run dev:api

# Work on slice 3 (AI Agents) in another terminal
cd worktrees/slice03
bun run dev:agents
```

## 📊 Performance Architecture

### Core Web Vitals Targets
- **LCP**: < 2.5 seconds
- **FID**: < 100 milliseconds
- **CLS**: < 0.1
- **TTFB**: < 800 milliseconds

### Optimization Strategies
1. **Code Splitting**: Route-based and component-based
2. **Tree Shaking**: Remove unused code
3. **Bundle Analysis**: Monitor bundle size
4. **Image Optimization**: Next.js Image component
5. **Caching**: Service workers + CDN
6. **Database**: Connection pooling + query optimization

## 🔒 Security Architecture

### Security Layers
1. **Input Validation**: Zod schemas at API boundaries
2. **Authentication**: JWT with refresh tokens
3. **Authorization**: Role-based access control
4. **Rate Limiting**: API endpoint protection
5. **CORS**: Cross-origin request security
6. **CSP**: Content Security Policy headers

### Security Monitoring
- Dependency vulnerability scanning
- Regular security audits
- Error tracking with Sentry
- Access logging and monitoring

This architecture supports the TDD workflow with clear separation of concerns, parallel development capabilities, and comprehensive testing strategies.