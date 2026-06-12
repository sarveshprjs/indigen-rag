type State = "closed" | "open" | "half-open";

export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: State = "closed";
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(threshold = 5, timeoutMs = 60_000) {
    this.threshold = threshold;
    this.timeout = timeoutMs;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailure > this.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker OPEN — service unavailable");
      }
    }
    try {
      const result = await this.withRetry(fn);
      this.onSuccess();
      return result;
    } catch (e) {
      this.onFailure();
      throw e;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (e) {
        if (i === attempts - 1) throw e;
        await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500 + Math.random() * 200));
      }
    }
    throw new Error("Unreachable");
  }

  private onSuccess() {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) this.state = "open";
  }

  get status() {
    return { state: this.state, failures: this.failures };
  }
}

// Singleton
export const llmBreaker = new CircuitBreaker();
