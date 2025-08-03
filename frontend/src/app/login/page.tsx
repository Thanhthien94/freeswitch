import { LoginForm } from '@/components/auth/LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  // Server-side auth check
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return <LoginForm />;
}
