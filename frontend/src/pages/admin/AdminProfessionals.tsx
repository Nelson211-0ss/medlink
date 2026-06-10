import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminProfessionalsPanel } from '@/components/admin/AdminProfessionalsPanel';

export default function AdminProfessionals() {
  return (
    <AdminPageShell
      title="Professionals"
      description="Browse every healthcare professional account with full profile details."
    >
      <AdminProfessionalsPanel />
    </AdminPageShell>
  );
}
