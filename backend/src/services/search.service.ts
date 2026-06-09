import { esClient, ES_INDICES, checkElasticsearch } from '../config/elasticsearch';
import { ProfessionalRepository } from '../repositories/professional.repository';
import { FileService } from './file.service';
import { JobRow, ProfessionalRow } from '../types/entities';
import { logger } from '../config/logger';

interface SearchOpts {
  q?: string;
  filters?: Record<string, string | undefined>;
  page?: number;
  limit?: number;
  sort?: string;
}

export class SearchService {
  constructor(
    private professionals: ProfessionalRepository,
    private files: FileService,
  ) {}

  async indexProfessional(p: ProfessionalRow, fullName: string): Promise<void> {
    try {
      await esClient.index({
        index: ES_INDICES.professionals,
        id: p.id,
        document: {
          userId: p.user_id,
          fullName,
          profession: p.profession,
          specialization: p.specialization,
          skills: p.skills ?? [],
          experienceYears: p.experience_years,
          location: p.location,
          country: p.country,
          city: p.city,
          availability: p.availability,
          salaryExpectation: p.salary_expectation,
          verificationStatus: p.verification_status,
          createdAt: p.created_at,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to index professional');
    }
  }

  async indexJob(j: JobRow, organizationName: string): Promise<void> {
    try {
      await esClient.index({
        index: ES_INDICES.jobs,
        id: j.id,
        document: {
          title: j.title,
          description: j.description,
          profession: j.profession,
          specialization: j.specialization,
          skills: j.skills ?? [],
          location: j.location,
          country: j.country,
          city: j.city,
          employmentType: j.employment_type,
          salaryMin: j.salary_min,
          salaryMax: j.salary_max,
          organizationId: j.organization_id,
          organizationName,
          status: j.status,
          createdAt: j.created_at,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to index job');
    }
  }

  async removeJob(id: string): Promise<void> {
    try {
      await esClient.delete({ index: ES_INDICES.jobs, id });
    } catch {
      /* ignore missing */
    }
  }

  private buildQuery(opts: SearchOpts, textFields: string[]) {
    const must: unknown[] = [];
    const filter: unknown[] = [];
    if (opts.q) {
      must.push({ multi_match: { query: opts.q, fields: textFields, fuzziness: 'AUTO' } });
    }
    for (const [key, value] of Object.entries(opts.filters ?? {})) {
      if (value) filter.push({ term: { [key]: value } });
    }
    return must.length || filter.length ? { bool: { must, filter } } : { match_all: {} };
  }

  /**
   * Organization talent discovery — backed by Postgres so every registered
   * professional is visible even when Elasticsearch is unavailable.
   */
  async searchProfessionals(opts: SearchOpts) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const filters = opts.filters ?? {};

    const { rows, total } = await this.professionals.searchDiscoverable({
      q: opts.q,
      profession: filters.profession,
      specialization: filters.specialization,
      country: filters.country,
      city: filters.city,
      availability: filters.availability,
      page,
      limit,
    });

    // Optionally enrich with Elasticsearch scores when available.
    let scoreMap = new Map<string, number>();
    if (opts.q && (await checkElasticsearch())) {
      try {
        const es = await esClient.search({
          index: ES_INDICES.professionals,
          size: 100,
          query: this.buildQuery(opts, ['fullName^2', 'specialization', 'skills', 'location']) as never,
        });
        scoreMap = new Map(
          (es.hits.hits as Array<{ _id: string; _score: number }>).map((h) => [h._id, h._score]),
        );
      } catch (err) {
        logger.warn({ err }, 'Elasticsearch professional search skipped');
      }
    }

    const data = await Promise.all(
      rows.map(async (p) => ({
        id: p.id,
        score: scoreMap.get(p.id),
        fullName: `${p.first_name} ${p.last_name}`.trim(),
        profession: p.profession,
        specialization: p.specialization,
        skills: p.skills ?? [],
        experienceYears: p.experience_years,
        location: p.location,
        country: p.country,
        city: p.city,
        availability: p.availability,
        salaryExpectation: p.salary_expectation,
        verificationStatus: p.verification_status,
        profileCompletion: p.profile_completion,
        openToOffers: p.open_to_offers,
        avatar: await this.files.resolveUrl(p.avatar),
        createdAt: p.created_at,
      })),
    );

    return {
      data,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async searchJobs(opts: SearchOpts) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 20;
    const result = await esClient.search({
      index: ES_INDICES.jobs,
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must: this.buildQuery(opts, ['title^3', 'description', 'specialization', 'skills', 'location']),
          filter: [{ term: { status: 'open' } }],
        },
      } as never,
      sort:
        opts.sort === 'salary'
          ? [{ salaryMax: 'desc' }]
          : opts.sort === 'recent'
            ? [{ createdAt: 'desc' }]
            : undefined,
    });
    return this.format(result, page, limit);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private format(result: any, page: number, limit: number) {
    const hits = result.hits.hits as Array<{ _id: string; _score: number; _source: unknown }>;
    const totalRaw = result.hits.total as { value: number } | number;
    const total = typeof totalRaw === 'number' ? totalRaw : (totalRaw?.value ?? 0);
    return {
      data: hits.map((h) => ({ id: h._id, score: h._score, ...(h._source as object) })),
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }
}
