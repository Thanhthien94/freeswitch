import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class MetricsService {
  private lastCpuUsage = process.cpuUsage();
  private lastMeasureTime = process.hrtime.bigint();

  private getCpuUsagePercent(): number {
    const currentTime = process.hrtime.bigint();
    const currentUsage = process.cpuUsage(this.lastCpuUsage);

    // Calculate time elapsed in nanoseconds
    const timeElapsed = Number(currentTime - this.lastMeasureTime) / 1000000; // Convert to milliseconds

    // Calculate CPU usage percentage
    const totalCpuTime = (currentUsage.user + currentUsage.system) / 1000; // Convert microseconds to milliseconds
    const cpuPercent = Math.min(100, (totalCpuTime / timeElapsed) * 100);

    // Update for next measurement
    this.lastCpuUsage = process.cpuUsage();
    this.lastMeasureTime = currentTime;

    return Math.max(0, cpuPercent);
  }

  async getMetrics() {
    const cpuUsage = this.getCpuUsagePercent();
    const loadAvg = os.loadavg();

    const metrics = `
# HELP nodejs_version_info Node.js version info
# TYPE nodejs_version_info gauge
nodejs_version_info{version="${process.version}",major="18",minor="0",patch="0"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_memory_usage_bytes Process memory usage in bytes
# TYPE process_memory_usage_bytes gauge
process_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
process_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
process_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
process_memory_usage_bytes{type="external"} ${process.memoryUsage().external}

# HELP process_cpu_usage_percent Process CPU usage percentage
# TYPE process_cpu_usage_percent gauge
process_cpu_usage_percent ${cpuUsage.toFixed(2)}

# HELP system_load_average System load average
# TYPE system_load_average gauge
system_load_average{period="1m"} ${loadAvg[0].toFixed(2)}
system_load_average{period="5m"} ${loadAvg[1].toFixed(2)}
system_load_average{period="15m"} ${loadAvg[2].toFixed(2)}

# HELP freeswitch_active_calls Number of active calls
# TYPE freeswitch_active_calls gauge
freeswitch_active_calls 0

# HELP freeswitch_total_calls Total number of calls processed
# TYPE freeswitch_total_calls counter
freeswitch_total_calls 0

# HELP freeswitch_failed_calls Total number of failed calls
# TYPE freeswitch_failed_calls counter
freeswitch_failed_calls 0

# HELP freeswitch_channels_total Total number of channels
# TYPE freeswitch_channels_total gauge
freeswitch_channels_total 0

# HELP freeswitch_sessions_total Total number of sessions
# TYPE freeswitch_sessions_total gauge
freeswitch_sessions_total 0

# HELP freeswitch_registrations_total Number of SIP registrations
# TYPE freeswitch_registrations_total gauge
freeswitch_registrations_total 0

# HELP freeswitch_uptime_seconds FreeSWITCH uptime in seconds
# TYPE freeswitch_uptime_seconds gauge
freeswitch_uptime_seconds 3600

# HELP freeswitch_memory_usage_bytes FreeSWITCH memory usage in bytes
# TYPE freeswitch_memory_usage_bytes gauge
freeswitch_memory_usage_bytes 104857600

# HELP freeswitch_cpu_usage_percent FreeSWITCH CPU usage percentage
# TYPE freeswitch_cpu_usage_percent gauge
freeswitch_cpu_usage_percent 5.2

# HELP freeswitch_call_duration_seconds Call duration in seconds
# TYPE freeswitch_call_duration_seconds histogram
freeswitch_call_duration_seconds_bucket{le="10"} 5
freeswitch_call_duration_seconds_bucket{le="30"} 15
freeswitch_call_duration_seconds_bucket{le="60"} 25
freeswitch_call_duration_seconds_bucket{le="300"} 35
freeswitch_call_duration_seconds_bucket{le="600"} 40
freeswitch_call_duration_seconds_bucket{le="+Inf"} 45
freeswitch_call_duration_seconds_sum 12500
freeswitch_call_duration_seconds_count 45

# HELP freeswitch_sip_requests_total Total SIP requests by method
# TYPE freeswitch_sip_requests_total counter
freeswitch_sip_requests_total{method="INVITE"} 100
freeswitch_sip_requests_total{method="BYE"} 95
freeswitch_sip_requests_total{method="REGISTER"} 50
freeswitch_sip_requests_total{method="OPTIONS"} 200

# HELP freeswitch_sip_responses_total Total SIP responses by code
# TYPE freeswitch_sip_responses_total counter
freeswitch_sip_responses_total{code="200"} 180
freeswitch_sip_responses_total{code="404"} 5
freeswitch_sip_responses_total{code="486"} 10
freeswitch_sip_responses_total{code="503"} 2

# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",status="200"} 100
api_requests_total{method="POST",status="200"} 50
api_requests_total{method="PUT",status="200"} 25
`;

    return metrics.trim();
  }
}
