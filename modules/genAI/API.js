import express from "express";
import multer from "multer";
import { 
  handleGenerateRequest, 
  generateImage, 
  generateDocument, 
  generateAudio,
  generateVideo,
  healthCheck,
  getSupportedFileTypes
} from "./controller.js";
import { 
  validatePrompt,
  validateFileUpload,
  sanitizeRequestBody,
  validateContentType,
  createRateLimiter
} from "../../middleware/validation.js";
import { FILE_TYPES } from "../../utils/fileValidation.js";

const router = express.Router();

// Rate limiting middleware
const rateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Configure multer storage
const storage = multer.memoryStorage();

/**
 * Create multer upload configuration for specific file type
 * @param {Object} fileTypeConfig - File type configuration
 * @returns {Object} - Multer upload configuration
 */
function createUploadConfig(fileTypeConfig) {
  return multer({
    storage: storage,
    limits: {
      fileSize: fileTypeConfig.maxSize,
      files: 1,
      fieldSize: 1024 * 1024 // 1MB field size limit
    },
    fileFilter: (req, file, cb) => {
      if (fileTypeConfig.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(fileTypeConfig.errorMessage), false);
      }
    }
  });
}

// Create upload configurations for each file type
const uploadImage = createUploadConfig(FILE_TYPES.IMAGE);
const uploadDocument = createUploadConfig(FILE_TYPES.DOCUMENT);
const uploadAudio = createUploadConfig(FILE_TYPES.AUDIO);
const uploadVideo = createUploadConfig(FILE_TYPES.VIDEO);

// Error handling middleware for multer
function handleMulterError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: false,
        code: 400,
        message: 'File size exceeds the allowed limit',
        errors: error.message
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: false,
        code: 400,
        message: 'Too many files uploaded',
        errors: error.message
      });
    }
  }
  
  if (error.message.includes('Only') && error.message.includes('files are allowed')) {
    return res.status(400).json({
      status: false,
      code: 400,
      message: error.message,
      errors: 'Invalid file type'
    });
  }
  
  next(error);
}

// Global middleware
router.use(rateLimiter);
router.use(sanitizeRequestBody);

// Health check endpoint (no authentication needed)
router.get("/health", healthCheck);

// File types information endpoint
router.get("/file-types", getSupportedFileTypes);

// Text generation endpoint
router.post("/generate-text", 
  validatePrompt,
  handleGenerateRequest
);

// File upload endpoints with validation
router.post("/generate-from-image", 
  validateContentType,
  uploadImage.single('file'),
  handleMulterError,
  validatePrompt,
  validateFileUpload('image'),
  generateImage
);

router.post("/generate-from-document", 
  validateContentType,
  uploadDocument.single('file'),
  handleMulterError,
  validatePrompt,
  validateFileUpload('document'),
  generateDocument
);

router.post("/generate-from-audio", 
  validateContentType,
  uploadAudio.single('file'),
  handleMulterError,
  validatePrompt,
  validateFileUpload('audio'),
  generateAudio
);

router.post("/generate-from-video", 
  validateContentType,
  uploadVideo.single('file'),
  handleMulterError,
  validatePrompt,
  validateFileUpload('video'),
  generateVideo
);

// Global error handler
router.use((error, req, res, next) => {
  console.error('Unhandled error in API route:', error);
  
  res.status(500).json({
    status: false,
    code: 500,
    message: 'Internal server error',
    errors: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

export default router;