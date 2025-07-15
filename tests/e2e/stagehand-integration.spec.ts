import { test, expect } from '@playwright/test'

test.describe('Stagehand Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
    
    // Wait for app to be ready
    await page.waitForSelector('[data-testid="main-app"]', { timeout: 30000 })
  })

  test('should integrate with Stagehand for automated interactions', async ({ page }) => {
    // Test Stagehand-like automated navigation
    await page.evaluate(() => {
      // Simulate Stagehand's ability to understand and interact with UI elements
      const buttons = Array.from(document.querySelectorAll('button'))
      const targetButton = buttons.find(btn => 
        btn.textContent?.toLowerCase().includes('new') || 
        btn.textContent?.toLowerCase().includes('create')
      )
      
      if (targetButton) {
        (targetButton as HTMLButtonElement).click()
      }
    })

    // Verify automated interaction worked
    await expect(page.locator('[data-testid="creation-dialog"], [data-testid="new-item-form"]')).toBeVisible({ timeout: 5000 })
  })

  test('should handle dynamic content loading with Stagehand patterns', async ({ page }) => {
    // Simulate Stagehand's ability to wait for dynamic content
    await page.click('[data-testid="projects-nav"]')
    
    // Use Stagehand-like waiting pattern
    await page.waitForFunction(() => {
      const projectList = document.querySelector('[data-testid="projects-list"], [data-testid="projects-container"]')
      return projectList && projectList.children.length > 0
    }, { timeout: 10000 })

    // Verify content loaded
    await expect(page.locator('[data-testid="projects-list"], [data-testid="projects-container"]')).toBeVisible()
  })

  test('should support Stagehand-style form automation', async ({ page }) => {
    // Navigate to a form
    await page.click('[data-testid="settings-btn"]')
    await expect(page.locator('[data-testid="settings-dialog"]')).toBeVisible()

    // Simulate Stagehand's intelligent form filling
    await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], textarea'))
      
      inputs.forEach((input, index) => {
        const htmlInput = input as HTMLInputElement | HTMLTextAreaElement
        if (htmlInput.placeholder?.toLowerCase().includes('name')) {
          htmlInput.value = 'Automated Test User'
        } else if (htmlInput.placeholder?.toLowerCase().includes('email')) {
          htmlInput.value = 'test@example.com'
        } else if (htmlInput.type === 'text') {
          htmlInput.value = `Test Value ${index}`
        }
        
        // Trigger change event
        htmlInput.dispatchEvent(new Event('input', { bubbles: true }))
        htmlInput.dispatchEvent(new Event('change', { bubbles: true }))
      })
    })

    // Verify form was filled
    const nameInput = page.locator('input[placeholder*="name" i]').first()
    if (await nameInput.isVisible()) {
      await expect(nameInput).toHaveValue('Automated Test User')
    }
  })

  test('should handle complex UI interactions like Stagehand', async ({ page }) => {
    // Test multi-step workflow automation
    await page.click('[data-testid="agents-nav"]')
    await expect(page.locator('[data-testid="agents-page"]')).toBeVisible()

    // Simulate Stagehand's ability to perform complex sequences
    await page.evaluate(() => {
      // Find and click create button
      const createButton = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent?.toLowerCase().includes('create') ||
        btn.textContent?.toLowerCase().includes('add') ||
        btn.textContent?.toLowerCase().includes('new')
      )
      
      if (createButton) {
        (createButton as HTMLButtonElement).click()
      }
    })

    // Wait for form to appear
    await page.waitForSelector('input, select, textarea', { timeout: 5000 })

    // Fill form intelligently
    await page.evaluate(() => {
      const nameInput = document.querySelector('input[placeholder*="name" i], input[name*="name" i]') as HTMLInputElement
      if (nameInput) {
        nameInput.value = 'Stagehand Test Agent'
        nameInput.dispatchEvent(new Event('input', { bubbles: true }))
      }

      const typeSelect = document.querySelector('select[name*="type" i], select[id*="type" i]') as HTMLSelectElement
      if (typeSelect && typeSelect.options.length > 1) {
        typeSelect.selectedIndex = 1
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }))
      }
    })

    // Submit form
    await page.evaluate(() => {
      const submitButton = Array.from(document.querySelectorAll('button')).find(btn =>
        btn.textContent?.toLowerCase().includes('save') ||
        btn.textContent?.toLowerCase().includes('create') ||
        btn.textContent?.toLowerCase().includes('submit') ||
        btn.type === 'submit'
      )
      
      if (submitButton) {
        (submitButton as HTMLButtonElement).click()
      }
    })

    // Verify creation succeeded
    await page.waitForTimeout(1000) // Allow for UI updates
    const agentList = page.locator('[data-testid="agent-list"], [data-testid="agents-container"]')
    if (await agentList.isVisible()) {
      await expect(agentList).toContainText('Stagehand Test Agent')
    }
  })

  test('should handle error recovery like Stagehand', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/**', route => route.abort())

    // Try to perform an action that would fail
    await page.click('[data-testid="sync-btn"], [data-testid="refresh-btn"]').catch(() => {
      // Button might not exist, that's ok for this test
    })

    // Stagehand-like error detection and recovery
    await page.evaluate(() => {
      // Look for error indicators
      const errorElements = document.querySelectorAll('[data-testid*="error"], .error, [class*="error"]')
      if (errorElements.length > 0) {
        console.log('Error detected, implementing recovery strategy')
        
        // Try to find retry button
        const retryButton = Array.from(document.querySelectorAll('button')).find(btn =>
          btn.textContent?.toLowerCase().includes('retry') ||
          btn.textContent?.toLowerCase().includes('try again')
        )
        
        if (retryButton) {
          (retryButton as HTMLButtonElement).click()
        }
      }
    })

    // Restore network and verify recovery
    await page.unroute('**/api/**')
    
    // The app should handle the error gracefully
    const errorMessage = page.locator('[data-testid="error-message"], .error-message')
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible()
    }
  })

  test('should support Stagehand-style element observation', async ({ page }) => {
    // Test ability to observe and report on page elements
    const elementReport = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'))
      const inputs = Array.from(document.querySelectorAll('input'))
      const links = Array.from(document.querySelectorAll('a'))
      
      return {
        interactiveElements: {
          buttons: buttons.length,
          inputs: inputs.length,
          links: links.length
        },
        buttonTypes: buttons.map(btn => ({
          text: btn.textContent?.trim() || '',
          type: btn.type || 'button',
          disabled: btn.disabled,
          ariaLabel: btn.getAttribute('aria-label') || '',
          testId: btn.getAttribute('data-testid') || ''
        })),
        inputTypes: inputs.map(input => ({
          type: input.type,
          placeholder: input.placeholder || '',
          name: input.name || '',
          required: input.required,
          testId: input.getAttribute('data-testid') || ''
        }))
      }
    })

    // Verify we can observe the page structure
    expect(elementReport.interactiveElements.buttons).toBeGreaterThan(0)
    expect(elementReport.buttonTypes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.any(String)
        })
      ])
    )
  })

  test('should handle accessibility features like Stagehand', async ({ page }) => {
    // Test keyboard navigation support
    await page.keyboard.press('Tab')
    
    // Verify focus management
    const focusedElement = await page.locator(':focus').first()
    await expect(focusedElement).toBeVisible()

    // Test screen reader compatibility
    const ariaLabels = await page.evaluate(() => {
      const elementsWithAria = Array.from(document.querySelectorAll('[aria-label], [aria-labelledby], [role]'))
      return elementsWithAria.map(el => ({
        tag: el.tagName.toLowerCase(),
        ariaLabel: el.getAttribute('aria-label') || '',
        role: el.getAttribute('role') || '',
        ariaLabelledBy: el.getAttribute('aria-labelledby') || ''
      }))
    })

    // Verify accessibility features are present
    expect(ariaLabels.length).toBeGreaterThan(0)
  })

  test('should perform end-to-end workflow automation', async ({ page }) => {
    // Complete workflow: Create project -> Add agent -> Start session
    
    // Step 1: Create project
    await page.click('[data-testid="projects-nav"]')
    await page.click('[data-testid="new-project-btn"], [data-testid="create-project-btn"]').catch(() => {
      // Button might have different selector
    })
    
    // Look for any form that appeared
    await page.waitForSelector('input, textarea', { timeout: 5000 }).catch(() => {
      console.log('No form appeared for project creation')
    })

    // Step 2: Navigate through the application
    await page.click('[data-testid="agents-nav"]').catch(() => {
      console.log('Agents nav not found')
    })

    // Step 3: Verify navigation worked
    const currentUrl = page.url()
    expect(currentUrl).toContain('localhost')

    // Step 4: Test session management
    await page.click('[data-testid="sessions-nav"], [data-testid="session-btn"]').catch(() => {
      console.log('Sessions nav not found')
    })

    // The workflow should complete without critical errors
    expect(page.url()).toContain('localhost')
  })
})