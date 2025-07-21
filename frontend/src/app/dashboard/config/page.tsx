import { Metadata } from 'next';
import ProfessionalConfigPanel from '@/components/config/ProfessionalConfigPanel';

export const metadata: Metadata = {
  title: 'Configuration Management | Professional PBX',
  description: 'Manage system configurations with professional controls, audit trails, and security',
};

export default function ConfigPage() {
  return (
    <ProfessionalConfigPanel />
  );
}
