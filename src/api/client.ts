import { ELEVENLABS_API_BASE, ERROR_MESSAGES } from '../config/constants.js';
import type { ElevenLabsError } from '../types/index.js';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  responseType?: 'json' | 'arraybuffer';
}

interface ClientConfig {
  apiKey: string;
  maxRetries?: number;
  retryDelayMs?: number;
}

export class ElevenLabsClient {
  private apiKey: string;
  private maxRetries: number;
  private retryDelayMs: number;

  constructor(config: ClientConfig) {
    this.apiKey = config.apiKey;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getErrorMessage(status: number, detail?: string): string {
    const baseMessage = ERROR_MESSAGES[status] || `HTTP Error ${status}`;
    return detail ? `${baseMessage}: ${detail}` : baseMessage;
  }

  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      responseType = 'json',
    } = options;

    const url = `${ELEVENLABS_API_BASE}${endpoint}`;

    const requestHeaders: Record<string, string> = {
      'xi-api-key': this.apiKey,
      ...headers,
    };

    if (body && !requestHeaders['Content-Type']) {
      requestHeaders['Content-Type'] = 'application/json';
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorBody = await response.text();
          let errorDetail: string | undefined;

          try {
            const errorJson = JSON.parse(errorBody) as ElevenLabsError;
            errorDetail = errorJson.detail?.message;
          } catch {
            errorDetail = errorBody;
          }

          const error = new Error(this.getErrorMessage(response.status, errorDetail));
          (error as any).status = response.status;

          // Retry on rate limit or server errors
          if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
            const delay = Math.pow(2, attempt) * this.retryDelayMs;
            console.error(`Request failed with ${response.status}, retrying in ${delay}ms...`);
            await this.sleep(delay);
            lastError = error;
            continue;
          }

          throw error;
        }

        if (responseType === 'arraybuffer') {
          return await response.arrayBuffer() as T;
        }

        return await response.json() as T;
      } catch (error) {
        if ((error as any).status) {
          // This is our formatted error, not a network error
          throw error;
        }

        // Network error - retry
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * this.retryDelayMs;
          console.error(`Network error, retrying in ${delay}ms...`, (error as Error).message);
          await this.sleep(delay);
          lastError = error as Error;
          continue;
        }

        throw new Error(`Network error after ${this.maxRetries + 1} attempts: ${(error as Error).message}`);
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  // GET request helper
  async get<T>(endpoint: string, responseType?: 'json' | 'arraybuffer'): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', responseType });
  }

  // POST request helper
  async post<T>(
    endpoint: string,
    body: unknown,
    responseType?: 'json' | 'arraybuffer'
  ): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, responseType });
  }

  // POST for audio generation (returns ArrayBuffer)
  async generateAudio(endpoint: string, body: unknown): Promise<ArrayBuffer> {
    return this.request<ArrayBuffer>(endpoint, {
      method: 'POST',
      body,
      responseType: 'arraybuffer',
    });
  }
}

// Singleton instance factory
let clientInstance: ElevenLabsClient | null = null;

export function getClient(): ElevenLabsClient {
  if (!clientInstance) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is required');
    }

    clientInstance = new ElevenLabsClient({
      apiKey,
      maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
      retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
    });
  }

  return clientInstance;
}

// Reset client (for testing)
export function resetClient(): void {
  clientInstance = null;
}
