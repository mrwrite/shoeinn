import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  PENDING_UPDATES_KEY,
  PendingServiceUpdate,
  loadPendingUpdates,
  persistPendingUpdates,
  processPendingUpdates,
} from '../offline/queue';

describe('offline queue management', () => {
  const updates: PendingServiceUpdate[] = [
    { id: '1', status: 'inactive', queuedAt: 1 },
    { id: '2', status: 'active', queuedAt: 2 },
    { id: '3', status: 'inactive', queuedAt: 3 },
  ];

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists pending updates and loads them back', async () => {
    await persistPendingUpdates(updates);
    const stored = await AsyncStorage.getItem(PENDING_UPDATES_KEY);
    expect(stored).toBe(JSON.stringify(updates));

    const loaded = await loadPendingUpdates();
    expect(loaded).toEqual(updates);
  });

  it('removes storage entry when queue is empty', async () => {
    await persistPendingUpdates([]);
    const stored = await AsyncStorage.getItem(PENDING_UPDATES_KEY);
    expect(stored).toBeNull();
  });

  it('stops processing when a worker throws and returns remaining items', async () => {
    const worker = jest
      .fn<Promise<void>, [PendingServiceUpdate]>()
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('offline'));

    const { processed, remaining } = await processPendingUpdates(updates, worker);

    expect(worker).toHaveBeenCalledTimes(2);
    expect(processed).toHaveLength(1);
    expect(remaining).toEqual(updates.slice(1));
  });
});
