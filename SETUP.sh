#!/bin/bash

# SETUP.sh - Idempotent environment setup for Claude Flow
# This script prepares the development environment for remote agents

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if we're in the correct directory
check_project_root() {
    if [[ ! -f "package.json" ]] || [[ ! -d "frontend" ]] || [[ ! -d "src-tauri" ]]; then
        log_error "Please run this script from the project root directory"
        exit 1
    fi
}

# Install Bun if not present
install_bun() {
    if ! command_exists bun; then
        log_info "Installing Bun..."
        curl -fsSL https://bun.sh/install | bash
        export PATH="$HOME/.bun/bin:$PATH"
        log_success "Bun installed successfully"
    else
        log_info "Bun is already installed ($(bun --version))"
    fi
}

# Install Node.js if not present
check_nodejs() {
    if ! command_exists node; then
        log_warning "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    else
        local node_version=$(node --version | cut -d'v' -f2)
        local major_version=$(echo $node_version | cut -d'.' -f1)
        if (( major_version < 18 )); then
            log_error "Node.js version $node_version is too old. Please upgrade to Node.js 18+"
            exit 1
        fi
        log_info "Node.js version $node_version is compatible"
    fi
}

# Install Rust if not present
install_rust() {
    if ! command_exists rustc; then
        log_info "Installing Rust..."
        curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
        source "$HOME/.cargo/env"
        log_success "Rust installed successfully"
    else
        log_info "Rust is already installed ($(rustc --version))"
    fi
}

# Install project dependencies
install_dependencies() {
    log_info "Installing root dependencies..."
    bun install

    log_info "Installing frontend dependencies..."
    cd frontend
    bun install
    cd ..

    log_success "All dependencies installed"
}

# Setup environment files
setup_env_files() {
    local env_files=(
        "frontend/apps/web/.env.example:.env"
        "frontend/apps/server/.env.example:.env"
        "api/.env.example:.env"
    )

    for entry in "${env_files[@]}"; do
        local example_file="${entry%%:*}"
        local target_file="${entry##*:}"
        local target_dir=$(dirname "$example_file")
        local target_path="$target_dir/$target_file"
        
        if [[ -f "$example_file" ]] && [[ ! -f "$target_path" ]]; then
            log_info "Creating $target_path from $example_file"
            cp "$example_file" "$target_path"
        elif [[ -f "$target_path" ]]; then
            log_info "Environment file $target_path already exists"
        fi
    done
}

# Install Playwright browsers
install_playwright() {
    if command_exists playwright; then
        log_info "Installing Playwright browsers..."
        cd frontend
        bun run test:e2e:install
        cd ..
        log_success "Playwright browsers installed"
    else
        log_warning "Playwright not found, skipping browser installation"
    fi
}

# Run initial validation
validate_setup() {
    log_info "Validating setup..."
    
    # Check TypeScript compilation
    if ! bun run typecheck; then
        log_error "TypeScript compilation failed"
        exit 1
    fi
    
    # Check linting
    if ! bun run lint; then
        log_warning "Linting issues found, but continuing..."
    fi
    
    # Run a quick test
    if ! bun run test:fast 2>/dev/null; then
        log_warning "Some tests failed, but setup is complete"
    fi
    
    log_success "Setup validation complete"
}

# Main setup function
main() {
    log_info "Starting Claude Flow environment setup..."
    
    check_project_root
    check_nodejs
    install_bun
    install_rust
    install_dependencies
    setup_env_files
    install_playwright
    validate_setup
    
    log_success "Environment setup complete!"
    log_info "You can now run:"
    log_info "  bun run dev      - Start development server"
    log_info "  bun run test     - Run tests"
    log_info "  bun run build    - Build for production"
    
    log_info "Check AGENTS.md for more commands and guidelines"
}

# Run main function
main "$@"