import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Search } from 'lucide-react'
import { Input } from '../src/components/Input'

describe('Input', () => {
  it('renders correctly', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  it('handles change events', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<Input onChange={handleChange} placeholder="Type here" />)
    
    await user.type(screen.getByPlaceholderText('Type here'), 'hello')
    expect(handleChange).toHaveBeenCalled()
  })

  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />)
    
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('renders with description', () => {
    render(
      <Input 
        label="Username" 
        description="Choose a unique username"
        placeholder="Enter username" 
      />
    )
    
    expect(screen.getByText('Choose a unique username')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(
      <Input 
        label="Email" 
        error="Invalid email address"
        placeholder="Enter email" 
      />
    )
    
    const input = screen.getByLabelText('Email')
    const errorMessage = screen.getByText('Invalid email address')
    
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(errorMessage).toBeInTheDocument()
    expect(errorMessage).toHaveAttribute('role', 'alert')
  })

  it('shows success state', () => {
    render(
      <Input 
        label="Username" 
        success="Username is available"
        placeholder="Enter username" 
      />
    )
    
    expect(screen.getByText('Username is available')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />)
    expect(screen.getByPlaceholderText('Disabled input')).toBeDisabled()
  })

  it('renders with left icon', () => {
    render(
      <Input 
        leftIcon={<Search data-testid="search-icon" />}
        placeholder="Search..." 
      />
    )
    
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('renders with addons', () => {
    render(
      <Input 
        leftAddon="https://"
        rightAddon=".com"
        placeholder="yoursite" 
      />
    )
    
    expect(screen.getByText('https://')).toBeInTheDocument()
    expect(screen.getByText('.com')).toBeInTheDocument()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<Input size="sm" placeholder="Small" />)
    expect(screen.getByPlaceholderText('Small')).toHaveClass('h-8')

    rerender(<Input size="lg" placeholder="Large" />)
    expect(screen.getByPlaceholderText('Large')).toHaveClass('h-12')
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')
  })

  it('has proper accessibility attributes', () => {
    render(
      <Input 
        label="Email"
        description="Your email address"
        error="Required field"
        placeholder="Enter email"
      />
    )
    
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-describedby')
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('generates unique IDs', () => {
    render(
      <>
        <Input label="First" placeholder="First input" />
        <Input label="Second" placeholder="Second input" />
      </>
    )
    
    const firstInput = screen.getByLabelText('First')
    const secondInput = screen.getByLabelText('Second')
    
    expect(firstInput.id).not.toBe(secondInput.id)
  })

  it('uses provided ID', () => {
    render(<Input id="custom-id" label="Test" placeholder="Test" />)
    expect(screen.getByLabelText('Test')).toHaveAttribute('id', 'custom-id')
  })
})