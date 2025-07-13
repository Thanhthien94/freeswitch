# FreeSWITCH PBX System - Technical Specifications

## 🏗️ System Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   FreeSWITCH    │
│   (NextJS 15)   │────│   (NestJS)      │────│   (PBX Core)    │
│   Port: 3002    │    │   Port: 3000    │    │   Port: 5060    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

### Container Architecture
```yaml
Services:
  - frontend-ui (NextJS 15)
  - nestjs-api (NestJS Backend)
  - freeswitch-pbx (FreeSWITCH Core)
  - postgres-db (Database)

Networks:
  - Bridge networking for external SIP access
  - Internal Docker networking for service communication
```

---

## 🔧 Technology Stack

### Frontend (NextJS 15)
- **Framework:** Next.js 15 with App Router
- **Authentication:** Server Actions + JWT sessions
- **UI Library:** Tailwind CSS + shadcn/ui
- **State Management:** Server-side with React cache
- **API Calls:** Native fetch in Server Actions
- **Form Handling:** useActionState hook

### Backend (NestJS)
- **Framework:** NestJS with TypeScript
- **Database ORM:** TypeORM
- **Authentication:** JWT with bcrypt
- **API Documentation:** Swagger/OpenAPI
- **Validation:** class-validator
- **Configuration:** @nestjs/config

### PBX Core (FreeSWITCH)
- **Image:** safarov/freeswitch:latest
- **SIP Port:** 5060 (UDP/TCP)
- **RTP Ports:** 16384-16484
- **Event Socket:** 8021
- **Configuration:** XML-based

### Database (PostgreSQL)
- **Version:** PostgreSQL 15
- **Port:** 5432
- **Features:** JSONB, UUID, Triggers
- **Backup:** pg_dump automated

---

## 📊 Database Schema

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### CDR (Call Detail Records) Table
```sql
CREATE TABLE cdr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_uuid VARCHAR(255) UNIQUE NOT NULL,
  caller_number VARCHAR(50),
  destination_number VARCHAR(50),
  start_time TIMESTAMP,
  answer_time TIMESTAMP,
  end_time TIMESTAMP,
  duration INTEGER, -- in seconds
  billsec INTEGER,  -- billable seconds
  hangup_cause VARCHAR(100),
  direction VARCHAR(20), -- 'inbound', 'outbound', 'internal'
  domain VARCHAR(100),
  context VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Recordings Table
```sql
CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cdr_id UUID REFERENCES cdr(id),
  call_uuid VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  duration INTEGER,
  format VARCHAR(20) DEFAULT 'wav',
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_call_uuid (call_uuid),
  INDEX idx_cdr_id (cdr_id)
);
```

#### Extensions Table
```sql
CREATE TABLE extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extension VARCHAR(20) UNIQUE NOT NULL,
  domain VARCHAR(100) NOT NULL,
  password VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id),
  enabled BOOLEAN DEFAULT true,
  voicemail_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔐 Authentication & Security

### Authentication Flow
```
1. User submits login form
2. Server Action validates credentials
3. NestJS verifies user + password hash
4. JWT token generated with user info
5. HttpOnly cookie set with encrypted session
6. Middleware protects subsequent routes
```

### Security Measures
- **Password Hashing:** bcrypt with salt rounds
- **Session Management:** JWT with HttpOnly cookies
- **CORS Protection:** Configured for specific origins
- **Input Validation:** class-validator in NestJS
- **SQL Injection:** TypeORM parameterized queries
- **XSS Protection:** Content Security Policy

---

## 📞 FreeSWITCH Configuration

### SIP Configuration
```xml
<!-- conf/sip_profiles/internal.xml -->
<profile name="internal">
  <settings>
    <param name="sip-ip" value="0.0.0.0"/>
    <param name="sip-port" value="5060"/>
    <param name="rtp-ip" value="0.0.0.0"/>
    <param name="ext-rtp-ip" value="auto-nat"/>
    <param name="rtp-start-port" value="16384"/>
    <param name="rtp-end-port" value="16484"/>
  </settings>
</profile>
```

