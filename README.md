# Gemini NengAI - Multimodal AI Content Generation API

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini-2.5--flash-orange.svg)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

## 📋 Deskripsi

Gemini NengAI adalah REST API yang powerful untuk content generation menggunakan Google Gemini AI. API ini mendukung multimodal input (text, image, document, audio, video) dan dirancang dengan arsitektur yang robust, scalable, dan production-ready.

## ✨ Features

- 🤖 **AI Content Generation** - Powered by Google Gemini 2.5 Flash
- 📸 **Image Analysis** - Analisis dan deskripsi gambar
- 📄 **Document Processing** - Ekstrak informasi dari PDF, Word, Excel
- 🎵 **Audio Analysis** - Transkripsi dan analisis audio
- 🎬 **Video Processing** - Analisis konten video
- 🛡️ **Security** - Rate limiting, input validation, file sanitization
- 📊 **Monitoring** - Performance tracking dan comprehensive logging
- 🔧 **Robust Error Handling** - Standardized responses dan graceful recovery

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm atau yarn
- Google Gemini API Key

### Installation

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd gemini-nengai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   NODE_ENV=development
   PORT=6068
   ```

4. **Start server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

Server akan berjalan di `http://localhost:6068`

## 📖 API Documentation

### Base URL
```
http://localhost:6068/api/nengAI
```

### Authentication
Saat ini API tidak memerlukan authentication, namun menggunakan rate limiting (100 requests per 15 menit per IP).

---

### 🏥 Health Check

**GET** `/health`

Mengecek status kesehatan aplikasi.

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2025-10-15T10:30:00.000Z",
    "uptime": 3600,
    "memory": {
      "rss": 45678592,
      "heapTotal": 23456789,
      "heapUsed": 12345678
    },
    "version": "1.0.0"
  },
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

---

### 📋 Supported File Types

**GET** `/file-types`

Menampilkan informasi jenis file yang didukung.

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Supported file types retrieved successfully",
  "data": [
    {
      "type": "image",
      "name": "image",
      "maxSize": 10485760,
      "maxSizeMB": 10,
      "allowedMimeTypes": ["image/jpeg", "image/png", "image/gif", "image/webp"],
      "fieldName": "file"
    },
    {
      "type": "document",
      "name": "document", 
      "maxSize": 52428800,
      "maxSizeMB": 50,
      "allowedMimeTypes": ["application/pdf", "application/msword", "text/plain"],
      "fieldName": "file"
    }
  ]
}
```

---

### 💬 Text Generation

**POST** `/generate-text`

Generate content dari text prompt saja.

**Request Body:**
```json
{
  "prompt": "Jelaskan tentang artificial intelligence"
}
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Content generated successfully",
  "data": "Artificial Intelligence (AI) adalah teknologi yang memungkinkan...",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

---

### 📸 Image Analysis

**POST** `/generate-from-image`

Generate content dari kombinasi image dan text prompt.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file): Image file (JPEG, PNG, GIF, WebP, BMP, SVG)
- `prompt` (text): Text prompt untuk analisis

**Example Request:**
```bash
curl -X POST http://localhost:6068/api/nengAI/generate-from-image \
  -F "file=@image.jpg" \
  -F "prompt=Describe what you see in this image"
```

**Response:**
```json
{
  "status": true,
  "code": 200,
  "message": "Content generated successfully from image",
  "data": "In this image, I can see a beautiful sunset over the ocean...",
  "meta": {
    "originalName": "sunset.jpg",
    "mimeType": "image/jpeg",
    "size": 1048576,
    "encoding": "7bit"
  },
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

---

### 📄 Document Analysis

**POST** `/generate-from-document`

Generate content dari dokumen (PDF, Word, Excel, Text, CSV).

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file): Document file 
- `prompt` (text): Text prompt untuk analisis

**Supported Formats:**
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)
- Text files (`.txt`)
- CSV files (`.csv`)
- PowerPoint (`.ppt`, `.pptx`)

**Example Request:**
```bash
curl -X POST http://localhost:6068/api/nengAI/generate-from-document \
  -F "file=@document.pdf" \
  -F "prompt=Summarize the main points of this document"
