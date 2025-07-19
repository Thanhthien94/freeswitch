import { LoginForm } from '@/components/auth/LoginForm';
import { PublicPage } from '@/components/auth/AuthGuard';

export default function LoginPage() {
  return (
    <PublicPage>
      <LoginForm />
    </PublicPage>
  );
}
