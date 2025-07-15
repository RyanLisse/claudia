import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  it('renders modal content when open', () => {
    render(<Modal {...defaultProps} />);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render modal content when closed', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal {...defaultProps} title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<Modal {...defaultProps} description="Test Description" />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when escape key is pressed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    await user.keyboard('{Escape}');
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when escape key is pressed if closeOnEscape is false', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    
    render(<Modal {...defaultProps} onClose={onClose} closeOnEscape={false} />);
    
    await user.keyboard('{Escape}');
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('applies correct size variants', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-sm');

    rerender(<Modal {...defaultProps} size="xl" />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-xl');
  });

  it('applies custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Modal {...defaultProps} title="Test Title" description="Test Description">
        <div>Content</div>
      </Modal>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby');
    expect(dialog).toHaveAttribute('aria-describedby');
  });
});

describe('Modal composition components', () => {
  it('renders ModalHeader correctly', () => {
    render(<ModalHeader>Header content</ModalHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders ModalBody correctly', () => {
    render(<ModalBody>Body content</ModalBody>);
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders ModalFooter correctly', () => {
    render(<ModalFooter>Footer content</ModalFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('applies custom className to composition components', () => {
    render(
      <div>
        <ModalHeader className="custom-header">Header</ModalHeader>
        <ModalBody className="custom-body">Body</ModalBody>
        <ModalFooter className="custom-footer">Footer</ModalFooter>
      </div>
    );
    
    expect(screen.getByText('Header')).toHaveClass('custom-header');
    expect(screen.getByText('Body')).toHaveClass('custom-body');
    expect(screen.getByText('Footer')).toHaveClass('custom-footer');
  });
});