import { GTResizeObserver } from "./resize-observer";

describe("Resize Observer", () => {
  it('should initialize properly', done => {
    const foo = new GTResizeObserver(window);
    expect(foo).toBeDefined();
    done();
  });
});