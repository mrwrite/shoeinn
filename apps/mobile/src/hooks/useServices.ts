import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchServices, type Service } from '../api/services';
import { cacheServices } from '../cache/servicesCache';
import { servicesQueryKey } from '../query/keys';

export const useServices = () => {
  const query = useQuery<Service[], Error>({
    queryKey: servicesQueryKey,
    queryFn: fetchServices,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // v5: do side-effects in effects, not in options
  useEffect(() => {
    if (query.data) {
      cacheServices(query.data).catch((e) =>
        console.warn('[Services] cache failed:', e)
      );
    }
  }, [query.data]);

  return query;
};
