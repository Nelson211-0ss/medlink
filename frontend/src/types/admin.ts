export interface AdminUserBase {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AdminProfessionalUser extends AdminUserBase {
  professionalId?: string | null;
  profession?: string | null;
  specialization?: string | null;
  experienceYears?: number | null;
  city?: string | null;
  country?: string | null;
  skills?: string[];
  availability?: string | null;
  salaryExpectation?: number | null;
  licenseNumber?: string | null;
  verificationStatus?: string | null;
  profileCompletion?: number | null;
}

export interface AdminOrganizationUser extends AdminUserBase {
  organizationId?: string | null;
  organizationName?: string | null;
  organizationType?: string | null;
  registrationNumber?: string | null;
  website?: string | null;
  city?: string | null;
  country?: string | null;
  size?: string | null;
  description?: string | null;
  verificationStatus?: string | null;
  logo?: string | null;
}
