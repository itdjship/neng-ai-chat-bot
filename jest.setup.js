// Global test setup
import { jest } from '@jest/globals';

// Mock console methods in test environment to reduce noise
global.console = {
  ...console,
  // Only log during tests if VERBOSE is set
  log: process.env.VERBOSE === 'true' ? console.log : jest.fn(),
  info: process.env.VERBOSE === 'true' ? console.info : jest.fn(),
  debug: process.env.VERBOSE === 'true' ? console.debug : jest.fn(),
  warn: console.warn, // Keep warnings
  error: console.error, // Keep errors
};

// Setup global test timeout
jest.setTimeout(30000);

// Setup environment variables for testing
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-api-key';
process.env.GEMINI_MODEL = 'gemini-2.5-flash';
process.env.PORT = '3000';

// Global helper functions for tests
global.mockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  file: null,
  files: [],
  ...overrides
});

global.mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

global.createMockFile = (options = {}) => ({
  fieldname: 'file',
  originalname: options.name || 'test.jpg',
  encoding: '7bit',
  mimetype: options.mimeType || 'image/jpeg',
  size: options.size || 1024000,
  buffer: options.buffer || Buffer.from('fake file data'),
  destination: options.destination || '/tmp',
  filename: options.filename || 'test-file',
  path: options.path || '/tmp/test-file',
  ...options
});

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});