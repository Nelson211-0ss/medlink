import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function statusVariant(status: string) {
  if (status === 'active') return 'default' as const;
  if (status === 'suspended' || status === 'deactivated') return 'destructive' as const;
  return 'secondary' as const;
}

export function verificationVariant(status?: string | null) {
  if (status === 'verified') return 'default' as const;
  if (status === 'rejected') return 'destructive' as const;
  return 'secondary' as const;
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusVariant(status)} className="rounded-md px-1.5 py-0 text-[10px] font-semibold capitalize">
      {status}
    </Badge>
  );
}

export function VerificationBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return (
    <Badge
      variant={verificationVariant(status)}
      className="rounded-md px-1.5 py-0 text-[10px] font-semibold capitalize"
    >
      {status}
    </Badge>
  );
}

export function DetailCell({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div className="admin-detail-cell">
      <p className="admin-detail-label">{label}</p>
      <p className="admin-detail-value">{value}</p>
    </div>
  );
}

export function AdminPagination({
  page,
  totalPages,
  isFetching,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1 || isFetching}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
