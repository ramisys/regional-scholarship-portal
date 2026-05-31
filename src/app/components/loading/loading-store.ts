import { useSyncExternalStore } from 'react';

type Listener = () => void;

let activeRequestCount = 0;
const listeners = new Set<Listener>();

const emitChange = () => {
  listeners.forEach((listener) => listener());
};

export const startGlobalLoading = () => {
  activeRequestCount += 1;
  emitChange();
};

export const stopGlobalLoading = () => {
  activeRequestCount = Math.max(0, activeRequestCount - 1);
  emitChange();
};

const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => activeRequestCount;

export const useGlobalLoadingCount = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export const useIsGlobalLoading = () => useGlobalLoadingCount() > 0;
