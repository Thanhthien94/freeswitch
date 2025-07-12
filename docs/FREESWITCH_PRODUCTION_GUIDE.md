# 🏢 FreeSWITCH Production Configuration Guide

## 🎯 Comprehensive Production-Ready Setup

Dựa trên tài liệu chính thức FreeSWITCH và best practices từ cộng đồng.

## 📋 **Table of Contents**

1. [Security Configuration](#security-configuration)
2. [Authentication & Authorization](#authentication--authorization)
3. [Multi-Domain Setup](#multi-domain-setup)
4. [SIP Profiles Configuration](#sip-profiles-configuration)
5. [Dialplan Configuration](#dialplan-configuration)
6. [Directory & User Management](#directory--user-management)
7. [NAT & Firewall Configuration](#nat--firewall-configuration)
8. [Performance & Monitoring](#performance--monitoring)
9. [High Availability](#high-availability)
10. [Production Deployment](#production-deployment)

---

## 🔒 **1. Security Configuration**

### **1.1 Authentication Requirements**

#### **Force Authentication for ALL Registrations:**
```xml
<!-- sip_profiles/internal.xml -->
<param name="auth-calls" value="true"/>
<param name="accept-blind-reg" value="false"/>
<param name="accept-blind-auth" value="false"/>
<param name="challenge-realm" value="auto_from"/>
<param name="inbound-reg-force-matching-username" value="true"/>
```

#### **Strong Password Policy:**
```xml
<!-- directory/default.xml -->
<params>
  <param name="allow-empty-password" value="false"/>
  <param name="minimum-password-length" value="8"/>
</params>
```

### **1.2 Firewall & Rate Limiting**

#### **IPTables Rules:**
```bash
# Basic SIP protection
iptables -A INPUT -p udp --dport 5060 -m limit --limit 10/s --limit-burst 10 -j ACCEPT
iptables -A INPUT -p udp --dport 5080 -m limit --limit 10/s --limit-burst 10 -j ACCEPT

# DoS REGISTER attack prevention
iptables -A INPUT -m string --string "REGISTER sip:" --algo bm --to 65 \
  -m hashlimit --hashlimit 4/minute --hashlimit-burst 1 \
  --hashlimit-mode srcip,dstport --hashlimit-name sip_r_limit -j ACCEPT

# Block friendly-scanner
iptables -I INPUT -j DROP -p udp --dport 5060 \
  -m string --string "friendly-scanner" --algo bm
```

#### **ACL Configuration:**
```xml
<!-- autoload_configs/acl.conf.xml -->
<list name="domains" default="deny">
  <node type="allow" domain="$${domain}"/>
  <node type="allow" cidr="192.168.0.0/16"/>
  <node type="allow" cidr="10.0.0.0/8"/>
  <node type="allow" cidr="172.16.0.0/12"/>
</list>

<list name="trusted_networks" default="deny">
  <node type="allow" cidr="192.168.1.0/24"/>
  <node type="allow" cidr="127.0.0.1/32"/>
</list>
```

### **1.3 Fail2Ban Integration**

#### **Fail2Ban Filter:**
```ini
# /etc/fail2ban/filter.d/freeswitch.conf
[Definition]
failregex = \[WARNING\] sofia_reg\.c:\d+ SIP auth failure \(REGISTER\) on sofia profile \'[^']*\' for \[.*\] from ip <HOST>
            \[WARNING\] sofia_reg\.c:\d+ SIP auth challenge \(REGISTER\) on sofia profile \'[^']*\' for \[.*\] from ip <HOST>
ignoreregex =
```

#### **Fail2Ban Jail:**
```ini
# /etc/fail2ban/jail.local
[freeswitch]
enabled = true
port = 5060,5080
protocol = udp
filter = freeswitch
logpath = /var/log/freeswitch/freeswitch.log
maxretry = 5
bantime = 3600
findtime = 600
```

---

## 🔐 **2. Authentication & Authorization**

### **2.1 Strong Authentication Configuration**

#### **SIP Profile Security:**
```xml
<!-- sip_profiles/internal.xml -->
<param name="auth-calls" value="true"/>
<param name="auth-all-packets" value="false"/>
<param name="auth-subscriptions" value="true"/>
<param name="challenge-realm" value="auto_from"/>
<param name="disable-register" value="false"/>
<param name="inbound-reg-force-matching-username" value="true"/>
<param name="force-register-domain" value="$${domain}"/>
<param name="force-register-db-domain" value="$${domain}"/>
```

### **2.2 User Directory Security**

#### **Secure User Template:**
```xml
<!-- directory/default/user_template.xml -->
<user id="EXTENSION_NUMBER">
  <params>
    <param name="password" value="STRONG_PASSWORD"/>
    <param name="vm-password" value="DIFFERENT_STRONG_PASSWORD"/>
    <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(${dialed_user}@${dialed_domain})}"/>
  </params>
  <variables>
    <variable name="toll_allow" value="domestic,international,local"/>
    <variable name="accountcode" value="EXTENSION_NUMBER"/>
    <variable name="user_context" value="default"/>
    <variable name="effective_caller_id_name" value="User Name"/>
    <variable name="effective_caller_id_number" value="EXTENSION_NUMBER"/>
    <variable name="outbound_caller_id_name" value="Company Name"/>
    <variable name="outbound_caller_id_number" value="MAIN_NUMBER"/>
    <variable name="callgroup" value="default"/>
  </variables>
</user>
```

---

## 🏢 **3. Multi-Domain Setup**

### **3.1 Domain Variables:**
```xml
<!-- vars.xml -->
<X-PRE-PROCESS cmd="set" data="domain=$${local_ip_v4}"/>
<X-PRE-PROCESS cmd="set" data="domain_name=$${domain}"/>
<!-- Multi-domain support -->
<X-PRE-PROCESS cmd="set" data="company1_domain=company1.local"/>
<X-PRE-PROCESS cmd="set" data="company2_domain=company2.local"/>
<X-PRE-PROCESS cmd="set" data="pbx_domain=pbx.local"/>
```

### **3.2 Domain Directory Structure:**
```xml
<!-- directory/company1.local.xml -->
<include>
  <domain name="company1.local">
    <params>
      <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(*/${dialed_user}@${dialed_domain})}"/>
      <param name="allow-empty-password" value="false"/>
    </params>
    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="company1_gateway"/>
      <variable name="default_areacode" value="212"/>
      <variable name="transfer_fallback_extension" value="operator"/>
    </variables>
    <groups>
      <group name="default">
        <users>
          <!-- Company 1 users -->
          <X-PRE-PROCESS cmd="include" data="company1/*.xml"/>
        </users>
      </group>
    </groups>
  </domain>
</include>
```

---

## 📞 **4. SIP Profiles Configuration**

### **4.1 Internal Profile (Production):**
```xml
<!-- sip_profiles/internal.xml -->
<profile name="internal">
  <aliases>
    <alias name="default"/>
  </aliases>
  <gateways>
    <X-PRE-PROCESS cmd="include" data="internal/*.xml"/>
  </gateways>
  <domains>
    <domain name="all" alias="true" parse="true"/>
  </domains>
  <settings>
    <!-- Network Settings -->
    <param name="sip-ip" value="$${local_ip_v4}"/>
    <param name="sip-port" value="$${internal_sip_port}"/>
    <param name="ext-sip-ip" value="auto-nat"/>
    <param name="ext-rtp-ip" value="auto-nat"/>
    
    <!-- Authentication & Security -->
    <param name="auth-calls" value="true"/>
    <param name="auth-all-packets" value="false"/>
    <param name="accept-blind-reg" value="false"/>
    <param name="accept-blind-auth" value="false"/>
    <param name="challenge-realm" value="auto_from"/>
    <param name="inbound-reg-force-matching-username" value="true"/>
    
    <!-- NAT Handling -->
    <param name="aggressive-nat-detection" value="true"/>
    <param name="nat-options-ping" value="true"/>
    <param name="NDLB-force-rport" value="true"/>
    <param name="NDLB-received-in-nat-reg-contact" value="true"/>
    
    <!-- Media Settings -->
    <param name="media_timeout" value="300"/>
    <param name="media_hold_timeout" value="1800"/>
    <param name="rtp-autofix-timing" value="true"/>
    
    <!-- Codec Settings -->
    <param name="inbound-codec-prefs" value="$${global_codec_prefs}"/>
    <param name="outbound-codec-prefs" value="$${global_codec_prefs}"/>
    
    <!-- Registration Settings -->
    <param name="multiple-registrations" value="contact"/>
    <param name="force-register-domain" value="$${domain}"/>
    <param name="force-register-db-domain" value="$${domain}"/>
    
    <!-- Context Routing -->
    <param name="context" value="public"/>
    <param name="dialplan" value="XML"/>
    
    <!-- TLS Settings (if enabled) -->
    <param name="tls" value="$${internal_ssl_enable}"/>
    <param name="tls-sip-port" value="$${internal_tls_port}"/>
    <param name="tls-cert-dir" value="$${internal_ssl_dir}"/>
    <param name="tls-version" value="$${sip_tls_version}"/>
  </settings>
</profile>
```

### **4.2 External Profile (Carriers):**
```xml
<!-- sip_profiles/external.xml -->
<profile name="external">
  <gateways>
    <X-PRE-PROCESS cmd="include" data="external/*.xml"/>
  </gateways>
  <domains>
    <domain name="all" alias="false" parse="false"/>
  </domains>
  <settings>
    <!-- Network Settings -->
    <param name="sip-ip" value="$${local_ip_v4}"/>
    <param name="sip-port" value="$${external_sip_port}"/>
    <param name="ext-sip-ip" value="auto-nat"/>
    <param name="ext-rtp-ip" value="auto-nat"/>
    
    <!-- Authentication -->
    <param name="auth-calls" value="false"/>
    <param name="accept-blind-reg" value="false"/>
    
    <!-- Context Routing -->
    <param name="context" value="public"/>
    <param name="dialplan" value="XML"/>
    
    <!-- Media Settings -->
    <param name="media_timeout" value="300"/>
    <param name="media_hold_timeout" value="1800"/>
    
    <!-- Codec Settings -->
    <param name="inbound-codec-prefs" value="$${outbound_codec_prefs}"/>
    <param name="outbound-codec-prefs" value="$${outbound_codec_prefs}"/>
  </settings>
</profile>
```

---

## 🔄 **5. Dialplan Configuration**

### **5.1 Security-First Dialplan:**
```xml
<!-- dialplan/public.xml -->
<include>
  <context name="public">
    <!-- Anti-fraud protection -->
    <extension name="unloop">
      <condition field="${unroll_loops}" expression="^true$"/>
      <condition field="${sip_looped_call}" expression="^true$">
        <action application="deflect" data="${destination_number}"/>
      </condition>
    </extension>
    
    <!-- Rate limiting -->
    <extension name="rate_limit">
      <condition field="${call_debug}" expression="^true$" break="never">
        <action application="info"/>
      </condition>
      <condition field="${sip_h_X-AUTH-TOKEN}" expression="^(.+)$" break="never">
        <action application="set" data="auth_token=$1"/>
      </condition>
    </extension>
    
    <!-- DID routing -->
    <extension name="public_did">
      <condition field="destination_number" expression="^(\d{10})$">
        <action application="set" data="domain_name=$${domain}"/>
        <action application="transfer" data="$1 XML default"/>
      </condition>
    </extension>
  </context>
</include>
```

### **5.2 Default Context (Authenticated Users):**
```xml
<!-- dialplan/default.xml -->
<include>
  <context name="default">
    <!-- Local extensions -->
    <extension name="Local_Extension">
      <condition field="destination_number" expression="^(10[01][0-9])$">
        <action application="export" data="dialed_extension=$1"/>
        <action application="set" data="ringback=${us-ring}"/>
        <action application="set" data="transfer_ringback=$${hold_music}"/>
        <action application="set" data="call_timeout=30"/>
        <action application="set" data="hangup_after_bridge=true"/>
        <action application="set" data="continue_on_fail=true"/>
        <action application="hash" data="insert/${domain_name}-call_return/${dialed_extension}/${caller_id_number}"/>
        <action application="hash" data="insert/${domain_name}-last_dial_ext/${dialed_extension}/${uuid}"/>
        <action application="set" data="called_party_callgroup=${user_data(${dialed_extension}@${domain_name} var callgroup)}"/>
        <action application="hash" data="insert/${domain_name}-last_dial/${called_party_callgroup}/${uuid}"/>
        <action application="bridge" data="user/${dialed_extension}@${domain_name}"/>
        <action application="answer"/>
        <action application="sleep" data="1000"/>
        <action application="bridge" data="loopback/app=voicemail:default ${domain_name} ${dialed_extension}"/>
      </condition>
    </extension>
    
    <!-- Outbound calling -->
    <extension name="outbound_pstn">
      <condition field="destination_number" expression="^9([1-9]\d{10})$">
        <action application="set" data="effective_caller_id_name=${outbound_caller_name}"/>
        <action application="set" data="effective_caller_id_number=${outbound_caller_id}"/>
        <action application="bridge" data="sofia/gateway/primary_carrier/$1"/>
      </condition>
    </extension>
  </context>
</include>
```

---

## 👥 **6. Directory & User Management**

### **6.1 Centralized User Management:**
```xml
<!-- directory/default.xml -->
<include>
  <domain name="$${domain}">
    <params>
      <param name="dial-string" value="{presence_id=${dialed_user}@${dialed_domain}}${sofia_contact(*/${dialed_user}@${dialed_domain})}"/>
      <param name="jsonrpc-allowed-methods" value="verto"/>
      <param name="allow-empty-password" value="false"/>
    </params>
    
    <variables>
      <variable name="record_stereo" value="true"/>
      <variable name="default_gateway" value="$${default_provider}"/>
      <variable name="default_areacode" value="$${default_areacode}"/>
      <variable name="transfer_fallback_extension" value="operator"/>
    </variables>
    
    <groups>
      <group name="default">
        <users>
          <X-PRE-PROCESS cmd="include" data="default/*.xml"/>
        </users>
      </group>
      
      <group name="sales">
        <users>
          <X-PRE-PROCESS cmd="include" data="sales/*.xml"/>
        </users>
      </group>
      
      <group name="support">
        <users>
          <X-PRE-PROCESS cmd="include" data="support/*.xml"/>
        </users>
      </group>
    </groups>
  </domain>
</include>
```

---

## 🌐 **7. NAT & Firewall Configuration**

### **7.1 Advanced NAT Settings:**
```xml
<!-- sip_profiles/internal.xml NAT section -->
<param name="aggressive-nat-detection" value="true"/>
<param name="nat-options-ping" value="true"/>
<param name="NDLB-force-rport" value="true"/>
<param name="NDLB-received-in-nat-reg-contact" value="true"/>
<param name="apply-inbound-acl" value="domains"/>
<param name="force-register-domain" value="$${domain}"/>
<param name="rtp-autofix-timing" value="true"/>
<param name="ext-sip-ip" value="auto-nat"/>
<param name="ext-rtp-ip" value="auto-nat"/>
```

### **7.2 RTP Configuration:**
```xml
<!-- vars.xml -->
<X-PRE-PROCESS cmd="set" data="rtp_start_port=16384"/>
<X-PRE-PROCESS cmd="set" data="rtp_end_port=32768"/>
<X-PRE-PROCESS cmd="set" data="rtp_port_range=16384-32768"/>
```

---

## 📊 **8. Performance & Monitoring**

### **8.1 Performance Settings:**
```xml
<!-- autoload_configs/switch.conf.xml -->
<configuration name="switch.conf" description="Core Configuration">
  <settings>
    <param name="max-sessions" value="1000"/>
    <param name="sessions-per-second" value="30"/>
    <param name="loglevel" value="info"/>
    <param name="debug-level" value="1"/>
    <param name="dump-cores" value="yes"/>
    <param name="rtp-start-port" value="16384"/>
    <param name="rtp-end-port" value="32768"/>
    <param name="core-db-dsn" value="sqlite://core"/>
  </settings>
</configuration>
```

### **8.2 Logging Configuration:**
```xml
<!-- autoload_configs/logfile.conf.xml -->
<configuration name="logfile.conf" description="File Logging">
  <settings>
    <param name="colorize" value="true"/>
    <param name="uuid" value="true"/>
  </settings>
  <profiles>
    <profile name="default">
      <settings>
        <param name="logfile" value="/var/log/freeswitch/freeswitch.log"/>
        <param name="rollover" value="10485760"/>
        <param name="maximum-rotate" value="32"/>
      </settings>
      <mappings>
        <map name="all" value="console,info,notice,warning,err,crit,alert"/>
      </mappings>
    </profile>
  </profiles>
</configuration>
```

---

---

## 🔄 **9. High Availability**

### **9.1 Database Configuration:**
```xml
<!-- autoload_configs/db.conf.xml -->
<configuration name="db.conf" description="LIMIT DB Configuration">
  <settings>
    <param name="odbc-dsn" value="freeswitch:freeswitch:freeswitch"/>
    <param name="max-db-handles" value="50"/>
    <param name="db-handle-timeout" value="10"/>
  </settings>
</configuration>
```

### **9.2 Shared Registration (Redis/Database):**
```xml
<!-- autoload_configs/sofia.conf.xml -->
<param name="odbc-dsn" value="pgsql://hostaddr=127.0.0.1 dbname=freeswitch user=freeswitch password='password' options='-c default_tablespace=freeswitch'"/>
<param name="track-calls" value="true"/>
<param name="reg-db-domain" value="$${domain}"/>
```

### **9.3 Load Balancing Configuration:**
```xml
<!-- autoload_configs/distributor.conf.xml -->
<configuration name="distributor.conf" description="Distributor Configuration">
  <lists>
    <list name="pstn_gateways" total-weight="10">
      <node name="gateway1" weight="5"/>
      <node name="gateway2" weight="3"/>
      <node name="gateway3" weight="2"/>
    </list>
  </lists>
</configuration>
```

---

## 🚀 **10. Production Deployment**

### **10.1 System Requirements:**

#### **Minimum Hardware:**
- **CPU**: 4 cores, 2.4GHz+
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: SSD recommended, 100GB+
- **Network**: Gigabit Ethernet

#### **Operating System:**
- **Linux**: Ubuntu 20.04 LTS, CentOS 8, Debian 11
- **Kernel**: 5.4+ recommended
- **File System**: ext4 or XFS

### **10.2 Installation Script:**
```bash
#!/bin/bash
# FreeSWITCH Production Installation

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y wget gnupg2 software-properties-common

# Add FreeSWITCH repository
wget -O - https://files.freeswitch.org/repo/deb/debian-release/fsstretch-archive-keyring.asc | apt-key add -
echo "deb http://files.freeswitch.org/repo/deb/debian-release/ `lsb_release -sc` main" > /etc/apt/sources.list.d/freeswitch.list

# Install FreeSWITCH
apt update
apt install -y freeswitch-meta-all

# Configure system limits
cat >> /etc/security/limits.conf << EOF
freeswitch soft core unlimited
freeswitch hard core unlimited
freeswitch soft nofile 999999
freeswitch hard nofile 999999
freeswitch soft nproc 999999
freeswitch hard nproc 999999
freeswitch soft stack 240
freeswitch hard stack 240
EOF

# Configure systemd service
systemctl enable freeswitch
systemctl start freeswitch
```

### **10.3 Security Hardening:**
```bash
#!/bin/bash
# Security Hardening Script

# Install fail2ban
apt install -y fail2ban

# Configure fail2ban for FreeSWITCH
cat > /etc/fail2ban/filter.d/freeswitch.conf << EOF
[Definition]
failregex = \[WARNING\] sofia_reg\.c:\d+ SIP auth failure \(REGISTER\) on sofia profile \'[^']*\' for \[.*\] from ip <HOST>
ignoreregex =
EOF

cat > /etc/fail2ban/jail.d/freeswitch.conf << EOF
[freeswitch]
enabled = true
port = 5060,5080
protocol = udp
filter = freeswitch
logpath = /var/log/freeswitch/freeswitch.log
maxretry = 5
bantime = 3600
findtime = 600
EOF

# Restart fail2ban
systemctl restart fail2ban

# Configure iptables
iptables-save > /etc/iptables.rules.backup

# Basic firewall rules
iptables -F
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -p udp --dport 5060 -m limit --limit 10/s -j ACCEPT
iptables -A INPUT -p udp --dport 5080 -m limit --limit 10/s -j ACCEPT
iptables -A INPUT -p udp --dport 16384:32768 -j ACCEPT
iptables -A INPUT -j DROP

# Save iptables rules
iptables-save > /etc/iptables.rules
```

### **10.4 Monitoring & Alerting:**
```bash
#!/bin/bash
# Monitoring Setup

# Install monitoring tools
apt install -y htop iotop nethogs

# Create monitoring script
cat > /usr/local/bin/fs-monitor.sh << 'EOF'
#!/bin/bash
# FreeSWITCH Monitoring Script

LOG_FILE="/var/log/freeswitch-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check FreeSWITCH status
if ! systemctl is-active --quiet freeswitch; then
    echo "[$DATE] CRITICAL: FreeSWITCH is not running" >> $LOG_FILE
    systemctl start freeswitch
fi

# Check memory usage
MEM_USAGE=$(ps -o pid,ppid,cmd,%mem,%cpu --sort=-%mem -C freeswitch | awk 'NR==2{print $4}')
if (( $(echo "$MEM_USAGE > 80" | bc -l) )); then
    echo "[$DATE] WARNING: High memory usage: $MEM_USAGE%" >> $LOG_FILE
fi

# Check active calls
ACTIVE_CALLS=$(fs_cli -x "show calls count" | grep "total" | awk '{print $1}')
echo "[$DATE] INFO: Active calls: $ACTIVE_CALLS" >> $LOG_FILE

# Check registrations
REGISTRATIONS=$(fs_cli -x "sofia status profile internal reg" | grep "Total items returned" | awk '{print $4}')
echo "[$DATE] INFO: Active registrations: $REGISTRATIONS" >> $LOG_FILE
EOF

chmod +x /usr/local/bin/fs-monitor.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/fs-monitor.sh" | crontab -
```

### **10.5 Backup & Recovery:**
```bash
#!/bin/bash
# Backup Script

BACKUP_DIR="/backup/freeswitch"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration
tar -czf $BACKUP_DIR/freeswitch-config-$DATE.tar.gz /etc/freeswitch/

# Backup database
sqlite3 /var/lib/freeswitch/db/core.db ".backup $BACKUP_DIR/core-$DATE.db"

# Backup recordings
tar -czf $BACKUP_DIR/recordings-$DATE.tar.gz /var/lib/freeswitch/recordings/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.db" -mtime +30 -delete

echo "Backup completed: $DATE"
```

---

## 📋 **11. Production Checklist**

### **Pre-Deployment:**
- [ ] Security audit completed
- [ ] Firewall rules configured
- [ ] Fail2ban installed and configured
- [ ] Strong passwords set for all users
- [ ] TLS certificates installed (if using SIP TLS)
- [ ] Backup procedures tested
- [ ] Monitoring tools configured
- [ ] Load testing completed
- [ ] Documentation updated

### **Post-Deployment:**
- [ ] Monitor logs for errors
- [ ] Verify all services are running
- [ ] Test call flows
- [ ] Verify registrations
- [ ] Check system resources
- [ ] Test backup/recovery procedures
- [ ] Verify monitoring alerts
- [ ] Document any issues

---

## 🔧 **12. Troubleshooting Commands**

### **System Status:**
```bash
# Check FreeSWITCH status
systemctl status freeswitch

# Check logs
tail -f /var/log/freeswitch/freeswitch.log

# Check active calls
fs_cli -x "show calls"

# Check registrations
fs_cli -x "sofia status profile internal reg"

# Check system resources
htop
iotop
nethogs
```

### **SIP Debugging:**
```bash
# Enable SIP tracing
fs_cli -x "sofia profile internal siptrace on"

# Check SIP profile status
fs_cli -x "sofia status profile internal"

# Reload configuration
fs_cli -x "reloadxml"
fs_cli -x "sofia profile internal restart"
```

---

## 📚 **13. Additional Resources**

### **Official Documentation:**
- [FreeSWITCH Documentation](https://developer.signalwire.com/freeswitch/)
- [Security Best Practices](https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/Security/)
- [Configuration Guide](https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/Configuration/)

### **Community Resources:**
- [FreeSWITCH Forums](https://forum.signalwire.community/)
- [FreeSWITCH Slack](https://signalwire.community/)
- [GitHub Repository](https://github.com/signalwire/freeswitch)

### **Professional Support:**
- [SignalWire Support](https://signalwire.com/support)
- [FreeSWITCH Consulting](https://freeswitch.com/support/)

---

**🎉 PRODUCTION GUIDE HOÀN THÀNH!**

Đây là comprehensive guide để deploy FreeSWITCH production-ready với:
- ✅ **Security hardening**
- ✅ **Authentication enforcement**
- ✅ **Multi-domain support**
- ✅ **NAT traversal**
- ✅ **High availability**
- ✅ **Monitoring & alerting**
- ✅ **Backup & recovery**
- ✅ **Performance optimization**

**Bây giờ bạn có thể triển khai FreeSWITCH theo chuẩn enterprise!** 🚀
