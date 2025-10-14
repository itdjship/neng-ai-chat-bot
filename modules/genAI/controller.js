/**
 * Optimized and robust controller for GenAI endpoints
 */
import { generateText, generateFromFile } from '../../services/geminiService.js';
import { 
  validateFile, 
  prepareFileForAPI, 
  formatFileMetadata,
  getFileTypeConfig 
} from '../../utils/fileValidation.js';
import { 
  sendSuccessResponse, 
  sendValidationError, 
  sendInternalServerError 
} from '../../utils/responseHandler.js';
import { 
  logRequest, 
  logSuccess, 
  logError, 
  logValidationError,
  withPerformanceMonitoring 
} from '../../utils/logger.js';

/**
 * Base controller class for common functionality
 */
class BaseController {
  constructor() {
    this.performanceMonitoredGenerate = withPerformanceMonitoring(
      this.callGeminiAPI.bind(this), 
      'Gemini API Call'
    );
  }

  /**
   * Call Gemini API with error handling
   * @param {string} prompt - Text prompt
   * @param {Object} fileData - File data object (optional)
   * @returns {string} - Generated text response
   */
  async callGeminiAPI(prompt, fileData = null) {
    try {
      if (fileData) {
        return await generateFromFile(prompt, fileData);
      } else {
        return await generateText(prompt);
      }
    } catch (error) {
      // Re-throw with more context
      throw new Error(`Gemini API Error: ${error.message}`);
    }
  }

  /**
   * Generic request handler for text-only requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} endpoint - Endpoint name for logging
   */
  async handleTextRequest(req, res, endpoint) {
    const startTime = Date.now();
    
    try {
      logRequest(req, endpoint);
      
      const { prompt } = req.body || {};
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new Error('Valid prompt is required');
      }
      
      const generatedText = await this.performanceMonitoredGenerate(prompt.trim());
      const processingTime = Date.now() - startTime;
      
      logSuccess(endpoint, processingTime, { 
        promptLength: prompt.length,
        responseLength: generatedText.length 
      });
      
      sendSuccessResponse(res, generatedText, 'Content generated successfully');
      
    } catch (error) {
      logError(endpoint, error, { 
        promptLength: req.body?.prompt?.length || 0 
      });
      sendInternalServerError(res, error, 'Failed to generate content');
    }
  }

  /**
   * Generic request handler for file upload requests
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} endpoint - Endpoint name for logging
   * @param {string} fileType - Expected file type
   */
  async handleFileRequest(req, res, endpoint, fileType) {
    const startTime = Date.now();
    
    try {
      logRequest(req, endpoint, fileType);
      
      const { prompt } = req.body || {};
      const file = req.file;
      
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        throw new Error('Valid prompt is required');
      }
      
      // Validate file
      const validation = validateFile(file, fileType);
      if (!validation.isValid) {
        logValidationError(endpoint, validation.error, { 
          fileName: file?.originalname,
          fileSize: file?.size,
          fileMimeType: file?.mimetype 
        });
        return sendValidationError(res, validation.error);
      }
      
      // Prepare file data for API
      const fileData = prepareFileForAPI(file);
      
      // Generate content
      const generatedText = await this.performanceMonitoredGenerate(prompt.trim(), fileData);
      const processingTime = Date.now() - startTime;
      
      // Format response
      const meta = formatFileMetadata(file);
      
      logSuccess(endpoint, processingTime, { 
        promptLength: prompt.length,
        responseLength: generatedText.length,
        fileSize: file.size,
        fileName: file.originalname 
      });
      
      sendSuccessResponse(
        res, 
        generatedText, 
        `Content generated successfully from ${fileType}`,
        meta
      );
      
    } catch (error) {
      logError(endpoint, error, { 
        promptLength: req.body?.prompt?.length || 0,
        fileName: req.file?.originalname,
        fileSize: req.file?.size 
      });
      sendInternalServerError(res, error, `Failed to generate content from ${fileType}`);
    }
  }
}

// Create controller instance
const controller = new BaseController();

/**
 * Handle text generation requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function handleGenerateRequest(req, res) {
  await controller.handleTextRequest(req, res, 'generate-text');
}

/**
 * Handle image generation requests with file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateImage(req, res) {
  await controller.handleFileRequest(req, res, 'generate-from-image', 'image');
}

/**
 * Handle document generation requests with file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateDocument(req, res) {
  await controller.handleFileRequest(req, res, 'generate-from-document', 'document');
}

/**
 * Handle audio generation requests with file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateAudio(req, res) {
  await controller.handleFileRequest(req, res, 'generate-from-audio', 'audio');
}

/**
 * Handle video generation requests with file upload
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function generateVideo(req, res) {
  await controller.handleFileRequest(req, res, 'generate-from-video', 'video');
}

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function healthCheck(req, res) {
  try {
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
    
    sendSuccessResponse(res, healthData, 'Service is healthy');
  } catch (error) {
    sendInternalServerError(res, error, 'Health check failed');
  }
}

/**
 * Get supported file types information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getSupportedFileTypes(req, res) {
  try {
    const fileTypesInfo = Object.entries(getFileTypeConfig()).map(([key, config]) => ({
      type: key.toLowerCase(),
      name: config.name,
      maxSize: config.maxSize,
      maxSizeMB: Math.round(config.maxSize / (1024 * 1024)),
      allowedMimeTypes: config.allowedMimeTypes,
      fieldName: config.fieldName
    }));
    
    sendSuccessResponse(res, fileTypesInfo, 'Supported file types retrieved successfully');
  } catch (error) {
    sendInternalServerError(res, error, 'Failed to retrieve file types information');
  }
}