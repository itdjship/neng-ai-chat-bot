import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import {
  validatePrompt,
  validateFileUpload,
  sanitizeRequestBody,
  createRateLimiter,
  validateContentType
} from '../../middleware/validation.js';

// Mock the response handler
jest.mock('../../utils/responseHandler.js', () => ({
  sendValidationError: jest.fn()
}));

import { sendValidationError } from '../../utils/responseHandler.js';

describe('Validation Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      body: {},
      file: null,
      get: jest.fn()
    };
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('validatePrompt', () => {
    test('should call next() for valid prompt', () => {
      mockReq.body.prompt = 'This is a valid prompt';

      validatePrompt(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(sendValidationError).not.toHaveBeenCalled();
    });

    test('should trim whitespace from prompt', () => {
      mockReq.body.prompt = '  This is a prompt with whitespace  ';

      validatePrompt(mockReq, mockRes, mockNext);

      expect(mockReq.body.prompt).toBe('This is a prompt with whitespace');
      expect(mockNext).toHaveBeenCalled();
    });

    test('should send validation error for missing prompt', () => {
      mockReq.body = {};

      validatePrompt(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Prompt is required in the request body'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should send validation error for null prompt', () => {
      mockReq.body.prompt = null;

      validatePrompt(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Prompt is required in the request body'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should send validation error for non-string prompt', () => {
      mockReq.body.prompt = 123;

      validatePrompt(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Prompt must be a string'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should send validation error for empty prompt after trim', () => {
      mockReq.body.prompt = '   ';

      validatePrompt(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Prompt cannot be empty'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should send validation error for too long prompt', () => {
      mockReq.body.prompt = 'a'.repeat(10001); // 10,001 characters

      validatePrompt(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Prompt is too long (maximum 10,000 characters)'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should accept maximum length prompt', () => {
      mockReq.body.prompt = 'a'.repeat(10000); // Exactly 10,000 characters

      validatePrompt(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(sendValidationError).not.toHaveBeenCalled();
    });
  });

  describe('validateFileUpload', () => {
    test('should call next() when file is present', () => {
      mockReq.file = { originalname: 'test.jpg' };
      const middleware = validateFileUpload('image');

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.fileType).toBe('image');
      expect(sendValidationError).not.toHaveBeenCalled();
    });

    test('should send validation error when file is missing', () => {
      mockReq.file = null;
      const middleware = validateFileUpload('document');

      middleware(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'document file is required for this endpoint'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should handle different file types', () => {
      mockReq.file = { originalname: 'audio.mp3' };
      const middleware = validateFileUpload('audio');

      middleware(mockReq, mockRes, mockNext);

      expect(mockReq.fileType).toBe('audio');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('sanitizeRequestBody', () => {
    test('should remove dangerous properties', () => {
      mockReq.body = {
        prompt: 'test',
        __proto__: { dangerous: true },
        constructor: { dangerous: true },
        prototype: { dangerous: true },
        normalField: 'normal'
      };

      sanitizeRequestBody(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({
        prompt: 'test',
        normalField: 'normal'
      });
      expect(mockNext).toHaveBeenCalled();
    });

    test('should trim string values', () => {
      mockReq.body = {
        prompt: '  test prompt  ',
        description: '  description  ',
        number: 123,
        boolean: true
      };

      sanitizeRequestBody(mockReq, mockRes, mockNext);

      expect(mockReq.body.prompt).toBe('test prompt');
      expect(mockReq.body.description).toBe('description');
      expect(mockReq.body.number).toBe(123);
      expect(mockReq.body.boolean).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle empty body', () => {
      mockReq.body = null;

      sanitizeRequestBody(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test('should handle body without dangerous properties', () => {
      mockReq.body = {
        prompt: 'safe prompt',
        data: { nested: 'value' }
      };

      sanitizeRequestBody(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({
        prompt: 'safe prompt',
        data: { nested: 'value' }
      });
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('validateContentType', () => {
    test('should call next() for valid multipart/form-data content type', () => {
      mockReq.get.mockReturnValue('multipart/form-data; boundary=something');

      validateContentType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(sendValidationError).not.toHaveBeenCalled();
    });

    test('should send validation error for missing content type', () => {
      mockReq.get.mockReturnValue(null);

      validateContentType(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Content-Type must be multipart/form-data for file uploads'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should send validation error for wrong content type', () => {
      mockReq.get.mockReturnValue('application/json');

      validateContentType(mockReq, mockRes, mockNext);

      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Content-Type must be multipart/form-data for file uploads'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should accept content type that includes multipart/form-data', () => {
      mockReq.get.mockReturnValue('multipart/form-data');

      validateContentType(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('createRateLimiter', () => {
    beforeEach(() => {
      // Reset time for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-01-01T00:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should allow requests under the limit', () => {
      mockReq.ip = '127.0.0.1';
      const rateLimiter = createRateLimiter(5, 60000); // 5 requests per minute

      // First request should pass
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(sendValidationError).not.toHaveBeenCalled();

      mockNext.mockClear();

      // Second request should also pass
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should block requests exceeding the limit', () => {
      mockReq.ip = '127.0.0.1';
      const rateLimiter = createRateLimiter(2, 60000); // 2 requests per minute

      // First two requests should pass
      rateLimiter(mockReq, mockRes, mockNext);
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(2);

      mockNext.mockClear();

      // Third request should be blocked
      rateLimiter(mockReq, mockRes, mockNext);
      expect(sendValidationError).toHaveBeenCalledWith(
        mockRes,
        'Too many requests. Please try again later.',
        429
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should reset rate limit after time window', () => {
      mockReq.ip = '127.0.0.1';
      const timeWindow = 60000; // 1 minute
      const rateLimiter = createRateLimiter(1, timeWindow);

      // First request
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      mockNext.mockClear();

      // Second request should be blocked
      rateLimiter(mockReq, mockRes, mockNext);
      expect(sendValidationError).toHaveBeenCalled();

      sendValidationError.mockClear();
      mockNext.mockClear();

      // Advance time past the window
      jest.advanceTimersByTime(timeWindow + 1000);

      // Request should now pass again
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(sendValidationError).not.toHaveBeenCalled();
    });

    test('should handle different IPs separately', () => {
      const rateLimiter = createRateLimiter(1, 60000);

      // Request from first IP
      mockReq.ip = '127.0.0.1';
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      mockNext.mockClear();

      // Request from second IP should still pass
      mockReq.ip = '192.168.1.1';
      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(sendValidationError).not.toHaveBeenCalled();
    });

    test('should use connection.remoteAddress when IP is not available', () => {
      mockReq.ip = undefined;
      mockReq.connection = { remoteAddress: '10.0.0.1' };
      const rateLimiter = createRateLimiter(1, 60000);

      rateLimiter(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledTimes(1);

      mockNext.mockClear();

      // Second request from same connection should be blocked
      rateLimiter(mockReq, mockRes, mockNext);
      expect(sendValidationError).toHaveBeenCalled();
    });

    test('should handle edge case of exactly at limit', () => {
      mockReq.ip = '127.0.0.1';
      const rateLimiter = createRateLimiter(3, 60000);

      // Make exactly 3 requests (the limit)
      for (let i = 0; i < 3; i++) {
        rateLimiter(mockReq, mockRes, mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(3);

      mockNext.mockClear();

      // 4th request should be blocked
      rateLimiter(mockReq, mockRes, mockNext);
      expect(sendValidationError).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should work with custom parameters', () => {
      mockReq.ip = '127.0.0.1';
      const rateLimiter = createRateLimiter(10, 30000); // 10 requests per 30 seconds

      // Should allow up to 10 requests
      for (let i = 0; i < 10; i++) {
        rateLimiter(mockReq, mockRes, mockNext);
      }
      expect(mockNext).toHaveBeenCalledTimes(10);

      mockNext.mockClear();

      // 11th request should be blocked
      rateLimiter(mockReq, mockRes, mockNext);
      expect(sendValidationError).toHaveBeenCalled();
    });
  });
});