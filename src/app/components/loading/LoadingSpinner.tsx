import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-4',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className, size = 'md' }) => {
  return (
    <span
      className={cn(
        'inline-block animate-spin rounded-full border-current border-r-transparent motion-reduce:animate-none',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    />
  );
};
