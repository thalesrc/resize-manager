import { Observable, fromEvent, Subject } from "rxjs";
import { share, map, filter, throttleTime, merge, distinctUntilChanged, debounceTime, mapTo } from "rxjs/operators";
import { isTruthy } from "@thalesrc/js-utils";

/**
 * Resizable Target Type (HTMLElement or Window)
 */
export type ResizableTarget = HTMLElement | Window;

/**
 * Resize Event
 */
export interface ResizeEvent {
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
 * Mutation Event provider of all registered elements
 */
const MUTATION_EVENTS_SUBJECT = new Subject<MutationRecord>();

/**
 * Observable instance of MUTATION_EVENTS_SUBJECT
 * @see MUTATION_EVENTS_SUBJECT
 */
const MUTATION_EVENTS = MUTATION_EVENTS_SUBJECT.pipe(share());

/**
 * Html Elements' Mutation Observer
 */
const MUTATION_OBSERVER = new MutationObserver(records => {
  records.forEach(record => MUTATION_EVENTS_SUBJECT.next(record));
});

/**
 * Cache observed elements and observables
 */
const OBSERVER_CACHE = new WeakMap<ResizableTarget, Observable<ResizeEvent>>();

/**
 * Creates and registers resize observers for the target with factory given
 * @param target Target to provide resize events
 * @param factory Resize Event Observable Factory
 */
function resizeEventProvider(target: ResizableTarget, factory: (target: ResizableTarget) => Observable<ResizeEvent>): Observable<ResizeEvent> {
  let cache = OBSERVER_CACHE.get(target);

  if (!cache) {
    cache = factory(target);
    OBSERVER_CACHE.set(target, cache);
  }

  return cache;
}

/**
 * Creates and registers resize observer for a window instance
 * @param target Target Window Object
 */
function windowResizeEventProvider(target: Window): Observable<ResizeEvent> {
  return resizeEventProvider(target, (target: Window) => {
    return fromEvent(target, "resize").pipe(
      map(e => ({width: target.innerWidth, height: target.innerHeight})),
      share()
    );
  });
}

/**
 * Creates and registers resize observer for an HTMLElement instance
 * @param target Target Window Object
 */
function domElementResizeEventProvider(target: HTMLElement): Observable<ResizeEvent> {
  return resizeEventProvider(target, (target: HTMLElement) => {
    RESIZE_OBSERVER.observe(target);
    MUTATION_OBSERVER.observe(target, {attributes: true, characterData: true, subtree: true, childList: true});

    return RESIZE_EVENTS.pipe(
      filter(e => e.target === target),
      map(entry => (<ResizeEvent>{width: entry.contentRect.width, height: entry.contentRect.height})),
      merge(MUTATION_EVENTS.pipe(
        filter(record => record.type !== "attributes"),
        map(() => (<ResizeEvent>{width: target.offsetWidth, height: target.offsetHeight}))
      )),
      distinctUntilChanged(({width, height}, next) => width === next.width && height === next.height),
      share()
    );
  });
}

function bothTruthy(val1: any, val2: any): boolean {
  return isTruthy(val1) && isTruthy(val2);
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
  private _provider: Observable<ResizeEvent>;

  /**
   * The buffer for the observables which are throttled by the same time
   */
  private _buffer: {[key: number]: Observable<ResizeEvent>} = {};

  /**
   * @param target Target to listen its resize events
   * @param throttleTime Time interval to throttle resize events
   * > The throttle time under 90ms will not work well because of performance prospects.
   * > It will fire much less event than expected.
   * > Use in caution!
   */
  constructor(
    private target: ResizableTarget,
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
  get resize(): Observable<ResizeEvent> {
    return this.throttleBy(this.throttleTime);
  }

  /**
   * Emits only when resizing starts
   */
  get resizeStart(): Observable<ResizeEvent> {
    return this._provider.pipe(
      merge(this.resizeEnd.pipe(mapTo(false))),
      distinctUntilChanged(bothTruthy),
      filter(isTruthy)
    )
  }

  /**
   * Emits only when resizing ends
   */
  get resizeEnd(): Observable<ResizeEvent> {
    return this._provider.pipe(debounceTime(this.throttleTime));
  }

  /**
   * Returns throttled resize events by given time
   *
   * Set `time` argument to `0` if want to catch all events
   *
   * @param time Time to throttle events
   */
  public throttleBy(time: number): Observable<ResizeEvent> {
    if (time <= 0) {
      return this._provider;
    }

    if (!(time in this._buffer)) {
      this._buffer[time] = this._provider.pipe(throttleTime(time));
    }

    return this._buffer[time];
  }
}