```

---

### 🎵 Audio Analysis

**POST** `/generate-from-audio`

Generate content dari file audio.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file): Audio file
- `prompt` (text): Text prompt untuk analisis

**Supported Formats:**
- MP3 (`.mp3`)
- WAV (`.wav`)
- FLAC (`.flac`)
- AAC (`.aac`)
- OGG (`.ogg`)
- WebM Audio (`.webm`)

**Example Request:**
```bash
curl -X POST http://localhost:6068/api/nengAI/generate-from-audio \
  -F "file=@audio.mp3" \
  -F "prompt=Transcribe this audio and summarize the content"
```

---

### 🎬 Video Analysis

**POST** `/generate-from-video`

Generate content dari file video.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (file): Video file
- `prompt` (text): Text prompt untuk analisis

**Supported Formats:**
- MP4 (`.mp4`)
- M4V (`.m4v`)
- QuickTime (`.mov`)
- WebM Video (`.webm`)

**Example Request:**
```bash
curl -X POST http://localhost:6068/api/nengAI/generate-from-video \
  -F "file=@video.mp4" \
  -F "prompt=Describe what happens in this video"
```

## 📊 Response Format

### Success Response
```json
{
  "status": true,
  "code": 200,
  "message": "Success message",
  "data": "Generated content or data",
  "meta": {
    "originalName": "filename.ext",
    "mimeType": "file/type",
    "size": 1048576
  },
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "status": false,
  "code": 400,
  "message": "Error message",
  "errors": "Detailed error information",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

## 🛡️ Security & Limitations

### Rate Limiting
- **Limit:** 100 requests per 15 minutes per IP address
- **Response:** HTTP 429 when limit exceeded

### File Size Limits
- **Images:** 10 MB maximum
- **Documents:** 50 MB maximum  
- **Audio:** 100 MB maximum
- **Video:** 200 MB maximum

### Input Validation
- Prompt maximum length: 10,000 characters
- File type validation based on MIME type
- Input sanitization untuk security

### Content-Type Requirements
File upload endpoints memerlukan `multipart/form-data` content type.

## 🏗️ Architecture

### Project Structure
```
gemini-nengai/
├── app.js                      # Main application entry point
├── router.js                   # Main API router
├── package.json               # Dependencies dan scripts
├── .env                       # Environment variables
├── services/
│   └── geminiService.js       # Gemini AI integration
└── modules/
    └── genAI/
        ├── API.js             # Route definitions
        ├── controller.js      # Request handlers
        ├── utils/
        │   ├── fileValidation.js    # File validation utilities
        │   ├── responseHandler.js   # Response formatting
        │   └── logger.js            # Logging utilities
        └── middleware/
            └── validation.js        # Input validation middleware
```

### Key Components

1. **Controller Layer**
   - Request handling dan validation
   - Business logic coordination
   - Response formatting

2. **Service Layer**
   - Gemini AI API integration
   - External service calls

3. **Utility Layer**
   - File validation dan processing
   - Logging dan monitoring
   - Response standardization

4. **Middleware Layer**
   - Input validation
   - Rate limiting
   - Error handling

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API Key | - | ✅ |
| `GEMINI_MODEL` | Gemini model name | `gemini-2.5-flash` | ❌ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `PORT` | Server port | `6068` | ❌ |

### Customization

**File Size Limits** dapat diubah di `modules/genAI/utils/fileValidation.js`:
```javascript
export const FILE_TYPES = {
  IMAGE: {
    maxSize: 10 * 1024 * 1024, // 10MB
    // ...
  }
}
```

**Rate Limiting** dapat diubah di `modules/genAI/middleware/validation.js`:
```javascript
const rateLimiter = createRateLimiter(100, 15 * 60 * 1000); // 100 req/15min
```

## 📝 Development

### Running in Development
```bash
# Install nodemon globally (optional)
npm install -g nodemon

# Run with auto-reload
nodemon app.js

# Or add to package.json scripts:
npm run dev
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "node app.js",
    "dev": "nodemon app.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

### Logging

Development mode menyediakan detailed logging:
```
[2025-10-15T10:30:00.000Z] REQUEST: generate-from-image {
  method: "POST",
  endpoint: "generate-from-image", 
  ip: "127.0.0.1",
  hasFile: true,
  fileInfo: { originalName: "image.jpg", size: 1024000 }
}

[PERFORMANCE] Gemini API Call: 1250ms

[2025-10-15T10:30:00.000Z] SUCCESS: generate-from-image {
  processingTime: "1250ms",
  fileSize: 1024000,
  responseLength: 500
}
```

## 🧪 Testing

Proyek ini dilengkapi dengan comprehensive test suite menggunakan Jest untuk memastikan kualitas dan reliability code.

### Test Coverage

[![Test Coverage](https://img.shields.io/badge/Coverage-98.67%25-brightgreen.svg)](./coverage)
[![Tests](https://img.shields.io/badge/Tests-174%20passed-brightgreen.svg)](#)

**Current Coverage:**
- **Statements:** 98.67%
- **Branches:** 91.96%  
- **Functions:** 100%
- **Lines:** 98.64%

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test __tests__/utils/fileValidation.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should validate file"
```

### Test Structure

```
__tests__/
├── controllers/
│   └── controller.test.js      # Controller function tests
├── middleware/
│   └── validation.test.js      # Middleware validation tests  
├── services/
│   └── geminiService.test.js   # Service integration tests
├── utils/
│   ├── fileValidation.test.js  # File validation utility tests
│   ├── responseHandler.test.js # Response handler tests
│   └── logger.test.js          # Logger utility tests
├── integration/
│   └── api.test.js            # API endpoint integration tests
└── system/
    └── coverage.test.js       # System and coverage tests
```

### Test Categories

#### 1. Unit Tests
**Utilities Testing:**
- File validation functions
- Response formatting
- Logger functionality
- Input sanitization

**Example:**
```javascript
describe('validateFile', () => {
  test('should validate image file correctly', () => {
    const file = { mimetype: 'image/jpeg', size: 1024000 };
    const result = validateFile(file, 'image');
    expect(result.isValid).toBe(true);
  });
});
```

#### 2. Integration Tests  
**API Endpoints:**
- All file upload endpoints
- Text generation endpoint
- Health check and file types
- Error handling scenarios

**Example:**
```javascript
describe('POST /api/genAI/generate/image', () => {
  test('should process image file successfully', async () => {
    const response = await request(app)
      .post('/api/genAI/generate/image')
      .field('prompt', 'Describe this image')
      .attach('file', imageBuffer, 'test.jpg')
      .expect(200);
      
    expect(response.body.success).toBe(true);
  });
});
```

#### 3. Service Tests
**Gemini AI Integration:**
- Text generation scenarios
- File processing workflows  
- Error handling for API failures
- Security validation

#### 4. System Tests
**Infrastructure Testing:**
- Module loading verification
- Test coverage validation
- Configuration verification
- Performance monitoring

### Test Configuration

**Jest Configuration (`jest.config.js`):**
```javascript
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverage: true,
  collectCoverageFrom: [
    'modules/**/controller.js',
    'modules/**/middleware/*.js', 
    'modules/**/utils/*.js',
    '!modules/**/utils/logger.js',
    '!modules/**/*backup*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

### Mocking Strategy

**Service Mocks:**
```javascript
jest.mock('../../services/geminiService.js', () => ({
  generateText: jest.fn(),
  generateFromFile: jest.fn()
}));
```

**File Upload Mocks:**
```javascript
// Mock multer middleware for file upload testing
app.use((req, res, next) => {
  if (req.path.includes('/image')) {
    req.file = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
      size: 1024000,
      buffer: Buffer.from('fake image data')
    };
  }
  next();
});
```

### Test Data Management

**Test Files:**
- Mock image buffers untuk file upload tests
- Sample prompts untuk text generation
- Error scenarios untuk negative testing
- Performance test data

### Coverage Reports

**HTML Report:**
```bash
npm test
# Open ./coverage/lcov-report/index.html
```

**Text Report:**
```
---------------------|---------|----------|---------|---------|-------------------
File                 | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
---------------------|---------|----------|---------|---------|-------------------
All files            |   98.67 |    91.96 |     100 |   98.64 |                   
 genAI               |   98.07 |       84 |     100 |   98.03 |                   
  controller.js      |   98.07 |       84 |     100 |   98.03 | 107               
 genAI/middleware    |     100 |    93.33 |     100 |     100 |                   
  validation.js      |     100 |    93.33 |     100 |     100 | 89                
 genAI/utils         |   98.18 |    94.73 |     100 |   98.11 |                  
  fileValidation.js  |   97.43 |    92.68 |     100 |   97.29 | 83               
  responseHandler.js |     100 |      100 |     100 |     100 |                  
