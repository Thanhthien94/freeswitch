# 🔧 Development Environment Setup for MacOS

Hướng dẫn thiết lập và chạy môi trường development cho FreeSWITCH PBX System trên MacOS.

## 📋 Yêu cầu hệ thống

- **Docker Desktop for Mac** (phiên bản mới nhất)
- **macOS** 10.15+ (Catalina hoặc mới hơn)
- **RAM**: Tối thiểu 8GB (khuyến nghị 16GB)
- **Disk**: Tối thiểu 10GB trống

## 🚀 Khởi động nhanh

### 1. Khởi động development environment

```bash
# Sử dụng script tiện ích
./dev-start.sh start

# Hoặc sử dụng docker-compose trực tiếp
docker-compose -f docker-compose.dev.yml --env-file .env.dev up -d
```

### 2. Kiểm tra trạng thái services

```bash
./dev-start.sh status
```

### 3. Xem logs

```bash
./dev-start.sh logs
```

## 🛠️ Các lệnh quản lý

Script `dev-start.sh` cung cấp các lệnh sau:

| Lệnh | Mô tả |
|------|-------|
| `./dev-start.sh start` | Khởi động development environment |
| `./dev-start.sh stop` | Dừng development environment |
| `./dev-start.sh restart` | Khởi động lại environment |
| `./dev-start.sh rebuild` | Rebuild và khởi động lại |
| `./dev-start.sh logs` | Xem logs từ tất cả services |
| `./dev-start.sh clean` | Xóa tất cả containers và volumes |
| `./dev-start.sh status` | Hiển thị trạng thái services |

## 🌐 Truy cập các services

Sau khi khởi động thành công, bạn có thể truy cập:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:3002 | - |
| **API** | http://localhost:3000 | - |
| **API Documentation** | http://localhost:3000/api/docs | - |
| **Grafana Dashboard** | http://localhost:3001 | admin/admin123 |
| **RabbitMQ Management** | http://localhost:15672 | admin/admin123 |
| **Prometheus** | http://localhost:9090 | - |

## 📊 Database Access

- **PostgreSQL**: `localhost:5432`
  - Database: `pbx_db_dev`
  - User: `pbx_user`
  - Password: `pbx_password_dev`

- **Redis**: `localhost:6379`

## 🔧 Cấu hình Development

### Environment Variables

File `.env.dev` chứa tất cả cấu hình cho development environment. Các thay đổi quan trọng so với production:

- Sử dụng internal Docker volumes thay vì external paths
- Database và credentials khác với production
- CORS được cấu hình cho localhost
- Swagger documentation được bật

### Volumes

Development environment sử dụng Docker internal volumes:

- `postgres_data`: PostgreSQL data
- `redis_data`: Redis data  
- `rabbitmq_data`: RabbitMQ data
- `freeswitch_data`: FreeSWITCH data
- `prometheus_data`: Prometheus metrics
- `grafana_data`: Grafana dashboards

## 🔄 Development Workflow

### 1. Thay đổi code

Khi thay đổi code trong `nestjs-app` hoặc `frontend`:

```bash
# Rebuild containers để áp dụng thay đổi
./dev-start.sh rebuild
```

### 2. Reset database

Nếu cần reset database:

```bash
# Dừng và xóa tất cả data
./dev-start.sh clean

# Khởi động lại
./dev-start.sh start
```

### 3. Debug services

Xem logs của service cụ thể:

```bash
# Logs của tất cả services
docker-compose -f docker-compose.dev.yml logs -f

# Logs của service cụ thể
docker-compose -f docker-compose.dev.yml logs -f nestjs-api
docker-compose -f docker-compose.dev.yml logs -f freeswitch
```

## 🐛 Troubleshooting

### Docker Desktop không khởi động được

1. Kiểm tra Docker Desktop đã được cài đặt và chạy
2. Restart Docker Desktop
3. Kiểm tra disk space (cần ít nhất 10GB)

### Port conflicts

Nếu gặp lỗi port đã được sử dụng:

```bash
# Kiểm tra port nào đang được sử dụng
lsof -i :3000
lsof -i :3002
lsof -i :5432

# Dừng process đang sử dụng port hoặc thay đổi port trong .env.dev
```

### Container không khởi động

```bash
# Xem logs chi tiết
docker-compose -f docker-compose.dev.yml logs [service-name]

# Rebuild từ đầu
./dev-start.sh clean
./dev-start.sh start
```

## 📝 Ghi chú quan trọng

1. **Data Persistence**: Data sẽ được lưu trong Docker volumes và persist giữa các lần restart
2. **Clean Up**: Sử dụng `./dev-start.sh clean` để xóa tất cả data khi cần
3. **Performance**: Trên MacOS, Docker có thể chậm hơn so với Linux native
4. **File Watching**: Hot reload có thể không hoạt động tốt với Docker trên MacOS

## 🔗 So sánh với Production

| Aspect | Development | Production |
|--------|-------------|------------|
| **Volumes** | Docker internal volumes | External host paths (`/opt/pbx-data/`) |
| **Container Names** | Có suffix `-dev` | Tên gốc |
| **Environment** | `.env.dev` | `.env` |
| **Data Protection** | Có thể xóa dễ dàng | Được bảo vệ khỏi `docker-compose down -v` |
| **Performance** | Tối ưu cho development | Tối ưu cho production |
