import "@testing-library/jest-dom";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterEach, expect, vi } from "vitest";

// Make React available globally for JSX
global.React = React;

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Run cleanup after each test case
afterEach(() => {
	cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(), // no-op for tests
		removeEventListener: vi.fn(), // no-op for tests
		dispatchEvent: vi.fn(), // no-op for tests
	})),
});

// Mock environment variables
process.env.NODE_ENV = "test";

// Mock localStorage
Object.defineProperty(window, "localStorage", {
	value: {
		getItem: vi.fn(() => null),
		setItem: vi.fn(() => null),
		removeItem: vi.fn(() => null),
		clear: vi.fn(() => null),
	},
	writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, "sessionStorage", {
	value: {
		getItem: vi.fn(() => null),
		setItem: vi.fn(() => null),
		removeItem: vi.fn(() => null),
		clear: vi.fn(() => null),
	},
	writable: true,
});
