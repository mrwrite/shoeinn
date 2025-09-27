import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';

import { cacheServices, hydrateServicesCache, loadServicesCache } from '../cache/servicesCache';
import type { Service } from '../api/services';
import { servicesQueryKey } from '../query/keys';

describe('services cache hydration', () => {
  const sampleServices: Service[] = [
    {
      id: '1',
      name: 'Cut & Style',
      description: null,
      price: 45,
      price_cents: 4500,
      duration_min: 30,
      company: {
        id: 'company-1',
        name: 'Shoe Inn',
        city: 'Seattle',
        state: 'WA',
      },
      status: 'active',
    },
  ];

  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists and hydrates services into the query cache', async () => {
    const queryClient = new QueryClient();

    await cacheServices(sampleServices);
    const stored = await loadServicesCache();

    expect(stored).toEqual(sampleServices);

    await hydrateServicesCache(queryClient);

    const hydrated = queryClient.getQueryData<Service[]>(servicesQueryKey);
    expect(hydrated).toEqual(sampleServices);
  });
});
