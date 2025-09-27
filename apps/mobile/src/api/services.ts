import { fetchWithRetry } from './fetchWithRetry';

export type ServiceStatus = 'active' | 'inactive';

export interface Service {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  price_cents: number;
  duration_min?: number | null;
  company: {
    id: string;
    name: string;
    city?: string | null;
    state?: string | null;
  };
  status: ServiceStatus;
}

const API_BASE_URL = 'http://192.168.128.1:8000';

const mapService = (service: any): Service => ({
  ...service,
  status: (service?.status ?? 'active') as ServiceStatus,
});

export async function fetchServices(): Promise<Service[]> {
  const response = await fetchWithRetry(`${API_BASE_URL}/services`);
  const data = await response.json();
  return Array.isArray(data) ? data.map(mapService) : [];
}

export async function updateServiceStatus({
  id,
  status,
}: {
  id: string;
  status: ServiceStatus;
}): Promise<Service> {
  const response = await fetchWithRetry(`${API_BASE_URL}/services/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  return mapService({ ...data, status });
}
