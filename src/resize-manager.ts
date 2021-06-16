import { ResizableTarget, GTResizeObserver } from "./resize-observer";

export class ResizeManager {
  private _buffer = new Map<ResizableTarget, GTResizeObserver>();

  constructor(
    private observerThrottleTime: number = 90
  ) {
  }

  public observe(target: ResizableTarget, throttleTime = this.observerThrottleTime): GTResizeObserver {
    if (!this._buffer.has(target)) {
      this._buffer.set(target, new GTResizeObserver(target, throttleTime));
    }

    return this._buffer.get(target);
  }

  public get root(): GTResizeObserver {
    return this.observe(window);
  }
}