---------------------|---------|----------|---------|---------|-------------------
```

### Continuous Integration

**Pre-commit Hooks:**
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

**GitHub Actions Example:**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### Testing Best Practices

1. **Test Naming Convention:**
   - Descriptive test names: `should validate file when format is correct`
   - Group related tests in describe blocks
   - Use consistent naming patterns

2. **Test Structure:**
   - Arrange: Setup test data
   - Act: Execute function under test  
   - Assert: Verify expected results

3. **Mock Strategy:**
   - Mock external dependencies (Gemini API)
   - Use dependency injection untuk testability
   - Reset mocks between tests

4. **Coverage Goals:**
   - Maintain minimum 85% coverage
   - Focus on critical business logic
   - Test error scenarios dan edge cases

### Manual Testing dengan cURL

**Text Generation:**
```bash
curl -X POST http://localhost:6068/api/nengAI/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Explain artificial intelligence"}'
```

**Image Analysis:**
```bash
curl -X POST http://localhost:6068/api/nengAI/generate-from-image \
  -F "file=@test-image.jpg" \
  -F "prompt=Describe this image"
```

**Health Check:**
```bash
curl http://localhost:6068/api/nengAI/health
```

### Testing dengan Postman

1. Import collection dengan endpoints:
   - `GET /api/nengAI/health`
   - `GET /api/nengAI/file-types`
   - `POST /api/nengAI/generate-text`
   - `POST /api/nengAI/generate-from-image`
   - `POST /api/nengAI/generate-from-document`
   - `POST /api/nengAI/generate-from-audio`
   - `POST /api/nengAI/generate-from-video`

2. Set environment variables:
   - `baseUrl`: `http://localhost:6068`

