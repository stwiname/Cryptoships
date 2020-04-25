export class PromiseCancelledError extends Error {
  constructor() {
    super();

    Object.setPrototypeOf(this, PromiseCancelledError.prototype);

    this.message = 'Promise Cancelled';
  }
}

export default class CancellablePromise<T> implements Promise<T> {
  get [Symbol.toStringTag]() {
    return 'CancellablePromise';
  }

  public static resolve = <T>(value: T): CancellablePromise<T> => {
    return new CancellablePromise(Promise.resolve(value), () => {
      // Handle if value is a CancellablePromise
      if (
        value &&
        (value as any).cancel &&
        typeof (value as any).cancel === 'function'
      ) {
        (value as any).cancel();
      }
    });
  };

  public static reject = (reason: any): CancellablePromise<void> => {
    return new CancellablePromise(Promise.reject(reason), () => null);
  };

  public static all = <T>(
    promises: Array<CancellablePromise<T>>
  ): CancellablePromise<T[]> => {
    return new CancellablePromise(Promise.all(promises), () => {
      promises.map(p => p.cancel());
    });
  };

  public static race = <T>(
    promises: Array<CancellablePromise<T>>
  ): CancellablePromise<T> => {
    return new CancellablePromise(Promise.race(promises), () => {
      promises.map(p => p.cancel());
    });
  };

  public static makeCancellable = <V>(pendingValue: Promise<V>): CancellablePromise<V> => {
    let isCancelled = false;

    return new CancellablePromise<V>(pendingValue, () => isCancelled = true)
      .map(val => {
        if (isCancelled) {
          throw new PromiseCancelledError();
        }
        return val;
      })
      .mapError(e => {
        if (isCancelled) {
          throw new PromiseCancelledError();
        }
        throw e;
      });
  }

  constructor(private pendingValue: Promise<T>, public cancel: () => void) {}

  public async then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): Promise<TResult1 | TResult2> {
    return this.pendingValue.then(onfulfilled, onrejected);
  }

  public finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return (this.pendingValue as any).finally(onfinally);
  }

  public async catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<T | TResult> {
    return this.pendingValue.catch(onrejected);
  }

  public map<Y>(f: (x: T) => Y) {
    return new CancellablePromise(this.pendingValue.then(f), this.cancel);
  }

  public mapError(f: (x: Error) => T) {
    return new CancellablePromise(this.pendingValue.catch(f), this.cancel);
  }
}

export const logNotCancelledError = (msg: string) => (e: Error) => {
  if (e instanceof PromiseCancelledError) {
    return;
  }
  console.error(msg, e);
}