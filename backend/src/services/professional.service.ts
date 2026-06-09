import { ProfessionalRepository } from '../repositories/professional.repository';
import { UserRepository } from '../repositories/user.repository';
import { FileService } from './file.service';
import { query } from '../database/pool';
import { NotFoundError } from '../utils/errors';
import { ProfessionalRow } from '../types/entities';

export class ProfessionalService {
  constructor(
    private professionals: ProfessionalRepository,
    private users: UserRepository,
    private files: FileService,
    private onProfileChanged?: (p: ProfessionalRow) => Promise<void>,
  ) {}

  /** Compute a 0-100 profile completion score from filled fields. */
  private computeCompletion(p: ProfessionalRow): number {
    const checks = [
      !!p.profession,
      !!p.specialization,
      p.experience_years > 0,
      !!p.bio,
      !!p.availability,
      !!p.salary_expectation,
      !!p.location,
      !!p.license_number,
      (p.skills?.length ?? 0) > 0,
      !!p.cv_url,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  async getByUserId(userId: string) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const user = await this.users.findById(userId);
    return {
      ...profile,
      first_name: user?.first_name,
      last_name: user?.last_name,
      avatar: user ? await this.files.resolveUrl(user.avatar) : null,
    };
  }

  async getFullProfile(professionalId: string) {
    const profile = await this.professionals.findById(professionalId);
    if (!profile) throw new NotFoundError('Profile not found');
    const [user, education, certifications, licenses, experience] = await Promise.all([
      this.users.findById(profile.user_id),
      query('SELECT * FROM education WHERE professional_id = $1 ORDER BY end_year DESC', [professionalId]),
      query('SELECT * FROM certifications WHERE professional_id = $1', [professionalId]),
      query('SELECT * FROM licenses WHERE professional_id = $1', [professionalId]),
      query('SELECT * FROM work_experience WHERE professional_id = $1 ORDER BY start_date DESC', [professionalId]),
    ]);
    return {
      ...profile,
      user: user && {
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: await this.files.resolveUrl(user.avatar),
        email: user.email,
      },
      education: education.rows,
      certifications: certifications.rows,
      licenses: licenses.rows,
      workExperience: experience.rows,
    };
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const updated = (await this.professionals.update(profile.id, data)) as ProfessionalRow;
    const completion = this.computeCompletion(updated);
    await this.professionals.updateCompletion(updated.id, completion);
    updated.profile_completion = completion;
    if (this.onProfileChanged) await this.onProfileChanged(updated);
    return updated;
  }

  async setAvailability(userId: string, availability: string, openToOffers: boolean) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    return this.professionals.update(profile.id, {
      availability,
      open_to_offers: openToOffers,
    });
  }

  // ---- sub-resources ----
  async addEducation(userId: string, data: Record<string, unknown>) {
    const profile = await this.getByUserId(userId);
    const { rows } = await query(
      `INSERT INTO education (professional_id, institution, degree, field_of_study, start_year, end_year, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [profile.id, data.institution, data.degree, data.fieldOfStudy, data.startYear, data.endYear, data.description],
    );
    return rows[0];
  }

  async addCertification(userId: string, data: Record<string, unknown>) {
    const profile = await this.getByUserId(userId);
    const { rows } = await query(
      `INSERT INTO certifications (professional_id, name, issuing_body, issue_date, expiry_date, credential_id, document_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [profile.id, data.name, data.issuingBody, data.issueDate, data.expiryDate, data.credentialId, data.documentUrl],
    );
    return rows[0];
  }

  async addLicense(userId: string, data: Record<string, unknown>) {
    const profile = await this.getByUserId(userId);
    const { rows } = await query(
      `INSERT INTO licenses (professional_id, license_type, license_number, issuing_authority, country, issue_date, expiry_date, document_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [profile.id, data.licenseType, data.licenseNumber, data.issuingAuthority, data.country, data.issueDate, data.expiryDate, data.documentUrl],
    );
    return rows[0];
  }

  async addWorkExperience(userId: string, data: Record<string, unknown>) {
    const profile = await this.getByUserId(userId);
    const { rows } = await query(
      `INSERT INTO work_experience (professional_id, title, organization, location, start_date, end_date, is_current, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [profile.id, data.title, data.organization, data.location, data.startDate, data.endDate, data.isCurrent ?? false, data.description],
    );
    return rows[0];
  }
}
