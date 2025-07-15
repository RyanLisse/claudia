# CI/CD Pipeline Documentation

This document describes the comprehensive CI/CD pipeline setup for the Claudia project.

## 🚀 Overview

The CI/CD pipeline is designed to ensure code quality, security, and reliable deployments for the Claudia Tauri + React application. It includes automated testing, security scanning, performance monitoring, and deployment automation.

## 📋 Pipeline Components

### 1. Main CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Jobs:**
- **Lint & Type Check**: Code formatting and TypeScript validation
- **Test Frontend**: Unit and integration tests with coverage
- **Test Rust**: Cross-platform Rust testing
- **Security Scan**: Dependency and security vulnerability checks
- **Build Frontend**: Production build artifacts
- **Build Tauri**: Cross-platform Tauri application builds
- **Performance Test**: Lighthouse CI performance testing
- **Deploy Preview**: Staging deployment for PRs
- **Deploy Production**: Production deployment on main branch

### 2. Release Pipeline (`release.yml`)

**Triggers:**
- Version tags (`v*`)
- Manual workflow dispatch with version input

**Features:**
- Automated GitHub releases
- Cross-platform binary builds (Linux, macOS, Windows)
- Homebrew formula updates
- Release notifications

### 3. Security Pipeline (`security.yml`)

**Triggers:**
- Push to main/develop branches
- Pull requests to main
- Daily scheduled scans (2 AM UTC)
- Manual dispatch

**Security Checks:**
- Dependency vulnerability scanning
- CodeQL static analysis
- Semgrep security patterns
- Secret detection with TruffleHog
- Docker security scanning
- License compliance checking

### 4. Monitoring Pipeline (`monitoring.yml`)

**Triggers:**
- Hourly scheduled monitoring
- Manual dispatch

**Monitoring:**
- Application uptime checks
- API endpoint health
- Performance monitoring
- SSL certificate expiry
- Security anomaly detection
- Dependency monitoring

## 🔧 Configuration Files

### Testing Configuration

- **`vitest.config.ts`**: Vitest configuration with coverage
- **`test-setup.ts`**: Test environment setup and mocks
- **`lighthouserc.js`**: Lighthouse CI configuration

### Deployment Configuration

- **`Dockerfile`**: Multi-stage Docker build
- **`.dockerignore`**: Docker build optimization
- **`.github/codeql/codeql-config.yml`**: CodeQL analysis configuration

## 📊 Coverage and Quality Gates

### Frontend Coverage Thresholds
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

### Performance Thresholds
- Performance Score: 80%
- Accessibility Score: 90%
- Best Practices: 80%
- SEO: 80%

### Security Requirements
- No high/critical vulnerabilities
- All secrets properly managed
- License compliance verified

## 🔐 Required Secrets

### Deployment Secrets
- `VERCEL_TOKEN`: Vercel deployment token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

### Monitoring Secrets
- `APP_URL`: Application URL for health checks
- `DOMAIN`: Domain for SSL monitoring
- `ALERT_EMAIL`: Email for alerts

### Notification Secrets
- `SLACK_WEBHOOK_URL`: Slack notifications
- `EMAIL_WEBHOOK_URL`: Email notifications

### Security Scanning
- `SNYK_TOKEN`: Snyk security scanning
- `SEMGREP_APP_TOKEN`: Semgrep security analysis
- `CODECOV_TOKEN`: Code coverage reporting
- `LHCI_GITHUB_APP_TOKEN`: Lighthouse CI

### Release Management
- `HOMEBREW_TAP_TOKEN`: Homebrew formula updates

## 🚀 Getting Started

### 1. Enable Workflows

Ensure all workflow files are in `.github/workflows/`:
- `ci.yml` - Main CI/CD pipeline
- `release.yml` - Release automation
- `security.yml` - Security scanning
- `monitoring.yml` - Application monitoring

### 2. Configure Repository Settings

**Branch Protection Rules:**
- Require status checks to pass
- Require branches to be up to date
- Require review from code owners
- Dismiss stale reviews when new commits are pushed

**Required Status Checks:**
- Lint & Type Check
- Test Frontend
- Test Rust
- Security Scan
- Build Frontend

