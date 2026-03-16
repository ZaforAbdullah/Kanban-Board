import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '@/lib/auth';

// Root route: redirect based on auth state
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/boards');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
