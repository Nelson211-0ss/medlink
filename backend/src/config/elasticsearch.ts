import { Client } from '@elastic/elasticsearch';
import { env } from './env';
import { logger } from './logger';

export const esClient = new Client({ node: env.ELASTICSEARCH_NODE });

export const ES_INDICES = {
  professionals: 'medilink_professionals',
  jobs: 'medilink_jobs',
} as const;

const professionalMapping = {
  properties: {
    userId: { type: 'keyword' },
    fullName: { type: 'text' },
    profession: { type: 'keyword' },
    specialization: { type: 'keyword' },
    skills: { type: 'keyword' },
    experienceYears: { type: 'integer' },
    location: { type: 'text' },
    country: { type: 'keyword' },
    city: { type: 'keyword' },
    availability: { type: 'keyword' },
    salaryExpectation: { type: 'integer' },
    verificationStatus: { type: 'keyword' },
    createdAt: { type: 'date' },
  },
} as const;

const jobMapping = {
  properties: {
    title: { type: 'text' },
    description: { type: 'text' },
    profession: { type: 'keyword' },
    specialization: { type: 'keyword' },
    skills: { type: 'keyword' },
    location: { type: 'text' },
    country: { type: 'keyword' },
    city: { type: 'keyword' },
    employmentType: { type: 'keyword' },
    salaryMin: { type: 'integer' },
    salaryMax: { type: 'integer' },
    organizationId: { type: 'keyword' },
    organizationName: { type: 'text' },
    status: { type: 'keyword' },
    createdAt: { type: 'date' },
  },
} as const;

/** Create indices if they do not exist. Safe to call on boot. */
export const ensureIndices = async (): Promise<void> => {
  try {
    for (const [name, mappings] of [
      [ES_INDICES.professionals, professionalMapping],
      [ES_INDICES.jobs, jobMapping],
    ] as const) {
      const exists = await esClient.indices.exists({ index: name });
      if (!exists) {
        await esClient.indices.create({ index: name, mappings: mappings as never });
        logger.info({ index: name }, 'Created Elasticsearch index');
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to ensure Elasticsearch indices');
  }
};

export const checkElasticsearch = async (): Promise<boolean> => {
  try {
    await esClient.ping();
    return true;
  } catch {
    return false;
  }
};
