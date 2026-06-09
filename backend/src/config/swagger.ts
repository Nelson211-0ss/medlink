import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'MediNexus API',
      version: '1.0.0',
      description:
        'Healthcare workforce marketplace API connecting professionals with organizations.',
    },
    servers: [{ url: `${env.APP_URL}${env.API_PREFIX}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
              },
            },
          },
        },
        MatchResult: {
          type: 'object',
          properties: {
            matchScore: { type: 'integer', example: 92 },
            reasons: {
              type: 'array',
              items: { type: 'string' },
              example: ['ICU specialization', '5 years experience', 'Located in Kampala'],
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth' },
      { name: 'Professionals' },
      { name: 'Organizations' },
      { name: 'Jobs' },
      { name: 'Applications' },
      { name: 'Matches' },
      { name: 'Search' },
      { name: 'Messages' },
      { name: 'Notifications' },
      { name: 'Subscriptions' },
      { name: 'Admin' },
    ],
    paths: {
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a professional or organization',
          security: [],
          responses: { 201: { description: 'Account created' } },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login',
          security: [],
          responses: { 200: { description: 'Authenticated' } },
        },
      },
      '/jobs': {
        get: { tags: ['Jobs'], summary: 'List open jobs', security: [], responses: { 200: { description: 'OK' } } },
        post: { tags: ['Jobs'], summary: 'Create a job (organization)', responses: { 201: { description: 'Created' } } },
      },
      '/matches/recommended-jobs': {
        get: {
          tags: ['Matches'],
          summary: 'Recommended jobs for the professional',
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/MatchResult' } },
                },
              },
            },
          },
        },
      },
      '/search/professionals': {
        get: { tags: ['Search'], summary: 'Search professionals (Elasticsearch)', responses: { 200: { description: 'OK' } } },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
});
