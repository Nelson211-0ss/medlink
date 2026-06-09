import { MatchingService } from '../src/services/matching.service';
import { JobRow, ProfessionalRow } from '../src/types/entities';

// Repositories are not used by the pure score() method, so we cast empty stubs.
const service = new MatchingService({} as never, {} as never, {} as never);

const baseJob: JobRow = {
  id: 'j1',
  organization_id: 'o1',
  title: 'ICU Nurse',
  description: null,
  profession: 'nurse',
  specialization: 'ICU',
  skills: ['ICU', 'ACLS'],
  employment_type: 'full_time',
  location: 'Kampala',
  country: 'Uganda',
  city: 'Kampala',
  is_remote: false,
  salary_min: 1000,
  salary_max: 1500,
  currency: 'USD',
  experience_min: 3,
  required_licenses: [],
  status: 'open',
  views_count: 0,
  expires_at: null,
  created_at: new Date(),
  updated_at: new Date(),
};

const basePro: ProfessionalRow = {
  id: 'p1',
  user_id: 'u1',
  profession: 'nurse',
  specialization: 'ICU',
  experience_years: 5,
  bio: null,
  availability: 'full_time',
  salary_expectation: 1200,
  currency: 'USD',
  location: 'Kampala',
  country: 'Uganda',
  city: 'Kampala',
  license_number: 'LIC-123',
  skills: ['ICU', 'ACLS'],
  cv_url: null,
  verification_status: 'verified',
  profile_completion: 80,
  open_to_offers: true,
  created_at: new Date(),
  updated_at: new Date(),
};

describe('MatchingService.score', () => {
  it('gives a high score for a strong match', () => {
    const { matchScore, reasons } = service.score(baseJob, basePro);
    expect(matchScore).toBeGreaterThanOrEqual(90);
    expect(reasons.length).toBeGreaterThan(0);
  });

  it('penalizes a profession mismatch', () => {
    const result = service.score(baseJob, { ...basePro, profession: 'pharmacist', specialization: 'Clinical' });
    expect(result.matchScore).toBeLessThan(70);
  });

  it('caps the score at 100', () => {
    const result = service.score(baseJob, basePro);
    expect(result.matchScore).toBeLessThanOrEqual(100);
  });

  it('rewards remote availability when job is remote', () => {
    const remoteJob = { ...baseJob, is_remote: true, city: 'Nairobi', country: 'Kenya' };
    const result = service.score(remoteJob, basePro);
    expect(result.reasons).toContain('Open to remote');
  });
});
