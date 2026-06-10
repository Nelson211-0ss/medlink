import { ProfessionalRepository } from '../repositories/professional.repository';
import { UserRepository } from '../repositories/user.repository';
import { FileService } from './file.service';
import { query } from '../database/pool';
import { ForbiddenError, NotFoundError } from '../utils/errors';
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

  private async loadResumeSections(professionalId: string) {
    const [education, certifications, licenses, experience] = await Promise.all([
      query('SELECT * FROM education WHERE professional_id = $1 ORDER BY end_year DESC NULLS LAST', [professionalId]),
      query('SELECT * FROM certifications WHERE professional_id = $1 ORDER BY issue_date DESC NULLS LAST', [professionalId]),
      query('SELECT * FROM licenses WHERE professional_id = $1 ORDER BY issue_date DESC NULLS LAST', [professionalId]),
      query('SELECT * FROM work_experience WHERE professional_id = $1 ORDER BY start_date DESC NULLS LAST', [professionalId]),
    ]);
    return {
      education: education.rows,
      certifications: certifications.rows,
      licenses: licenses.rows,
      workExperience: experience.rows,
    };
  }

  private async refreshCompletion(profileId: string) {
    const profile = await this.professionals.findById(profileId);
    if (!profile) return;
    const completion = this.computeCompletion(profile);
    await this.professionals.updateCompletion(profileId, completion);
  }

  async getByUserId(userId: string) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const [user, resume] = await Promise.all([
      this.users.findById(userId),
      this.loadResumeSections(profile.id),
    ]);
    return {
      ...profile,
      cv_url: await this.files.resolveUrl(profile.cv_url),
      first_name: user?.first_name,
      last_name: user?.last_name,
      avatar: user ? await this.files.resolveUrl(user.avatar) : null,
      email: user?.email ?? null,
      phone: user?.phone ?? null,
      contact_email: user?.contact_email ?? null,
      ...resume,
    };
  }

  async getFullProfile(professionalId: string) {
    const profile = await this.professionals.findById(professionalId);
    if (!profile) throw new NotFoundError('Profile not found');
    const [user, resume] = await Promise.all([
      this.users.findById(profile.user_id),
      this.loadResumeSections(professionalId),
    ]);
    return {
      ...profile,
      cv_url: await this.files.resolveUrl(profile.cv_url),
      user: user && {
        firstName: user.first_name,
        lastName: user.last_name,
        avatar: await this.files.resolveUrl(user.avatar),
        email: user.contact_email || user.email,
        phone: user.phone ?? null,
      },
      ...resume,
    };
  }

  async setCvUrl(userId: string, objectName: string) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    await this.professionals.updateCvUrl(profile.id, objectName);
    await this.refreshCompletion(profile.id);
    return this.files.resolveUrl(objectName);
  }

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');

    const { phone, contactEmail, contact_email, ...profileData } = data;
    const contact: { phone?: string | null; contact_email?: string | null } = {};
    if (phone !== undefined) contact.phone = (phone as string) || null;
    if (contactEmail !== undefined) contact.contact_email = (contactEmail as string) || null;
    if (contact_email !== undefined) contact.contact_email = (contact_email as string) || null;
    if (Object.keys(contact).length) await this.users.updateContact(userId, contact);

    const updated = (await this.professionals.update(profile.id, profileData)) as ProfessionalRow;
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
  private async assertResumeOwner(userId: string, table: string, itemId: string) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const { rows } = await query<{ id: string }>(
      `SELECT id FROM ${table} WHERE id = $1 AND professional_id = $2`,
      [itemId, profile.id],
    );
    if (!rows[0]) throw new ForbiddenError('Not allowed to modify this entry');
    return profile;
  }

  async addEducation(userId: string, data: Record<string, unknown>) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const { rows } = await query(
      `INSERT INTO education (professional_id, institution, degree, field_of_study, start_year, end_year, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [profile.id, data.institution, data.degree, data.fieldOfStudy, data.startYear, data.endYear, data.description],
    );
    await this.refreshCompletion(profile.id);
    return rows[0];
  }

  async addCertification(userId: string, data: Record<string, unknown>) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const { rows } = await query(
      `INSERT INTO certifications (professional_id, name, issuing_body, issue_date, expiry_date, credential_id, document_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [profile.id, data.name, data.issuingBody, data.issueDate, data.expiryDate, data.credentialId, data.documentUrl],
    );
    await this.refreshCompletion(profile.id);
    return rows[0];
  }

  async addLicense(userId: string, data: Record<string, unknown>) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const { rows } = await query(
      `INSERT INTO licenses (professional_id, license_type, license_number, issuing_authority, country, issue_date, expiry_date, document_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [profile.id, data.licenseType, data.licenseNumber, data.issuingAuthority, data.country, data.issueDate, data.expiryDate, data.documentUrl],
    );
    await this.refreshCompletion(profile.id);
    return rows[0];
  }

  async addWorkExperience(userId: string, data: Record<string, unknown>) {
    const profile = await this.professionals.findByUserId(userId);
    if (!profile) throw new NotFoundError('Professional profile not found');
    const { rows } = await query(
      `INSERT INTO work_experience (professional_id, title, organization, location, start_date, end_date, is_current, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [profile.id, data.title, data.organization, data.location, data.startDate, data.endDate || null, data.isCurrent ?? false, data.description],
    );
    await this.refreshCompletion(profile.id);
    return rows[0];
  }

  async deleteEducation(userId: string, itemId: string) {
    await this.assertResumeOwner(userId, 'education', itemId);
    await query('DELETE FROM education WHERE id = $1', [itemId]);
    return { deleted: true };
  }

  async deleteCertification(userId: string, itemId: string) {
    await this.assertResumeOwner(userId, 'certifications', itemId);
    await query('DELETE FROM certifications WHERE id = $1', [itemId]);
    return { deleted: true };
  }

  async deleteLicense(userId: string, itemId: string) {
    await this.assertResumeOwner(userId, 'licenses', itemId);
    await query('DELETE FROM licenses WHERE id = $1', [itemId]);
    return { deleted: true };
  }

  async deleteWorkExperience(userId: string, itemId: string) {
    await this.assertResumeOwner(userId, 'work_experience', itemId);
    await query('DELETE FROM work_experience WHERE id = $1', [itemId]);
    return { deleted: true };
  }
}
