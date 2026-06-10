import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminOrganizationsPanel } from '@/components/admin/AdminOrganizationsPanel';

export default function AdminOrganizations() {
  return (
    <AdminPageShell
      title="Organizations"
      description="Browse every facility account with contacts, location, and verification details."
    >
      <AdminOrganizationsPanel />
    </AdminPageShell>
  );
}
