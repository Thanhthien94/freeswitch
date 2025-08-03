import { Metadata } from 'next';
import { SystemStatusPage } from '@/components/status/SystemStatusPage';

export const metadata: Metadata = {
  title: 'System Status | FreeSWITCH PBX',
  description: 'Real-time system status and health monitoring for FreeSWITCH PBX',
};

export default function StatusPageRoute() {
  return <SystemStatusPage />;
}
