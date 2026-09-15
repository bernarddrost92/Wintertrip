import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
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

// jsdom's Blob/File polyfill doesn't implement arrayBuffer() — Mission
// Hunt's Excel import reads uploaded files this way (readWorkbookRowsFromFile).
// FileReader IS implemented by jsdom, so bridge through that instead of
// hand-rolling a buffer reader.
if (typeof window.Blob !== 'undefined' && !window.Blob.prototype.arrayBuffer) {
  window.Blob.prototype.arrayBuffer = function (this: Blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
