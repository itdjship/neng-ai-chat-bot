import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  FILE_TYPES,
  isValidFileType,
  isValidFileSize,
  validateFile,
  prepareFileForAPI,
  formatFileMetadata,
  getFileTypeConfig,
  getAllFileTypeConfigs
} from '../../utils/fileValidation.js';

describe('File Validation Utils', () => {
  describe('FILE_TYPES configuration', () => {
    test('should have all required file types', () => {
      expect(FILE_TYPES).toHaveProperty('IMAGE');
      expect(FILE_TYPES).toHaveProperty('DOCUMENT');
      expect(FILE_TYPES).toHaveProperty('AUDIO');
      expect(FILE_TYPES).toHaveProperty('VIDEO');
    });

    test('should have correct structure for each file type', () => {
      Object.values(FILE_TYPES).forEach(fileType => {
        expect(fileType).toHaveProperty('name');
        expect(fileType).toHaveProperty('maxSize');
        expect(fileType).toHaveProperty('allowedMimeTypes');
        expect(fileType).toHaveProperty('fieldName');
        expect(fileType).toHaveProperty('errorMessage');
        expect(Array.isArray(fileType.allowedMimeTypes)).toBe(true);
      });
    });

    test('should have reasonable size limits', () => {
      expect(FILE_TYPES.IMAGE.maxSize).toBeGreaterThan(0);
      expect(FILE_TYPES.DOCUMENT.maxSize).toBeGreaterThan(FILE_TYPES.IMAGE.maxSize);
      expect(FILE_TYPES.VIDEO.maxSize).toBeGreaterThan(FILE_TYPES.AUDIO.maxSize);
    });
  });

  describe('isValidFileType', () => {
    test('should return true for valid image mime types', () => {
      const file = { mimetype: 'image/jpeg' };
      expect(isValidFileType(file, 'image')).toBe(true);
    });

    test('should return false for invalid mime types', () => {
      const file = { mimetype: 'application/evil' };
      expect(isValidFileType(file, 'image')).toBe(false);
    });

    test('should return false for null or undefined file', () => {
      expect(isValidFileType(null, 'image')).toBe(false);
      expect(isValidFileType(undefined, 'image')).toBe(false);
    });

    test('should return false for file without mimetype', () => {
      const file = { size: 1000 };
      expect(isValidFileType(file, 'image')).toBe(false);
    });

    test('should handle wildcard matching for image types', () => {
      const file = { mimetype: 'image/png' };
      expect(isValidFileType(file, 'image')).toBe(true);
    });
  });

  describe('isValidFileSize', () => {
    test('should return true for valid file size', () => {
      const file = { size: 1000 };
      const maxSize = 2000;
      expect(isValidFileSize(file, maxSize)).toBe(true);
    });

    test('should return false for oversized file', () => {
      const file = { size: 3000 };
      const maxSize = 2000;
      expect(isValidFileSize(file, maxSize)).toBe(false);
    });

    test('should return false for null or undefined file', () => {
      expect(isValidFileSize(null, 1000)).toBe(false);
      expect(isValidFileSize(undefined, 1000)).toBe(false);
    });

    test('should return false for file without size property', () => {
      const file = { mimetype: 'image/jpeg' };
      expect(isValidFileSize(file, 1000)).toBe(false);
    });

    test('should handle edge case of exactly max size', () => {
      const file = { size: 1000 };
      const maxSize = 1000;
      expect(isValidFileSize(file, maxSize)).toBe(true);
    });
  });

  describe('getFileTypeConfig', () => {
    test('should return correct config for valid type names', () => {
      const imageConfig = getFileTypeConfig('image');
      expect(imageConfig).toBe(FILE_TYPES.IMAGE);
      
      const docConfig = getFileTypeConfig('document');
      expect(docConfig).toBe(FILE_TYPES.DOCUMENT);
    });

    test('should return null for invalid type names', () => {
      expect(getFileTypeConfig('invalid')).toBeNull();
      expect(getFileTypeConfig(null)).toBeNull();
      expect(getFileTypeConfig(undefined)).toBeNull();
      expect(getFileTypeConfig('')).toBeNull();
    });

    test('should be case insensitive', () => {
      expect(getFileTypeConfig('IMAGE')).toBe(FILE_TYPES.IMAGE);
      expect(getFileTypeConfig('Image')).toBe(FILE_TYPES.IMAGE);
      expect(getFileTypeConfig('iMaGe')).toBe(FILE_TYPES.IMAGE);
    });
  });

  describe('validateFile', () => {
    const validImageFile = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024000 // 1MB
    };

    test('should return valid result for correct image file', () => {
      const result = validateFile(validImageFile, 'image');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should return invalid result for missing file', () => {
      const result = validateFile(null, 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('image file is required');
    });

    test('should return invalid result for oversized file', () => {
      const oversizedFile = { ...validImageFile, size: 50 * 1024 * 1024 }; // 50MB
      const result = validateFile(oversizedFile, 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File size exceeds');
    });

    test('should return invalid result for wrong file type', () => {
      const wrongTypeFile = { ...validImageFile, mimetype: 'application/pdf' };
      const result = validateFile(wrongTypeFile, 'image');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('JPEG');
    });

    test('should return invalid result for unknown file type', () => {
      const result = validateFile(validImageFile, 'unknown');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Unknown file type');
    });

    test('should validate different file types correctly', () => {
      const pdfFile = {
        originalname: 'doc.pdf',
        mimetype: 'application/pdf',
        size: 1024000
      };
      
      const result = validateFile(pdfFile, 'document');
      expect(result.isValid).toBe(true);
    });
  });

  describe('prepareFileForAPI', () => {
    test('should convert file buffer to base64 format', () => {
      const file = {
        buffer: Buffer.from('test data'),
        mimetype: 'image/jpeg'
      };
      
      const result = prepareFileForAPI(file);
      
      expect(result).toHaveProperty('mimeType', 'image/jpeg');
      expect(result).toHaveProperty('data');
      expect(typeof result.data).toBe('string');
      expect(result.data).toBe(Buffer.from('test data').toString('base64'));
    });

    test('should throw error for invalid file object', () => {
      expect(() => prepareFileForAPI(null)).toThrow('Invalid file object');
      expect(() => prepareFileForAPI({})).toThrow('Invalid file object');
      expect(() => prepareFileForAPI({ buffer: Buffer.from('test') })).toThrow('Invalid file object');
    });

    test('should handle different mime types', () => {
      const file = {
        buffer: Buffer.from('pdf data'),
        mimetype: 'application/pdf'
      };
      
      const result = prepareFileForAPI(file);
      expect(result.mimeType).toBe('application/pdf');
    });
  });

  describe('formatFileMetadata', () => {
    test('should format complete file metadata', () => {
      const file = {
        originalname: 'test-image.jpg',
        mimetype: 'image/jpeg',
        size: 1048576
      };

      const result = formatFileMetadata(file);
      expect(result).toEqual(expect.objectContaining({
        originalName: 'test-image.jpg',
        mimeType: 'image/jpeg',
        size: 1048576,
        sizeFormatted: expect.any(String),
        uploadedAt: expect.any(String)
      }));
    });

    test('should return null for null file', () => {
      expect(formatFileMetadata(null)).toBeNull();
    });

    test('should handle partial file metadata', () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg'
        // missing size
      };

      const result = formatFileMetadata(file);
      expect(result.originalName).toBe('test.jpg');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.size).toBe(0);
    });
  });

  describe('getAllFileTypeConfigs', () => {
    test('should return array of all file type configurations', () => {
      const configs = getAllFileTypeConfigs();
      
      expect(Array.isArray(configs)).toBe(true);
      expect(configs).toHaveLength(4);
      
      configs.forEach(config => {
        expect(config).toHaveProperty('type');
        expect(config).toHaveProperty('name');
        expect(config).toHaveProperty('maxSize');
        expect(config).toHaveProperty('maxSizeMB');
        expect(config).toHaveProperty('allowedMimeTypes');
        expect(config).toHaveProperty('fieldName');
        expect(config).toHaveProperty('errorMessage');
      });
    });

    test('should include maxSizeMB calculated correctly', () => {
      const configs = getAllFileTypeConfigs();
      const imageConfig = configs.find(c => c.type === 'image');
      
      expect(imageConfig.maxSizeMB).toBe(10); // 10MB
    });
  });
});