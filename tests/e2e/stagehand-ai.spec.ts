import { test, expect, type Page } from '@playwright/test'
import { StagehandAI } from '../utils/stagehand-ai'

// AI-powered E2E tests using Stagehand integration
test.describe('Claudia AI Assistant - AI-Powered E2E Tests', () => {
  let stagehand: StagehandAI
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    stagehand = new StagehandAI(page)
    await page.goto('/')
  })

  test.afterEach(async () => {
    if (stagehand) {
      await stagehand.cleanup()
    }
  })

  test('AI can navigate and interact with the main interface', async () => {
    // Use AI to understand and navigate the interface
    const pageDescription = await stagehand.analyzePageStructure()
    expect(pageDescription).toContain('Claudia AI Assistant')

    // AI-driven navigation
    await stagehand.findAndClick('settings or configuration button')
    await stagehand.waitForPageChange()
    
    // Verify AI found the correct section
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/(settings|config|preferences)/)
  })

  test('AI can interact with chat interface intelligently', async () => {
    // Find chat input using AI understanding
    const chatInput = await stagehand.findElement('message input field or chat box')
    expect(chatInput).toBeTruthy()

    // AI generates test message and sends it
    const testMessage = await stagehand.generateTestMessage('greeting')
    await stagehand.typeInElement(chatInput, testMessage)
    await stagehand.submitMessage()

    // AI verifies response appears
    const response = await stagehand.waitForResponse()
    expect(response).toBeTruthy()
  })

  test('AI can handle complex multi-step workflows', async () => {
    // Complex workflow: Create project → Configure settings → Test functionality
    
    // Step 1: AI finds and creates new project
    await stagehand.findAndClick('create new project or add project')
    await stagehand.waitForModal()
    
    const projectName = `AI-Test-Project-${Date.now()}`
    await stagehand.fillForm({
      'project name': projectName,
      'description': 'AI-generated test project'
    })
    await stagehand.submitForm()

    // Step 2: AI configures project settings
    await stagehand.navigateToProjectSettings(projectName)
    await stagehand.configureProjectSettings({
      'ai model': 'claude-sonnet',
      'max tokens': '4000'
    })

    // Step 3: AI tests project functionality
    await stagehand.testProjectFunctionality()
    
    // Verify success
    const successIndicator = await stagehand.findElement('success message or confirmation')
    expect(successIndicator).toBeTruthy()
  })

  test('AI can detect and handle error states', async () => {
    // Intentionally trigger error condition
    await stagehand.findAndClick('settings')
    await stagehand.modifyField('invalid configuration', 'invalid-value')
    await stagehand.submitForm()

    // AI detects error state
    const errorDetected = await stagehand.detectErrorState()
    expect(errorDetected).toBe(true)

    // AI attempts recovery
    await stagehand.handleErrorRecovery()
    
    // Verify recovery successful
    const recoverySuccessful = await stagehand.verifyNormalState()
    expect(recoverySuccessful).toBe(true)
  })

  test('AI can perform accessibility testing', async () => {
    // AI-driven accessibility analysis
    const accessibilityReport = await stagehand.performAccessibilityAudit()
    
    expect(accessibilityReport.violations).toHaveLength(0)
    expect(accessibilityReport.score).toBeGreaterThanOrEqual(95)
    
    // AI tests keyboard navigation
    const keyboardNavigation = await stagehand.testKeyboardNavigation()
    expect(keyboardNavigation.success).toBe(true)
    
    // AI tests screen reader compatibility
    const screenReaderTest = await stagehand.testScreenReaderCompatibility()
    expect(screenReaderTest.compatible).toBe(true)
  })

  test('AI can perform visual regression testing', async () => {
    // AI takes baseline screenshots
    await stagehand.captureVisualBaseline('main-interface')
    
    // Make UI changes
    await stagehand.changeTheme('dark')
    await stagehand.captureVisualComparison('main-interface-dark')
    
    // AI analyzes visual differences
    const visualDiff = await stagehand.compareVisuals('main-interface', 'main-interface-dark')
    expect(visualDiff.significantChanges).toBe(true)
    expect(visualDiff.regressionDetected).toBe(false)
  })
})

// Performance testing with AI
test.describe('AI-Powered Performance Tests', () => {
  test('AI monitors and validates performance metrics', async ({ page }) => {
    const stagehand = new StagehandAI(page)
    
    // Start performance monitoring
    await stagehand.startPerformanceMonitoring()
    
    // Navigate through app with AI
    await page.goto('/')
    await stagehand.performUserJourney('typical-user-workflow')
    
    // AI analyzes performance data
    const performanceReport = await stagehand.analyzePerformance()
    
    expect(performanceReport.loadTime).toBeLessThan(3000)
    expect(performanceReport.interactivityScore).toBeGreaterThan(90)
    expect(performanceReport.memoryLeaks).toBe(false)
  })
})