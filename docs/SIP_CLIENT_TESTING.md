# 📞 SIP Client Testing Guide

## 🎯 Mục tiêu
Test kết nối SIP clients thực tế với FreeSWITCH PBX system để đảm bảo:
- SIP registration hoạt động
- Cuộc gọi nội bộ (extension to extension)
- Audio quality
- Call features cơ bản

## 🔧 Thông tin kết nối

### SIP Server Configuration
- **SIP Server IP**: `192.168.1.6`
- **SIP Port**: `5060` (UDP/TCP)
- **TLS Port**: `5061` (nếu hỗ trợ)
- **Domain**: `192.168.1.6`

### Test Users Available
| Extension | Username | Password | VM Password |
|-----------|----------|----------|-------------|
| 1000 | 1000 | d-d5kjaQMM6_ | 1000 |
| 1001 | 1001 | d-d5kjaQMM6_ | 1001 |
| 1002 | 1002 | d-d5kjaQMM6_ | 1002 |
| 1003 | 1003 | d-d5kjaQMM6_ | 1003 |
| ... | ... | ... | ... |
| 1019 | 1019 | d-d5kjaQMM6_ | 1019 |

## 📱 Recommended SIP Clients

### Desktop Applications
1. **Zoiper** (Windows/Mac/Linux) - Free
2. **X-Lite** (Windows/Mac) - Free
3. **Bria** (Windows/Mac) - Paid
4. **MicroSIP** (Windows) - Free
5. **Linphone** (Windows/Mac/Linux) - Free

### Mobile Applications
1. **Zoiper** (iOS/Android) - Free/Paid
2. **Linphone** (iOS/Android) - Free
3. **CSipSimple** (Android) - Free
4. **Bria Mobile** (iOS/Android) - Paid

### Web-based
1. **JsSIP** - Browser-based
2. **SIPml5** - HTML5 SIP client

## ⚙️ SIP Client Configuration

### Example: Zoiper Configuration
```
Account Type: SIP
Username: 1000
Password: d-d5kjaQMM6_
Domain: 192.168.1.6
Outbound Proxy: (leave empty)
Port: 5060
Transport: UDP
```

### Example: X-Lite Configuration
```
Display Name: Extension 1000
User Name: 1000
Password: d-d5kjaQMM6_
Domain: 192.168.1.6
```

### Example: Linphone Configuration
```
Username: 1000
SIP Domain: 192.168.1.6
Password: d-d5kjaQMM6_
Transport: UDP
Port: 5060
```

## 🧪 Testing Scenarios

### 1. Basic Registration Test
1. Configure SIP client với user 1000
2. Kiểm tra registration status = "Registered"
3. Verify trong FreeSWITCH logs

### 2. Internal Call Test
1. Register 2 SIP clients (1000 và 1001)
2. Từ 1000 gọi 1001
3. Answer call từ 1001
4. Test audio 2 chiều
5. Hangup call

### 3. Multiple Extensions Test
1. Register 3-4 SIP clients cùng lúc
2. Test calls giữa các extensions khác nhau
3. Verify concurrent calls

### 4. Call Features Test
1. **Hold/Resume**: Test hold và resume calls
2. **Transfer**: Test blind và attended transfer
3. **Conference**: Gọi extension 3000 để join conference
4. **Voicemail**: Gọi *98 để check voicemail

## 📊 Monitoring & Verification

### FreeSWITCH CLI Commands
```bash
# Connect to FreeSWITCH CLI
docker exec -it freeswitch-core fs_cli

# Check registrations
sofia status profile internal reg

# Show active calls
show calls

# Show channels
show channels

# Monitor events
/events plain all
```

### API Endpoints for Monitoring
```bash
# Check FreeSWITCH health
curl http://localhost:3000/api/v1/health/freeswitch

# Get active calls
curl http://localhost:3000/api/v1/calls

# View metrics
curl http://localhost:3000/api/v1/metrics
```

### Grafana Dashboards
- **FreeSWITCH Metrics**: http://localhost:3001/d/freeswitch-metrics
- **System Metrics**: http://localhost:3001/d/system-metrics

## 🔍 Troubleshooting

### Common Issues

#### 1. Registration Failed
- Check IP address và port
- Verify username/password
- Check firewall settings
- Ensure FreeSWITCH is running

#### 2. No Audio
- Check RTP ports (16384-16394)
- Verify network connectivity
- Check NAT settings
- Test with different codecs

#### 3. Call Setup Failed
- Check dialplan configuration
- Verify extension exists
- Check FreeSWITCH logs
- Test with fs_cli

### Network Requirements
- **SIP Signaling**: Port 5060 (UDP/TCP)
- **RTP Media**: Ports 16384-16394 (UDP)
- **TLS (optional)**: Port 5061 (TCP)

### Firewall Configuration
```bash
# Allow SIP signaling
sudo ufw allow 5060/udp
sudo ufw allow 5060/tcp

# Allow RTP media
sudo ufw allow 16384:16394/udp

# Allow TLS (if needed)
sudo ufw allow 5061/tcp
```

## ✅ Success Criteria

### Registration Success
- [ ] SIP client shows "Registered" status
- [ ] Extension appears in `sofia status profile internal reg`
- [ ] No authentication errors in logs

### Call Success
- [ ] Call setup completes within 3 seconds
- [ ] Audio flows both directions
- [ ] Call can be terminated cleanly
- [ ] No dropped packets or audio issues

### System Performance
- [ ] CPU usage remains under 50%
- [ ] Memory usage stable
- [ ] No error messages in logs
- [ ] Metrics show healthy system

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

SIP Client: ___________
Version: ___________

Test Results:
[ ] Registration successful
[ ] Internal calls working
[ ] Audio quality good
[ ] Call features working
[ ] No system errors

Notes:
_________________________________
_________________________________
```
