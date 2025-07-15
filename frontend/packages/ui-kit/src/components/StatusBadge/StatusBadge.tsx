import React from 'react';
import { cn } from '../../utils';

interface StatusBadgeProps {
  status: 'idle' | 'busy' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

const statusClasses = {
  idle: 'bg-gray-100 text-gray-800 border-gray-300',
  busy: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  error: 'bg-red-100 text-red-800 border-red-300',
  success: 'bg-green-100 text-green-800 border-green-300',
};

const sizeClasses = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  className,
  children,
  'data-testid': testId = 'status-badge',
}) => {
  const displayText = children || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      data-testid={testId}
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        statusClasses[status],
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label={`Status: ${status}`}
    >
      <span
        className={cn(
          'mr-1.5 h-2 w-2 rounded-full',
          status === 'idle' && 'bg-gray-500',
          status === 'busy' && 'bg-yellow-500 animate-pulse',
          status === 'error' && 'bg-red-500',
          status === 'success' && 'bg-green-500'
        )}
      />
      {displayText}
    </span>
  );
};

export default StatusBadge;