## 🚨 Error Handling

### Common Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Bad Request - Invalid input | Check request format dan validation |
| 401 | Unauthorized | Check API key configuration |
| 413 | Payload Too Large | Reduce file size |
| 415 | Unsupported Media Type | Check file type dan Content-Type |
| 429 | Too Many Requests | Wait and retry after rate limit reset |
| 500 | Internal Server Error | Check logs dan server status |

### Error Response Examples

**Validation Error:**
```json
{
  "status": false,
  "code": 400,
  "message": "Prompt is required in the request body",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

**File Size Error:**
```json
{
  "status": false,
  "code": 400,
  "message": "File size exceeds maximum limit of 10MB",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

**Rate Limit Error:**
```json
{
  "status": false,
  "code": 429,
  "message": "Too many requests. Please try again later.",
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

## 🎯 Best Practices

### API Usage
1. **Always include proper prompt** - Clear dan specific prompts menghasilkan output yang lebih baik
2. **Optimize file sizes** - Compress files sebelum upload untuk performance
3. **Handle rate limits** - Implement retry logic dengan exponential backoff
4. **Validate responses** - Always check `status` field dalam response

### Security
1. **Validate file types** - Jangan rely hanya pada file extensions
2. **Monitor usage** - Track API usage untuk detect abuse
3. **Sanitize inputs** - Always validate dan sanitize user inputs
4. **Use HTTPS** - Always use HTTPS di production

### Performance
1. **Cache responses** - Cache common queries untuk reduce API calls
2. **Optimize images** - Resize images untuk reduce processing time
3. **Monitor performance** - Track response times dan optimize bottlenecks

## 🐛 Troubleshooting

### Common Issues

**1. "Gemini API Key is not set"**
```bash
# Solution: Set environment variable
export GEMINI_API_KEY="your-api-key"
# or add to .env file
```

**2. "Only image files are allowed"**
```bash
# Solution: Check file MIME type
file --mime-type your-file.jpg
# Ensure file is valid image format
```

**3. "File size exceeds maximum limit"**
```bash
# Solution: Compress file or check limits
ls -lh your-file.pdf
# Reduce file size or increase limit in config
```

**4. Rate limit exceeded**
```bash
# Solution: Wait for rate limit reset or implement retry logic
sleep 900  # Wait 15 minutes
```

### Debug Mode
Set `NODE_ENV=development` untuk detailed error messages dan stack traces.

## 📚 Additional Resources

- [Google Gemini AI Documentation](https://ai.google.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 📄 License

ISC License - see LICENSE file for details.

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

Untuk support dan pertanyaan:
- Create issue di GitHub repository
- Check documentation dan troubleshooting guide
- Review logs untuk error details

---

Made with ❤️ using Google Gemini AI