import { Observable, fromEvent, Subject } from "rxjs";
import { share, map, filter } from "rxjs/operators";
import ResizeObserver from 'resize-observer-polyfill';

export type IResizableTarget = HTMLElement | Window;

export interface IResizeEvent {
  width: number;
  height: number;
}

const RESIZE_EVENTS_SUBJECT = new Subject<ResizeObserverEntry>();
const RESIZE_EVENTS = RESIZE_EVENTS_SUBJECT.pipe(share());

const RESIZE_OBSERVER = new ResizeObserver(entries => {
  entries.forEach(entry => RESIZE_EVENTS_SUBJECT.next(entry));
});

function windowResizeEventProvider(target: Window): Observable<IResizeEvent> {
  return fromEvent(target, "resize")
    .pipe(map(e => ({width: target.innerWidth, height: target.innerHeight})))
    .pipe(share());
}

function domElementResizeEventProvider(target: HTMLElement): Observable<IResizeEvent> {
  RESIZE_OBSERVER.observe(target);
  return RESIZE_EVENTS
    .pipe(filter(e => e.target === target))
    .pipe(map(entry => ({width: entry.contentRect.width, height: entry.contentRect.height})));
}

export class GTResizeObserver {
  private provider: Observable<IResizeEvent>;

  constructor(
    private target: IResizableTarget,
    private throttleTime = 90
  ) {
    this.provider = target instanceof Window
      ? windowResizeEventProvider(target)
      : domElementResizeEventProvider(target);
  }
}