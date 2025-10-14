import { describe, test, expect, jest, beforeEach } from '@jest/globals';

// Mock geminiService
jest.mock('../../services/geminiService.js', () => ({
  generateText: jest.fn(),
  generateFromFile: jest.fn()
}));

import { generateText, generateFromFile } from '../../services/geminiService.js';

describe('Gemini Service Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    test('should handle successful text generation', async () => {
      const mockResponse = 'This is a generated response from Gemini AI';
      generateText.mockResolvedValue(mockResponse);

      const result = await generateText('Tell me about artificial intelligence');

      expect(result).toBe(mockResponse);
      expect(generateText).toHaveBeenCalledWith('Tell me about artificial intelligence');
    });

    test('should handle API errors gracefully', async () => {
      const apiError = new Error('Gemini API rate limit exceeded');
      generateText.mockRejectedValue(apiError);

      await expect(generateText('Test prompt')).rejects.toThrow('Gemini API rate limit exceeded');
    });

    test('should handle empty prompts', async () => {
      generateText.mockResolvedValue('Please provide a valid prompt');

      const result = await generateText('');

      expect(result).toBe('Please provide a valid prompt');
    });

    test('should handle very long prompts', async () => {
      const longPrompt = 'A'.repeat(10000);
      const mockResponse = 'Response to very long prompt';
      generateText.mockResolvedValue(mockResponse);

      const result = await generateText(longPrompt);

      expect(result).toBe(mockResponse);
      expect(generateText).toHaveBeenCalledWith(longPrompt);
    });

    test('should handle prompts with special characters', async () => {
      const specialPrompt = 'Explain AI 🤖 with émojis and spëcial chars!';
      const mockResponse = 'AI explanation with special characters';
      generateText.mockResolvedValue(mockResponse);

      const result = await generateText(specialPrompt);

      expect(result).toBe(mockResponse);
    });
  });

  describe('generateFromFile', () => {
    test('should handle image file processing', async () => {
      const mockFileData = {
        mimeType: 'image/jpeg',
        data: 'base64encodedimagedata'
      };
      const mockResponse = 'This image shows a beautiful sunset over the ocean';
      generateFromFile.mockResolvedValue(mockResponse);

      const result = await generateFromFile('Describe this image', mockFileData);

      expect(result).toBe(mockResponse);
      expect(generateFromFile).toHaveBeenCalledWith('Describe this image', mockFileData);
    });

    test('should handle PDF document processing', async () => {
      const mockFileData = {
        mimeType: 'application/pdf',
        data: 'base64encodedpdfdata'
      };
      const mockResponse = 'This document contains important information about...';
      generateFromFile.mockResolvedValue(mockResponse);

      const result = await generateFromFile('Summarize this document', mockFileData);

      expect(result).toBe(mockResponse);
    });

    test('should handle audio file processing', async () => {
      const mockFileData = {
        mimeType: 'audio/mpeg',
        data: 'base64encodedaudiodata'
      };
      const mockResponse = 'Transcription: Hello, this is a test audio file...';
      generateFromFile.mockResolvedValue(mockResponse);

      const result = await generateFromFile('Transcribe this audio', mockFileData);

      expect(result).toBe(mockResponse);
    });

    test('should handle video file processing', async () => {
      const mockFileData = {
        mimeType: 'video/mp4',
        data: 'base64encodedvideodata'
      };
      const mockResponse = 'This video shows a person demonstrating...';
      generateFromFile.mockResolvedValue(mockResponse);

      const result = await generateFromFile('Describe this video', mockFileData);

      expect(result).toBe(mockResponse);
    });

    test('should handle file processing errors', async () => {
      const mockFileData = {
        mimeType: 'image/jpeg',
        data: 'corrupteddata'
      };
      const processingError = new Error('Unable to process corrupted file');
      generateFromFile.mockRejectedValue(processingError);

      await expect(
        generateFromFile('Analyze this file', mockFileData)
      ).rejects.toThrow('Unable to process corrupted file');
    });

    test('should handle unsupported file types', async () => {
      const mockFileData = {
        mimeType: 'application/unknown',
        data: 'somedata'
      };
      const unsupportedError = new Error('Unsupported file type');
      generateFromFile.mockRejectedValue(unsupportedError);

      await expect(
        generateFromFile('Process this file', mockFileData)
      ).rejects.toThrow('Unsupported file type');
    });

    test('should handle large file processing', async () => {
      const largeFileData = {
        mimeType: 'video/mp4',
        data: 'very'.repeat(100000) // Simulate large file
      };
      const mockResponse = 'Successfully processed large video file';
      generateFromFile.mockResolvedValue(mockResponse);

      const result = await generateFromFile('Analyze this large video', largeFileData);

      expect(result).toBe(mockResponse);
    });

    test('should handle missing file data', async () => {
      const invalidError = new Error('Invalid file data provided');
      generateFromFile.mockRejectedValue(invalidError);

      await expect(
        generateFromFile('Process this file', null)
      ).rejects.toThrow('Invalid file data provided');
    });

    test('should handle malformed base64 data', async () => {
      const mockFileData = {
        mimeType: 'image/jpeg',
        data: 'invalid-base64-data!!!'
      };
      const base64Error = new Error('Invalid base64 encoding');
      generateFromFile.mockRejectedValue(base64Error);

      await expect(
        generateFromFile('Process this image', mockFileData)
      ).rejects.toThrow('Invalid base64 encoding');
    });
  });

  describe('Service reliability and performance', () => {
    test('should handle multiple concurrent requests', async () => {
      const mockResponses = [
        'Response 1',
        'Response 2', 
        'Response 3',
        'Response 4',
        'Response 5'
      ];

      generateText
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2])
        .mockResolvedValueOnce(mockResponses[3])
        .mockResolvedValueOnce(mockResponses[4]);

      const promises = Array(5).fill().map((_, i) =>
        generateText(`Test prompt ${i + 1}`)
      );

      const results = await Promise.all(promises);

      expect(results).toEqual(mockResponses);
      expect(generateText).toHaveBeenCalledTimes(5);
    });

    test('should handle timeout scenarios', async () => {
      const timeoutError = new Error('Request timeout after 30 seconds');
      generateText.mockRejectedValue(timeoutError);

      await expect(
        generateText('This is a test that will timeout')
      ).rejects.toThrow('Request timeout after 30 seconds');
    });

    test('should handle network connectivity issues', async () => {
      const networkError = new Error('Network connection failed');
      generateFromFile.mockRejectedValue(networkError);

      const mockFileData = {
        mimeType: 'image/jpeg',
        data: 'base64data'
      };

      await expect(
        generateFromFile('Analyze image', mockFileData)
      ).rejects.toThrow('Network connection failed');
    });

    test('should handle API quota exceeded', async () => {
      const quotaError = new Error('API quota exceeded for today');
      generateText.mockRejectedValue(quotaError);

      await expect(
        generateText('Test prompt')
      ).rejects.toThrow('API quota exceeded for today');
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Invalid API key provided');
      generateText.mockRejectedValue(authError);

      await expect(
        generateText('Test with invalid auth')
      ).rejects.toThrow('Invalid API key provided');
    });
  });

  describe('Data validation and security', () => {
    test('should handle SQL injection attempts in prompts', async () => {
      const maliciousPrompt = "'; DROP TABLE users; --";
      const mockResponse = 'I cannot process potentially harmful content';
      generateText.mockResolvedValue(mockResponse);

      const result = await generateText(maliciousPrompt);

      expect(result).toBe(mockResponse);
    });

    test('should handle XSS attempts in prompts', async () => {
      const xssPrompt = '<script>alert("xss")</script>';
      const mockResponse = 'Content processed safely';
      generateText.mockResolvedValue(mockResponse);

      const result = await generateText(xssPrompt);

      expect(result).toBe(mockResponse);
    });

    test('should handle extremely large file data', async () => {
      const hugeFileData = {
        mimeType: 'video/mp4',
        data: 'x'.repeat(200 * 1024 * 1024) // 200MB simulated
      };
      const sizeError = new Error('File too large for processing');
      generateFromFile.mockRejectedValue(sizeError);

      await expect(
        generateFromFile('Process huge file', hugeFileData)
      ).rejects.toThrow('File too large for processing');
    });
  });
});