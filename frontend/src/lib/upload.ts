import { api, ApiEnvelope } from './api';
import { AuthUser } from '@/store/auth';

export async function uploadAvatar(file: File): Promise<{ url: string; user: AuthUser }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiEnvelope<{ url: string; user: AuthUser }>>('/files/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export async function uploadOrgLogo(file: File): Promise<{ url: string; organization: Record<string, unknown> }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiEnvelope<{ url: string; organization: Record<string, unknown> }>>(
    '/files/logo',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data.data;
}
