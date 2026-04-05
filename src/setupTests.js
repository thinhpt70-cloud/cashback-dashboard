// src/setupTests.js
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill TextEncoder/TextDecoder for Node environments (required by some libs)
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill ReadableStream (required by undici/fetch)
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web');
  global.ReadableStream = ReadableStream;
}

// Polyfill MessagePort (required by some workers/undici)
if (typeof global.MessagePort === 'undefined') {
    const { MessagePort } = require('worker_threads');
    global.MessagePort = MessagePort;
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
