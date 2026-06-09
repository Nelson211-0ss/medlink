import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Building2, Eye, EyeOff, Lock, Mail, Stethoscope } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { Spinner } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { useLogin, useRegister } from '@/hooks/useAuth';
import { apiError } from '@/lib/api';
import { AuthDivider, SocialAuthButtons } from '@/components/auth/SocialAuthButtons';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    firstName: z.string().min(1, 'Required'),
    lastName: z.string().min(1, 'Required'),
    email: z.string().email('Enter a valid email'),
    password: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'One uppercase letter')
      .regex(/[a-z]/, 'One lowercase letter')
      .regex(/[0-9]/, 'One number'),
    role: z.enum(['professional', 'organization']),
    organizationName: z.string().optional(),
    profession: z.string().optional(),
  })
  .refine((d) => d.role !== 'organization' || !!d.organizationName, {
    message: 'Organization name is required',
    path: ['organizationName'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

const professions = [
  'nurse',
  'doctor',
  'pharmacist',
  'lab_technician',
  'radiographer',
  'midwife',
  'physiotherapist',
  'caregiver',
];

export default function AuthPanel() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignUp = location.pathname === '/register';

  const setMode = (signUp: boolean) => {
    navigate(signUp ? '/register' : '/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile header */}
      <div className="border-b border-slate-100 px-6 py-5 lg:hidden">
        <div className="mb-4 flex justify-center">
          <Link to="/">
            <Logo size="lg" />
          </Link>
        </div>
        <div className="mx-auto flex w-fit gap-2 rounded-full bg-slate-100 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode(false)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              !isSignUp ? 'bg-white text-primary shadow-sm' : 'text-slate-500',
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode(true)}
            className={cn(
              'rounded-full px-4 py-1.5 transition-colors',
              isSignUp ? 'bg-white text-primary shadow-sm' : 'text-slate-500',
            )}
          >
            Sign up
          </button>
        </div>
      </div>

      {/* Desktop split panel */}
      <div className={cn('auth-split', isSignUp && 'auth-split--signup')}>
        <div className="auth-form-container auth-sign-in">
          <SignInForm />
        </div>
        <div className="auth-form-container auth-sign-up">
          <SignUpForm />
        </div>

        <div className="auth-overlay-container">
          <div className="auth-overlay">
            <div className="auth-overlay-panel auth-overlay-left">
              <h2 className="text-3xl font-bold">Welcome back!</h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/90">
                To stay connected with healthcare opportunities, please sign in with your personal
                details
              </p>
              <button type="button" className="auth-ghost-btn" onClick={() => setMode(false)}>
                Sign in
              </button>
            </div>
            <div className="auth-overlay-panel auth-overlay-right">
              <h2 className="text-3xl font-bold">Hello, Friend!</h2>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/90">
                Enter your personal details and start your journey with MediLink
              </p>
              <button type="button" className="auth-ghost-btn" onClick={() => setMode(true)}>
                Sign up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile forms */}
      <div className="px-6 py-8 lg:hidden">
        {isSignUp ? <SignUpForm mobile /> : <SignInForm mobile />}
      </div>
    </div>
  );
}

function FormShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="w-full max-w-[340px]">
      <div className="mb-8 hidden justify-center lg:flex">
        <Link to="/">
          <Logo size="lg" />
        </Link>
      </div>
      <h1 className="text-center text-2xl font-bold text-primary">{title}</h1>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function AuthField({
  icon: Icon,
  error,
  right,
  className,
  ...inputProps
}: {
  icon: React.ElementType;
  error?: string;
  right?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          className={cn(
            'flex h-11 w-full rounded-lg border-0 bg-slate-100 px-10 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
            right && 'pr-10',
            className,
          )}
          {...inputProps}
        />
        {right}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SignInForm({ mobile }: { mobile?: boolean }) {
  const login = useLogin();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginForm) => {
    try {
      await login.mutateAsync(values);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  if (mobile) {
    return (
      <div className="mx-auto max-w-[340px]">
        <h1 className="mb-6 text-center text-2xl font-bold text-primary">Sign in to MediLink</h1>
        <SocialAuthButtons mode="login" />
        <AuthDivider />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          icon={Mail}
          id="email"
          type="email"
          placeholder="Email"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          icon={Lock}
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          error={errors.password?.message}
          {...register('password')}
          right={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <div className="text-center">
          <Link to="/forgot-password" className="text-xs text-slate-500 underline hover:text-primary">
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" className="h-11 w-full rounded-full uppercase tracking-wide" disabled={login.isPending}>
          {login.isPending ? <Spinner /> : 'Sign in'}
        </Button>
        </form>
      </div>
    );
  }

  return (
    <FormShell title="Sign in to MediLink">
      <SocialAuthButtons mode="login" />
      <AuthDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AuthField
          icon={Mail}
          id="email"
          type="email"
          placeholder="Email"
          error={errors.email?.message}
          {...register('email')}
        />
        <AuthField
          icon={Lock}
          id="password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          error={errors.password?.message}
          {...register('password')}
          right={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <div className="text-center">
          <Link to="/forgot-password" className="text-xs text-slate-500 underline hover:text-primary">
            Forgot your password?
          </Link>
        </div>
        <Button type="submit" className="h-11 w-full rounded-full uppercase tracking-wide" disabled={login.isPending}>
          {login.isPending ? <Spinner /> : 'Sign in'}
        </Button>
      </form>
    </FormShell>
  );
}

function SignUpForm({ mobile }: { mobile?: boolean }) {
  const [role, setRole] = useState<'professional' | 'organization'>('professional');
  const registerMut = useRegister();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'professional' },
  });

  const pickRole = (r: 'professional' | 'organization') => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (values: RegisterForm) => {
    try {
      await registerMut.mutateAsync(values);
      toast.success('Account created! Check your email to verify.');
      navigate('/dashboard');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const formBody = (
    <>
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(
          [
            { id: 'professional' as const, label: 'Professional', icon: Stethoscope },
            { id: 'organization' as const, label: 'Organization', icon: Building2 },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => pickRole(opt.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors',
              role === opt.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50',
            )}
          >
            <opt.icon className="h-4 w-4" />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <input
            placeholder="First name"
            className="flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            {...register('firstName')}
          />
          {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
        </div>
        <div className="space-y-1">
          <input
            placeholder="Last name"
            className="flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            {...register('lastName')}
          />
          {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
        </div>
      </div>

      {role === 'organization' ? (
        <div className="space-y-1">
          <input
            placeholder="Organization name"
            className="flex h-11 w-full rounded-lg border-0 bg-slate-100 px-3 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            {...register('organizationName')}
          />
          {errors.organizationName && (
            <p className="text-xs text-destructive">{errors.organizationName.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          <Select
            className="h-11 border-0 bg-slate-100"
            {...register('profession')}
          >
            {professions.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, ' ')}
              </option>
            ))}
          </Select>
        </div>
      )}

      <AuthField
        icon={Mail}
        id="email"
        type="email"
        placeholder="Email"
        error={errors.email?.message}
        {...register('email')}
      />
      <AuthField
        icon={Lock}
        id="password"
        type="password"
        placeholder="Password"
        error={errors.password?.message}
        {...register('password')}
      />

      <Button type="submit" className="h-11 w-full rounded-full uppercase tracking-wide" disabled={registerMut.isPending}>
        {registerMut.isPending ? <Spinner /> : 'Sign up'}
      </Button>
    </>
  );

  if (mobile) {
    return (
      <div className="mx-auto max-w-[340px]">
        <h1 className="mb-6 text-center text-2xl font-bold text-primary">Create your account</h1>
        <SocialAuthButtons mode="signup" />
        <AuthDivider />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {formBody}
        </form>
      </div>
    );
  }

  return (
    <FormShell title="Create your account">
      <SocialAuthButtons mode="signup" />
      <AuthDivider />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {formBody}
      </form>
    </FormShell>
  );
}
