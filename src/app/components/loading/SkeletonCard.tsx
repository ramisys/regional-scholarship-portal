import React from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../utils/cn';

interface SkeletonCardProps {
  compact?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ compact = false, className }) => {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="space-y-3 border-b">
        <Skeleton className="h-5 w-40" />
        {!compact && <Skeleton className="h-4 w-56 max-w-full" />}
      </CardHeader>
      <CardContent className={compact ? 'p-4' : 'p-6'}>
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
};
