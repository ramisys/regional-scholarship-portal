import React from 'react';
import { Progress } from '../ui/progress';
import { cn } from '../../utils/cn';

interface UploadProgressLoaderProps {
  progress: number;
  statusText?: string;
  className?: string;
}

export const UploadProgressLoader: React.FC<UploadProgressLoaderProps> = ({
  progress,
  statusText = 'Uploading file',
  className,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn('space-y-2 rounded-lg border border-blue-100 bg-blue-50/80 p-4', className)}>
      <div className="flex items-center justify-between text-sm text-blue-900">
        <span>{statusText}</span>
        <span>{clampedProgress}%</span>
      </div>
      <Progress value={clampedProgress} />
    </div>
  );
};
