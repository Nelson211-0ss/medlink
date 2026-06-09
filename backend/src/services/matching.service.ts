import { JobRow, ProfessionalRow } from '../types/entities';
import { MatchRepository } from '../repositories/match.repository';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { JobRepository } from '../repositories/job.repository';
import { query } from '../database/pool';

export interface MatchResult {
  matchScore: number;
  reasons: string[];
}

/**
 * Healthcare-specific weighted matching engine.
 * Each dimension contributes a weighted sub-score; the sum is normalized to 0-100.
 */
const WEIGHTS = {
  profession: 30,
  specialization: 20,
  experience: 15,
  skills: 12,
  location: 10,
  availability: 5,
  salary: 5,
  licenses: 3,
} as const;

export class MatchingService {
  constructor(
    private matches: MatchRepository,
    private professionals: ProfessionalRepository,
    private jobs: JobRepository,
  ) {}

  /** Pure scoring function — also unit-testable in isolation. */
  score(job: JobRow, pro: ProfessionalRow): MatchResult {
    let total = 0;
    const reasons: string[] = [];

    // Profession (hard signal)
    if (job.profession && pro.profession && job.profession === pro.profession) {
      total += WEIGHTS.profession;
      reasons.push(`${this.label(pro.profession)} profession match`);
    }

    // Specialization
    if (job.specialization && pro.specialization) {
      if (job.specialization.toLowerCase() === pro.specialization.toLowerCase()) {
        total += WEIGHTS.specialization;
        reasons.push(`${pro.specialization} specialization`);
      } else if (
        pro.specialization.toLowerCase().includes(job.specialization.toLowerCase()) ||
        job.specialization.toLowerCase().includes(pro.specialization.toLowerCase())
      ) {
        total += WEIGHTS.specialization * 0.5;
        reasons.push(`Related specialization (${pro.specialization})`);
      }
    }

    // Experience
    if (pro.experience_years >= job.experience_min) {
      total += WEIGHTS.experience;
      if (pro.experience_years > 0) reasons.push(`${pro.experience_years} years experience`);
    } else if (job.experience_min > 0) {
      const ratio = pro.experience_years / job.experience_min;
      total += WEIGHTS.experience * Math.max(0, ratio);
    }

    // Skills overlap
    const jobSkills = (job.skills ?? []).map((s) => s.toLowerCase());
    const proSkills = (pro.skills ?? []).map((s) => s.toLowerCase());
    if (jobSkills.length && proSkills.length) {
      const overlap = jobSkills.filter((s) => proSkills.includes(s));
      const ratio = overlap.length / jobSkills.length;
      total += WEIGHTS.skills * ratio;
      if (overlap.length) reasons.push(`${overlap.length} matching skill(s)`);
    }

    // Location
    if (job.is_remote || pro.availability === 'remote') {
      total += WEIGHTS.location;
      reasons.push('Open to remote');
    } else if (job.city && pro.city && job.city.toLowerCase() === pro.city.toLowerCase()) {
      total += WEIGHTS.location;
      reasons.push(`Located in ${pro.city}`);
    } else if (job.country && pro.country && job.country.toLowerCase() === pro.country.toLowerCase()) {
      total += WEIGHTS.location * 0.6;
      reasons.push(`Located in ${pro.country}`);
    }

    // Availability
    if (job.employment_type && pro.availability && job.employment_type === pro.availability) {
      total += WEIGHTS.availability;
      reasons.push(`Available for ${this.label(pro.availability)}`);
    }

    // Salary alignment
    if (pro.salary_expectation && job.salary_max) {
      if (pro.salary_expectation <= job.salary_max) {
        total += WEIGHTS.salary;
        reasons.push('Salary expectations align');
      }
    } else {
      total += WEIGHTS.salary * 0.5;
    }

    // Licenses
    if ((job.required_licenses ?? []).length === 0) {
      total += WEIGHTS.licenses;
    } else if (pro.license_number) {
      total += WEIGHTS.licenses;
      reasons.push('Licensed professional');
    }

    const matchScore = Math.min(100, Math.round(total));
    return { matchScore, reasons: reasons.slice(0, 5) };
  }

  private label(s: string): string {
    return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /** Score a single job/professional pair by id. */
  async scorePair(jobId: string, professionalId: string): Promise<MatchResult> {
    const [job, pro] = await Promise.all([
      this.jobs.findById(jobId),
      this.professionals.findById(professionalId),
    ]);
    if (!job || !pro) return { matchScore: 0, reasons: [] };
    return this.score(job, pro);
  }

  /** Find and persist the best candidate matches for a job. */
  async candidatesForJob(jobId: string, limit = 20) {
    const job = await this.jobs.findById(jobId);
    if (!job) return [];
    const pros = await this.professionals.findAllForMatching({
      profession: job.profession ?? undefined,
    });
    const scored = pros
      .map((pro) => ({ pro, ...this.score(job, pro) }))
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    for (const m of scored) {
      await this.matches.upsert({
        jobId,
        professionalId: m.pro.id,
        score: m.matchScore,
        reasons: m.reasons,
      });
    }
    return scored.map((m) => ({
      professionalId: m.pro.id,
      matchScore: m.matchScore,
      reasons: m.reasons,
    }));
  }

  /** Recommend the best jobs for a professional. */
  async jobsForProfessional(professionalId: string, limit = 20) {
    const pro = await this.professionals.findById(professionalId);
    if (!pro) return [];
    const { rows: jobs } = await query<JobRow>(
      `SELECT * FROM jobs WHERE status = 'open'
       AND (profession = $1 OR $1 IS NULL) LIMIT 300`,
      [pro.profession],
    );
    return jobs
      .map((job) => ({ job, ...this.score(job, pro) }))
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map((m) => ({ job: m.job, matchScore: m.matchScore, reasons: m.reasons }));
  }

  async recordSwipe(matchId: string, side: 'org' | 'prof', action: 'liked' | 'passed') {
    return this.matches.setAction(matchId, side, action);
  }
}
