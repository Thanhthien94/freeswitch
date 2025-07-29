# CORS Configuration Documentation

## Tổng quan

Tài liệu này mô tả cách cấu hình CORS (Cross-Origin Resource Sharing) trong hệ thống FreeSWITCH PBX để đảm bảo frontend có thể giao tiếp an toàn với backend API và WebSocket services.

## Cấu hình CORS chính

### 1. HTTP API CORS (main.ts)

```typescript
// CORS configuration trong nestjs-app/src/main.ts
const corsOrigins = new Set([
  // Default development origins
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002'
]);

// Add origins from environment variables
const corsOriginEnv = configService.get('CORS_ORIGIN');
if (corsOriginEnv) {
  corsOriginEnv.split(',').forEach(origin => {
    corsOrigins.add(origin.trim());
  });
}

app.enableCors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow no-origin requests
    if (corsOriginsArray.includes(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`, 'Bootstrap');
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Query-Params'],
});
```

### 2. WebSocket CORS

#### Dashboard Gateway
```typescript
@WebSocketGateway({
  namespace: '/dashboard',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || 
            ['http://localhost:3002', 'http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
```

#### Realtime Gateway
```typescript
@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map(origin => origin.trim()) || 
            [process.env.FRONTEND_URL || 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/realtime',
})
```

## Environment Variables

### Development (.env)
```env
# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002
FRONTEND_URL=http://localhost:3002
DOMAIN=http://localhost

# API Configuration
API_PORT=3000
API_PREFIX=api/v1
```

### Production (.env.production)
```env
# CORS settings
CORS_ORIGIN=https://your-domain.com
FRONTEND_URL=https://your-domain.com
DOMAIN=https://your-domain.com

# API Configuration
API_PORT=3000
API_PREFIX=api/v1
```

## Docker Configuration

Trong `docker-compose.yml`:
```yaml
environment:
  - CORS_ORIGIN=${CORS_ORIGIN:-http://localhost:3002}
  - FRONTEND_URL=${FRONTEND_URL:-http://localhost:3002}
  - DOMAIN=${DOMAIN:-http://localhost}
  - API_PORT=${API_PORT:-3000}
  - API_PREFIX=${API_PREFIX:-api/v1}
```

## Tính năng CORS

### ✅ Được phép
- **Origins**: Các domain được cấu hình trong `CORS_ORIGIN`
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization, X-Requested-With, X-Query-Params
- **Credentials**: Được phép (cookies, authorization headers)
- **No-origin requests**: Được phép (mobile apps, curl)

### ❌ Bị chặn
- Origins không được liệt kê trong cấu hình
- Methods không được phép
- Headers không được phép

## Testing CORS

### 1. Sử dụng script test
```bash
# Test CORS với curl
./scripts/test-cors.sh

# Test CORS với Node.js (cần cài axios)
node test-cors.js
```

### 2. Test thủ công với curl
```bash
# Test preflight request
curl -I -X OPTIONS \
  -H "Origin: http://localhost:3002" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  http://localhost:3000/api/v1/health

# Test actual request
curl -I -X GET \
  -H "Origin: http://localhost:3002" \
  http://localhost:3000/api/v1/health
```

### 3. Test WebSocket CORS
```javascript
// Trong browser console
const socket = io('ws://localhost:3000/dashboard', {
  transports: ['websocket']
});

socket.on('connect', () => console.log('Connected'));
socket.on('connect_error', (error) => console.error('CORS Error:', error));
```

## Troubleshooting

### Lỗi thường gặp

1. **"Access to fetch at ... has been blocked by CORS policy"**
   - Kiểm tra origin có trong `CORS_ORIGIN` không
   - Đảm bảo backend đang chạy
   - Kiểm tra environment variables

2. **WebSocket connection failed**
   - Kiểm tra WebSocket gateway CORS config
   - Đảm bảo `FRONTEND_URL` được set đúng
   - Kiểm tra network connectivity

3. **Credentials not included**
   - Đảm bảo `credentials: true` trong CORS config
   - Frontend phải set `withCredentials: true`

### Debug CORS

1. **Kiểm tra logs**:
   ```bash
   docker-compose logs nestjs-app | grep CORS
   ```

2. **Kiểm tra environment variables**:
   ```bash
   docker-compose exec nestjs-app env | grep CORS
   ```

3. **Kiểm tra browser network tab**:
   - Xem preflight OPTIONS requests
   - Kiểm tra response headers
   - Xem error messages

## Best Practices

1. **Development**: Sử dụng localhost và 127.0.0.1 variants
2. **Production**: Chỉ allow domain chính thức
3. **Security**: Không allow `*` origin trong production
4. **Logging**: Enable CORS logging để debug
5. **Testing**: Test CORS trước khi deploy production

## Cấu hình cho các môi trường khác nhau

### Local Development
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002
```

### Staging
```env
CORS_ORIGIN=https://staging.your-domain.com,http://localhost:3002
```

### Production
```env
CORS_ORIGIN=https://your-domain.com
```
