import { ResizableTarget, GTResizeObserver } from "./resize-observer";

export class ResizeManager {
  private _buffer = new Map<ResizableTarget, GTResizeObserver>();

  constructor(
    private observerThrottleTime?: number
  ) {
  }

  public observe(target: ResizableTarget): GTResizeObserver {
    if (!this._buffer.has(target)) {
      this._buffer.set(target, new GTResizeObserver(target, this.observerThrottleTime));
    }

    return this._buffer.get(target);
  }

  public get root(): GTResizeObserver {
    return this.observe(window);
  }
}
