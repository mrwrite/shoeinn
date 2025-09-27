import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ServiceStatus } from '../api/services';

export interface PendingServiceUpdate {
  id: string;
  status: ServiceStatus;
  queuedAt: number;
}

export const PENDING_UPDATES_KEY = 'pending-service-updates';

export const loadPendingUpdates = async (): Promise<PendingServiceUpdate[]> => {
  const raw = await AsyncStorage.getItem(PENDING_UPDATES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as PendingServiceUpdate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    await AsyncStorage.removeItem(PENDING_UPDATES_KEY);
    return [];
  }
};

export const persistPendingUpdates = async (
  queue: PendingServiceUpdate[],
): Promise<void> => {
  if (!queue.length) {
    await AsyncStorage.removeItem(PENDING_UPDATES_KEY);
    return;
  }

  await AsyncStorage.setItem(PENDING_UPDATES_KEY, JSON.stringify(queue));
};

export interface ProcessQueueResult {
  processed: PendingServiceUpdate[];
  remaining: PendingServiceUpdate[];
}

export const processPendingUpdates = async (
  queue: PendingServiceUpdate[],
  worker: (item: PendingServiceUpdate) => Promise<void>,
): Promise<ProcessQueueResult> => {
  const processed: PendingServiceUpdate[] = [];

  for (let index = 0; index < queue.length; index += 1) {
    const item = queue[index];

    try {
      await worker(item);
      processed.push(item);
    } catch (error) {
      return {
        processed,
        remaining: queue.slice(index),
      };
    }
  }

  return {
    processed,
    remaining: [],
  };
};
