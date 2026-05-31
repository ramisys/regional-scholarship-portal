import React from 'react';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

interface LoadingErrorStateProps {
  title: string;
  description: string;
  onRetry: () => void;
  className?: string;
}

export const LoadingErrorState: React.FC<LoadingErrorStateProps> = ({
  title,
  description,
  onRetry,
  className,
}) => {
  return (
    <div className={cn('rounded-xl border border-red-200 bg-red-50 p-6 text-center', className)}>
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="mt-2 text-sm text-red-700">{description}</p>
      <Button className="mt-4" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
};
