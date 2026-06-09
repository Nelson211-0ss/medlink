import { ApplicationRepository } from '../repositories/application.repository';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { JobRepository } from '../repositories/job.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { UserRepository } from '../repositories/user.repository';
import { MatchingService } from './matching.service';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { APPLICATION_STAGES, NOTIFICATION_TYPES } from '../utils/constants';

export class ApplicationService {
  constructor(
    private applications: ApplicationRepository,
    private professionals: ProfessionalRepository,
    private jobs: JobRepository,
    private organizations: OrganizationRepository,
    private users: UserRepository,
    private matching: MatchingService,
    private notifications: NotificationService,
    private email: EmailService,
  ) {}

  async apply(userId: string, jobId: string, data: { coverLetter?: string; cvUrl?: string }) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new ForbiddenError('Professional profile required');
    const job = await this.jobs.findById(jobId);
    if (!job || job.status !== 'open') throw new NotFoundError('Job not available');

    const existing = await this.applications.findByJobAndProfessional(jobId, profile.id);
    if (existing) throw new BadRequestError('You have already applied to this job');

    const { matchScore } = this.matching.score(job, profile);
    const application = await this.applications.insert({
      job_id: jobId,
      professional_id: profile.id,
      cover_letter: data.coverLetter ?? null,
      cv_url: data.cvUrl ?? profile.cv_url ?? null,
      match_score: matchScore,
    });

    const org = await this.organizations.findById(job.organization_id);
    if (org) {
      await this.notifications.notify({
        userId: org.user_id,
        type: NOTIFICATION_TYPES.APPLICATION_UPDATE,
        title: 'New application received',
        body: `A candidate applied to "${job.title}"`,
        data: { jobId, applicationId: application.id },
      });
    }
    return application;
  }

  async listMine(userId: string) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new ForbiddenError('Professional profile required');
    return this.applications.listForProfessional(profile.id);
  }

  async listForJob(userId: string, jobId: string) {
    const job = await this.jobs.findById(jobId);
    if (!job) throw new NotFoundError('Job not found');
    const org = await this.organizations.findByUserId(userId);
    if (!org || org.id !== job.organization_id) throw new ForbiddenError();
    return this.applications.listForJob(jobId);
  }

  async updateStage(userId: string, applicationId: string, stage: string) {
    if (!APPLICATION_STAGES.includes(stage as never)) {
      throw new BadRequestError('Invalid application stage');
    }
    const application = await this.applications.findById(applicationId);
    if (!application) throw new NotFoundError('Application not found');
    const job = await this.jobs.findById(application.job_id);
    const org = job && (await this.organizations.findByUserId(userId));
    if (!job || !org || org.id !== job.organization_id) throw new ForbiddenError();

    const updated = await this.applications.update(applicationId, { stage });

    const profile = await this.professionals.findById(application.professional_id);
    if (profile) {
      const candidate = await this.users.findById(profile.user_id);
      await this.notifications.notify({
        userId: profile.user_id,
        type: NOTIFICATION_TYPES.APPLICATION_UPDATE,
        title: 'Application update',
        body: `Your application for "${job.title}" is now ${stage}`,
        data: { jobId: job.id, applicationId },
      });
      if (candidate) {
        await this.email.sendApplicationUpdate(candidate.email, candidate.first_name, job.title, stage);
      }
    }
    return updated;
  }

  async pipeline(userId: string) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new ForbiddenError('Organization profile required');
    const counts = await this.applications.pipelineForOrganization(org.id);
    return APPLICATION_STAGES.reduce<Record<string, number>>((acc, stage) => {
      acc[stage] = counts[stage] ?? 0;
      return acc;
    }, {});
  }
}
