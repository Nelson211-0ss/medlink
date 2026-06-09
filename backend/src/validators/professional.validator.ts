import { z } from 'zod';
import { AVAILABILITY, PROFESSIONS } from '../utils/constants';

export const updateProfessionalSchema = z.object({
  profession: z.enum(PROFESSIONS).optional(),
  specialization: z.string().max(120).optional(),
  experience_years: z.number().int().min(0).max(70).optional(),
  bio: z.string().max(4000).optional(),
  availability: z.enum(AVAILABILITY).optional(),
  salary_expectation: z.number().int().nonnegative().optional(),
  currency: z.string().max(8).optional(),
  location: z.string().max(160).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  license_number: z.string().max(120).optional(),
  skills: z.array(z.string()).max(50).optional(),
  cv_url: z.string().url().optional(),
  open_to_offers: z.boolean().optional(),
});

export const availabilitySchema = z.object({
  availability: z.enum(AVAILABILITY),
  openToOffers: z.boolean(),
});

export const updateOrganizationSchema = z.object({
  organization_name: z.string().max(160).optional(),
  organization_type: z.string().max(60).optional(),
  registration_number: z.string().max(120).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  address: z.string().max(400).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(80).optional(),
  description: z.string().max(4000).optional(),
  size: z.string().max(40).optional(),
});
