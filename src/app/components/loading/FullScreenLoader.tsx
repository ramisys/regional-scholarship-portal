import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FullScreenLoaderProps {
  title?: string;
  description?: string;
}

export const FullScreenLoader: React.FC<FullScreenLoaderProps> = ({
  title = 'Loading…',
  description = 'Preparing your experience',
}) => {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/60 px-4">
      <div className="max-w-sm rounded-2xl border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_60px_-30px_rgba(37,99,235,0.35)] backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/80">
          <LoadingSpinner size="lg" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600" />
        </div>
      </div>
    </div>
  );
};
