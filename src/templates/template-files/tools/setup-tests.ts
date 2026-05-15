import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLFormElement.prototype.requestSubmit = vi.fn();
window.matchMedia = vi.fn().mockImplementation(() => ({
  matches: false,
  addEventListener: () => {},
  removeEventListener: () => {},
}));

// Mock ResizeObserver for Carbon components. vi.fn().mockImplementation(...)
// is not constructable, so use a class so `new ResizeObserver(...)` works.
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};
