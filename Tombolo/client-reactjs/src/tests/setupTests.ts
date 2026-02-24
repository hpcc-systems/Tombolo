import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Mock antd notification and message globally
vi.mock('antd', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    notification: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      open: vi.fn(),
    },
    message: {
      error: vi.fn(),
      success: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
    },
  };
});

// Ensure `window.location.href` has a sensible default for tests that use `new URL()`
if (!window.location.href || window.location.href === 'about:blank') {
  Object.defineProperty(window, 'location', {
    value: new URL('http://localhost/'),
    writable: true,
  });
}

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Clear document body before each test
beforeEach(() => {
  document.body.innerHTML = '';
});

// Ant Design relies on matchMedia for responsive behavior. Polyfill for JSDOM.
if (!(window as any).matchMedia) {
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
