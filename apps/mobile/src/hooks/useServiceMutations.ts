import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  type Service,
  type ServiceStatus,
  updateServiceStatus,
} from '../api/services';
import { cacheServices } from '../cache/servicesCache';
import { useOfflineManager } from '../offline/OfflineProvider';
import type { PendingServiceUpdate } from '../offline/queue';
import { servicesQueryKey } from '../query/keys';

interface UpdateVariables {
  id: string;
  status: ServiceStatus;
}

interface MutationContext {
  previousServices?: Service[];
}

interface QueuedResult {
  queued: true;
}

interface SuccessResult {
  queued: false;
  service: Service;
}

type MutationResult = QueuedResult | SuccessResult;

export const useServiceStatusMutation = () => {
  const queryClient = useQueryClient();
  const { isOnline, enqueueUpdate } = useOfflineManager();

  return useMutation<MutationResult, Error, UpdateVariables, MutationContext>({
    mutationFn: async ({ id, status }) => {
      if (!isOnline) {
        const update: PendingServiceUpdate = {
          id,
          status,
          queuedAt: Date.now(),
        };
        await enqueueUpdate(update);
        return { queued: true };
      }

      const service = await updateServiceStatus({ id, status });
      return { queued: false, service };
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: servicesQueryKey });

      const previousServices = queryClient.getQueryData<Service[]>(servicesQueryKey);

      queryClient.setQueryData<Service[]>(servicesQueryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((service) =>
          service.id === id ? { ...service, status } : service,
        );
      });

      return { previousServices };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData<Service[]>(servicesQueryKey, context.previousServices);
      }
    },
    onSuccess: async (result) => {
      if (!result.queued) {
        queryClient.setQueryData<Service[]>(servicesQueryKey, (current) => {
          if (!current) {
            return current;
          }
          return current.map((service) =>
            service.id === result.service.id ? result.service : service,
          );
        });
      }
    },
    onSettled: async () => {
      const services = queryClient.getQueryData<Service[]>(servicesQueryKey);
      if (services) {
        await cacheServices(services);
      }
    },
  });
};
