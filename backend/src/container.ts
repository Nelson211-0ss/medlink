/**
 * Lightweight dependency-injection container.
 * Repositories and services are instantiated once and shared. Controllers and
 * sockets resolve their collaborators from here, keeping wiring in one place.
 */
import { UserRepository } from './repositories/user.repository';
import { TokenRepository } from './repositories/token.repository';
import { ProfessionalRepository } from './repositories/professional.repository';
import { OrganizationRepository } from './repositories/organization.repository';
import { JobRepository } from './repositories/job.repository';
import { ApplicationRepository } from './repositories/application.repository';
import { MatchRepository } from './repositories/match.repository';
import { SavedRepository } from './repositories/saved.repository';
import { MessageRepository } from './repositories/message.repository';
import { NotificationRepository } from './repositories/notification.repository';
import { SubscriptionRepository } from './repositories/subscription.repository';
import { AuditRepository } from './repositories/audit.repository';

import { EmailService } from './services/email.service';
import { AuthService } from './services/auth.service';
import { SearchService } from './services/search.service';
import { NotificationService } from './services/notification.service';
import { ProfessionalService } from './services/professional.service';
import { OrganizationService } from './services/organization.service';
import { MatchingService } from './services/matching.service';
import { JobService } from './services/job.service';
import { ApplicationService } from './services/application.service';
import { FileService } from './services/file.service';
import { MessageService } from './services/message.service';
import { SubscriptionService } from './services/subscription.service';
import { AdminService } from './services/admin.service';
import { DashboardService } from './services/dashboard.service';

// ---- repositories ----
const userRepo = new UserRepository();
const tokenRepo = new TokenRepository();
const professionalRepo = new ProfessionalRepository();
const organizationRepo = new OrganizationRepository();
const jobRepo = new JobRepository();
const applicationRepo = new ApplicationRepository();
const matchRepo = new MatchRepository();
const savedRepo = new SavedRepository();
const messageRepo = new MessageRepository();
const notificationRepo = new NotificationRepository();
const subscriptionRepo = new SubscriptionRepository();
const auditRepo = new AuditRepository();

// ---- services ----
const emailService = new EmailService();
const searchService = new SearchService();
const notificationService = new NotificationService(notificationRepo);

const authService = new AuthService(
  userRepo,
  tokenRepo,
  professionalRepo,
  organizationRepo,
  subscriptionRepo,
  emailService,
);

const professionalService = new ProfessionalService(
  professionalRepo,
  userRepo,
  async (p) => {
    const user = await userRepo.findById(p.user_id);
    if (user) await searchService.indexProfessional(p, `${user.first_name} ${user.last_name}`);
  },
);

const organizationService = new OrganizationService(organizationRepo);
const matchingService = new MatchingService(matchRepo, professionalRepo, jobRepo);
const jobService = new JobService(jobRepo, organizationRepo, searchService);

const applicationService = new ApplicationService(
  applicationRepo,
  professionalRepo,
  jobRepo,
  organizationRepo,
  userRepo,
  matchingService,
  notificationService,
  emailService,
);

const fileService = new FileService();
const messageService = new MessageService(messageRepo, notificationService);
const subscriptionService = new SubscriptionService(subscriptionRepo, userRepo);
const adminService = new AdminService(
  userRepo,
  professionalRepo,
  organizationRepo,
  jobRepo,
  auditRepo,
);
const dashboardService = new DashboardService(
  professionalRepo,
  organizationRepo,
  applicationRepo,
  matchRepo,
  notificationRepo,
  matchingService,
);

export const container = {
  repositories: {
    userRepo,
    tokenRepo,
    professionalRepo,
    organizationRepo,
    jobRepo,
    applicationRepo,
    matchRepo,
    savedRepo,
    messageRepo,
    notificationRepo,
    subscriptionRepo,
    auditRepo,
  },
  services: {
    emailService,
    searchService,
    notificationService,
    authService,
    professionalService,
    organizationService,
    matchingService,
    jobService,
    applicationService,
    fileService,
    messageService,
    subscriptionService,
    adminService,
    dashboardService,
  },
};

export type Container = typeof container;
