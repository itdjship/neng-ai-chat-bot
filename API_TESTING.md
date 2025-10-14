# API Testing Collection for Postman/Insomnia

## Environment Variables
```json
{
  "baseUrl": "http://localhost:6068",
  "apiPath": "/api/nengAI"
}
```

## Collection Endpoints

### 1. Health Check
```
GET {{baseUrl}}{{apiPath}}/health
```

### 2. Get File Types
```
GET {{baseUrl}}{{apiPath}}/file-types
```

### 3. Text Generation
```
POST {{baseUrl}}{{apiPath}}/generate-text
Content-Type: application/json

{
  "prompt": "Explain the concept of artificial intelligence in simple terms"
}
```

### 4. Image Analysis
```
POST {{baseUrl}}{{apiPath}}/generate-from-image
Content-Type: multipart/form-data

Form Data:
- file: [SELECT IMAGE FILE]
- prompt: "Describe what you see in this image in detail"
```

### 5. Document Analysis
```
POST {{baseUrl}}{{apiPath}}/generate-from-document
Content-Type: multipart/form-data

Form Data:
- file: [SELECT PDF/WORD/EXCEL FILE]
- prompt: "Summarize the main points of this document"
```

### 6. Audio Analysis
```
POST {{baseUrl}}{{apiPath}}/generate-from-audio
Content-Type: multipart/form-data

Form Data:
- file: [SELECT AUDIO FILE]
- prompt: "Transcribe this audio and provide a summary"
```

### 7. Video Analysis
```
POST {{baseUrl}}{{apiPath}}/generate-from-video
Content-Type: multipart/form-data

Form Data:
- file: [SELECT VIDEO FILE]
- prompt: "Describe what happens in this video"
```

## Sample Test Files

For testing purposes, you can use these sample files:

### Images
- Small JPEG image (< 1MB)
- PNG with transparency
- GIF animation
- WebP format

### Documents
- Simple PDF document
- Word document with text and images
- Excel spreadsheet with data
- Plain text file
- CSV file with data

### Audio
- Short MP3 recording
- WAV file with speech
- FLAC audio file

### Video
- Short MP4 video clip
- M4V format video

## Expected Response Format

All successful responses will follow this format:
```json
{
  "status": true,
  "code": 200,
  "message": "Success message",
  "data": "Generated content...",
  "meta": {
    "originalName": "filename.ext",
    "mimeType": "file/mimetype",
    "size": 12345
  },
  "timestamp": "2025-10-15T10:30:00.000Z"
}
```

## Error Testing

Test these error scenarios:

1. **Missing prompt** - Send request without prompt field
2. **Empty prompt** - Send request with empty string prompt
3. **Large file** - Upload file exceeding size limits
4. **Invalid file type** - Upload unsupported file format
5. **Rate limiting** - Send > 100 requests rapidly
6. **Invalid content-type** - Send file upload with wrong content-type