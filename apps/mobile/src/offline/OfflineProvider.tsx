import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';

import { cacheServices } from '../cache/servicesCache';
import type { Service } from '../api/services';
import { updateServiceStatus } from '../api/services';
import { servicesQueryKey } from '../query/keys';
import {
  PendingServiceUpdate,
  loadPendingUpdates,
  persistPendingUpdates,
  processPendingUpdates,
} from './queue';

interface OfflineContextValue {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  enqueueUpdate: (update: PendingServiceUpdate) => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

export const OfflineProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queue, setQueue] = useState<PendingServiceUpdate[]>([]);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadPendingUpdates().then((initialQueue) => {
      if (isMountedRef.current) {
        setQueue(initialQueue);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const setConnection = (connected: boolean) => {
      setIsOnline(connected);
    };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setConnection(connected);
    });

    NetInfo.fetch().then((state) => {
      const connected = Boolean(state.isConnected && state.isInternetReachable !== false);
      setConnection(connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const persistQueue = useCallback(async (nextQueue: PendingServiceUpdate[]) => {
    await persistPendingUpdates(nextQueue);
  }, []);

  const flushQueue = useCallback(async () => {
    if (!isOnline || !queue.length || isSyncing) {
      return;
    }

    setIsSyncing(true);
    let remainingQueue = queue;

    try {
      const { remaining } = await processPendingUpdates(queue, async (item) => {
        await updateServiceStatus({ id: item.id, status: item.status });
      });

      remainingQueue = remaining;
      setQueue(remainingQueue);
      await persistQueue(remainingQueue);

      if (!remainingQueue.length) {
        await queryClient.invalidateQueries({ queryKey: servicesQueryKey });
      }
    } finally {
      const currentData = queryClient.getQueryData<Service[]>(servicesQueryKey);
      if (currentData) {
        await cacheServices(currentData);
      }
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, persistQueue, queryClient, queue]);

  useEffect(() => {
    if (isOnline && queue.length) {
      void flushQueue();
    }
  }, [flushQueue, isOnline, queue.length]);

  const enqueueUpdate = useCallback(
    async (update: PendingServiceUpdate) => {
      let nextQueue: PendingServiceUpdate[] = [];
      setQueue((current) => {
        nextQueue = [...current, update];
        return nextQueue;
      });
      await persistQueue(nextQueue);
    },
    [persistQueue],
  );

  const value = useMemo(
    () => ({
      isOnline,
      isSyncing,
      pendingCount: queue.length,
      enqueueUpdate,
    }),
    [enqueueUpdate, isOnline, isSyncing, queue.length],
  );

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
};

export const useOfflineManager = (): OfflineContextValue => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOfflineManager must be used within an OfflineProvider');
  }
  return context;
};
