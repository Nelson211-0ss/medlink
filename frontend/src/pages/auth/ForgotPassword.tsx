import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthShell } from './AuthShell';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/input';
import { Spinner } from '@/components/ui/misc';
import { useForgotPassword } from '@/hooks/useAuth';
import { apiError } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgot.mutateAsync(email);
      setSent(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a secure reset link">
      {sent ? (
        <div className="rounded-lg border bg-muted/50 p-4 text-sm">
          If an account exists for <span className="font-medium">{email}</span>, a reset link is on
          its way. Check MailHog at <span className="font-medium">http://localhost:8025</span> in
          development.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending && <Spinner />} Send reset link
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