### CDR Configuration
```xml
<!-- conf/autoload_configs/cdr_pg_csv.conf.xml -->
<configuration name="cdr_pg_csv.conf">
  <settings>
    <param name="db-host" value="postgres-db"/>
    <param name="db-port" value="5432"/>
    <param name="db-name" value="freeswitch"/>
    <param name="db-username" value="freeswitch"/>
    <param name="db-password" value="password"/>
  </settings>
</configuration>
```

### Recording Configuration
```xml
<!-- conf/autoload_configs/local_stream.conf.xml -->
<configuration name="local_stream.conf">
  <directory name="default" path="/recordings">
    <param name="rate" value="8000"/>
    <param name="shuffle" value="false"/>
    <param name="channels" value="1"/>
    <param name="interval" value="20"/>
    <param name="timer-name" value="soft"/>
  </directory>
</configuration>
```

---

## 🔌 API Specifications

### Authentication Endpoints
```typescript
POST /api/v1/auth/login
Body: { email: string, password: string }
Response: { user: User, token: string }

POST /api/v1/auth/register  
Body: { name: string, email: string, password: string }
Response: { user: User, token: string }

POST /api/v1/auth/logout
Response: { message: string }

GET /api/v1/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { user: User }
```

### CDR Endpoints
```typescript
GET /api/v1/cdr
Query: { page?, limit?, startDate?, endDate?, callerNumber?, destinationNumber? }
Response: { data: CDR[], total: number, page: number }

GET /api/v1/cdr/:id
Response: { data: CDR }

GET /api/v1/cdr/stats
Query: { startDate?, endDate? }
Response: { totalCalls: number, totalDuration: number, avgDuration: number }

GET /api/v1/cdr/export
Query: { format: 'csv' | 'excel', ...filters }
Response: File download
```

### Recording Endpoints
```typescript
GET /api/v1/recordings
Query: { page?, limit?, callUuid?, startDate?, endDate? }
Response: { data: Recording[], total: number }

GET /api/v1/recordings/:id
Response: { data: Recording }

GET /api/v1/recordings/:id/download
Response: Audio file stream

DELETE /api/v1/recordings/:id
Response: { message: string }
```

---

## 🚀 Deployment Configuration

### Docker Compose Structure
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports: ["3002:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://nestjs-api:3000/api/v1
      - SESSION_SECRET=${SESSION_SECRET}
    
  nestjs-api:
    build: ./nestjs-app
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres-db:5432/db
      - JWT_SECRET=${JWT_SECRET}
    
  freeswitch-pbx:
    image: safarov/freeswitch:latest
    ports: 
      - "5060:5060/udp"
      - "16384-16484:16384-16484/udp"
    volumes:
      - ./freeswitch/conf:/etc/freeswitch
      - ./recordings:/recordings
    
  postgres-db:
    image: postgres:15
    environment:
      - POSTGRES_DB=freeswitch
      - POSTGRES_USER=freeswitch
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

### Environment Variables
```bash
# Database
DB_PASSWORD=secure_password
DATABASE_URL=postgresql://freeswitch:${DB_PASSWORD}@postgres-db:5432/freeswitch

# Authentication
JWT_SECRET=your-jwt-secret-key
SESSION_SECRET=your-session-secret-key

# FreeSWITCH
FS_EVENT_SOCKET_PASSWORD=ClueCon
FS_DEFAULT_PASSWORD=1234

# Application
NODE_ENV=production
API_PORT=3000
FRONTEND_PORT=3002
```

---

## 📈 Performance Considerations

### Database Optimization
- **Indexes:** CDR table indexed on call_uuid, start_time, caller_number
- **Partitioning:** CDR table partitioned by month for large datasets
- **Connection Pooling:** TypeORM connection pool configuration
- **Query Optimization:** Efficient pagination and filtering

### Caching Strategy
- **React Cache:** Server-side data deduplication
- **Redis:** Session storage for horizontal scaling
- **CDN:** Static assets caching
- **Database:** Query result caching for reports

### Monitoring & Logging
- **Application Logs:** Structured logging with Winston
- **Database Logs:** PostgreSQL slow query logging
- **FreeSWITCH Logs:** Event socket monitoring
- **Health Checks:** Container health monitoring

---

**Document Version:** 1.0  
**Last Updated:** July 13, 2025  
**Next Review:** After Phase 2 completion
