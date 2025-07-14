# FreeSWITCH PBX System

Complete FreeSWITCH-based PBX system with NestJS backend, Next.js frontend, and professional audio player for call recordings.

## 🚀 Quick Start

### Development
```bash
git clone https://github.com/Thanhthien94/freeswitch.git
cd freeswitch
docker-compose up -d
```
- Frontend: http://localhost:3002
- Backend API: http://localhost:3000
- Grafana: http://localhost:3001

### Production
```bash
git clone https://github.com/Thanhthien94/freeswitch.git
cd freeswitch
cp .env.production .env.production.local
# Edit .env.production.local with your values
./deploy.sh
```

## 📁 Project Structure

```
├── docker-compose.yml              # Development environment
├── docker-compose.production.yml   # Production environment (no internal nginx)
├── deploy.sh                       # Production deployment script
├── stop.sh                         # Service management script
├── .env.production                 # Production environment template
├── nestjs-app/                     # NestJS Backend API
├── frontend/                       # Next.js Frontend
├── configs/freeswitch/             # FreeSWITCH configuration
├── recordings/                     # Call recordings storage
├── database/                       # Database initialization
├── nginx-proxy-manager-config.txt  # NPM configuration
└── deployment-guide.md             # Complete deployment guide
```

## 🔧 Docker Compose Files

### `docker-compose.yml` (Development)
- **Purpose**: Local development with full monitoring
- **Includes**: Nginx, Prometheus, Grafana, all services
- **Ports**: All services exposed for debugging
- **Usage**: `docker-compose up -d`

### `docker-compose.production.yml` (Production)
- **Purpose**: Production deployment with existing Nginx Proxy Manager
- **Includes**: Only core services (no internal nginx/monitoring)
- **Ports**: Only Frontend (3002) and Backend (3000) exposed
- **Usage**: `docker-compose -f docker-compose.production.yml up -d`

## 🎵 Features

### ✅ Completed Features
- **FreeSWITCH PBX**: Complete telephony system with SIP support
- **Call Recording**: Optimized quality (mono 8kHz) with automatic recording
- **CDR System**: Event-based call detail records via ESL
- **Professional Audio Player**: Popup dialog with full controls
  - Play/Pause, Progress bar, Volume control
  - Playback speed (0.5x to 2x)
  - Skip forward/backward 10 seconds
  - Download functionality
  - Call information display
- **User Management**: Authentication and authorization
- **REST API**: Complete backend API with NestJS
- **Modern Frontend**: Next.js with professional UI/UX

### 🎛️ Audio Player Controls
- **Large Play/Pause Button**: Center control
- **Progress Bar**: Seek functionality with time display
- **Volume Control**: Slider with mute/unmute button
- **Speed Control**: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
- **Skip Controls**: ±10 seconds buttons
- **Download Button**: Direct recording download
- **Call Info**: Caller, destination, duration, timestamp

## 🔗 Service Endpoints

### Development URLs
- **Frontend**: http://localhost:3002
- **Backend API**: http://localhost:3000/api/v1
- **Grafana**: http://localhost:3001 (admin/admin123)
- **RabbitMQ**: http://localhost:15672 (admin/admin123)

### Production URLs (via Nginx Proxy Manager)
- **Frontend**: https://your-domain.com
- **Backend API**: https://your-domain.com/api/v1
- **Health Check**: https://your-domain.com/api/v1/health

## 🛡️ Security Features

- **JWT Authentication**: Secure API access
- **Rate Limiting**: API and login protection
- **CORS Configuration**: Proper cross-origin handling
- **Database Security**: Internal-only access in production
- **SSL/TLS**: HTTPS enforcement via Nginx Proxy Manager

## 📞 SIP Configuration

- **SIP Port**: 5060/udp
- **RTP Range**: 16384-16484/udp
- **Domain**: Configurable via environment
- **Authentication**: SIP user authentication required

## 🔧 Management Commands

```bash
# Development
docker-compose up -d                    # Start all services
docker-compose logs -f                  # View logs
docker-compose down                     # Stop services

# Production
./deploy.sh                             # Deploy to production
./stop.sh                               # Stop services
./stop.sh --remove                      # Stop and remove containers
./stop.sh --remove-all                  # Remove everything including data

# Service-specific logs
docker-compose logs -f nestjs-api       # Backend logs
docker-compose logs -f frontend-ui      # Frontend logs
docker-compose logs -f freeswitch-core  # FreeSWITCH logs
```

## 📋 Requirements

- **Docker & Docker Compose**: Latest versions
- **Nginx Proxy Manager**: For production (if not using internal nginx)
- **Domain Name**: For production SSL certificates
- **Firewall**: Ports 5060/udp and 16384-16484/udp for SIP

## 🚀 Deployment

### For Development
1. Clone repository
2. Run `docker-compose up -d`
3. Access http://localhost:3002

### For Production
1. Clone repository
2. Configure `.env.production.local`
3. Run `./deploy.sh`
4. Configure Nginx Proxy Manager
5. Test SIP connectivity

See `deployment-guide.md` for detailed production setup instructions.

## 📊 Monitoring (Development Only)

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **Node Exporter**: http://localhost:9100

## 🎯 Testing

### Web Interface
1. Access frontend URL
2. Login with admin credentials
3. Navigate to Call Detail Records
4. Click "Play" on recordings to test audio player

### SIP Testing
1. Configure SIP client with domain:5060
2. Register with created user credentials
3. Make test calls between extensions
4. Verify recordings appear in CDR

## 🔄 Backup & Recovery

```bash
# Database backup
docker exec postgres-db pg_dump -U pbx_user pbx_production > backup.sql

# Recordings backup
tar -czf recordings-backup.tar.gz recordings/

# Configuration backup
tar -czf config-backup.tar.gz configs/
```

## 🐛 Troubleshooting

- **503 Errors**: Check if backend is running and healthy
- **Audio Issues**: Verify RTP ports in firewall
- **SIP Registration**: Check domain configuration and credentials
- **Database Connection**: Verify credentials and network connectivity

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

**🏆 Professional FreeSWITCH PBX system ready for production deployment!**
