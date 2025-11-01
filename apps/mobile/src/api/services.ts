import { Platform } from 'react-native';
import Constants from 'expo-constants';

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

const DEFAULT_API_PORT = 8000;

const getExpoHost = (): string | undefined => {
  const debuggerHost = Constants.expoGoConfig?.debuggerHost;
  if (debuggerHost) {
    return debuggerHost.split(':')[0];
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  return undefined;
};

const resolveApiBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    return envUrl;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_API_PORT}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
};

const API_BASE_URL = resolveApiBaseUrl();

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
