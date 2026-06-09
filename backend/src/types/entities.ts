import { Role } from '../utils/constants';

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  password_hash: string;
  role: Role;
  avatar: string | null;
  status: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ProfessionalRow {
  id: string;
  user_id: string;
  profession: string | null;
  specialization: string | null;
  experience_years: number;
  bio: string | null;
  availability: string | null;
  salary_expectation: number | null;
  currency: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  license_number: string | null;
  skills: string[];
  cv_url: string | null;
  verification_status: string;
  profile_completion: number;
  open_to_offers: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface OrganizationRow {
  id: string;
  user_id: string;
  organization_name: string;
  organization_type: string | null;
  registration_number: string | null;
  website: string | null;
  logo: string | null;
  address: string | null;
  country: string | null;
  city: string | null;
  description: string | null;
  size: string | null;
  verification_status: string;
  created_at: Date;
  updated_at: Date;
}

export interface JobRow {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  profession: string | null;
  specialization: string | null;
  skills: string[];
  employment_type: string | null;
  location: string | null;
  country: string | null;
  city: string | null;
  is_remote: boolean;
  salary_min: number | null;
  salary_max: number | null;
  currency: string | null;
  experience_min: number;
  required_licenses: string[];
  status: string;
  views_count: number;
  expires_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface ApplicationRow {
  id: string;
  job_id: string;
  professional_id: string;
  cover_letter: string | null;
  cv_url: string | null;
  stage: string;
  notes: string | null;
  match_score: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface MatchRow {
  id: string;
  job_id: string;
  professional_id: string;
  match_score: number;
  reasons: string[];
  org_action: string | null;
  prof_action: string | null;
  is_mutual: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  read_at: Date | null;
  created_at: Date;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: Date;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: Date | null;
  created_at: Date;
  updated_at: Date;
}