### 3. Set Up Secrets

Navigate to repository Settings → Secrets and Variables → Actions:

```bash
# Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Monitoring
APP_URL=https://your-app.com
DOMAIN=your-app.com
ALERT_EMAIL=alerts@your-domain.com

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/your/webhook
EMAIL_WEBHOOK_URL=https://your-email-service.com/webhook

# Security
SNYK_TOKEN=your_snyk_token
SEMGREP_APP_TOKEN=your_semgrep_token
CODECOV_TOKEN=your_codecov_token

# Release
HOMEBREW_TAP_TOKEN=your_github_token
```

### 4. Configure Branch Protection

```yaml
# .github/branch-protection.yml
protection_rules:
  main:
    required_status_checks:
      strict: true
      contexts:
        - "Lint & Type Check"
        - "Test Frontend"
        - "Test Rust"
        - "Security Scan"
        - "Build Frontend"
    enforce_admins: true
    required_pull_request_reviews:
      required_approving_review_count: 1
      dismiss_stale_reviews: true
    restrictions: null
```

## 📈 Monitoring and Alerting

### Health Checks
- Application endpoint monitoring
- API response time tracking
- SSL certificate expiry alerts
- Dependency vulnerability monitoring

### Performance Monitoring
- Lighthouse CI on every PR
- Load testing with k6
- Response time alerting
- Performance budget enforcement

### Security Monitoring
- Daily vulnerability scans
- Secret detection
- License compliance
- Security alert notifications

## 🔄 Deployment Workflow

### Preview Deployments
1. Create pull request
2. Automated tests run
3. Security scans execute
4. Preview deployment to Vercel
5. Performance tests on preview
6. Review and approval process

### Production Deployments
1. Merge to main branch
2. Full test suite execution
3. Security validation
4. Production build creation
5. Deployment to production
6. Health check verification
7. Monitoring activation

### Release Process
1. Create version tag (`v1.0.0`)
2. Automated release workflow
3. Cross-platform builds
4. GitHub release creation
5. Binary artifacts upload
6. Homebrew formula update
7. Release notifications

## 🛠 Local Development

### Running Tests
```bash
# Frontend tests
cd frontend
bun test
bun test:coverage
bun test:watch

# Rust tests
cd src-tauri
cargo test
```

### Running Security Scans
```bash
# Dependency audit
cd frontend && bun audit
cd src-tauri && cargo audit

# License check
npx license-checker --onlyAllow 'MIT;BSD;ISC;Apache-2.0'
```

### Performance Testing
```bash
# Lighthouse CI
npm install -g @lhci/cli
lhci autorun

# Load testing
npm install -g k6
k6 run load-test.js
```

## 📝 Troubleshooting

### Common Issues

**Build Failures:**
- Check dependency compatibility
- Verify Node.js/Rust versions
- Review build logs for specific errors

**Test Failures:**
- Ensure test environment setup
- Check for missing test dependencies
- Verify mock configurations

**Security Scan Issues:**
- Update vulnerable dependencies
- Review and fix security patterns
- Ensure no hardcoded secrets

**Deployment Issues:**
- Verify all required secrets are set
- Check deployment target configuration
- Review deployment logs

### Getting Help

1. Check GitHub Actions logs
2. Review workflow status badges
3. Check monitoring dashboards
4. Review security scan reports
5. Contact the DevOps team

## 📊 Metrics and Reports

### Code Coverage
- Automated coverage reports
- Coverage trend tracking
- Quality gate enforcement

### Security Reports
- Vulnerability assessments
- Dependency health scores
- Compliance status

### Performance Metrics
- Lighthouse scores
- Load test results
- Response time trends

### Deployment Metrics
- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate

---

## 🎯 Best Practices

1. **Keep workflows fast** - Use caching and parallel jobs
2. **Fail fast** - Run quick checks before expensive operations
3. **Secure by default** - Use least privilege access
4. **Monitor everything** - Comprehensive observability
5. **Automate repetitive tasks** - Reduce manual intervention
6. **Document changes** - Keep this README updated

For questions or suggestions, please open an issue or contact the DevOps team.