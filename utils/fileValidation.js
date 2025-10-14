/**
 * File validation utilities and configurations
 */

// File type configurations
export const FILE_TYPES = {
  IMAGE: {
    name: 'image',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/svg+xml'
    ],
    fieldName: 'file',
    errorMessage: 'Only JPEG, PNG, GIF, WebP, BMP, and SVG image files are allowed'
  },
  DOCUMENT: {
    name: 'document',
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    fieldName: 'file',
    errorMessage: 'Only PDF, Word, Excel, PowerPoint, Text, and CSV files are allowed'
  },
  AUDIO: {
    name: 'audio',
    maxSize: 100 * 1024 * 1024, // 100MB
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/aac',
      'audio/flac',
      'audio/webm'
    ],
    fieldName: 'file',
    errorMessage: 'Only MP3, WAV, OGG, AAC, FLAC, and WebM audio files are allowed'
  },
  VIDEO: {
    name: 'video',
    maxSize: 200 * 1024 * 1024, // 200MB
    allowedMimeTypes: [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv'
    ],
    fieldName: 'file',
    errorMessage: 'Only MP4, AVI, MOV, WMV, FLV, WebM, and MKV video files are allowed'
  }
};

/**
 * Check if file type is valid for given type category
 * @param {Object} file - File object with mimetype property
 * @param {string} fileType - Type category (image, document, audio, video)
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidFileType(file, fileType) {
  if (!file || !file.mimetype) {
    return false;
  }
  
  const config = getFileTypeConfig(fileType);
  if (!config) {
    return false;
  }
  
  return config.allowedMimeTypes.includes(file.mimetype);
}

/**
 * Validate file size
 * @param {Object} file - Uploaded file object
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} - True if valid, false otherwise
 */
export function isValidFileSize(file, maxSize) {
  if (!file || typeof file.size !== 'number') {
    return false;
  }
  
  return file.size <= maxSize;
}

/**
 * Get file type configuration by type name
 * @param {string} typeName - File type name (case insensitive)
 * @returns {Object|null} File type configuration or null if not found
 */
export function getFileTypeConfig(typeName) {
  if (!typeName || typeof typeName !== 'string') {
    return null;
  }
  const upperTypeName = typeName.toUpperCase();
  return FILE_TYPES[upperTypeName] || null;
}

/**
 * Validate uploaded file against type configuration
 * @param {Object} file - Uploaded file object
 * @param {string} fileType - File type name
 * @returns {Object} - Validation result with isValid and error message
 */
export function validateFile(file, fileType) {
  const config = getFileTypeConfig(fileType);
  
  if (!config) {
    return {
      isValid: false,
      error: `Unknown file type: ${fileType}`
    };
  }
  
  if (!file) {
    return {
      isValid: false,
      error: `${config.name} file is required`
    };
  }

  // Check file type
  if (!isValidFileType(file, fileType)) {
    return {
      isValid: false,
      error: config.errorMessage
    };
  }

  // Check file size
  if (!isValidFileSize(file, config.maxSize)) {
    const maxSizeMB = Math.round(config.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  return {
    isValid: true,
    error: null
  };
}

/**
 * Prepare file for API by converting to base64
 * @param {Object} file - Uploaded file object with buffer
 * @returns {Object} - Object with mimeType and base64 data
 * @throws {Error} - If file is invalid
 */
export function prepareFileForAPI(file) {
  if (!file || !file.buffer || !file.mimetype) {
    throw new Error('Invalid file object - missing buffer or mimetype');
  }

  return {
    mimeType: file.mimetype,
    data: file.buffer.toString('base64')
  };
}

/**
 * Format file metadata for response
 * @param {Object} file - Uploaded file object
 * @returns {Object|null} - Formatted metadata or null
 */
export function formatFileMetadata(file) {
  if (!file) {
    return null;
  }

  return {
    originalName: file.originalname || 'unknown',
    mimeType: file.mimetype || 'unknown',
    size: file.size || 0,
    sizeFormatted: formatFileSize(file.size || 0),
    uploadedAt: new Date().toISOString()
  };
}

/**
 * Format file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get all file type configurations for client
 * @returns {Array} - Array of file type configurations with additional info
 */
export function getAllFileTypeConfigs() {
  return Object.entries(FILE_TYPES).map(([key, config]) => ({
    type: key.toLowerCase(),
    name: config.name,
    maxSize: config.maxSize,
    maxSizeMB: Math.round(config.maxSize / (1024 * 1024)),
    allowedMimeTypes: config.allowedMimeTypes,
    fieldName: config.fieldName,
    errorMessage: config.errorMessage
  }));
}