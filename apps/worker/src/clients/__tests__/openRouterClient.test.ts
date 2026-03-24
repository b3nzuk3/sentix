import { OpenRouterClient } from '../openRouter';

describe('OpenRouterClient', () => {
  const originalFetch = global.fetch;
  const mockEnv = { OPENROUTER_API_KEY: 'test-api-key' };

  beforeEach(() => {
    process.env = { ...mockEnv };
    global.fetch = originalFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('retries on network error and succeeds on second attempt', async () => {
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
    const result = await client.extractThemes(context);

    expect(result).toEqual([{ title: 'Retry Success', confidence: 0.95 }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('fails after 3 retries if all attempts fail', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;

    const client = new OpenRouterClient();
    const context = {
      project: { name: 'Test Project', description: 'A test project' },
      signals: []
    };
    await expect(client.extractThemes(context)).rejects.toThrow('Unknown error after retries');
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
});
