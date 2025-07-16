# AGENTS.md - Claude Flow Agent Configuration

## 🎯 Project Overview
Full-stack TypeScript application with Tauri desktop client, React frontend, and AI agent system.

## 📋 Essential Commands

### Setup & Development
```bash
bun install                    # Install dependencies
bun run dev                    # Start development server
bun run build                  # Build for production
bun run preview               # Preview production build
```

### Testing
```bash
bun run test                   # Run all tests
bun run test:watch            # Run tests in watch mode
bun run test:coverage         # Run tests with coverage
bun run test:e2e              # Run end-to-end tests
```

### Code Quality
```bash
bun run lint                  # Run ESLint
bun run lint:fix             # Fix linting issues
bun run format               # Format code with Prettier
bun run typecheck            # TypeScript type checking
```

## 🏗️ Project Structure
- `frontend/` - React frontend (Bun monorepo)
- `src-tauri/` - Tauri desktop app (Rust)
- `api/` - Backend API services
- `docs/` - Documentation and specifications
- `tests/` - Test files and setup

## 🤖 AI Agent System
- Located in `frontend/packages/ai-agents/`
- Uses Inngest for orchestration
- Supports multiple agent types: researcher, coder, analyst, optimizer, coordinator

## 📦 Key Dependencies
- **Runtime**: Bun (package manager), Node.js
- **Frontend**: React, TypeScript, Tailwind CSS
- **Desktop**: Tauri (Rust)
- **Testing**: Vitest, Playwright
- **AI**: Inngest, Electric SQL for real-time sync

## 🔧 Environment Setup
- Copy `.env.example` to `.env` in relevant directories
- Run `bun install` in root and `frontend/` directories
- Install Rust toolchain for Tauri development
- Install Playwright browsers: `bun run test:e2e:install`

## 📝 Notes
- Uses Bun for package management (not npm/yarn)
- Monorepo structure with workspaces
- TDD workflow with comprehensive testing
- Real-time sync with Electric SQL
- Agent orchestration with Inngest