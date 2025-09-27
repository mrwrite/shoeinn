import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';

import type { Service } from '../api/services';
import { servicesQueryKey } from '../query/keys';

export const SERVICES_CACHE_KEY = 'services-cache';

export const cacheServices = async (services: Service[]): Promise<void> => {
  await AsyncStorage.setItem(SERVICES_CACHE_KEY, JSON.stringify(services));
};

export const loadServicesCache = async (): Promise<Service[] | null> => {
  const raw = await AsyncStorage.getItem(SERVICES_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Service[];
    return parsed;
  } catch (error) {
    await AsyncStorage.removeItem(SERVICES_CACHE_KEY);
    return null;
  }
};

export const hydrateServicesCache = async (queryClient: QueryClient): Promise<void> => {
  const cachedServices = await loadServicesCache();
  if (cachedServices) {
    queryClient.setQueryData<Service[]>(servicesQueryKey, cachedServices);
  }
};
