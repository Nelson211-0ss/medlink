import { z } from 'zod';
import { EMPLOYMENT_TYPES, JOB_STATUS, PROFESSIONS } from '../utils/constants';

export const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(8000).optional(),
  profession: z.enum(PROFESSIONS).optional(),
  specialization: z.string().max(120).optional(),
  skills: z.array(z.string()).max(40).optional(),
  employment_type: z.enum(EMPLOYMENT_TYPES).optional(),
  location: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  is_remote: z.boolean().optional(),
  salary_min: z.number().int().nonnegative().optional(),
  salary_max: z.number().int().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  experience_min: z.number().int().nonnegative().optional(),
  required_licenses: z.array(z.string()).optional(),
  status: z.enum(JOB_STATUS).optional(),
});

export const updateJobSchema = createJobSchema.partial();
