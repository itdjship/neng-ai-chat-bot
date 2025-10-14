/**
 * Response handling utilities for consistent API responses
 */

/**
 * Standard success response format
 * @param {Object} res - Express response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {Object} meta - Additional metadata
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export function sendSuccessResponse(res, data, message = 'Success', meta = null, statusCode = 200) {
  const response = {
    status: true,
    code: statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Standard error response format
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string|Object} errors - Detailed error information
 */
export function sendErrorResponse(res, message, statusCode = 500, errors = null) {
  const response = {
    status: false,
    code: statusCode,
    message,
    timestamp: new Date().toISOString()
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  res.status(statusCode).json(response);
}

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {string} message - Validation error message
 * @param {string|Object} validationErrors - Specific validation errors
 */
export function sendValidationError(res, message, validationErrors = null) {
  sendErrorResponse(res, message, 400, validationErrors);
}

/**
 * Internal server error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} customMessage - Custom error message
 */
export function sendInternalServerError(res, error, customMessage = 'Internal server error') {
  console.error('Internal Server Error:', error);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorDetails = isDevelopment ? {
    message: error.message,
    stack: error.stack
  } : 'Internal server error occurred';
  
  sendErrorResponse(res, customMessage, 500, errorDetails);
}

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource that was not found
 */
export function sendNotFoundError(res, resource = 'Resource') {
  sendErrorResponse(res, `${resource} not found`, 404);
}

/**
 * Unauthorized error response
 * @param {Object} res - Express response object
 * @param {string} message - Unauthorized message
 */
export function sendUnauthorizedError(res, message = 'Unauthorized access') {
  sendErrorResponse(res, message, 401);
}

/**
 * Forbidden error response
 * @param {Object} res - Express response object
 * @param {string} message - Forbidden message
 */
export function sendForbiddenError(res, message = 'Forbidden access') {
  sendErrorResponse(res, message, 403);
}