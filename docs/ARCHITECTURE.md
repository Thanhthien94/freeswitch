# Kiến trúc Tổng đài Enterprise với FreeSWITCH + NestJS

## Tổng quan

Hệ thống tổng đài enterprise được thiết kế với kiến trúc microservices, sử dụng FreeSWITCH làm core PBX và NestJS làm application controller. Kiến trúc này đảm bảo tính mở rộng, bảo mật và hiệu suất cao cho môi trường doanh nghiệp.

## Kiến trúc tổng thể

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   API Gateway   │    │   Web Dashboard │
│     (Nginx)     │◄──►│    (NestJS)     │◄──►│    (React)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   FreeSWITCH    │    │   PostgreSQL    │    │     Redis       │
│     (Docker)    │◄──►│   (Database)    │    │   (Cache/Session)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   RabbitMQ      │    │   Prometheus    │    │    Grafana      │
│ (Message Queue) │    │  (Monitoring)   │    │  (Dashboard)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Thành phần chính

### 1. FreeSWITCH Core (Docker)
- **Vai trò**: PBX engine chính, xử lý SIP/RTP, call routing
- **Image**: safarov/freeswitch:latest
- **Tính năng**:
  - Multi-domain support
  - Event Socket Library (ESL) integration
  - CDR logging
  - Conference bridge
  - IVR capabilities

### 2. NestJS Application Controller
- **Vai trò**: API Gateway và business logic controller
- **Modules chính**:
  - Auth Module (JWT, RBAC)
  - Call Control Module (ESL integration)
  - User Management Module
  - CDR Module
  - Real-time Events Module (WebSocket)
  - Configuration Module
  - Monitoring Module

### 3. Database Layer
- **PostgreSQL**: Primary database cho user data, CDR, configuration
- **Redis**: Session management, caching, real-time data

### 4. Message Queue
- **RabbitMQ**: Async processing, event distribution, microservices communication

### 5. Monitoring & Logging
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboard
- **ELK Stack**: Centralized logging (optional)

## Data Flow

### Call Flow
1. **Incoming Call** → FreeSWITCH receives SIP INVITE
2. **Event Generation** → FreeSWITCH sends events via ESL
3. **NestJS Processing** → Call Control Module processes events
4. **Business Logic** → Apply routing rules, authentication
5. **Call Routing** → Send commands back to FreeSWITCH
6. **Real-time Updates** → WebSocket notifications to dashboard

### API Flow
1. **Client Request** → Load Balancer → NestJS API Gateway
2. **Authentication** → JWT validation, RBAC check
3. **Business Logic** → Process request, interact with FreeSWITCH via ESL
4. **Database Operations** → PostgreSQL/Redis operations
5. **Response** → JSON response to client

## Security Architecture

### Network Security
- **Firewall Rules**: Restrict access to essential ports only
- **VPN Access**: Secure remote administration
- **SSL/TLS**: All communications encrypted

### Application Security
- **JWT Authentication**: Stateless authentication
- **RBAC**: Role-based access control
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Comprehensive input sanitization

### FreeSWITCH Security
- **SIP Authentication**: Strong password policies
- **ACL Configuration**: IP-based access control
- **Encryption**: SRTP for media, TLS for signaling

## Deployment Architecture

### Development Environment
```yaml
services:
  freeswitch:
    image: safarov/freeswitch:latest
    ports: ["5060:5060", "8021:8021"]
  
  nestjs:
    build: ./nestjs-app
    ports: ["3000:3000"]
  
  postgres:
    image: postgres:15
    
  redis:
    image: redis:7-alpine
```

### Production Environment
- **Container Orchestration**: Docker Swarm hoặc Kubernetes
- **High Availability**: Multiple instances với load balancing
- **Auto Scaling**: Based on CPU/memory metrics
- **Backup Strategy**: Automated database backups
- **Monitoring**: 24/7 health checks và alerting

## Integration Patterns

### FreeSWITCH ESL Integration
```typescript
// ESL Connection Service
@Injectable()
export class EslService {
  private connection: ESLConnection;
  
  async connect() {
    this.connection = new ESLConnection('freeswitch', 8021, 'ClueCon');
    await this.connection.events('plain', 'all');
  }
  
  async originate(destination: string, context: string) {
    return this.connection.api('originate', `sofia/internal/${destination} ${context}`);
  }
}
```

### Real-time Events
```typescript
// WebSocket Gateway
@WebSocketGateway()
export class EventsGateway {
  @SubscribeMessage('call-events')
  handleCallEvents(client: Socket, data: any) {
    // Forward FreeSWITCH events to web clients
  }
}
```

## Performance Considerations

### Scalability
- **Horizontal Scaling**: Multiple NestJS instances
- **Database Optimization**: Connection pooling, indexing
- **Caching Strategy**: Redis for frequently accessed data
- **CDN**: Static assets delivery

### Monitoring Metrics
- **Call Quality**: MOS scores, packet loss, jitter
- **System Performance**: CPU, memory, disk I/O
- **Application Metrics**: Response times, error rates
- **Business Metrics**: Call volume, success rates

## Best Practices

### Code Organization
- **Modular Architecture**: Clear separation of concerns
- **Dependency Injection**: Loose coupling between components
- **Error Handling**: Comprehensive error management
- **Testing**: Unit tests, integration tests, e2e tests

### Operations
- **CI/CD Pipeline**: Automated testing và deployment
- **Configuration Management**: Environment-based configs
- **Logging**: Structured logging với correlation IDs
- **Documentation**: API docs, deployment guides

## Technology Stack

### Backend
- **NestJS**: Node.js framework
- **TypeScript**: Type-safe development
- **node-esl**: FreeSWITCH ESL library
- **TypeORM**: Database ORM
- **Passport**: Authentication middleware

### Database
- **PostgreSQL**: Primary database
- **Redis**: Caching và sessions
- **MongoDB**: Optional for logs/analytics

### Infrastructure
- **Docker**: Containerization
- **Nginx**: Load balancer và reverse proxy
- **RabbitMQ**: Message queue
- **Prometheus/Grafana**: Monitoring

### Frontend (Optional)
- **React**: Web dashboard
- **WebRTC**: Browser-based calling
- **Socket.io**: Real-time communication

## Next Steps

1. **Setup Infrastructure**: Docker Compose environment
2. **FreeSWITCH Configuration**: Production-ready setup
3. **NestJS Development**: Core modules implementation
4. **Integration Testing**: ESL connectivity và call flows
5. **Security Implementation**: Authentication và authorization
6. **Monitoring Setup**: Metrics và alerting
7. **Documentation**: API docs và deployment guides
