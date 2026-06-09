import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { startOAuth } from '@/lib/oauth';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C4.79 15.25 5.51 7.59 11.68 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.16 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

interface SocialAuthButtonsProps {
  mode?: 'login' | 'signup';
  className?: string;
}

export function SocialAuthButtons({ mode = 'login', className }: SocialAuthButtonsProps) {
  const handleOAuth = (provider: 'google' | 'apple') => {
    try {
      startOAuth(provider, mode);
    } catch {
      toast.error('Unable to start social sign-in. Please try email instead.');
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <button
        type="button"
        onClick={() => handleOAuth('google')}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
      >
        <GoogleIcon className="h-5 w-5" />
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => handleOAuth('apple')}
        className="flex h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-900 bg-slate-900 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
      >
        <AppleIcon className="h-5 w-5" />
        Continue with Apple
      </button>
    </div>
  );
}

export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center text-xs font-medium uppercase tracking-wide">
        <span className="bg-white px-3 text-slate-400">or use email</span>
      </div>
    </div>
  );
}
