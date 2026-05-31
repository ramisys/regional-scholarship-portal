import React from 'react';
import { useIsGlobalLoading } from './loading-store';

export const GlobalRequestBar: React.FC = () => {
  const isLoading = useIsGlobalLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-transparent"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">Loading content</span>
      <div className="h-full w-full origin-left animate-pulse bg-gradient-to-r from-blue-500 via-sky-400 to-blue-600" />
    </div>
  );
};
