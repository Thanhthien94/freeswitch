# FreeSWITCH Call Recording Configuration

## 📚 Official Documentation Reference

Based on FreeSWITCH Official Documentation: https://developer.signalwire.com/freeswitch/FreeSWITCH-Explained/Modules/mod-dptools/6587110/

## 🎯 Recording Methods (Official)

### 1. EXECUTE_ON_ANSWER Method (RECOMMENDED)
```xml
<action application="export" data="execute_on_answer=record_session $${recordings_dir}/${filename}.wav"/>
```
**✅ Best Practice:** Recording starts when call is answered, not when bridge begins.

### 2. MEDIA_BUG_ANSWER_REQ Method
```xml
<action application="set" data="media_bug_answer_req=true"/>
<action application="record_session" data="path/to/file.wav"/>
```
**✅ Best Practice:** Recording waits for answer before starting.

### 3. BRIDGE_PRE_EXECUTE Method
```xml
<action application="set" data="bridge_pre_execute_bleg_app=record_session"/>
<action application="set" data="bridge_pre_execute_bleg_data=path/to/file.wav"/>
```
**✅ Best Practice:** Recording starts on B-leg when bridge is established.

### 4. UUID_RECORD API Method
```xml
<action application="export" data="execute_on_answer=api uuid_record ${uuid} start path/to/file.wav"/>
```
**✅ Best Practice:** API-based recording with full control.

## 🚀 Current Implementation

### Global Recording (Testing)
- **File:** `configs/freeswitch/dialplan/default/01_global_recording.xml`
- **Method:** execute_on_answer
- **Trigger:** All calls when `global_recording_enabled=true`

### Selective Recording (Production)
- **File:** `configs/freeswitch/dialplan/default/02_selective_recording.xml`
- **Method:** execute_on_answer with conditions
- **Trigger:** Specific extensions, external calls, business hours

### Bridge Recording (Alternative)
- **File:** `configs/freeswitch/dialplan/default/03_bridge_recording.xml`
- **Method:** bridge_pre_execute_bleg_app
- **Trigger:** When `bridge_recording_enabled=true`

## ⚙️ Configuration Variables

### vars.xml Settings
```xml
<!-- Primary Methods -->
<X-PRE-PROCESS cmd="set" data="global_recording_enabled=true"/>
<X-PRE-PROCESS cmd="set" data="selective_recording_enabled=false"/>

<!-- Alternative Methods -->
<X-PRE-PROCESS cmd="set" data="bridge_recording_enabled=false"/>
<X-PRE-PROCESS cmd="set" data="media_bug_recording_enabled=false"/>
<X-PRE-PROCESS cmd="set" data="uuid_recording_enabled=false"/>
```

### Recording Quality Settings
```xml
<X-PRE-PROCESS cmd="set" data="recording_format=wav"/>
<X-PRE-PROCESS cmd="set" data="recording_rate=8000"/>
<X-PRE-PROCESS cmd="set" data="recording_channels=2"/>
```

## 📁 File Organization

### Directory Structure
```
/var/lib/freeswitch/recordings/
├── archive/           # Archived recordings
├── daily/            # Daily recordings
├── monthly/          # Monthly recordings
└── *.wav            # Current recordings
```

### Filename Convention
```
Format: YYYYMMDD-HHMMSS_caller_destination_uuid.wav
Example: 20250713-143022_1001_1002_94e37cbb-0796-4399-9dae-5c1dfc15bfa9.wav
```

## 🎛️ Recording Controls

### DTMF Controls (During Call)
- **\*7** - Toggle recording on/off
- **\*8** - Pause/resume recording
- **\*2** - Manual recording (legacy)

### API Controls
```bash
# Start recording
fs_cli -x "uuid_record <uuid> start /path/to/file.wav"

# Stop recording
fs_cli -x "uuid_record <uuid> stop /path/to/file.wav"

# Pause recording
fs_cli -x "uuid_record <uuid> pause /path/to/file.wav"
```

## 🔧 Management Script

### Usage
```bash
# Enable global recording (testing)
./scripts/recording_management.sh global

# Enable selective recording (production)
./scripts/recording_management.sh selective

# Check status
./scripts/recording_management.sh status

# Cleanup old recordings
./scripts/recording_management.sh cleanup 90
```

## 📊 Recording Variables

### Channel Variables
- **RECORD_STEREO=true** - Enable stereo recording
- **RECORD_TITLE** - Recording title metadata
- **RECORD_COPYRIGHT** - Copyright information
- **RECORD_SOFTWARE** - Software identifier
- **RECORD_ARTIST** - Artist/system identifier
- **RECORD_COMMENT** - Recording comment
- **RECORD_DATE** - Recording date

### Control Variables
- **media_bug_answer_req=true** - Wait for answer
- **recording_follow_transfer=true** - Continue on transfer
- **RECORD_BRIDGE_REQ=true** - Bridge requirement
- **record_waste_resources=false** - Optimize resources

## 🎯 Best Practices

### 1. Testing Environment
- Use **global_recording_enabled=true**
- Record all calls for testing
- Monitor storage usage
- Test recording quality

### 2. Production Environment
- Use **selective_recording_enabled=true**
- Configure specific rules
- Implement retention policies
- Monitor performance impact

### 3. Performance Optimization
- Use appropriate sample rates (8kHz for voice, 16kHz for quality)
- Enable compression for storage
- Implement cleanup policies
- Monitor disk space

### 4. Compliance
- Configure retention policies
- Implement access controls
- Log recording activities
- Ensure data protection

## 🔍 Troubleshooting

### Common Issues
1. **No recordings created**
   - Check `global_recording_enabled` variable
   - Verify recordings directory exists
   - Check FreeSWITCH logs for errors

2. **Recording starts too early**
   - Use `media_bug_answer_req=true`
   - Use `execute_on_answer` method

3. **Recording stops on transfer**
   - Set `recording_follow_transfer=true`

4. **Poor audio quality**
   - Adjust `recording_rate` and `recording_channels`
   - Check codec compatibility

### Debug Commands
```bash
# Check variables
fs_cli -x "eval \${global_recording_enabled}"

# Check recordings directory
fs_cli -x "eval \${recordings_dir}"

# List active recordings
fs_cli -x "show channels"
```

## 📈 Monitoring

### API Endpoints
- `GET /api/v1/recordings` - List recordings
- `GET /api/v1/recordings/stats` - Recording statistics
- `GET /api/v1/recordings/:uuid/info` - Recording details

### Log Monitoring
```bash
# Watch recording logs
docker logs freeswitch-core | grep -i record

# Check recording status
curl -s http://localhost:3000/api/v1/recordings/stats
```

## 🔄 Migration Guide

### From Manual to Automatic
1. Test with global recording
2. Configure selective rules
3. Update dialplan
4. Restart FreeSWITCH
5. Verify recordings

### From Legacy to New System
1. Backup existing recordings
2. Update configuration files
3. Test new recording methods
4. Migrate old recordings
5. Update monitoring systems
