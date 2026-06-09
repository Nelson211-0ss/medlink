import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/ui/misc';
import { titleCase } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  audience: string;
  features: string[];
}

export default function Billing() {
  const user = useAuthStore((s) => s.user)!;

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: async () => (await api.get<ApiEnvelope<Plan[]>>('/subscriptions/plans')).data.data,
  });
  const { data: current } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => (await api.get<ApiEnvelope<{ plan: string; status: string }>>('/subscriptions/me')).data.data,
  });

  const checkout = useMutation({
    mutationFn: async (plan: string) => (await api.post<ApiEnvelope<{ url: string }>>('/subscriptions/checkout', { plan })).data.data,
    onSuccess: (d) => {
      if (d.url) window.location.href = d.url;
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (isLoading) return <PageLoader />;

  const visible = plans?.filter((p) => p.audience === user.role || p.id === 'free') ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & plans</h1>
        <p className="text-muted-foreground">
          Current plan: <Badge variant="secondary">{titleCase(current?.plan ?? 'free')}</Badge>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {visible.map((plan) => {
          const isCurrent = current?.plan === plan.id;
          return (
            <Card key={plan.id} className={isCurrent ? 'border-primary ring-1 ring-primary' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <Badge>Current</Badge>}
                </CardTitle>
                <p className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-secondary" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.id === 'free' ? 'outline' : 'default'}
                  disabled={isCurrent || plan.id === 'free' || checkout.isPending}
                  onClick={() => checkout.mutate(plan.id)}
                >
                  {isCurrent ? 'Active' : plan.id === 'free' ? 'Free' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
