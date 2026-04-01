/* eslint-disable no-console */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;
const originalGetComputedStyle = window.getComputedStyle.bind(window);

// Keep test output clean: suppress app-level console noise during unit tests.
beforeEach(() => {
  console.error = vi.fn();
  console.log = vi.fn();
  console.debug = vi.fn();
  console.info = vi.fn();
});

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
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
  console.debug = originalConsoleDebug;
  console.info = originalConsoleInfo;
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

// JSDOM does not support pseudo-element computed styles.
// Some UI dependencies call getComputedStyle(el, '::before' | '::after').
window.getComputedStyle = ((element: Element, pseudoElt?: string | null) => {
  if (pseudoElt) {
    return originalGetComputedStyle(element);
  }

  return originalGetComputedStyle(element);
}) as typeof window.getComputedStyle;
