import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  logRequest,
  logSuccess,
  logError,
  logValidationError,
  withPerformanceMonitoring
} from '../../utils/logger.js';

describe('Logger Utils', () => {
  let consoleLogSpy;
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('logRequest', () => {
    test('should log basic request information', () => {
      const mockReq = {
        method: 'POST',
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        body: { prompt: 'test prompt' }
      };

      logRequest(mockReq, 'test-endpoint');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('REQUEST: test-endpoint'),
        expect.objectContaining({
          method: 'POST',
          endpoint: 'test-endpoint',
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          hasFile: false,
          hasPrompt: true,
          timestamp: expect.any(String)
        })
      );
    });

    test('should log file information when file is present', () => {
      const mockReq = {
        method: 'POST',
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        body: { prompt: 'test prompt' },
        file: {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024000
        }
      };

      logRequest(mockReq, 'test-endpoint', 'image');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('REQUEST: test-endpoint'),
        expect.objectContaining({
          hasFile: true,
          fileType: 'image',
          fileInfo: {
            originalName: 'test.jpg',
            mimeType: 'image/jpeg',
            size: 1024000
          }
        })
      );
    });

    test('should handle missing IP and fallback to connection address', () => {
      const mockReq = {
        method: 'GET',
        connection: { remoteAddress: '192.168.1.1' },
        get: jest.fn().mockReturnValue('Test Agent'),
        body: {}
      };

      logRequest(mockReq, 'test-endpoint');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          ip: '192.168.1.1'
        })
      );
    });

    test('should handle missing user agent', () => {
      const mockReq = {
        method: 'GET',
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        get: jest.fn().mockReturnValue(undefined),
        body: {}
      };

      logRequest(mockReq, 'test-endpoint');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          userAgent: undefined
        })
      );
    });
  });

  describe('logSuccess', () => {
    test('should log success with processing time', () => {
      const processingTime = 1500;
      const additionalInfo = { fileSize: 1024 };

      logSuccess('test-endpoint', processingTime, additionalInfo);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('SUCCESS: test-endpoint'),
        expect.objectContaining({
          endpoint: 'test-endpoint',
          status: 'SUCCESS',
          processingTime: '1500ms',
          fileSize: 1024,
          timestamp: expect.any(String)
        })
      );
    });

    test('should log success without additional info', () => {
      logSuccess('test-endpoint', 750);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          endpoint: 'test-endpoint',
          status: 'SUCCESS',
          processingTime: '750ms',
          timestamp: expect.any(String)
        })
      );
    });

    test('should format processing time correctly', () => {
      logSuccess('test-endpoint', 0);
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          processingTime: '0ms'
        })
      );
    });
  });

  describe('logError', () => {
    test('should log error with basic information', () => {
      const error = new Error('Test error message');
      const additionalInfo = { userId: 123 };

      logError('test-endpoint', error, additionalInfo);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: test-endpoint'),
        expect.objectContaining({
          endpoint: 'test-endpoint',
          status: 'ERROR',
          errorMessage: 'Test error message',
          errorType: 'Error',
          userId: 123,
          timestamp: expect.any(String)
        })
      );
    });

    test('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logError('test-endpoint', error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          stack: 'Error stack trace'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test('should not include stack trace in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      logError('test-endpoint', error);

      const loggedData = consoleErrorSpy.mock.calls[0][1];
      expect(loggedData).not.toHaveProperty('stack');

      process.env.NODE_ENV = originalEnv;
    });

    test('should handle different error types', () => {
      const typeError = new TypeError('Type error message');

      logError('test-endpoint', typeError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errorType: 'TypeError',
          errorMessage: 'Type error message'
        })
      );
    });
  });

  describe('logValidationError', () => {
    test('should log validation error with request data', () => {
      const validationError = 'Invalid email format';
      const requestData = { email: 'invalid-email' };

      logValidationError('test-endpoint', validationError, requestData);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('VALIDATION_ERROR: test-endpoint'),
        expect.objectContaining({
          endpoint: 'test-endpoint',
          status: 'VALIDATION_ERROR',
          validationError: 'Invalid email format',
          requestData: { email: 'invalid-email' },
          timestamp: expect.any(String)
        })
      );
    });

    test('should log validation error without request data', () => {
      logValidationError('test-endpoint', 'Required field missing');

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          validationError: 'Required field missing',
          requestData: {}
        })
      );
    });
  });

  describe('withPerformanceMonitoring', () => {
    test('should monitor successful async function execution', async () => {
      const mockAsyncFunction = jest.fn().mockResolvedValue('success result');
      const monitoredFunction = withPerformanceMonitoring(mockAsyncFunction, 'TestOperation');

      const result = await monitoredFunction('arg1', 'arg2');

      expect(result).toBe('success result');
      expect(mockAsyncFunction).toHaveBeenCalledWith('arg1', 'arg2');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[PERFORMANCE\] TestOperation: \d+ms/)
      );
    });

    test('should monitor successful sync function execution', async () => {
      const mockSyncFunction = jest.fn().mockReturnValue('sync result');
      const monitoredFunction = withPerformanceMonitoring(mockSyncFunction, 'SyncOperation');

      const result = await monitoredFunction('arg1');

      expect(result).toBe('sync result');
      expect(mockSyncFunction).toHaveBeenCalledWith('arg1');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[PERFORMANCE\] SyncOperation: \d+ms/)
      );
    });

    test('should monitor and re-throw errors from async functions', async () => {
      const testError = new Error('Async function failed');
      const mockAsyncFunction = jest.fn().mockRejectedValue(testError);
      const monitoredFunction = withPerformanceMonitoring(mockAsyncFunction, 'FailingOperation');

      await expect(monitoredFunction()).rejects.toThrow('Async function failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[PERFORMANCE\] FailingOperation FAILED: \d+ms/),
        'Async function failed'
      );
    });

    test('should monitor and re-throw errors from sync functions', async () => {
      const testError = new Error('Sync function failed');
      const mockSyncFunction = jest.fn().mockImplementation(() => {
        throw testError;
      });
      const monitoredFunction = withPerformanceMonitoring(mockSyncFunction, 'FailingSyncOperation');

      await expect(monitoredFunction()).rejects.toThrow('Sync function failed');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/\[PERFORMANCE\] FailingSyncOperation FAILED: \d+ms/),
        'Sync function failed'
      );
    });

    test('should preserve function context when monitoring', async () => {
      const contextObject = {
        value: 'test value',
        getValue: function() {
          return this.value;
        }
      };

      const monitoredGetValue = withPerformanceMonitoring(contextObject.getValue, 'GetValue');
      const result = await monitoredGetValue.call(contextObject);

      expect(result).toBe('test value');
    });

    test('should handle functions with multiple arguments', async () => {
      const mockFunction = jest.fn().mockImplementation((a, b, c) => a + b + c);
      const monitoredFunction = withPerformanceMonitoring(mockFunction, 'AddOperation');

      const result = await monitoredFunction(1, 2, 3);

      expect(result).toBe(6);
      expect(mockFunction).toHaveBeenCalledWith(1, 2, 3);
    });

    test('should measure time accurately', async () => {
      const delay = 100; // 100ms delay
      const mockAsyncFunction = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, delay))
      );
      const monitoredFunction = withPerformanceMonitoring(mockAsyncFunction, 'DelayOperation');

      await monitoredFunction();

      const logCall = consoleLogSpy.mock.calls.find(call => 
        call[0].includes('[PERFORMANCE] DelayOperation:')
      );
      expect(logCall).toBeDefined();
      
      const timeMatch = logCall[0].match(/(\d+)ms/);
      expect(timeMatch).toBeDefined();
      const measuredTime = parseInt(timeMatch[1]);
      
      // Allow some tolerance for timing (should be at least delay ms, but not too much more)
      expect(measuredTime).toBeGreaterThanOrEqual(delay - 10);
      expect(measuredTime).toBeLessThan(delay + 50);
    });
  });
});