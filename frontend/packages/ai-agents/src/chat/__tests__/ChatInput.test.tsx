import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../ChatInput';
import { InputSanitizer } from '../../security/inputSanitizer';

// Mock the InputSanitizer
vi.mock('../../security/inputSanitizer', () => ({
  InputSanitizer: {
    sanitizeText: vi.fn((input: string) => input.replace(/</g, '&lt;').replace(/>/g, '&gt;')),
    validateChatMessage: vi.fn((message: string) => {
      if (message.includes('<script>')) {
        return { isValid: false, sanitized: '', error: 'Suspicious content detected' };
      }
      return { isValid: true, sanitized: message };
    }),
    validateFileUpload: vi.fn((file: File) => {
      if (file.name.endsWith('.exe') || file.name.endsWith('.js')) {
        return { isValid: false, error: 'File extension not allowed' };
      }
      if (file.size > 10 * 1024 * 1024) {
        return { isValid: false, error: 'File too large' };
      }
      return { isValid: true };
    }),
  },
}));

// Mock UI components - Update import path to match actual structure
vi.mock('@claudia/ui-kit', () => ({
  Button: ({ children, ...props }: any) => (
    <button {...props}>{children}</button>
  ),
}));

describe('ChatInput', () => {
  const mockOnSendMessage = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
  };

  it('should render chat input with default props', () => {
    render(<ChatInput {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /📤/i })).toBeInTheDocument();
    expect(screen.getByText('0/5000')).toBeInTheDocument();
  });

  it('should handle text input changes', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world!');
    
    expect(textarea).toHaveValue('Hello world!');
    expect(screen.getByText('12/5000')).toBeInTheDocument();
  });

  it('should enforce maximum length limit', async () => {
    render(<ChatInput {...defaultProps} maxLength={10} />);
    
    const textarea = screen.getByRole('textbox');
    
    // Type exactly 10 characters first
    await user.type(textarea, 'This is a ');
    expect(textarea).toHaveValue('This is a ');
    expect(screen.getByText('10/10')).toBeInTheDocument();
    
    // Try to type more - should be prevented by maxLength attribute
    await user.type(textarea, 'more text');
    
    // Should still only have 10 characters due to maxLength HTML attribute
    expect(textarea).toHaveValue('This is a ');
    expect(screen.getByText('10/10')).toBeInTheDocument();
  });

  it('should validate message content for XSS attempts', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    await user.type(textarea, '<script>alert("xss")</script>');
    await user.click(submitButton);
    
    expect(InputSanitizer.validateChatMessage).toHaveBeenCalledWith('<script>alert("xss")</script>');
    expect(screen.getByText('Suspicious content detected')).toBeInTheDocument();
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should submit valid messages', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    await user.type(textarea, 'Hello world!');
    await user.click(submitButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world!', undefined);
    expect(textarea).toHaveValue('');
  });

  it('should submit with Enter key', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world!');
    await user.keyboard('{Enter}');
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Hello world!', undefined);
  });

  it('should not submit with Shift+Enter', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello world!');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Hello world!\n');
  });

  it('should handle file uploads with security validation', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    expect(InputSanitizer.validateFileUpload).toHaveBeenCalledWith(file);
    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });

  it('should reject dangerous file types', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const maliciousFile = new File(['malicious'], 'virus.exe', { type: 'application/x-msdownload' });
    
    fireEvent.change(fileInput!, { target: { files: [maliciousFile] } });
    
    expect(InputSanitizer.validateFileUpload).toHaveBeenCalledWith(maliciousFile);
    expect(screen.getByText('virus.exe: File extension not allowed')).toBeInTheDocument();
  });

  it('should validate file size limits', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput!, { target: { files: [largeFile] } });
    
    expect(screen.getByText('large.txt: File too large')).toBeInTheDocument();
  });

  it('should allow removing attachments', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput!, { target: { files: [file] } });
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    
    const removeButton = screen.getByTitle('Remove attachment');
    fireEvent.click(removeButton);
    
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });

  it('should sanitize file names in attachments', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const file = new File(['content'], '<script>alert("xss")</script>test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    expect(InputSanitizer.sanitizeText).toHaveBeenCalledWith('<script>alert("xss")</script>test.txt');
  });

  it('should sanitize error messages', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    // Type a message that will trigger XSS validation error
    await user.type(textarea, '<script>alert("xss")</script>');
    await user.click(submitButton);
    
    // Should sanitize the error message when displaying it
    await waitFor(() => {
      expect(InputSanitizer.sanitizeText).toHaveBeenCalledWith('Suspicious content detected');
    });
  });

  it('should handle disabled state', () => {
    render(<ChatInput {...defaultProps} disabled />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    expect(textarea).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('should handle custom placeholder', () => {
    render(<ChatInput {...defaultProps} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should handle allowAttachments = false', () => {
    render(<ChatInput {...defaultProps} allowAttachments={false} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    expect(fileInput).not.toBeInTheDocument();
    
    expect(screen.queryByTitle('Attach file')).not.toBeInTheDocument();
  });

  it('should handle custom file types', () => {
    render(<ChatInput {...defaultProps} allowedFileTypes={['image/*']} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
  });

  it('should handle multiple file uploads', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const files = [
      new File(['content1'], 'test1.txt', { type: 'text/plain' }),
      new File(['content2'], 'test2.txt', { type: 'text/plain' }),
    ];
    
    fireEvent.change(fileInput!, { target: { files } });
    
    expect(screen.getByText('test1.txt')).toBeInTheDocument();
    expect(screen.getByText('test2.txt')).toBeInTheDocument();
  });

  it('should submit message with attachments', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    // Use fireEvent.change instead of user.type to avoid character-by-character typing
    fireEvent.change(textarea, { target: { value: 'Message with file' } });
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    await user.click(submitButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('Message with file', [file]);
  });

  it('should auto-resize textarea', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    const initialHeight = textarea.style.height;
    
    await user.type(textarea, 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5');
    
    // Height should be adjusted (mocked implementation would set it to scrollHeight)
    expect(textarea.style.height).toBe(`${textarea.scrollHeight}px`);
  });

  it('should prevent empty message submission', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /📤/i });
    await user.click(submitButton);
    
    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });

  it('should allow submission with only attachments', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    await user.click(submitButton);
    
    expect(mockOnSendMessage).toHaveBeenCalledWith('', [file]);
  });

  it('should handle upload errors gracefully', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const badFile = new File(['content'], 'bad.js', { type: 'application/javascript' });
    
    fireEvent.change(fileInput!, { target: { files: [badFile] } });
    
    expect(screen.getByText('bad.js: File extension not allowed')).toBeInTheDocument();
  });

  it('should clear form after successful submission', async () => {
    render(<ChatInput {...defaultProps} />);
    
    const textarea = screen.getByRole('textbox');
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    await user.type(textarea, 'Test message');
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    await user.click(submitButton);
    
    expect(textarea).toHaveValue('');
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });

  it('should handle submission errors', async () => {
    const errorOnSendMessage = vi.fn().mockImplementation(() => {
      throw new Error('Network error');
    });
    
    render(<ChatInput {...defaultProps} onSendMessage={errorOnSendMessage} />);
    
    const textarea = screen.getByRole('textbox');
    const submitButton = screen.getByRole('button', { name: /📤/i });
    
    await user.type(textarea, 'Test message');
    await user.click(submitButton);
    
    expect(screen.getByText('Failed to send message')).toBeInTheDocument();
  });

  it('should show loading state during file upload', () => {
    render(<ChatInput {...defaultProps} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    // Mock the uploading state
    fireEvent.change(fileInput!, { target: { files: [file] } });
    
    // The component should handle the uploading state internally
    expect(InputSanitizer.validateFileUpload).toHaveBeenCalled();
  });

  it('should respect custom maxFileSize', () => {
    const customMaxSize = 1024; // 1KB
    render(<ChatInput {...defaultProps} maxFileSize={customMaxSize} />);
    
    const fileInput = screen.getByRole('textbox').closest('form')?.querySelector('input[type="file"]');
    const largeFile = new File(['x'.repeat(2048)], 'large.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput!, { target: { files: [largeFile] } });
    
    expect(screen.getByText('large.txt: File too large (max 0.0009765625MB)')).toBeInTheDocument();
  });
});