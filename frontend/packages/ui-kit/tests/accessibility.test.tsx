import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Button } from '../src/components/Button'
import { Input } from '../src/components/Input'
import { Card, CardHeader, CardTitle, CardContent } from '../src/components/Card'
import { Alert } from '../src/components/Alert'
import { Badge } from '../src/components/Badge'

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Button', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <Button>Click me</Button>
          <Button variant="outline">Outline</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
        </div>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper ARIA attributes when loading', async () => {
      const { container } = render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard accessible', () => {
      render(<Button>Keyboard Test</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
    })
  })

  describe('Input', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <Input placeholder="Basic input" />
          <Input label="Labeled input" placeholder="With label" />
          <Input label="Required input" required placeholder="Required field" />
          <Input 
            label="Input with description" 
            description="This is a helpful description"
            placeholder="Described input" 
          />
          <Input 
            label="Error input" 
            error="This field is required"
            placeholder="Error state" 
          />
        </div>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper label association', () => {
      render(
        <Input 
          label="Email address" 
          placeholder="Enter your email"
          id="email-input"
        />
      )
      
      const input = screen.getByLabelText('Email address')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('id', 'email-input')
    })

    it('should have proper error association', async () => {
      const { container } = render(
        <Input 
          label="Password" 
          error="Password is required"
          placeholder="Enter password"
        />
      )
      
      const input = screen.getByLabelText('Password')
      expect(input).toHaveAttribute('aria-invalid', 'true')
      expect(input).toHaveAttribute('aria-describedby')
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Card', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Card content goes here.</p>
          </CardContent>
        </Card>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper heading hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle as="h2">Main Title</CardTitle>
          </CardHeader>
          <CardContent>
            <h3>Subsection</h3>
            <p>Content under subsection.</p>
          </CardContent>
        </Card>
      )
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Main Title')
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Subsection')
    })
  })

  describe('Alert', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <Alert>Basic alert message</Alert>
          <Alert variant="error" title="Error Alert">
            Something went wrong
          </Alert>
          <Alert variant="success" dismissible>
            Success message with dismiss
          </Alert>
        </div>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper alert role', () => {
      render(<Alert>Important message</Alert>)
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveTextContent('Important message')
    })

    it('should have accessible dismiss button', async () => {
      const { container } = render(
        <Alert dismissible>Dismissible alert</Alert>
      )
      
      const dismissButton = screen.getByRole('button', { name: /dismiss alert/i })
      expect(dismissButton).toBeInTheDocument()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Badge', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(
        <div>
          <Badge>Default badge</Badge>
          <Badge variant="success">Success</Badge>
          <Badge removable>Removable badge</Badge>
        </div>
      )
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have accessible remove button', async () => {
      const { container } = render(
        <Badge removable>Removable</Badge>
      )
      
      const removeButton = screen.getByRole('button', { name: /remove badge/i })
      expect(removeButton).toBeInTheDocument()
      
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation across components', () => {
      render(
        <div>
          <Button>First</Button>
          <Input placeholder="Second" />
          <Button>Third</Button>
          <Alert dismissible>Fourth (dismiss button)</Alert>
          <Badge removable>Fifth (remove button)</Badge>
        </div>
      )

      // Test tab order
      const firstButton = screen.getByRole('button', { name: 'First' })
      const input = screen.getByPlaceholderText('Second')
      const thirdButton = screen.getByRole('button', { name: 'Third' })
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      const removeButton = screen.getByRole('button', { name: /remove/i })

      // All interactive elements should be focusable
      firstButton.focus()
      expect(firstButton).toHaveFocus()

      input.focus()
      expect(input).toHaveFocus()

      thirdButton.focus()
      expect(thirdButton).toHaveFocus()

      dismissButton.focus()
      expect(dismissButton).toHaveFocus()

      removeButton.focus()
      expect(removeButton).toHaveFocus()
    })
  })

  describe('Focus Management', () => {
    it('should maintain focus visibility', () => {
      render(
        <div>
          <Button>Focus test</Button>
          <Input placeholder="Focus input" />
        </div>
      )

      const button = screen.getByRole('button')
      const input = screen.getByPlaceholderText('Focus input')

      // Focus should be visible (this would be tested with visual regression in a real scenario)
      button.focus()
      expect(button).toHaveFocus()

      input.focus()
      expect(input).toHaveFocus()
    })
  })
})