export interface FetchWithRetryOptions extends RequestInit {
  retries?: number;
  backoffMs?: number;
}

const defaultRetries = 3;
const defaultBackoff = 500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(
  input: RequestInfo | URL,
  { retries = defaultRetries, backoffMs = defaultBackoff, ...options }: FetchWithRetryOptions = {}
): Promise<Response> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      const response = await fetch(input, options);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }
      const delay = backoffMs * Math.pow(2, attempt);
      await wait(delay);
    }
    attempt += 1;
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Request failed after retries');
}
