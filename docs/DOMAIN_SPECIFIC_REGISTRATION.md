# 🏢 Domain-Specific Registration Guide

## 🎯 Cách đăng ký SIP với domain cụ thể

### 📋 **Available Domains:**
- ✅ **172.25.0.3** (Default IP domain)
- ✅ **localhost** (Local development domain)  
- ✅ **pbx.local** (Production domain)

## 📱 **SIP Client Configuration**

### 🔧 **Domain 1: localhost**

#### **Zoiper Configuration:**
```
Account Name: Extension 1001 (localhost)
SIP Server: 192.168.1.6
Port: 5060
Username: 1001
Password: d-d5kjaQMM6_
Domain: localhost
Realm: localhost
```

#### **Advanced Settings:**
```
Transport: UDP (preferred) or TCP
Outbound Proxy: (leave empty)
STUN Server: (leave empty for local)
Authentication Username: 1001
Display Name: Extension 1001 (localhost)
```

### 🔧 **Domain 2: pbx.local**

#### **Zoiper Configuration:**
```
Account Name: Extension 1001 (pbx.local)
SIP Server: 192.168.1.6
Port: 5060
Username: 1001
Password: d-d5kjaQMM6_
Domain: pbx.local
Realm: pbx.local
```

#### **Advanced Settings:**
```
Transport: UDP (preferred) or TCP
Outbound Proxy: (leave empty)
STUN Server: (leave empty for local)
Authentication Username: 1001
Display Name: Extension 1001 (pbx.local)
```

### 🔧 **Domain 3: 172.25.0.3 (Default)**

#### **Zoiper Configuration:**
```
Account Name: Extension 1001 (IP Domain)
SIP Server: 192.168.1.6
Port: 5060
Username: 1001
Password: d-d5kjaQMM6_
Domain: 172.25.0.3
Realm: 172.25.0.3
```

#### **Advanced Settings:**
```
Transport: UDP (preferred) or TCP
Outbound Proxy: (leave empty)
STUN Server: (leave empty for local)
Authentication Username: 1001
Display Name: Extension 1001 (IP)
```

## 🔍 **Verification Steps**

### 1. **Test Domain Lookup:**
```bash
# Test localhost domain
docker exec freeswitch-core fs_cli -x "xml_locate directory domain name localhost"

# Test pbx.local domain  
docker exec freeswitch-core fs_cli -x "xml_locate directory domain name pbx.local"

# Test IP domain
docker exec freeswitch-core fs_cli -x "xml_locate directory domain name 172.25.0.3"
```

### 2. **Test User Lookup:**
```bash
# Test user in localhost domain
docker exec freeswitch-core fs_cli -x "xml_locate directory user name 1001@localhost"

# Test user in pbx.local domain
docker exec freeswitch-core fs_cli -x "xml_locate directory user name 1001@pbx.local"

# Test user in IP domain
docker exec freeswitch-core fs_cli -x "xml_locate directory user name 1001@172.25.0.3"
```

### 3. **Monitor Registrations:**
```bash
# Check all registrations
docker exec freeswitch-core fs_cli -x "sofia status profile internal reg"

# Check specific domain registrations
docker exec freeswitch-core fs_cli -x "sofia status profile internal reg" | grep localhost
docker exec freeswitch-core fs_cli -x "sofia status profile internal reg" | grep pbx.local
```

## 📞 **Expected Registration Results**

### **Successful Registration will show:**
```
User: 1001@localhost
Status: Registered(UDP-NAT)(unknown) or Registered(TCP-NAT)(unknown)
Auth-Realm: localhost
```

### **For pbx.local domain:**
```
User: 1001@pbx.local  
Status: Registered(UDP-NAT)(unknown) or Registered(TCP-NAT)(unknown)
Auth-Realm: pbx.local
```

### **For IP domain:**
```
User: 1001@172.25.0.3
Status: Registered(UDP-NAT)(unknown) or Registered(TCP-NAT)(unknown)
Auth-Realm: 172.25.0.3
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Registration Failed**
```
Cause: Wrong domain in SIP client
Solution: Ensure Domain field matches exactly (case-sensitive)
```

### **Issue 2: Authentication Failed**
```
Cause: Realm mismatch
Solution: Set Realm = Domain in SIP client
```

### **Issue 3: User Not Found**
```
Cause: Domain not configured properly
Solution: Check domain exists in FreeSWITCH
```

## 🔧 **Testing Commands**

### **Enable Debug for Registration:**
```bash
# Enable SIP debugging
docker exec freeswitch-core fs_cli -x "sofia profile internal siptrace on"

# Enable detailed logging
docker exec freeswitch-core fs_cli -x "sofia loglevel all 9"

# Monitor real-time
docker logs -f freeswitch-core | grep -E "(REGISTER|401|200 OK)"
```

### **Disable Debug:**
```bash
# Disable SIP debugging
docker exec freeswitch-core fs_cli -x "sofia profile internal siptrace off"

# Reset log level
docker exec freeswitch-core fs_cli -x "sofia loglevel all 0"
```

## 📋 **Step-by-Step Registration Process**

### **Step 1: Choose Domain**
- Decide which domain to use (localhost, pbx.local, or IP)

### **Step 2: Configure SIP Client**
- Set Server: 192.168.1.6:5060
- Set Username: 1001 (or desired extension)
- Set Password: d-d5kjaQMM6_
- **IMPORTANT**: Set Domain = chosen domain
- **IMPORTANT**: Set Realm = same as domain

### **Step 3: Test Registration**
- Save configuration in SIP client
- Check registration status
- Verify in FreeSWITCH logs

### **Step 4: Verify Authentication**
- Check that Auth-Realm matches your domain
- Ensure User shows correct domain

## 🎯 **Multi-Domain Benefits**

### **Isolation:**
- Users in different domains are logically separated
- Domain-specific routing possible
- Multi-tenant support

### **Flexibility:**
- Same extension numbers across domains
- Domain-specific features
- Scalable architecture

### **Security:**
- Domain-based access control
- Separate authentication realms
- Isolated user spaces

---

**🎉 Bây giờ bạn có thể đăng ký với domain cụ thể! Chọn domain phù hợp và cấu hình SIP client theo hướng dẫn trên.**
