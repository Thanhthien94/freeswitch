import { Metadata } from 'next';
import { NetworkConfigPage } from '@/components/freeswitch/network-config/NetworkConfigPage';

export const metadata: Metadata = {
  title: 'Cấu hình mạng toàn cục | FreeSWITCH PBX',
  description: 'Quản lý cấu hình mạng tập trung cho hệ thống FreeSWITCH PBX',
};

export default function NetworkConfigPageRoute() {
  return <NetworkConfigPage />;
}
