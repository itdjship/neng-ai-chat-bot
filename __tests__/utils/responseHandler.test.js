import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendValidationError,
  sendInternalServerError,
  sendNotFoundError,
  sendUnauthorizedError,
  sendForbiddenError
} from '../../utils/responseHandler.js';

describe('Response Handler Utils', () => {
  let mockRes;
  let mockJson;
  let mockStatus;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
  });

  describe('sendSuccessResponse', () => {
    test('should send success response with default values', () => {
      const testData = { result: 'test' };
      
      sendSuccessResponse(mockRes, testData);
      
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: true,
          code: 200,
          message: 'Success',
          data: testData,
          timestamp: expect.any(String)
        })
      );
    });

    test('should send success response with custom message and status code', () => {
      const testData = { result: 'test' };
      const customMessage = 'Custom success message';
      const customStatus = 201;
      
      sendSuccessResponse(mockRes, testData, customMessage, null, customStatus);
      
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: true,
          code: 201,
          message: customMessage,
          data: testData,
          timestamp: expect.any(String)
        })
      );
    });

    test('should include meta when provided', () => {
      const testData = { result: 'test' };
      const meta = { originalName: 'test.jpg', size: 1024 };
      
      sendSuccessResponse(mockRes, testData, 'Success', meta);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: true,
          code: 200,
          message: 'Success',
          data: testData,
          meta: meta,
          timestamp: expect.any(String)
        })
      );
    });

    test('should not include meta when null', () => {
      const testData = { result: 'test' };
      
      sendSuccessResponse(mockRes, testData, 'Success', null);
      
      const callArgs = mockJson.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('meta');
    });

    test('should include valid ISO timestamp', () => {
      const testData = { result: 'test' };
      const beforeCall = new Date().toISOString();
      
      sendSuccessResponse(mockRes, testData);
      
      const callArgs = mockJson.mock.calls[0][0];
      const timestamp = new Date(callArgs.timestamp).toISOString();
      expect(timestamp).toBe(callArgs.timestamp);
      expect(callArgs.timestamp >= beforeCall).toBe(true);
    });
  });

  describe('sendErrorResponse', () => {
    test('should send error response with default status code', () => {
      const errorMessage = 'Something went wrong';
      
      sendErrorResponse(mockRes, errorMessage);
      
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 500,
          message: errorMessage,
          timestamp: expect.any(String)
        })
      );
    });

    test('should send error response with custom status code', () => {
      const errorMessage = 'Bad request';
      const statusCode = 400;
      
      sendErrorResponse(mockRes, errorMessage, statusCode);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 400,
          message: errorMessage,
          timestamp: expect.any(String)
        })
      );
    });

    test('should include errors when provided', () => {
      const errorMessage = 'Validation failed';
      const errors = { field: 'This field is required' };
      
      sendErrorResponse(mockRes, errorMessage, 400, errors);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 400,
          message: errorMessage,
          errors: errors,
          timestamp: expect.any(String)
        })
      );
    });

    test('should not include errors when null', () => {
      const errorMessage = 'Simple error';
      
      sendErrorResponse(mockRes, errorMessage, 400, null);
      
      const callArgs = mockJson.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('errors');
    });
  });

  describe('sendValidationError', () => {
    test('should send validation error with 400 status code', () => {
      const message = 'Validation failed';
      
      sendValidationError(mockRes, message);
      
      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 400,
          message: message,
          timestamp: expect.any(String)
        })
      );
    });

    test('should include validation errors when provided', () => {
      const message = 'Validation failed';
      const validationErrors = { 
        email: 'Invalid email format',
        password: 'Password too short'
      };
      
      sendValidationError(mockRes, message, validationErrors);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 400,
          message: message,
          errors: validationErrors,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('sendInternalServerError', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should log error and send 500 response', () => {
      const error = new Error('Test error');
      
      sendInternalServerError(mockRes, error);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Internal Server Error:', error);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 500,
          message: 'Internal server error',
          timestamp: expect.any(String)
        })
      );
    });

    test('should send custom message when provided', () => {
      const error = new Error('Test error');
      const customMessage = 'Database connection failed';
      
      sendInternalServerError(mockRes, error, customMessage);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage
        })
      );
    });

    test('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      sendInternalServerError(mockRes, error);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: {
            message: 'Test error',
            stack: 'Error stack trace'
          }
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    test('should not include error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      
      sendInternalServerError(mockRes, error);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: 'Internal server error occurred'
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('sendNotFoundError', () => {
    test('should send 404 response with default message', () => {
      sendNotFoundError(mockRes);
      
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 404,
          message: 'Resource not found',
          timestamp: expect.any(String)
        })
      );
    });

    test('should send 404 response with custom resource name', () => {
      sendNotFoundError(mockRes, 'User');
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found'
        })
      );
    });
  });

  describe('sendUnauthorizedError', () => {
    test('should send 401 response with default message', () => {
      sendUnauthorizedError(mockRes);
      
      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 401,
          message: 'Unauthorized access',
          timestamp: expect.any(String)
        })
      );
    });

    test('should send 401 response with custom message', () => {
      const customMessage = 'Invalid token';
      
      sendUnauthorizedError(mockRes, customMessage);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage
        })
      );
    });
  });

  describe('sendForbiddenError', () => {
    test('should send 403 response with default message', () => {
      sendForbiddenError(mockRes);
      
      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          status: false,
          code: 403,
          message: 'Forbidden access',
          timestamp: expect.any(String)
        })
      );
    });

    test('should send 403 response with custom message', () => {
      const customMessage = 'Insufficient permissions';
      
      sendForbiddenError(mockRes, customMessage);
      
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: customMessage
        })
      );
    });
  });
});