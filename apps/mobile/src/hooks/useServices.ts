import { useQuery } from '@tanstack/react-query';

import { fetchServices, type Service } from '../api/services';
import { cacheServices } from '../cache/servicesCache';
import { servicesQueryKey } from '../query/keys';

export const useServices = () =>
  useQuery<Service[], Error>({
    queryKey: servicesQueryKey,
    queryFn: fetchServices,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    onSuccess: async (data) => {
      await cacheServices(data);
    },
  });
