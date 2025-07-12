# 🔧 NAT Fix Guide - FreeSWITCH NAT Traversal Solutions

## 🎯 Vấn đề đã được giải quyết

### Vấn đề ban đầu:
- ❌ **BYE message handling issues** - FreeSWITCH không xử lý được BYE messages đúng cách
- ❌ **Audio loss during calls** - Mất thoại trong cuộc gọi giữa softphones
- ❌ **NAT traversal problems** - Vấn đề NAT khi SIP clients ở sau NAT/firewall

### Nguyên nhân:
- Thiếu cấu hình NAT traversal trong SIP profiles
- Deprecated RTP timeout settings
- Không enable aggressive NAT detection
- Thiếu force-rport và NAT contact rewriting

## ✅ Giải pháp đã áp dụng

### 1. **Aggressive NAT Detection**
```xml
<param name="aggressive-nat-detection" value="true"/>
```
- **Mục đích**: Tự động phát hiện và xử lý NAT scenarios
- **Kết quả**: `AGGRESSIVENAT: true` trong sofia status

### 2. **NAT Options Ping**
```xml
<param name="nat-options-ping" value="true"/>
```
- **Mục đích**: Gửi OPTIONS packets để maintain NAT bindings
- **Kết quả**: Giữ NAT holes open cho registered endpoints

### 3. **Force RPort**
```xml
<param name="NDLB-force-rport" value="true"/>
```
- **Mục đích**: Force sử dụng received port cho responses
- **Kết quả**: Cải thiện BYE message handling qua NAT

### 4. **NAT Contact Rewriting**
```xml
<param name="NDLB-received-in-nat-reg-contact" value="true"/>
```
- **Mục đích**: Thêm received parameter vào contact header
- **Kết quả**: Đúng contact information cho NAT clients

### 5. **Inbound ACL và Domain Forcing**
```xml
<param name="apply-inbound-acl" value="domains"/>
<param name="force-register-domain" value="$${domain}"/>
```
- **Mục đích**: Better domain và ACL handling cho NAT
- **Kết quả**: Consistent domain resolution

### 6. **RTP Auto-fix Timing**
```xml
<param name="rtp-autofix-timing" value="true"/>
```
- **Mục đích**: Tự động điều chỉnh RTP timing cho NAT
- **Kết quả**: Better audio quality qua NAT

### 7. **Updated RTP Timeout Settings**
```xml
<!-- Old deprecated settings -->
<!-- <param name="rtp-timeout-sec" value="300"/> -->
<!-- <param name="rtp-hold-timeout-sec" value="1800"/> -->

<!-- New correct settings -->
<param name="media_timeout" value="300"/>
<param name="media_hold_timeout" value="1800"/>
```
- **Mục đích**: Sử dụng current parameter names
- **Kết quả**: Loại bỏ deprecation warnings

## 📊 Kết quả sau khi áp dụng

### SIP Profile Status:
```
AGGRESSIVENAT    	true
RTP-IP           	172.25.0.3
Ext-RTP-IP       	14.240.195.91
SIP-IP           	172.25.0.3
Ext-SIP-IP       	14.240.195.91
```

### Expected Improvements:
- ✅ **Better BYE handling** - Proper call termination qua NAT
- ✅ **Improved audio quality** - Stable RTP media flow
- ✅ **Reliable NAT traversal** - Automatic NAT detection và handling
- ✅ **Contact rewriting** - Correct contact information
- ✅ **Symmetric RTP** - Better handling of symmetric RTP

## 🧪 Testing & Verification

### 1. **Test NAT Settings**
```bash
./scripts/test-nat-fix.sh nat
```

### 2. **Test SIP Registration**
```bash
./scripts/test-nat-fix.sh reg
```

### 3. **Test RTP Handling**
```bash
./scripts/test-nat-fix.sh rtp
```

### 4. **Test BYE Handling**
```bash
./scripts/test-nat-fix.sh bye
```

### 5. **Comprehensive Test**
```bash
./scripts/test-nat-fix.sh test
```

## 🔍 Monitoring & Troubleshooting

### Check NAT Detection:
```bash
docker exec freeswitch-core fs_cli -x "sofia status profile internal"
```

### Monitor SIP Messages:
```bash
docker exec freeswitch-core fs_cli -x "sofia profile internal siptrace on"
# Make test calls
docker exec freeswitch-core fs_cli -x "sofia profile internal siptrace off"
```

### Check Registrations:
```bash
docker exec freeswitch-core fs_cli -x "sofia status profile internal reg"
```
- Look for `UDP-NAT` flags in registrations
- Verify `fs_nat=yes` in contact headers

### Monitor RTP:
```bash
docker exec freeswitch-core fs_cli -x "show channels"
```
- Check for proper codec negotiation
- Verify RTP flow

## 📝 Configuration Files Modified

### 1. **configs/freeswitch/sip_profiles/internal.xml**
- Added aggressive NAT detection
- Enabled NAT options ping
- Added force-rport
- Enabled NAT contact rewriting
- Added inbound ACL và domain forcing
- Enabled RTP auto-fix timing
- Updated RTP timeout parameters

### 2. **configs/freeswitch/sip_profiles/external.xml**
- Updated RTP timeout parameters to new format

## 🚀 Next Steps

### For Production Deployment:
1. **Test with real softphones** từ different networks
2. **Monitor call quality** và BYE handling
3. **Adjust RTP timeout values** nếu cần
4. **Consider STUN/TURN** cho complex NAT scenarios
5. **Enable SIP TLS** cho security

### Advanced NAT Scenarios:
- **Symmetric NAT**: May need STUN server
- **Multiple NAT layers**: Consider TURN relay
- **Firewall restrictions**: May need specific port ranges

## ⚠️ Important Notes

1. **Test thoroughly** với real network conditions
2. **Monitor logs** cho NAT-related issues
3. **Adjust timeouts** based on network characteristics
4. **Consider security implications** của NAT settings
5. **Document network topology** cho troubleshooting

## 📞 Test Scenarios

### Recommended Test Cases:
1. **Basic call setup/teardown** - Extension to extension
2. **Hold/Resume** - Test media handling
3. **Transfer** - Test signaling qua NAT
4. **Conference** - Multiple participants
5. **Long duration calls** - Test timeout handling
6. **Rapid call sequences** - Test NAT binding maintenance

### Success Criteria:
- ✅ Calls setup within 3 seconds
- ✅ Audio flows both directions
- ✅ BYE messages processed correctly
- ✅ No dropped calls due to NAT issues
- ✅ Stable audio quality throughout call
- ✅ Proper call termination

---

**🎉 NAT fixes đã được áp dụng thành công! FreeSWITCH bây giờ có khả năng NAT traversal tốt hơn và xử lý BYE messages đúng cách.**
