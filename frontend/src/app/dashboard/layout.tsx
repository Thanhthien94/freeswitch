import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ProtectedPage } from '@/components/auth/UnifiedAuthGuard';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedPage>
      <DashboardLayout>{children}</DashboardLayout>
    </ProtectedPage>
  );
}
