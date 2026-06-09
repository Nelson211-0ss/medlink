import { query } from '../database/pool';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { OrganizationRepository } from '../repositories/organization.repository';
import { ApplicationRepository } from '../repositories/application.repository';
import { MatchRepository } from '../repositories/match.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { MatchingService } from './matching.service';
import { ForbiddenError } from '../utils/errors';
import { APPLICATION_STAGES } from '../utils/constants';

export class DashboardService {
  constructor(
    private professionals: ProfessionalRepository,
    private organizations: OrganizationRepository,
    private applications: ApplicationRepository,
    private matches: MatchRepository,
    private notifications: NotificationRepository,
    private matching: MatchingService,
  ) {}

  async professionalOverview(userId: string) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new ForbiddenError('Professional profile required');

    const [apps, recommended, savedJobs, invitations] = await Promise.all([
      this.applications.listForProfessional(profile.id),
      this.matching.jobsForProfessional(profile.id, 6),
      query<{ count: string }>('SELECT COUNT(*)::text AS count FROM saved_jobs WHERE professional_id = $1', [profile.id]),
      query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM invitations WHERE professional_id = $1 AND status = 'pending'`, [profile.id]),
    ]);

    const applicationPipeline = APPLICATION_STAGES.reduce<Record<string, number>>((acc, stage) => {
      acc[stage] = apps.filter((a) => a.stage === stage).length;
      return acc;
    }, {});

    const activeApplications = apps.filter((a) => !['hired', 'rejected'].includes(a.stage)).length;
    const offersReceived = apps.filter((a) => ['offer', 'hired'].includes(a.stage)).length;

    return {
      profileCompletion: profile.profile_completion,
      verificationStatus: profile.verification_status,
      applications: apps.length,
      applicationPipeline,
      activeApplications,
      offersReceived,
      recommendedJobs: recommended,
      savedJobs: Number(savedJobs.rows[0]?.count ?? 0),
      invitations: Number(invitations.rows[0]?.count ?? 0),
      unreadNotifications: await this.notifications.unreadCount(userId),
    };
  }

  async organizationOverview(userId: string) {
    const org = await this.organizations.findByUserId(userId);
    if (!org) throw new ForbiddenError('Organization profile required');

    const [jobs, allJobs, applicationsCount, profileViews, matchCount, pipelineRaw] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM jobs WHERE organization_id = $1 AND status = 'open'`, [org.id]),
      query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM jobs WHERE organization_id = $1`, [org.id]),
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.organization_id = $1`,
        [org.id],
      ),
      query<{ sum: string }>('SELECT COALESCE(SUM(views_count),0)::text AS sum FROM jobs WHERE organization_id = $1', [org.id]),
      this.matches.countMatchesForOrganization(org.id),
      this.applications.pipelineForOrganization(org.id),
    ]);

    const pipeline = APPLICATION_STAGES.reduce<Record<string, number>>((acc, s) => {
      acc[s] = pipelineRaw[s] ?? 0;
      return acc;
    }, {});

    const openJobs = Number(jobs.rows[0]?.count ?? 0);
    const totalJobsPosted = Number(allJobs.rows[0]?.count ?? 0);
    const applications = Number(applicationsCount.rows[0]?.count ?? 0);

    return {
      verificationStatus: org.verification_status,
      totalJobs: openJobs,
      totalJobsPosted,
      closedJobs: Math.max(totalJobsPosted - openJobs, 0),
      applications,
      avgApplicationsPerJob: totalJobsPosted > 0 ? Math.round(applications / totalJobsPosted) : 0,
      candidateMatches: matchCount,
      profileViews: Number(profileViews.rows[0]?.sum ?? 0),
      pipeline,
      unreadNotifications: await this.notifications.unreadCount(userId),
    };
  }
}
