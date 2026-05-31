import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { cn } from '../../utils/cn';

interface ButtonLoaderProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingLabel?: string;
  className?: string;
}

export const ButtonLoader: React.FC<ButtonLoaderProps> = ({
  isLoading,
  children,
  loadingLabel,
  className,
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <span className={cn('inline-flex items-center justify-center gap-2', className)}>
      <LoadingSpinner size="sm" />
      <span>{loadingLabel ?? 'Loading...'}</span>
    </span>
  );
};
