import { OpenRouterClient } from '../openRouter';

describe('OpenRouterClient', () => {
  const originalFetch = global.fetch;
  const mockEnv = { OPENROUTER_API_KEY: 'test-api-key' };

  beforeEach(() => {
    process.env = { ...mockEnv };
    global.fetch = originalFetch;
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should throw error if OPENROUTER_API_KEY is missing', () => {
    delete process.env.OPENROUTER_API_KEY;
    expect(() => new OpenRouterClient()).toThrow(
      'OPENROUTER_API_KEY environment variable is required'
    );
  });

  it('successful API call returns parsed themes', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              themes: [
                { title: 'Test Theme', confidence: 0.9 }
              ]
            })
          }
        }
      ]
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    ) as jest.Mock;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };
    const result = await client.extractThemes(context);

    expect(result).toEqual([{ title: 'Test Theme', confidence: 0.9 }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('500 response throws error with status', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' })
      } as Response)
    ) as jest.Mock;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };
    await expect(client.extractThemes(context)).rejects.toThrow(
      'OpenRouter error (500): Internal server error'
    );
  });

  it('retries on network error with exponential backoff and succeeds on second attempt', async () => {
    jest.useFakeTimers();
    // First call rejects, second call succeeds
    let callCount = 0;
    global.fetch = jest.fn(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  themes: [
                    { title: 'Retry Success', confidence: 0.95 }
                  ]
                })
              }
            }
          ]
        })
      } as Response);
    }) as jest.Mock;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    const promise = client.extractThemes(context);

    // Fast-forward 1 second (first retry delay)
    await jest.runAllTimersAsync();

    const result = await promise;

    expect(result).toEqual([{ title: 'Retry Success', confidence: 0.95 }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('fails after 3 retries with exponential backoff if all attempts fail', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    let capturedError: any = null;
    const promise = client.extractThemes(context);
    // Attach early catch to avoid unhandled rejection warning
    promise.catch(e => { capturedError = e; });

    // Run all timers; this will also process microtasks that schedule retries
    await jest.runAllTimersAsync();
    // Flush any remaining microtasks
    await Promise.resolve();

    expect(capturedError).toBeInstanceOf(Error);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('aborts fetch after 30 second timeout and retries', async () => {
    jest.useFakeTimers();
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

    let fetchAttempt = 0;
    const mockFetch = jest.fn((url: any, options?: any) => {
      fetchAttempt++;
      if (fetchAttempt === 1) {
        const signal = options?.signal as AbortSignal | undefined;
        return new Promise((resolve, reject) => {
          if (signal) {
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
          }
        });
      }
      // Subsequent attempts fail immediately
      return Promise.reject(new Error('Network error'));
    }) as jest.Mock;

    global.fetch = mockFetch;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    let capturedError: any = null;
    const promise = client.extractThemes(context);
    promise.catch(e => { capturedError = e; });

    // Run all timers (30s timeout, then retries) until promise settles
    await jest.runAllTimersAsync();
    // Flush any remaining microtasks
    await Promise.resolve();

    expect(capturedError).toBeInstanceOf(Error);

    expect(abortSpy).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(3);

    abortSpy.mockRestore();
  });
});
