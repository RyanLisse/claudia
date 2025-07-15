# E2E Testing Guide

This directory contains end-to-end tests for the Claudia frontend application using Playwright.

## Structure

```
tests/e2e/
├── README.md                    # This file
├── basic.test.ts               # Basic E2E tests (no server dependency)
├── smoke.test.ts               # Smoke tests for main application
├── auth.test.ts                # Authentication flow tests
├── projects.test.ts            # Project management tests
├── fixtures/
│   └── test-data.ts            # Test data fixtures
├── helpers/
│   ├── auth.ts                 # Authentication helpers
│   ├── db.ts                   # Database helpers
│   ├── server.ts               # Server setup helpers
│   └── visual.ts               # Visual testing helpers
└── pages/
    ├── BasePage.ts             # Base page object model
    ├── LoginPage.ts            # Login page object model
    ├── DashboardPage.ts        # Dashboard page object model
    └── ProjectsPage.ts         # Projects page object model
```

## Configuration

### Main Configuration (`playwright.config.ts`)
- Full application testing with web server
- Runs both web and server applications
- Suitable for integration testing

### Basic Configuration (`playwright.config.basic.ts`)
- Lightweight testing without server dependency
- Good for testing basic functionality
- Faster execution

## Running Tests

### All E2E Tests
```bash
bun run test:e2e
```

### Basic Tests Only
```bash
bun run test:e2e:basic
```

### Smoke Tests Only
```bash
bun run test:e2e:smoke
```

### With UI Mode
```bash
bun run test:e2e:ui
```

### Debug Mode
```bash
bun run test:e2e:debug
```

### Specific Browser
```bash
bun run test:e2e --project=chromium
bun run test:e2e --project=firefox
bun run test:e2e --project=webkit
```

## Test Categories

### Smoke Tests (`basic.test.ts`)
- Basic functionality verification
- No server dependency
- Fast execution

### Authentication Tests (`auth.test.ts`)
- Login/logout flows
- Session management
- Error handling

### Project Tests (`projects.test.ts`)
- Project CRUD operations
- Search and filtering
- Bulk operations

### Visual Tests
- Screenshot comparisons
- Responsive design
- Accessibility checks

## Best Practices

### Page Object Model
- Use page objects for maintainable tests
- Encapsulate page-specific logic
- Extend `BasePage` for common functionality

### Test Data
- Use fixtures for consistent test data
- Clean up after each test
- Use database helpers for setup/teardown

### Assertions
- Use specific assertions from `@playwright/test`
- Test user-visible behavior
- Include accessibility checks

### Error Handling
- Test both happy and error paths
- Mock network failures
- Verify error messages

## Configuration Tips

### Test Environment
- Tests run against local development servers
- Use test-specific environment variables
- Mock external dependencies

### Performance
- Run tests in parallel
- Use headless mode for CI
- Optimize test data setup

### Debugging
- Use `--headed` flag to see browser
- Add `await page.pause()` for debugging
- Use browser dev tools with `--debug`

## Fixtures and Helpers

### Test Data (`fixtures/test-data.ts`)
- Consistent test data across tests
- User profiles for authentication
- Project templates

### Authentication Helpers (`helpers/auth.ts`)
- Login/logout utilities
- Session management
- User creation

### Database Helpers (`helpers/db.ts`)
- Database cleanup
- Test data seeding
- State management

### Server Helpers (`helpers/server.ts`)
- Server health checks
- API mocking
- Network monitoring

### Visual Helpers (`helpers/visual.ts`)
- Screenshot comparisons
- Accessibility testing
- Performance monitoring

## Troubleshooting

### Common Issues

1. **Server not starting**: Check if ports are available
2. **Test timeouts**: Increase timeout values in config
3. **Flaky tests**: Add proper waits and assertions
4. **Browser issues**: Update browsers with `bun run test:e2e:install`

### Debug Commands

```bash
# Run single test with debug
bun run test:e2e:debug tests/e2e/basic.test.ts

# Run with headed browser
bun run test:e2e:headed

# Generate test report
bun run test:e2e:report
```

### CI/CD Integration

Tests are configured for CI environments:
- Retry failed tests
- Generate reports
- Capture screenshots and videos on failure
- Optimized for GitHub Actions

## Contributing

When adding new tests:

1. Follow the existing page object patterns
2. Use appropriate helpers and fixtures
3. Add proper error handling
4. Include accessibility checks
5. Update this README if needed

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Test Configuration](https://playwright.dev/docs/test-configuration)