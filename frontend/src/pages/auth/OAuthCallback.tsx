import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { api, ApiEnvelope } from '@/lib/api';
import { useAuthStore, AuthUser } from '@/store/auth';
import { PageLoader } from '@/components/ui/misc';

interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const error = params.get('error');
    if (error) {
      const messages: Record<string, string> = {
        oauth_unavailable: 'Social sign-in is not configured yet. Please use your email.',
        oauth_denied: 'Sign-in was cancelled.',
        oauth_failed: 'Social sign-in failed. Please try again or use email.',
      };
      toast.error(messages[error] ?? 'Sign-in failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    if (params.get('success') !== '1') {
      toast.error('Invalid sign-in response.');
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        const { data } = await api.post<ApiEnvelope<AuthResult>>('/auth/refresh', {});
        const payload = data.data;
        if (!payload?.accessToken || !payload?.user) {
          throw new Error('Missing session');
        }
        setAuth(payload.user, payload.accessToken);
        toast.success('Welcome to MediLink!');
        navigate('/dashboard', { replace: true });
      } catch {
        toast.error('Could not complete sign-in. Please try again.');
        navigate('/login', { replace: true });
      }
    })();
  }, [navigate, params, setAuth]);

  return <PageLoader />;
}
