/**
 * Logging utilities for request tracking and debugging
 */

/**
 * Log request information
 * @param {Object} req - Express request object
 * @param {string} endpoint - Endpoint name
 * @param {string} fileType - Type of file being processed
 */
export function logRequest(req, endpoint, fileType = null) {
  const requestInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    endpoint,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    hasFile: !!req.file,
    hasPrompt: !!req.body.prompt
  };
  
  if (fileType) {
    requestInfo.fileType = fileType;
  }
  
  if (req.file) {
    requestInfo.fileInfo = {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    };
  }
  
  console.log(`[${requestInfo.timestamp}] REQUEST: ${endpoint}`, requestInfo);
}

/**
 * Log successful response
 * @param {string} endpoint - Endpoint name
 * @param {number} processingTime - Processing time in milliseconds
 * @param {Object} additionalInfo - Additional information to log
 */
export function logSuccess(endpoint, processingTime, additionalInfo = {}) {
  const logInfo = {
    timestamp: new Date().toISOString(),
    endpoint,
    status: 'SUCCESS',
    processingTime: `${processingTime}ms`,
    ...additionalInfo
  };
  
  console.log(`[${logInfo.timestamp}] SUCCESS: ${endpoint}`, logInfo);
}

/**
 * Log error information
 * @param {string} endpoint - Endpoint name
 * @param {Error} error - Error object
 * @param {Object} additionalInfo - Additional context information
 */
export function logError(endpoint, error, additionalInfo = {}) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    endpoint,
    status: 'ERROR',
    errorMessage: error.message,
    errorType: error.constructor.name,
    ...additionalInfo
  };
  
  if (process.env.NODE_ENV === 'development') {
    errorInfo.stack = error.stack;
  }
  
  console.error(`[${errorInfo.timestamp}] ERROR: ${endpoint}`, errorInfo);
}

/**
 * Log validation error
 * @param {string} endpoint - Endpoint name
 * @param {string} validationError - Validation error message
 * @param {Object} requestData - Request data that failed validation
 */
export function logValidationError(endpoint, validationError, requestData = {}) {
  const logInfo = {
    timestamp: new Date().toISOString(),
    endpoint,
    status: 'VALIDATION_ERROR',
    validationError,
    requestData
  };
  
  console.warn(`[${logInfo.timestamp}] VALIDATION_ERROR: ${endpoint}`, logInfo);
}

/**
 * Performance monitoring wrapper
 * @param {Function} fn - Function to monitor
 * @param {string} operationName - Name of the operation
 * @returns {Function} - Wrapped function with performance monitoring
 */
export function withPerformanceMonitoring(fn, operationName) {
  return async function(...args) {
    const startTime = Date.now();
    
    try {
      const result = await fn.apply(this, args);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[PERFORMANCE] ${operationName}: ${duration}ms`);
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.error(`[PERFORMANCE] ${operationName} FAILED: ${duration}ms`, error.message);
      throw error;
    }
  };
}