import { Metadata } from 'next';
import FreeSwitchConfigPanel from '@/components/config/FreeSwitchConfigPanel';

export const metadata: Metadata = {
  title: 'FreeSWITCH Configuration | PBX Management',
  description: 'Configure FreeSWITCH network, SIP, and security settings',
};

export default function ConfigPage() {
  return (
    <div className="container mx-auto py-6">
      <FreeSwitchConfigPanel />
    </div>
  );
}
