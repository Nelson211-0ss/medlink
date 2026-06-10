import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Building2, Search } from 'lucide-react';
import { api, ApiEnvelope, apiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLoader } from '@/components/ui/misc';
import { AdminPagination } from '@/components/admin/admin-shared';
import { OrganizationAccountCard } from '@/components/admin/OrganizationAccountCard';
import { useAuthStore } from '@/store/auth';
import type { AdminOrganizationUser } from '@/types/admin';

export function AdminOrganizationsPanel() {
  const qc = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', 'organization', query, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '12', role: 'organization' });
      if (query) params.set('q', query);
      const res = await api.get<ApiEnvelope<AdminOrganizationUser[]>>(`/admin/users?${params}`);
      return { users: res.data.data, meta: res.data.meta };
    },
  });

  const remove = useMutation({
    mutationFn: async (user: AdminOrganizationUser) => {
      await api.delete(`/admin/users/${user.id}`);
    },
    onSuccess: () => {
      toast.success('Organization account deleted');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (e) => toast.error(apiError(e)),
  });

  const users = data?.users ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search.trim());
  };

  const handleDelete = (user: AdminOrganizationUser) => {
    const name = user.organizationName || `${user.firstName} ${user.lastName}`.trim() || user.email;
    const confirmed = window.confirm(
      `Delete organization account for ${name}?\n\nThis permanently removes the facility profile, job posts, and related data.`,
    );
    if (confirmed) remove.mutate(user);
  };

  return (
    <div className="admin-list-shell">
      <div className="admin-list-toolbar">
        <div className="admin-list-toolbar-top">
          <div className="admin-list-count">
            <span className="admin-list-count-icon">
              <Building2 className="h-4 w-4" />
            </span>
            <span>
              {meta ? `${meta.total} organization${meta.total === 1 ? '' : 's'}` : 'Loading…'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSearch} className="admin-search-form">
          <div className="admin-search-input-wrap">
            <Search className="admin-search-icon" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search facility name, contact, or email"
              className="admin-search-input"
            />
          </div>
          <Button type="submit" size="sm" className="admin-search-btn">
            Search
          </Button>
        </form>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : users.length === 0 ? (
        <div className="admin-list-empty">No organizations found.</div>
      ) : (
        <div className="admin-account-list">
          {users.map((user) => (
            <OrganizationAccountCard
              key={user.id}
              user={user}
              isSelf={user.id === currentUserId}
              deleting={remove.isPending}
              onDelete={() => handleDelete(user)}
            />
          ))}
        </div>
      )}

      <AdminPagination
        page={meta?.page ?? page}
        totalPages={totalPages}
        isFetching={isFetching}
        onPageChange={setPage}
      />
    </div>
  );
}
