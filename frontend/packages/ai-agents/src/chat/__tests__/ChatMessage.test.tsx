import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatMessage } from '../ChatMessage';
import { InputSanitizer } from '../../security/inputSanitizer';

// Mock the InputSanitizer
vi.mock('../../security/inputSanitizer', () => ({
  InputSanitizer: {
    sanitizeHtml: vi.fn((input: string) => input.replace(/<script[^>]*>.*?<\/script>/gi, '')),
    sanitizeText: vi.fn((input: string) => input.replace(/</g, '&lt;').replace(/>/g, '&gt;')),
    validateFileUpload: vi.fn(() => ({ isValid: true })),
  },
}));

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMessage = {
    id: 'msg-1',
    content: 'Hello world!',
    sender: 'user' as const,
    timestamp: new Date('2023-01-01T12:00:00Z'),
    attachments: [],
  };

  it('should render message content safely', () => {
    render(<ChatMessage message={mockMessage} />);
    
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith(mockMessage.content);
  });

  it('should sanitize XSS attempts in content', () => {
    const maliciousMessage = {
      ...mockMessage,
      content: '<script>alert("xss")</script>Hello world!',
    };

    render(<ChatMessage message={maliciousMessage} />);
    
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith(maliciousMessage.content);
    expect(screen.getByText('Hello world!')).toBeInTheDocument();
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
  });

  it('should handle HTML content safely', () => {
    const htmlMessage = {
      ...mockMessage,
      content: '<p>This is <strong>bold</strong> text</p>',
    };

    render(<ChatMessage message={htmlMessage} />);
    
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith(htmlMessage.content);
  });

  it('should display user and assistant messages differently', () => {
    const userMessage = { ...mockMessage, sender: 'user' as const };
    const assistantMessage = { ...mockMessage, sender: 'assistant' as const };

    const { rerender } = render(<ChatMessage message={userMessage} />);
    const userElement = screen.getByRole('article');
    expect(userElement).toHaveClass('ml-12');

    rerender(<ChatMessage message={assistantMessage} />);
    const assistantElement = screen.getByRole('article');
    expect(assistantElement).toHaveClass('mr-12');
  });

  it('should format timestamp correctly', () => {
    render(<ChatMessage message={mockMessage} />);
    
    expect(screen.getByText('12:00')).toBeInTheDocument();
  });

  it('should handle attachments safely', () => {
    const messageWithAttachments = {
      ...mockMessage,
      attachments: [
        { id: '1', name: 'safe.txt', size: 1000, type: 'text/plain' },
        { id: '2', name: 'image.jpg', size: 2000, type: 'image/jpeg' },
      ],
    };

    render(<ChatMessage message={messageWithAttachments} />);
    
    expect(screen.getByText('safe.txt')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
  });

  it('should sanitize attachment names', () => {
    const messageWithMaliciousAttachment = {
      ...mockMessage,
      attachments: [
        { id: '1', name: '<script>alert("xss")</script>evil.txt', size: 1000, type: 'text/plain' },
      ],
    };

    render(<ChatMessage message={messageWithMaliciousAttachment} />);
    
    expect(InputSanitizer.sanitizeText).toHaveBeenCalledWith(
      messageWithMaliciousAttachment.attachments[0].name
    );
  });

  it('should handle copy functionality', () => {
    // Mock clipboard API
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<ChatMessage message={mockMessage} />);
    
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);
    
    expect(mockClipboard.writeText).toHaveBeenCalledWith(mockMessage.content);
  });

  it('should handle edit functionality for user messages', () => {
    const onEdit = vi.fn();
    
    render(<ChatMessage message={mockMessage} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);
    
    expect(onEdit).toHaveBeenCalledWith(mockMessage.id);
  });

  it('should not show edit button for assistant messages', () => {
    const assistantMessage = { ...mockMessage, sender: 'assistant' as const };
    
    render(<ChatMessage message={assistantMessage} />);
    
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
  });

  it('should handle delete functionality', () => {
    const onDelete = vi.fn();
    
    render(<ChatMessage message={mockMessage} onDelete={onDelete} />);
    
    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith(mockMessage.id);
  });

  it('should handle missing or invalid timestamp', () => {
    const messageWithInvalidTime = {
      ...mockMessage,
      timestamp: null as any,
    };

    expect(() => render(<ChatMessage message={messageWithInvalidTime} />)).not.toThrow();
  });

  it('should handle long content gracefully', () => {
    const longMessage = {
      ...mockMessage,
      content: 'x'.repeat(10000),
    };

    render(<ChatMessage message={longMessage} />);
    
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith(longMessage.content);
  });

  it('should handle empty content', () => {
    const emptyMessage = {
      ...mockMessage,
      content: '',
    };

    render(<ChatMessage message={emptyMessage} />);
    
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith('');
  });

  it('should handle null/undefined content safely', () => {
    const nullMessage = {
      ...mockMessage,
      content: null as any,
    };

    expect(() => render(<ChatMessage message={nullMessage} />)).not.toThrow();
  });

  it('should validate file attachments', () => {
    const messageWithFiles = {
      ...mockMessage,
      attachments: [
        { id: '1', name: 'test.txt', size: 1000, type: 'text/plain' },
      ],
    };

    render(<ChatMessage message={messageWithFiles} />);
    
    expect(InputSanitizer.validateFileUpload).toHaveBeenCalled();
  });

  it('should handle keyboard navigation', () => {
    render(<ChatMessage message={mockMessage} />);
    
    const messageElement = screen.getByRole('article');
    fireEvent.keyDown(messageElement, { key: 'Enter' });
    
    // Should not cause any errors
    expect(messageElement).toBeInTheDocument();
  });

  it('should apply proper ARIA attributes', () => {
    render(<ChatMessage message={mockMessage} />);
    
    const messageElement = screen.getByRole('article');
    expect(messageElement).toHaveAttribute('tabindex', '0');
    expect(messageElement).toHaveAttribute('aria-label', 
      expect.stringContaining('Message from user')
    );
  });

  it('should handle markdown content safely', () => {
    const markdownMessage = {
      ...mockMessage,
      content: '# Header\n\n**Bold text**\n\n[Link](https://example.com)',
    };

    render(<ChatMessage message={markdownMessage} />);
    
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith(markdownMessage.content);
  });

  it('should handle code blocks safely', () => {
    const codeMessage = {
      ...mockMessage,
      content: '```javascript\nconst x = "<script>alert(1)</script>";\n```',
    };

    render(<ChatMessage message={codeMessage} />);
    
    expect(InputSanitizer.sanitizeHtml).toHaveBeenCalledWith(codeMessage.content);
  });
});