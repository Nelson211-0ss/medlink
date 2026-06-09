import { z } from 'zod';
import { ROLES } from '../utils/constants';

const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[a-z]/, 'Must include a lowercase letter')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a number');

export const registerSchema = z
  .object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email(),
    phone: z.string().max(30).optional(),
    password,
    role: z.enum([ROLES.PROFESSIONAL, ROLES.ORGANIZATION]),
    organizationName: z.string().max(160).optional(),
    organizationType: z.string().max(60).optional(),
    profession: z.string().max(60).optional(),
  })
  .refine((d) => d.role !== ROLES.ORGANIZATION || !!d.organizationName, {
    message: 'organizationName is required for organization accounts',
    path: ['organizationName'],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password,
});

export const verifyEmailSchema = z.object({ token: z.string().min(10) });
