# Testing Guide for Gemini NengAI

## 📊 Test Coverage Overview

[![Test Coverage](https://img.shields.io/badge/Coverage-98.67%25-brightgreen.svg)](./coverage)
[![Tests](https://img.shields.io/badge/Tests-174%20passed-brightgreen.svg)](#)

**Current Metrics:**
- **Total Tests:** 174
- **Test Suites:** 8
- **Statements Coverage:** 98.67%
- **Branches Coverage:** 91.96%  
- **Functions Coverage:** 100%
- **Lines Coverage:** 98.64%

## 🎯 Testing Philosophy

Our testing strategy follows the **Test Pyramid** approach:

1. **Unit Tests (60%)** - Fast, isolated, comprehensive
2. **Integration Tests (30%)** - API endpoints, middleware interaction
3. **System Tests (10%)** - End-to-end workflows, infrastructure validation

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run verbose output
npm run test:verbose

# Run silently (CI/CD)
npm run test:silent
```

### Test Categories

```bash
# Unit tests only
npm run test:unit

# Integration tests only  
npm run test:integration

# Service tests only
npm run test:services

# System tests only
npm run test:system
```

### Debugging Tests

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should validate file"

# Debug with Node inspector
node --inspect-brk=9229 node_modules/.bin/jest --runInBand
```

## 📁 Test Structure

```
__tests__/
├── controllers/           # Controller logic tests
│   └── controller.test.js
├── middleware/           # Middleware validation tests
│   └── validation.test.js
├── services/            # External service integration tests
│   └── geminiService.test.js
├── utils/              # Utility function tests
│   ├── fileValidation.test.js
│   ├── responseHandler.test.js
│   └── logger.test.js
├── integration/        # API endpoint tests
│   └── api.test.js
└── system/            # System and infrastructure tests
    └── coverage.test.js
```

## 🧪 Test Types & Examples

### 1. Unit Tests

#### File Validation Utils
```javascript
describe('File Validation Utils', () => {
  describe('validateFile', () => {
    test('should validate image file correctly', () => {
      const file = {
        mimetype: 'image/jpeg',
        size: 1024000,
        buffer: Buffer.from('fake image data')
      };
      
      const result = validateFile(file, 'image');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should reject oversized files', () => {
      const file = {
        mimetype: 'image/jpeg', 
        size: 50 * 1024 * 1024, // 50MB
        buffer: Buffer.from('fake image data')
      };
      
      const result = validateFile(file, 'image');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('file size exceeds');
    });
  });
});
```

#### Response Handler Utils
```javascript
describe('Response Handler Utils', () => {
  describe('sendSuccessResponse', () => {
    test('should send success response with correct format', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      
      sendSuccessResponse(mockRes, 'Generated content', 'Success');
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: true,
        code: 200,
        message: 'Success',
        data: 'Generated content',
        timestamp: expect.any(String)
      });
    });
  });
});
```

### 2. Integration Tests

#### API Endpoint Testing
```javascript
describe('API Integration Tests', () => {
  describe('POST /api/genAI/generate/image', () => {
    test('should process image file successfully', async () => {
      // Mock Gemini service
      generateFromFile.mockResolvedValue('This is an image of a sunset');
      
      const response = await request(app)
        .post('/api/genAI/generate/image')
        .field('prompt', 'Describe this image')
        .attach('file', imageBuffer, 'test.jpg')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('This is an image of a sunset');
      expect(response.body.meta).toHaveProperty('originalName', 'test.jpg');
    });

    test('should handle file validation errors', async () => {
      const response = await request(app)
        .post('/api/genAI/generate/image')
        .field('prompt', 'Describe this image')
        .attach('file', textBuffer, 'test.txt') // Wrong file type
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('validation');
    });
  });
});
```

### 3. Service Tests

#### Gemini AI Integration
```javascript
describe('Gemini Service Integration', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('generateText', () => {
    test('should handle successful text generation', async () => {
      const mockResponse = 'Generated AI content';
      GoogleGenerativeAI.prototype.getGenerativeModel.mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: {
            text: () => mockResponse
          }
        })
      });

      const result = await generateText('Test prompt');
      
      expect(result).toBe(mockResponse);
    });

    test('should handle API errors gracefully', async () => {
      GoogleGenerativeAI.prototype.getGenerativeModel.mockReturnValue({
        generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
      });

      await expect(generateText('Test prompt'))
        .rejects.toThrow('Failed to generate text content');
    });
  });
});
```

### 4. System Tests

#### Infrastructure Validation
```javascript
describe('System Tests', () => {
  describe('Project structure validation', () => {
    test('should verify all required modules exist', () => {
      const requiredModules = [
        'modules/genAI/controller.js',
        'modules/genAI/utils/fileValidation.js',
        'modules/genAI/middleware/validation.js',
        'services/geminiService.js'
      ];

      requiredModules.forEach(modulePath => {
        expect(() => require(`../${modulePath}`)).not.toThrow();
      });
    });

    test('should validate test directory structure', () => {
      const testDirs = [
        '__tests__/controllers',
        '__tests__/middleware', 
        '__tests__/utils',
        '__tests__/services',
        '__tests__/integration'
      ];

      testDirs.forEach(dir => {
        expect(fs.existsSync(dir)).toBe(true);
      });
    });
  });
});
```

## 🛠️ Mock Strategy

### Service Mocking

```javascript
// Mock Gemini AI service
jest.mock('../../services/geminiService.js', () => ({
  generateText: jest.fn(),
  generateFromFile: jest.fn()
}));

// Mock file validation utilities
jest.mock('../../modules/genAI/utils/fileValidation.js', () => ({
  validateFile: jest.fn(),
  prepareFileForAPI: jest.fn(),
  formatFileMetadata: jest.fn(),
  FILE_TYPES: {
    IMAGE: {
      maxSize: 10 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png']
    }
  }
}));
```

### File Upload Mocking

```javascript
// Create test app with mocked multer
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock multer middleware
  app.use((req, res, next) => {
    if (req.get('content-type')?.includes('multipart/form-data')) {
      // Mock file based on endpoint
      if (req.path.includes('/image')) {
        req.file = {
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024000,
          buffer: Buffer.from('fake image data')
        };
      }
    }
    next();
  });
  
  return app;
};
```

## 📊 Coverage Analysis

### Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 85,
    functions: 85,
    lines: 85,
    statements: 85,
  },
}
```

### Coverage Reports

**HTML Report:**
```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

**Text Summary:**
```
---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------|---------|----------|---------|---------|-------------------
All files            |   98.67 |    91.96 |     100 |   98.64 |                   
 controller.js       |   98.07 |       84 |     100 |   98.03 | 107               
 validation.js       |     100 |    93.33 |     100 |     100 | 89                
 fileValidation.js   |   97.43 |    92.68 |     100 |   97.29 | 83               
 responseHandler.js  |     100 |      100 |     100 |     100 |                  
---------------------|---------|----------|---------|---------|-------------------
```

### Uncovered Lines Analysis

**Line 107 (controller.js):** Error logging edge case - acceptable uncovered
**Line 89 (validation.js):** Rate limiter edge case - low priority  
**Line 83 (fileValidation.js):** File metadata fallback - acceptable uncovered

## 🔄 Test Data Management

### Test Fixtures

```javascript
// Test data for consistent testing
export const TEST_FILES = {
  VALID_IMAGE: {
    originalname: 'test.jpg',
    mimetype: 'image/jpeg', 
    size: 1024000,
    buffer: Buffer.from('fake image data')
  },
  
  OVERSIZED_IMAGE: {
    originalname: 'large.jpg',
    mimetype: 'image/jpeg',
    size: 50 * 1024 * 1024, // 50MB
    buffer: Buffer.alloc(50 * 1024 * 1024)
  },
  
  INVALID_FILE: {
    originalname: 'document.txt',
    mimetype: 'text/plain',
    size: 1024,
    buffer: Buffer.from('text content')
  }
};

export const TEST_PROMPTS = {
  VALID: 'Describe this content',
  EMPTY: '',
  TOO_LONG: 'x'.repeat(10001),
  WITH_SPECIAL_CHARS: 'Test with émojis 🚀 and special chars: <script>alert("xss")</script>'
};
```

### Mock Response Templates

```javascript
export const MOCK_RESPONSES = {
  SUCCESS: {
    TEXT: 'Generated AI content successfully',
    IMAGE: 'This is an image showing a beautiful sunset over the ocean',
    DOCUMENT: 'This document contains information about artificial intelligence',
    AUDIO: 'Audio transcription: Hello world, this is a test audio file',
    VIDEO: 'Video description: A short clip showing a person walking in a park'
  },
  
  ERRORS: {
    API_ERROR: new Error('Gemini API rate limit exceeded'),
    NETWORK_ERROR: new Error('Network connection failed'),
    INVALID_INPUT: new Error('Invalid input provided')
  }
};
```

## 🔧 Configuration

### Jest Configuration

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'modules/**/controller.js',
    'modules/**/middleware/*.js',
    'modules/**/utils/*.js',
    '!modules/**/utils/logger.js',
    '!modules/**/*backup*.js',
  ],
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Performance
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true
};
```

### Babel Configuration

```javascript
// babel.config.js
export default {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }]
  ]
};
```

### Jest Setup

```javascript
// jest.setup.js
import { jest } from '@jest/globals';

