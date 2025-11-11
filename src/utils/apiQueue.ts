interface QueuedRequest {
  id: string;
  url: string;
  options: RequestInit; // eslint-disable-line no-undef
  retryCount?: number;
  resolve: (value: Response) => void; // eslint-disable-line no-undef
  reject: (reason?: unknown) => void;
}

import { fetchWithTimeout } from './fetchWithTimeout';

class APIRequestQueue {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private maxConcurrent = 1; // Process one request at a time
  private activeRequests = 0;

  constructor(private fetchWithTimeout: (url: string, options: RequestInit, retryCount?: number) => Promise<Response>) {} // eslint-disable-line no-undef

  enqueue(url: string, options: RequestInit, retryCount?: number): Promise<Response> { // eslint-disable-line no-undef
    return new Promise<Response>((resolve, reject) => { // eslint-disable-line no-undef
      const request: QueuedRequest = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        url,
        options,
        retryCount,
        resolve,
        reject
      };

      this.queue.push(request);
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const request = this.queue.shift()!;
      this.activeRequests++;

      try {
        const response = await this.fetchWithTimeout(request.url, request.options, request.retryCount);
        request.resolve(response);
      } catch (error) {
        request.reject(error);
      } finally {
        this.activeRequests--;
      }
    }

    this.processing = false;

    // If there are more requests and we're not at max concurrency, process again
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      setTimeout(() => this.processQueue(), 0); // eslint-disable-line no-undef
    }
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }
}

// Create a singleton instance
const apiQueue = new APIRequestQueue(fetchWithTimeout);

// Exported function to use the queue
export const queuedFetch = (url: string, options: RequestInit, retryCount?: number): Promise<Response> => { // eslint-disable-line no-undef
  return apiQueue.enqueue(url, options, retryCount);
};

// Export the queue for monitoring if needed
export { apiQueue };
