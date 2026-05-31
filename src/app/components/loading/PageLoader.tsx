import React from 'react';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../utils/cn';

interface PageLoaderProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  title = 'Loading content',
  description = 'Fetching the latest data',
  children,
  className = '',
}) => {
  return (
    <div className={cn('space-y-6', className)} aria-busy="true" aria-live="polite">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <span className="sr-only">
          {title}. {description}
        </span>
      </div>
      {children}
    </div>
  );
};

export default PageLoader;