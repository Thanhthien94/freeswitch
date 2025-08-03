import { Metadata } from 'next';
import { AnalyticsPage } from '@/components/analytics/AnalyticsPage';

export const metadata: Metadata = {
  title: 'Call Analytics | FreeSWITCH PBX',
  description: 'Advanced call analytics and reporting for FreeSWITCH PBX system',
};

export default function AnalyticsPageRoute() {
  return <AnalyticsPage />;
}
