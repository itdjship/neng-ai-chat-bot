/**
 * Request validation middleware
 */
import { sendValidationError } from '../utils/responseHandler.js';

/**
 * Validate prompt in request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function validatePrompt(req, res, next) {
  const { prompt } = req.body;
  
  if (!prompt) {
    return sendValidationError(res, 'Prompt is required in the request body');
  }
  
  if (typeof prompt !== 'string') {
    return sendValidationError(res, 'Prompt must be a string');
  }
  
  if (prompt.trim().length === 0) {
    return sendValidationError(res, 'Prompt cannot be empty');
  }
  
  if (prompt.length > 10000) {
    return sendValidationError(res, 'Prompt is too long (maximum 10,000 characters)');
  }
  
  // Sanitize prompt
  req.body.prompt = prompt.trim();
  
  next();
}

/**
 * Validate file upload
 * @param {string} fileType - Expected file type
 * @returns {Function} - Middleware function
 */
export function validateFileUpload(fileType) {
  return (req, res, next) => {
    if (!req.file) {
      return sendValidationError(res, `${fileType} file is required for this endpoint`);
    }
    
    // Add file type to request for later use
    req.fileType = fileType;
    
    next();
  };
}

/**
 * Sanitize request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function sanitizeRequestBody(req, res, next) {
  if (req.body) {
    // Remove any potentially dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    dangerousKeys.forEach(key => {
      if (req.body.hasOwnProperty(key)) {
        delete req.body[key];
      }
    });
    
    // Trim string values
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  next();
}

/**
 * Rate limiting validation (basic implementation)
 * @param {number} maxRequests - Maximum requests per time window
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Function} - Middleware function
 */
export function createRateLimiter(maxRequests = 100, timeWindow = 15 * 60 * 1000) {
  const requests = new Map();
  
  return (req, res, next) => {
    const clientId = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(clientId)) {
      requests.set(clientId, { count: 1, resetTime: now + timeWindow });
      return next();
    }
    
    const clientData = requests.get(clientId);
    
    if (now > clientData.resetTime) {
      requests.set(clientId, { count: 1, resetTime: now + timeWindow });
      return next();
    }
    
    if (clientData.count >= maxRequests) {
      return sendValidationError(res, 'Too many requests. Please try again later.', 429);
    }
    
    clientData.count++;
    next();
  };
}

/**
 * Content-Type validation for multipart/form-data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function validateContentType(req, res, next) {
  const contentType = req.get('Content-Type');
  
  if (!contentType || !contentType.includes('multipart/form-data')) {
    return sendValidationError(res, 'Content-Type must be multipart/form-data for file uploads');
  }
  
  next();
}