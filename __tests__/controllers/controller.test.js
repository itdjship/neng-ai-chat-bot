import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  handleGenerateRequest,
  generateImage,
  generateDocument,
  generateAudio,
  generateVideo,
  healthCheck,
  getSupportedFileTypes
} from '../../modules/genAI/controller.js';

// Mock all dependencies
jest.mock('../../services/geminiService.js', () => ({
  generateText: jest.fn(),
  generateFromFile: jest.fn()
}));

jest.mock('../../utils/fileValidation.js', () => ({
  validateFile: jest.fn(),
  prepareFileForAPI: jest.fn(),
  formatFileMetadata: jest.fn(),
  getFileTypeConfig: jest.fn()
}));

jest.mock('../../utils/responseHandler.js', () => ({
  sendSuccessResponse: jest.fn(),
  sendValidationError: jest.fn(),
  sendInternalServerError: jest.fn()
}));

jest.mock('../../utils/logger.js', () => ({
  logRequest: jest.fn(),
  logSuccess: jest.fn(),
  logError: jest.fn(),
  logValidationError: jest.fn(),
  withPerformanceMonitoring: jest.fn().mockImplementation((fn) => fn)
}));

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
  logValidationError
} from '../../utils/logger.js';

describe('Controller Functions', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      body: {},
      file: null
    };
    mockRes = {};
    jest.clearAllMocks();
  });

  describe('handleGenerateRequest', () => {
    test('should handle successful text generation', async () => {
      mockReq.body.prompt = 'Test prompt';
      generateText.mockResolvedValue('Generated response');

      await handleGenerateRequest(mockReq, mockRes);

      expect(logRequest).toHaveBeenCalledWith(mockReq, 'generate-text');
      expect(generateText).toHaveBeenCalledWith('Test prompt');
      expect(logSuccess).toHaveBeenCalledWith(
        'generate-text',
        expect.any(Number),
        expect.objectContaining({
          promptLength: 11,
          responseLength: 18
        })
      );
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Generated response',
        'Content generated successfully'
      );
    });

    test('should handle Gemini API errors', async () => {
      mockReq.body.prompt = 'Test prompt';
      const apiError = new Error('Gemini API failed');
      generateText.mockRejectedValue(apiError);

      await handleGenerateRequest(mockReq, mockRes);

      expect(logError).toHaveBeenCalledWith(
        'generate-text',
        expect.any(Error),
        expect.objectContaining({
          promptLength: 11
        })
      );
      expect(sendInternalServerError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Failed to generate content'
      );
    });

    test('should handle missing prompt', async () => {
      mockReq.body = {};

      await handleGenerateRequest(mockReq, mockRes);

      expect(logError).toHaveBeenCalledWith(
        'generate-text',
        expect.any(Error),
        expect.objectContaining({
          promptLength: 0
        })
      );
    });
  });

  describe('generateImage', () => {
    const mockImageFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024000,
      buffer: Buffer.from('fake image data')
    };

    beforeEach(() => {
      mockReq.body.prompt = 'Describe this image';
      mockReq.file = mockImageFile;
      
      validateFile.mockReturnValue({ isValid: true, error: null });
      prepareFileForAPI.mockReturnValue({
        mimeType: 'image/jpeg',
        data: 'base64data'
      });
      formatFileMetadata.mockReturnValue({
        originalName: 'test.jpg',
        mimeType: 'image/jpeg',
        size: 1024000
      });
      generateFromFile.mockResolvedValue('Image analysis result');
    });

    test('should handle successful image analysis', async () => {
      await generateImage(mockReq, mockRes);

      expect(logRequest).toHaveBeenCalledWith(mockReq, 'generate-from-image', 'image');
      expect(validateFile).toHaveBeenCalledWith(mockImageFile, 'image');
      expect(prepareFileForAPI).toHaveBeenCalledWith(mockImageFile);
      expect(generateFromFile).toHaveBeenCalledWith(
        'Describe this image',
        { mimeType: 'image/jpeg', data: 'base64data' }
      );
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Image analysis result',
        'Content generated successfully from image',
        expect.objectContaining({
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024000
        })
      );
    });

    test('should handle file validation errors', async () => {
      validateFile.mockReturnValue({
        isValid: false,
        error: 'File too large'
      });

      await generateImage(mockReq, mockRes);

      expect(logValidationError).toHaveBeenCalledWith(
        'generate-from-image',
        'File too large',
        expect.objectContaining({
          fileName: 'test.jpg',
          fileSize: 1024000,
          fileMimeType: 'image/jpeg'
        })
      );
      expect(sendValidationError).toHaveBeenCalledWith(mockRes, 'File too large');
      expect(generateFromFile).not.toHaveBeenCalled();
    });

    test('should handle Gemini API errors during image processing', async () => {
      const apiError = new Error('Image processing failed');
      generateFromFile.mockRejectedValue(apiError);

      await generateImage(mockReq, mockRes);

      expect(logError).toHaveBeenCalledWith(
        'generate-from-image',
        expect.any(Error),
        expect.objectContaining({
          promptLength: 19,
          fileName: 'test.jpg',
          fileSize: 1024000
        })
      );
      expect(sendInternalServerError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Failed to generate content from image'
      );
    });

    test('should handle missing file', async () => {
      mockReq.file = null;
      validateFile.mockReturnValue({
        isValid: false,
        error: 'image file is required'
      });

      await generateImage(mockReq, mockRes);

      expect(sendValidationError).toHaveBeenCalledWith(mockRes, 'image file is required');
    });
  });

  describe('generateDocument', () => {
    const mockDocumentFile = {
      originalname: 'test.pdf',
      mimetype: 'application/pdf',
      size: 2048000,
      buffer: Buffer.from('fake pdf data')
    };

    beforeEach(() => {
      mockReq.body.prompt = 'Summarize this document';
      mockReq.file = mockDocumentFile;
      
      validateFile.mockReturnValue({ isValid: true, error: null });
      prepareFileForAPI.mockReturnValue({
        mimeType: 'application/pdf',
        data: 'base64pdfdata'
      });
      formatFileMetadata.mockReturnValue({
        originalName: 'test.pdf',
        mimeType: 'application/pdf',
        size: 2048000
      });
      generateFromFile.mockResolvedValue('Document summary');
    });

    test('should handle successful document analysis', async () => {
      await generateDocument(mockReq, mockRes);

      expect(logRequest).toHaveBeenCalledWith(mockReq, 'generate-from-document', 'document');
      expect(validateFile).toHaveBeenCalledWith(mockDocumentFile, 'document');
      expect(generateFromFile).toHaveBeenCalledWith(
        'Summarize this document',
        { mimeType: 'application/pdf', data: 'base64pdfdata' }
      );
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Document summary',
        'Content generated successfully from document',
        expect.objectContaining({
          originalName: 'test.pdf'
        })
      );
    });

    test('should handle document validation errors', async () => {
      validateFile.mockReturnValue({
        isValid: false,
        error: 'Unsupported document format'
      });

      await generateDocument(mockReq, mockRes);

      expect(sendValidationError).toHaveBeenCalledWith(mockRes, 'Unsupported document format');
      expect(generateFromFile).not.toHaveBeenCalled();
    });
  });

  describe('generateAudio', () => {
    const mockAudioFile = {
      originalname: 'test.mp3',
      mimetype: 'audio/mpeg',
      size: 5048000,
      buffer: Buffer.from('fake audio data')
    };

    beforeEach(() => {
      mockReq.body.prompt = 'Transcribe this audio';
      mockReq.file = mockAudioFile;
      
      validateFile.mockReturnValue({ isValid: true, error: null });
      prepareFileForAPI.mockReturnValue({
        mimeType: 'audio/mpeg',
        data: 'base64audiodata'
      });
      formatFileMetadata.mockReturnValue({
        originalName: 'test.mp3',
        mimeType: 'audio/mpeg',
        size: 5048000
      });
      generateFromFile.mockResolvedValue('Audio transcription');
    });

    test('should handle successful audio analysis', async () => {
      await generateAudio(mockReq, mockRes);

      expect(logRequest).toHaveBeenCalledWith(mockReq, 'generate-from-audio', 'audio');
      expect(validateFile).toHaveBeenCalledWith(mockAudioFile, 'audio');
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Audio transcription',
        'Content generated successfully from audio',
        expect.objectContaining({
          originalName: 'test.mp3'
        })
      );
    });
  });

  describe('generateVideo', () => {
    const mockVideoFile = {
      originalname: 'test.mp4',
      mimetype: 'video/mp4',
      size: 10048000,
      buffer: Buffer.from('fake video data')
    };

    beforeEach(() => {
      mockReq.body.prompt = 'Describe this video';
      mockReq.file = mockVideoFile;
      
      validateFile.mockReturnValue({ isValid: true, error: null });
      prepareFileForAPI.mockReturnValue({
        mimeType: 'video/mp4',
        data: 'base64videodata'
      });
      formatFileMetadata.mockReturnValue({
        originalName: 'test.mp4',
        mimeType: 'video/mp4',
        size: 10048000
      });
      generateFromFile.mockResolvedValue('Video description');
    });

    test('should handle successful video analysis', async () => {
      await generateVideo(mockReq, mockRes);

      expect(logRequest).toHaveBeenCalledWith(mockReq, 'generate-from-video', 'video');
      expect(validateFile).toHaveBeenCalledWith(mockVideoFile, 'video');
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Video description',
        'Content generated successfully from video',
        expect.objectContaining({
          originalName: 'test.mp4'
        })
      );
    });
  });

  describe('healthCheck', () => {
    const originalUptime = process.uptime;
    const originalMemoryUsage = process.memoryUsage;

    beforeEach(() => {
      process.uptime = jest.fn().mockReturnValue(3600);
      process.memoryUsage = jest.fn().mockReturnValue({
        rss: 45678592,
        heapTotal: 23456789,
        heapUsed: 12345678,
        external: 1024
      });
    });

    afterEach(() => {
      process.uptime = originalUptime;
      process.memoryUsage = originalMemoryUsage;
    });

    test('should return health status successfully', async () => {
      await healthCheck(mockReq, mockRes);

      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: 3600,
          memory: expect.objectContaining({
            rss: 45678592,
            heapTotal: 23456789,
            heapUsed: 12345678
          }),
          version: expect.any(String)
        }),
        'Service is healthy'
      );
    });

    test('should handle health check errors', async () => {
      process.uptime.mockImplementation(() => {
        throw new Error('Uptime check failed');
      });

      await healthCheck(mockReq, mockRes);

      expect(sendInternalServerError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Health check failed'
      );
    });

    test('should include version from environment', async () => {
      const originalVersion = process.env.npm_package_version;
      process.env.npm_package_version = '2.1.0';

      await healthCheck(mockReq, mockRes);

      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.objectContaining({
          version: '2.1.0'
        }),
        'Service is healthy'
      );

      process.env.npm_package_version = originalVersion;
    });
  });

  describe('getSupportedFileTypes', () => {
    beforeEach(() => {
      getFileTypeConfig.mockReturnValue({
        IMAGE: {
          name: 'image',
          maxSize: 10485760,
          allowedMimeTypes: ['image/jpeg', 'image/png'],
          fieldName: 'file'
        },
        DOCUMENT: {
          name: 'document',
          maxSize: 52428800,
          allowedMimeTypes: ['application/pdf'],
          fieldName: 'file'
        }
      });
    });

    test('should return supported file types successfully', async () => {
      await getSupportedFileTypes(mockReq, mockRes);

      expect(getFileTypeConfig).toHaveBeenCalled();
      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            name: 'image',
            maxSize: 10485760,
            maxSizeMB: 10,
            allowedMimeTypes: ['image/jpeg', 'image/png'],
            fieldName: 'file'
          }),
          expect.objectContaining({
            type: 'document',
            name: 'document',
            maxSize: 52428800,
            maxSizeMB: 50,
            allowedMimeTypes: ['application/pdf'],
            fieldName: 'file'
          })
        ]),
        'Supported file types retrieved successfully'
      );
    });

    test('should handle errors when retrieving file types', async () => {
      getFileTypeConfig.mockImplementation(() => {
        throw new Error('Configuration error');
      });

      await getSupportedFileTypes(mockReq, mockRes);

      expect(sendInternalServerError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Failed to retrieve file types information'
      );
    });
  });

  describe('Error handling scenarios', () => {
    test('should handle undefined request body', async () => {
      mockReq.body = undefined;

      await handleGenerateRequest(mockReq, mockRes);

      expect(sendInternalServerError).toHaveBeenCalled();
    });

    test('should handle file processing errors', async () => {
      mockReq.body.prompt = 'Test prompt';
      mockReq.file = { originalname: 'test.jpg' };
      
      validateFile.mockReturnValue({ isValid: true, error: null });
      prepareFileForAPI.mockImplementation(() => {
        throw new Error('File processing failed');
      });

      await generateImage(mockReq, mockRes);

      expect(sendInternalServerError).toHaveBeenCalledWith(
        mockRes,
        expect.any(Error),
        'Failed to generate content from image'
      );
    });

    test('should handle null file metadata gracefully', async () => {
      mockReq.body.prompt = 'Test prompt';
      mockReq.file = { originalname: 'test.jpg' };
      
      validateFile.mockReturnValue({ isValid: true, error: null });
      prepareFileForAPI.mockReturnValue({ mimeType: 'image/jpeg', data: 'data' });
      formatFileMetadata.mockReturnValue(null);
      generateFromFile.mockResolvedValue('Result');

      await generateImage(mockReq, mockRes);

      expect(sendSuccessResponse).toHaveBeenCalledWith(
        mockRes,
        'Result',
        'Content generated successfully from image',
        null
      );
    });
  });
});