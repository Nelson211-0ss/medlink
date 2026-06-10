export interface WorkExperience {
  id: string;
  title: string;
  organization?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean;
  description?: string | null;
}

export interface Education {
  id: string;
  institution: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  description?: string | null;
}

export interface Certification {
  id: string;
  name: string;
  issuing_body?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
}

export interface License {
  id: string;
  license_type: string;
  license_number?: string | null;
  country?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  verification_status?: string | null;
}

export interface ProfessionalResume {
  id?: string;
  profession?: string;
  specialization?: string;
  experience_years?: number;
  bio?: string | null;
  availability?: string;
  salary_expectation?: number;
  city?: string;
  country?: string;
  skills?: string[];
  license_number?: string;
  cv_url?: string | null;
  verification_status?: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    avatar?: string | null;
  };
  workExperience?: WorkExperience[];
  education?: Education[];
  certifications?: Certification[];
  licenses?: License[];
}
