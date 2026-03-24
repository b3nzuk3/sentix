import { OpenRouterClient } from '../openRouter';
import type { Theme } from '../types';

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
                { title: 'Test Theme', reason: 'Because it is a test', confidence: 0.9, evidence: ['signal-1'] }
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
    );

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };
    const result = await client.extractThemes(context);

    expect(result).toEqual([{
      title: 'Test Theme',
      reason: 'Because it is a test',
      confidence: 0.9,
      evidence: ['signal-1']
    }]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('malformed JSON response throws error', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: 'invalid JSON{{{'
          }
        }
      ]
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    );

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    await expect(client.extractThemes(context)).rejects.toThrow('Unexpected token');
  });

  it('missing choices array throws error', async () => {
    const mockResponse = {
      data: 'no choices here'
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    );

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    await expect(client.extractThemes(context)).rejects.toThrow('missing content');
  });

  it('missing message.content throws error', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: null
          }
        }
      ]
    };

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)
    );

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    await expect(client.extractThemes(context)).rejects.toThrow('missing content');
  });

  it('empty themes array returns empty array', async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              themes: []
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
    );

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };
    const result = await client.extractThemes(context);

    expect(result).toEqual([]);
  });

  it('500 response throws error with status', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' })
      } as Response)
    );

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };
    await expect(client.extractThemes(context)).rejects.toThrow(
      'OpenRouter error 500: Internal server error'
    );
  });

  it('400 response does not retry', async () => {
    jest.useFakeTimers();
    let fetchCount = 0;
    global.fetch = jest.fn(() => {
      fetchCount++;
      return Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ message: 'Bad request' })
      } as Response);
    });

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    const promise = client.extractThemes(context);
    promise.catch(() => {});

    await jest.runAllTimersAsync();
    await Promise.resolve();

    expect(fetchCount).toBe(1);
  });

  it('401 response does not retry', async () => {
    jest.useFakeTimers();
    let fetchCount = 0;
    global.fetch = jest.fn(() => {
      fetchCount++;
      return Promise.resolve({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      } as Response);
    });

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    const promise = client.extractThemes(context);
    promise.catch(() => {});

    await jest.runAllTimersAsync();
    await Promise.resolve();

    expect(fetchCount).toBe(1);
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
                    { title: 'Retry Success', reason: 'Retry worked', confidence: 0.95, evidence: [] }
                  ]
                })
              }
            }
          ]
        })
      } as Response);
    });

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    const promise = client.extractThemes(context);

    // Fast-forward 1 second (first retry delay)
    await jest.runAllTimersAsync();

    const result = await promise;

    expect(result).toEqual([{ title: 'Retry Success', reason: 'Retry worked', confidence: 0.95, evidence: [] }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('fails after 3 retries with exponential backoff if all attempts fail', async () => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    let capturedError: Error | null = null;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFetch = jest.fn((input: any, options?: any) => {
      fetchAttempt++;
      if (fetchAttempt === 1) {
        const signal = options?.signal as AbortSignal | undefined;
        return new Promise<Response>((resolve, reject) => {
          if (signal) {
            signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
          }
        });
      }
      // Subsequent attempts fail immediately with network error
      return Promise.reject(new Error('Network error'));
    });

    global.fetch = mockFetch;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    let capturedError: Error | null = null;
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

  it('should not abort controller when response parsing fails', async () => {
    jest.useFakeTimers();
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');

    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              themes: [
                { title: 'Test Theme', reason: 'Test reason', confidence: 0.9, evidence: ['sig1'] }
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
    );

    // Override JSON.parse to throw
    const originalJSONParse = JSON.parse;
    JSON.parse = jest.fn(() => {
      throw new SyntaxError('Unexpected token');
    });

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };

    const promise = client.extractThemes(context);
    promise.catch(() => {});

    await jest.runAllTimersAsync();
    await Promise.resolve();

    // Verify abort was called (timeout was cleaned up properly)
    expect(abortSpy).toHaveBeenCalledTimes(0);

    JSON.parse = originalJSONParse;
    abortSpy.mockRestore();
  });
});
