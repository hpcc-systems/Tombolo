import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Clear document body before each test
beforeEach(() => {
  document.body.innerHTML = '';
});

// Ant Design relies on matchMedia for responsive behavior. Polyfill for JSDOM.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
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
