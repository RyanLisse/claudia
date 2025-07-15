import { describe, it, expect } from 'vitest'

// Simple utility functions for testing
const clsx = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

const cn = (...inputs: (string | undefined | null | false)[]): string => {
  return clsx(...inputs)
}

describe('Utility Functions', () => {
  describe('clsx', () => {
    it('should combine class names', () => {
      expect(clsx('btn', 'btn-primary')).toBe('btn btn-primary')
    })

    it('should filter out falsy values', () => {
      expect(clsx('btn', null, undefined, false, 'active')).toBe('btn active')
    })

    it('should handle empty input', () => {
      expect(clsx()).toBe('')
    })

    it('should handle single class', () => {
      expect(clsx('btn')).toBe('btn')
    })
  })

  describe('cn', () => {
    it('should work as alias for clsx', () => {
      expect(cn('btn', 'btn-primary')).toBe('btn btn-primary')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const isDisabled = false
      
      expect(cn('btn', isActive && 'active', isDisabled && 'disabled')).toBe('btn active')
    })
  })
})