# Deployment Guide

## Production Deployment

### 1. Environment Setup

**Server Requirements:**
- Node.js 18+ 
- PM2 (recommended process manager)
- Nginx (recommended reverse proxy)
- SSL Certificate (Let's Encrypt recommended)

### 2. Environment Variables for Production

```bash
# Production .env file
NODE_ENV=production
PORT=6068
GEMINI_API_KEY=your_production_api_key
GEMINI_MODEL=gemini-2.5-flash

# Optional production settings
LOG_LEVEL=error
RATE_LIMIT_REQUESTS=50
RATE_LIMIT_WINDOW_MS=900000
```

### 3. PM2 Process Management

**Install PM2:**
```bash
npm install -g pm2
```

**Create ecosystem file (ecosystem.config.js):**
```javascript
module.exports = {
  apps: [{
    name: 'gemini-nengai',
    script: './app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 6068
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 6068
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
}
```

**Start with PM2:**
```bash
# Development
pm2 start ecosystem.config.js

# Production
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# Logs
pm2 logs gemini-nengai
```

### 4. Nginx Configuration

**Create Nginx configuration (/etc/nginx/sites-available/gemini-nengai):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/fullchain.pem;
    ssl_certificate_key /path/to/your/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self'" always;
    
    # File upload size limits
    client_max_body_size 200M;
    client_body_timeout 300s;
    
    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:6068;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }
    
    # Health check endpoint (direct access)
    location /api/nengAI/health {
        proxy_pass http://localhost:6068;
        access_log off;
    }
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/gemini-nengai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Test renewal
sudo certbot renew --dry-run
```

### 6. Firewall Configuration

```bash
# UFW Firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 7. Health Monitoring

**Create health check script (health-check.sh):**
```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:6068/api/nengAI/health)
if [ $response != "200" ]; then
    echo "Health check failed with status: $response"
    pm2 restart gemini-nengai
    exit 1
fi
echo "Health check passed"
```

**Add to crontab:**
```bash
# Check every 5 minutes
*/5 * * * * /path/to/health-check.sh
```

## Docker Deployment

### 1. Dockerfile

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 6068

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:6068/api/nengAI/health || exit 1

# Start application
CMD ["node", "app.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  gemini-nengai:
    build: .
    container_name: gemini-nengai
    restart: unless-stopped
    ports:
      - "6068:6068"
    environment:
      - NODE_ENV=production
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - GEMINI_MODEL=${GEMINI_MODEL}
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6068/api/nengAI/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    
  nginx:
    image: nginx:alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - gemini-nengai
```

### 3. Build and Run

```bash
# Build image
docker build -t gemini-nengai .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f gemini-nengai

# Stop
docker-compose down
```

## Monitoring and Logging

### 1. Application Monitoring

**Install and configure monitoring tools:**
```bash
# Install monitoring packages
npm install --save express-prometheus-middleware
npm install --save winston
```

**Add to your application:**
```javascript
// Prometheus metrics
import promMid from 'express-prometheus-middleware';

app.use(promMid({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [0.1, 0.5, 1, 1.5, 2, 3, 5, 10],
}));
```

### 2. Log Management

**Centralized logging with Winston:**
```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});
```

### 3. Performance Monitoring

Set up alerts for:
- Response time > 5 seconds
- Error rate > 5%
- Memory usage > 80%
- CPU usage > 80%
- Disk space < 20%

## Security Best Practices

### 1. API Security

- Use HTTPS only in production
- Implement API authentication (JWT recommended)
- Rate limiting per user/API key
- Input validation and sanitization
- Regular security audits

### 2. Server Security

```bash
# Update system regularly
sudo apt update && sudo apt upgrade

# Configure automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Secure SSH
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
# Set: PasswordAuthentication no
```

### 3. Application Security

- Keep dependencies updated
- Use helmet.js for security headers
- Implement CORS properly
- Validate file uploads strictly
- Monitor for vulnerabilities

## Backup and Recovery

### 1. Application Backup

```bash
#!/bin/bash
# backup-app.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "/backups/gemini-nengai-$DATE.tar.gz" \
  --exclude=node_modules \
  --exclude=logs \
  /path/to/gemini-nengai/
```

### 2. Environment Backup

```bash
# Backup environment variables
cp .env "/backups/.env-$DATE"

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 "/backups/pm2-$DATE.json"
```

### 3. Recovery Procedure

1. Stop application: `pm2 stop gemini-nengai`
2. Restore files from backup
3. Install dependencies: `npm install`
4. Restore environment: `cp backup/.env ./`
5. Start application: `pm2 start ecosystem.config.js --env production`
6. Verify health: `curl http://localhost:6068/api/nengAI/health`

## Scaling Considerations

### 1. Horizontal Scaling

- Use PM2 cluster mode
- Load balancer (Nginx/HAProxy)
- Multiple server instances
- Database for session storage

### 2. Vertical Scaling

- Increase server resources
- Optimize Node.js memory settings
- Use faster storage (SSD)
- Optimize Gemini API usage

### 3. Caching Strategy

- Response caching for common queries
- File upload caching
- Redis for session storage
- CDN for static assets

## Troubleshooting Production Issues

### 1. Common Issues

**High Memory Usage:**
```bash
# Monitor memory
pm2 monit
# Restart if needed
pm2 restart gemini-nengai
```

**Slow Response Times:**
```bash
# Check logs
pm2 logs gemini-nengai
# Monitor system resources
htop
```

**API Errors:**
```bash
# Check Gemini API status
curl -I https://generativelanguage.googleapis.com/v1beta/models
# Verify API key
echo $GEMINI_API_KEY
```

### 2. Emergency Procedures

**Service Down:**
1. Check PM2 status: `pm2 status`
2. Check system resources: `free -h`, `df -h`
3. Check logs: `pm2 logs`
4. Restart service: `pm2 restart gemini-nengai`
5. Check Nginx: `sudo systemctl status nginx`

**High Load:**
1. Check current load: `uptime`
2. Identify processes: `ps aux --sort=-%cpu`
3. Scale up: `pm2 scale gemini-nengai +2`
4. Monitor: `pm2 monit`