export const ROLES = {
  PROFESSIONAL: 'professional',
  ORGANIZATION: 'organization',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const USER_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
} as const;

export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const PROFESSIONS = [
  'nurse',
  'doctor',
  'pharmacist',
  'lab_technician',
  'radiographer',
  'midwife',
  'physiotherapist',
  'caregiver',
  'dentist',
  'paramedic',
  'nutritionist',
  'psychologist',
] as const;

export const AVAILABILITY = ['full_time', 'part_time', 'contract', 'locum', 'remote'] as const;

export const ORGANIZATION_TYPES = [
  'hospital',
  'clinic',
  'ngo',
  'nursing_home',
  'telemedicine',
  'research_institution',
  'pharmacy',
  'laboratory',
] as const;

export const JOB_STATUS = ['draft', 'open', 'paused', 'closed', 'archived'] as const;

export const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'locum', 'internship'] as const;

export const APPLICATION_STAGES = [
  'applied',
  'screening',
  'interview',
  'offer',
  'hired',
  'rejected',
] as const;

export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PREMIUM_PRO: 'premium_professional',
  PREMIUM_ORG: 'premium_organization',
} as const;

export const NOTIFICATION_TYPES = {
  NEW_MATCH: 'new_match',
  NEW_JOB: 'new_job',
  NEW_INVITATION: 'new_invitation',
  NEW_MESSAGE: 'new_message',
  APPLICATION_UPDATE: 'application_update',
  SYSTEM: 'system',
} as const;

export const ALLOWED_UPLOAD_MIME = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
} as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
