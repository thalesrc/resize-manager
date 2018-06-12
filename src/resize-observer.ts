import { Observable, fromEvent, Subject } from "rxjs";
import { share, map, filter, throttleTime } from "rxjs/operators";
import ResizeObserver from 'resize-observer-polyfill';

/**
 * Resizable Target Type (HTMLElement or Window)
 */
export type IResizableTarget = HTMLElement | Window;

/**
 * Resize Event
 */
export interface IResizeEvent {
  /**
   * width of the target in pixels
   */
  width: number;

  /**
   * height of the target in pixels
   */
  height: number;
}

/**
 * Resize Event provider of all registered elements
 */
const RESIZE_EVENTS_SUBJECT = new Subject<ResizeObserverEntry>();

/**
 * Observable instance of RESIZE_EVENTS_SUBJECT
 * @see RESIZE_EVENTS_SUBJECT
 */
const RESIZE_EVENTS = RESIZE_EVENTS_SUBJECT.pipe(share());

/**
 * Html Elements' Resize Observer
 */
const RESIZE_OBSERVER = new ResizeObserver(entries => {
  entries.forEach(entry => RESIZE_EVENTS_SUBJECT.next(entry));
});

/**
 * Cache of observed elements with observers
 */
const OBSERVER_CACHE = new Map<IResizableTarget, {count: number; observable: Observable<IResizeEvent>}>();

/**
 * Creates and registers resize observers for the target with factory given
 * @param target Target to provide resize events
 * @param factory Resize Event Observable Factory
 */
function resizeEventProvider(target: IResizableTarget, factory: (target: IResizableTarget) => Observable<IResizeEvent>): Observable<IResizeEvent> {
  let cache = OBSERVER_CACHE.get(target);

  if (!cache) {
    cache = { count: 0, observable: factory(target) };
  }

  cache.count++;
  return cache.observable;
}

/**
 * Creates and registers resize observer for a window instance
 * @param target Target Window Object
 */
function windowResizeEventProvider(target: Window): Observable<IResizeEvent> {
  return resizeEventProvider(target, (target: Window) => {
    return fromEvent(target, "resize")
    .pipe(map(e => ({width: target.innerWidth, height: target.innerHeight})))
    .pipe(share())
  });
}

/**
 * Creates and registers resize observer for an HTMLElement instance
 * @param target Target Window Object
 */
function domElementResizeEventProvider(target: HTMLElement): Observable<IResizeEvent> {
  return resizeEventProvider(target, (target: HTMLElement) => {
    RESIZE_OBSERVER.observe(target);
    return RESIZE_EVENTS
      .pipe(filter(e => e.target === target))
      .pipe(map(entry => ({width: entry.contentRect.width, height: entry.contentRect.height})))
      .pipe(share());
  });
}

/**
 * #### Resize Observer
 * Provides improved resize observables
 */
export class GTResizeObserver {
  /**
   * The Base Resize Observable
   * All the other events are derived from this
   * Fires the width & height in pixels
   */
  private _provider: Observable<IResizeEvent>;

  /**
   * The buffer for the observables which are throttled by the same time
   */
  private _buffer: {[key: number]: Observable<IResizeEvent>} = {};

  /**
   * @param target Target to listen its resize events
   * @param throttleTime Time interval to throttle resize events
   * > The throttle time under 90ms will not work well because of performance prospects.
   * > It will fire much less event than expected.
   * > Use in caution!
   */
  constructor(
    private target: IResizableTarget,
    private throttleTime = 90
  ) {
    this._provider = target instanceof Window
      ? windowResizeEventProvider(target)
      : domElementResizeEventProvider(target);
  }

  /**
   * Base Resize Observable
   *
   * Fires on every resize event
   *
   * _By default, throttles events for every [90ms]{@link ScrollObserver#throttleTime}, use [throttleBy]{@link ScrollObserver#throttled} if need something else_
   */
  get resize(): Observable<IResizeEvent> {
    return this.throttleBy(this.throttleTime);
  }

  /**
   * Returns throttled resize events by given time
   *
   * Set `time` argument to `0` if want to catch all events
   *
   * @param time Time to throttle events
   */
  public throttleBy(time: number): Observable<IResizeEvent> {
    if (time <= 0) {
      return this._provider;
    }

    if (!(time in this._buffer)) {
      this._buffer[time] = this._provider.pipe(throttleTime(time));
    }

    return this._buffer[time];
  }
}