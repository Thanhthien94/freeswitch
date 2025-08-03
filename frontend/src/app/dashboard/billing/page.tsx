import { Metadata } from 'next';
import { BillingPage } from '@/components/billing/BillingPage';

export const metadata: Metadata = {
  title: 'Billing & Invoicing | FreeSWITCH PBX',
  description: 'Billing management and invoice generation for FreeSWITCH PBX system',
};

export default function BillingPageRoute() {
  return <BillingPage />;
}
