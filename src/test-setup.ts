import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});

// jsdom doesn't implement HTMLMediaElement playback or Element.scrollIntoView —
// stub them so components using <audio>/scrollIntoView don't crash in tests.
// A real browser dispatches 'play'/'pause' DOM events once playback actually
// starts/stops — components (SoundtrackProvider) listen for exactly that, so
// the stub simulates it too rather than only resolving the promise.
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: vi.fn(function (this: HTMLMediaElement) {
    queueMicrotask(() => this.dispatchEvent(new Event('play')));
    return Promise.resolve();
  }),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  writable: true,
  value: vi.fn(function (this: HTMLMediaElement) {
    queueMicrotask(() => this.dispatchEvent(new Event('pause')));
  }),
});
Object.defineProperty(window.HTMLMediaElement.prototype, 'volume', {
  configurable: true,
  writable: true,
  value: 1,
});
if (!window.Element.prototype.scrollIntoView) {
  window.Element.prototype.scrollIntoView = vi.fn();
}
