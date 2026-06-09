import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Stethoscope, Building2 } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/input';
import { Spinner } from '@/components/ui/misc';
import { cn } from '@/lib/utils';
import { useRegister } from '@/hooks/useAuth';
import { apiError } from '@/lib/api';

const schema = z
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
type Form = z.infer<typeof schema>;

const professions = ['nurse', 'doctor', 'pharmacist', 'lab_technician', 'radiographer', 'midwife', 'physiotherapist', 'caregiver'];

export default function Register() {
  const [role, setRole] = useState<'professional' | 'organization'>('professional');
  const registerMut = useRegister();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { role: 'professional' } });

  const pickRole = (r: 'professional' | 'organization') => {
    setRole(r);
    setValue('role', r);
  };

  const onSubmit = async (values: Form) => {
    try {
      await registerMut.mutateAsync(values);
      toast.success('Account created! Check your email to verify.');
      navigate('/dashboard');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Join the healthcare workforce marketplace">
      <div className="mb-5 grid grid-cols-2 gap-3">
        {([
          { id: 'professional', label: 'Professional', icon: Stethoscope },
          { id: 'organization', label: 'Organization', icon: Building2 },
        ] as const).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => pickRole(opt.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border p-4 text-sm font-medium transition-colors',
              role === opt.id ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-accent',
            )}
          >
            <opt.icon className="h-5 w-5" />
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
          </div>
        </div>

        {role === 'organization' ? (
          <div className="space-y-1.5">
            <Label htmlFor="organizationName">Organization name</Label>
            <Input id="organizationName" {...register('organizationName')} />
            {errors.organizationName && (
              <p className="text-xs text-destructive">{errors.organizationName.message}</p>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="profession">Profession</Label>
            <Select id="profession" {...register('profession')}>
              {professions.map((p) => (
                <option key={p} value={p}>
                  {p.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={registerMut.isPending}>
          {registerMut.isPending && <Spinner />} Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
