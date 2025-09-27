import { fetchWithRetry } from './src/api/fetchWithRetry';

describe('fetchWithRetry', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves immediately when the first request succeeds', async () => {
    const mockResponse = { ok: true } as Response;
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(mockResponse);

    const result = await fetchWithRetry('https://example.com');

    expect(result).toBe(mockResponse);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('retries when the request fails and eventually succeeds', async () => {
    const error = new Error('network error');
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockResolvedValue({ ok: true } as Response);

    const response = await fetchWithRetry('https://example.com', {
      retries: 2,
      backoffMs: 1,
    });

    expect(response.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });
});