// Global test timeout
jest.setTimeout(10000);

// Global mocks
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'test-api-key';
```

## 🔍 Testing Best Practices

### 1. Test Naming Convention

```javascript
// ✅ Good: Descriptive and clear
test('should validate image file when format and size are correct', () => {});
test('should return validation error when file size exceeds limit', () => {});
test('should handle missing prompt gracefully', () => {});

// ❌ Bad: Vague and unclear  
test('file validation', () => {});
test('test error', () => {});
test('controller test', () => {});
```

### 2. Test Structure (AAA Pattern)

```javascript
test('should process image file successfully', async () => {
  // Arrange
  const mockFile = TEST_FILES.VALID_IMAGE;
  const mockPrompt = 'Describe this image';
  generateFromFile.mockResolvedValue('Generated content');
  
  // Act
  const response = await request(app)
    .post('/api/genAI/generate/image')
    .field('prompt', mockPrompt)
    .attach('file', mockFile.buffer, mockFile.originalname);
  
  // Assert
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(generateFromFile).toHaveBeenCalledWith(mockPrompt, expect.any(Object));
});
```

### 3. Error Testing

```javascript
describe('Error scenarios', () => {
  test('should handle Gemini API errors gracefully', async () => {
    // Arrange
    const apiError = new Error('API rate limit exceeded');
    generateText.mockRejectedValue(apiError);
    
    // Act
    const response = await request(app)
      .post('/api/genAI/generate-text')
      .send({ prompt: 'Test prompt' });
    
    // Assert
    expect(response.status).toBe(500);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Failed to generate content');
  });
});
```

### 4. Async Testing

```javascript
// ✅ Good: Proper async/await usage
test('should handle async operations correctly', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected value');
});

