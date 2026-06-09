import { JobRepository, JobWithOrganization } from '../repositories/job.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { SearchService } from './search.service';
import { FileService } from './file.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { ROLES } from '../utils/constants';
import { PaginationParams } from '../utils/pagination';
import { JobRow } from '../types/entities';

export class JobService {
  constructor(
    private jobs: JobRepository,
    private organizations: OrganizationRepository,
    private search: SearchService,
    private files: FileService,
  ) {}

  private async enrichJob(job: JobWithOrganization) {
    return {
      ...job,
      organization_logo: await this.files.resolveUrl(job.organization_logo),
    };
  }

  private async enrichJobs(jobs: JobWithOrganization[]) {
    return Promise.all(jobs.map((job) => this.enrichJob(job)));
  }

  private normalizeJobPayload(data: Record<string, unknown>) {
    const payload = { ...data };
    if (payload.expires_at === '' || payload.expires_at === null) {
      payload.expires_at = null;
    } else if (typeof payload.expires_at === 'string') {
      const raw = payload.expires_at;
      const endOfDay = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(`${raw}T23:59:59.999Z`)
        : new Date(raw);
      if (!Number.isNaN(endOfDay.getTime())) {
        payload.expires_at = endOfDay.toISOString();
      }
    }
    return payload;
  }

  async create(userId: string, data: Record<string, unknown>) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new ForbiddenError('Only organizations can post jobs');
    const job = await this.jobs.insert({
      ...this.normalizeJobPayload(data),
      organization_id: org.id,
    });
    await this.search.indexJob(job, org.organization_name);
    return job;
  }

  async list(
    p: PaginationParams,
    filters: { profession?: string; country?: string; q?: string },
    userId?: string,
    role?: string,
  ) {
    if (role === ROLES.ORGANIZATION && userId) {
      const org = await this.organizations.findByUserId(userId);
      if (!org) throw new ForbiddenError('Organization profile required');
      const rows = await this.jobs.listByOrganization(org.id, filters);
      return { rows: await this.enrichJobs(rows), total: rows.length };
    }
    const { rows, total } = await this.jobs.listOpen(p, filters);
    return { rows: await this.enrichJobs(rows), total };
  }

  async getById(id: string, opts: { incrementViews?: boolean } = {}) {
    const job = await this.jobs.findByIdWithOrganization(id);
    if (!job) throw new NotFoundError('Job not found');
    if (opts.incrementViews) await this.jobs.incrementViews(id);
    return this.enrichJob(job);
  }

  async listForOrganization(
    userId: string,
    filters: { profession?: string; country?: string; q?: string } = {},
  ) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new ForbiddenError('Organization profile required');
    const rows = await this.jobs.listByOrganization(org.id, filters);
    return this.enrichJobs(rows);
  }

  private async assertOwner(userId: string, jobId: string): Promise<JobRow> {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    const org = await this.organizations.findByUserId(userId);
    if (!org || org.id !== job.organization_id) {
      throw new ForbiddenError('You do not own this job');
    }
    return job;
  }

  async update(userId: string, jobId: string, data: Record<string, unknown>) {
    await this.assertOwner(userId, jobId);
    const updated = (await this.jobs.update(jobId, this.normalizeJobPayload(data))) as JobRow;
    const org = await this.organizations.findById(updated.organization_id);
    if (org) await this.search.indexJob(updated, org.organization_name);
    return updated;
  }

  async remove(userId: string, jobId: string) {
    await this.assertOwner(userId, jobId);
    await this.jobs.deleteById(jobId);
    await this.search.removeJob(jobId);
    return { deleted: true };
  }
}
