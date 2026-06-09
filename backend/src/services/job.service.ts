import { JobRepository } from '../repositories/job.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { SearchService } from './search.service';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { PaginationParams } from '../utils/pagination';
import { JobRow } from '../types/entities';

export class JobService {
  constructor(
    private jobs: JobRepository,
    private organizations: OrganizationRepository,
    private search: SearchService,
  ) {}

  async create(userId: string, data: Record<string, unknown>) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new ForbiddenError('Only organizations can post jobs');
    const job = await this.jobs.insert({ ...data, organization_id: org.id });
    await this.search.indexJob(job, org.organization_name);
    return job;
  }

  async list(p: PaginationParams, filters: { profession?: string; country?: string; q?: string }) {
    return this.jobs.listOpen(p, filters);
  }

  async getById(id: string, opts: { incrementViews?: boolean } = {}): Promise<JobRow> {
    const job = await this.jobs.findById(id);
    if (!job) throw new NotFoundError('Job not found');
    if (opts.incrementViews) await this.jobs.incrementViews(id);
    return job;
  }

  async listForOrganization(userId: string) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new ForbiddenError('Organization profile required');
    return this.jobs.listByOrganization(org.id);
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
    const updated = (await this.jobs.update(jobId, data)) as JobRow;
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
