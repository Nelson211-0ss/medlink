import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, apiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

interface JobApplyButtonProps {
  jobId: string;
  closed?: boolean;
  applied?: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  onApplied?: () => void;
}

export function JobApplyButton({
  jobId,
  closed,
  applied,
  size = 'sm',
  className,
  onApplied,
}: JobApplyButtonProps) {
  const qc = useQueryClient();

  const apply = useMutation({
    mutationFn: async () => (await api.post(`/jobs/${jobId}/apply`, {})).data,
    onSuccess: () => {
      toast.success('Application submitted!');
      qc.invalidateQueries({ queryKey: ['applications'] });
      onApplied?.();
    },
    onError: (e) => toast.error(apiError(e)),
  });

  if (closed) {
    return (
      <Button size={size} variant="outline" disabled className={cn('shrink-0', className)}>
        Closed
      </Button>
    );
  }

  if (applied) {
    return (
      <Button size={size} variant="outline" disabled className={cn('shrink-0', className)}>
        Applied
      </Button>
    );
  }

  return (
    <Button
      size={size}
      className={cn('shrink-0', className)}
      disabled={apply.isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        apply.mutate();
      }}
    >
      {apply.isPending && <Spinner />}
      Apply Now
    </Button>
  );
}