// ✅ Good: Promise rejection testing
test('should handle promise rejections', async () => {
  await expect(asyncFunction()).rejects.toThrow('Expected error');
});

// ❌ Bad: Missing await
test('async test without await', () => {
  const result = asyncFunction(); // Returns Promise, not actual result
  expect(result).toBe('expected value'); // This will fail
});
```

## 📈 Performance Testing

### Response Time Testing

```javascript
describe('Performance Tests', () => {
  test('should respond within acceptable time limits', async () => {
    const startTime = Date.now();
    
    const response = await request(app)
      .post('/api/genAI/generate-text')
      .send({ prompt: 'Short prompt' });
    
    const responseTime = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(5000); // 5 seconds max
  });
});
```

### Load Testing

```javascript
describe('Load Tests', () => {
  test('should handle concurrent requests', async () => {
    const requests = Array(10).fill().map(() =>
      request(app)
        .post('/api/genAI/generate-text')
        .send({ prompt: 'Concurrent test' })
    );
    
    const responses = await Promise.all(requests);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

## 🚦 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test:ci
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

### Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:unit",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

### Test Scripts for CI

```json
{
  "scripts": {
    "test:ci": "jest --ci --coverage --watchAll=false --passWithNoTests",
    "test:ci:unit": "jest __tests__/utils __tests__/middleware __tests__/controllers --ci",
    "test:ci:integration": "jest __tests__/integration --ci --forceExit"
  }
}
```

## 🐛 Debugging Tests

### Debug Mode

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="should validate file"

# Debug with VS Code
# Add to .vscode/launch.json:
{
  "type": "node",
  "request": "launch", 
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Verbose Output

```bash
# Detailed test output
npm run test:verbose

# With coverage details
npm run test:coverage -- --verbose
```

### Test Isolation

```javascript
// Isolate tests for debugging
describe.only('File Validation', () => {
  test.only('should validate specific case', () => {
    // Only this test will run
  });
});
```

## 📋 Test Checklist

### Before Committing

- [ ] All tests pass (`npm test`)
- [ ] Coverage meets threshold (>85%)
- [ ] New features have corresponding tests
- [ ] Error scenarios are tested
- [ ] Integration tests cover new endpoints
- [ ] Mock data is realistic and comprehensive

### Code Review Checklist

- [ ] Test names are descriptive and clear
- [ ] Tests follow AAA pattern (Arrange, Act, Assert)
- [ ] Async operations are properly handled
- [ ] Error scenarios are covered
- [ ] Mocks are appropriate and realistic
- [ ] Test data is isolated and repeatable

### Release Checklist

- [ ] Full test suite passes
- [ ] Integration tests with real scenarios
- [ ] Performance tests within limits
- [ ] Security tests for input validation
- [ ] Coverage report generated
- [ ] Test documentation updated

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Node.js Applications](https://nodejs.org/en/docs/guides/testing/)
- [Test Driven Development Best Practices](https://testdriven.io/)

---

**Remember:** Good tests are your safety net. They give you confidence to refactor, add features, and deploy with peace of mind.