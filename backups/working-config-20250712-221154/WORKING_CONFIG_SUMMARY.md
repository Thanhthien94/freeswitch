# FreeSWITCH Working Configuration Backup
**Date**: 2025-07-12 22:11:54
**Status**: FULLY WORKING - Audio, Registration, Multi-domain

## ✅ WORKING FEATURES:
- SIP Registration (multi-domain support)
- Call Setup & Termination
- 2-way Audio (PCMU/G722/OPUS)
- BYE Message Handling
- NAT Traversal
- Multi-domain: localhost, pbx.local, freeswitch.local

## 🔧 KEY CONFIGURATIONS:

### Docker Compose:
- **Network**: Bridge networking (not host)
- **Ports**: 5060 (SIP), 8023 (ESL), 16384-16484 (RTP)
- **Platform**: linux/amd64

### FreeSWITCH Core Settings:
- **RTP Port Range**: 16384-16484 (matches Docker mapping)
- **SIP/RTP IP**: $${local_ip_v4} (Docker internal)
- **External IPs**: 192.168.1.6 (host IP)

### SIP Profile (internal.xml):
- **NAT**: apply-nat-acl=none, NDLB-force-rport=true
- **Multi-domain**: force-register-domain disabled
- **Codecs**: OPUS,G722,PCMU,PCMA,H264,VP8

### Domains:
- **localhost**: Users 1000,1001,1002
- **pbx.local**: Users 1000,1001,1002  
- **freeswitch.local**: Users 1000-1019

## 🧪 TESTED SCENARIOS:
- ✅ SIP Registration (all domains)
- ✅ Call 1002@localhost → 1001@localhost
- ✅ 2-way audio working
- ✅ Proper call termination
- ✅ No duplicate calls
- ✅ BYE message handling

## 🎯 CRITICAL SUCCESS FACTORS:
1. **RTP Port Range Sync**: FreeSWITCH config MUST match Docker port mapping
2. **Bridge Networking**: Host networking doesn't work on macOS Docker Desktop
3. **NAT Settings**: apply-nat-acl=none for optimal NAT handling
4. **Multi-domain**: Disable force-register-domain for proper domain isolation

## 📋 SIP CLIENT CONFIG:
```
Server: 192.168.1.6:5060
Username: 1001 (or 1002)
Password: d-d5kjaQMM6_
Domain: localhost (or pbx.local, freeswitch.local)
```

## 🚀 READY FOR PRODUCTION DEVELOPMENT!
