import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Runs after each test suite
afterEach(() => {
  cleanup();
}); 