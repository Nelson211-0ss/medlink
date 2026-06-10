import { z } from 'zod';
import { ROLES, USER_STATUS } from '../utils/constants';

export const listAdminUsersSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  role: z.enum([ROLES.PROFESSIONAL, ROLES.ORGANIZATION, ROLES.ADMIN]).optional(),
  q: z.string().trim().max(100).optional(),
});

export const setUserStatusSchema = z.object({
  status: z.enum([
    USER_STATUS.PENDING,
    USER_STATUS.ACTIVE,
    USER_STATUS.SUSPENDED,
    USER_STATUS.DEACTIVATED,
  ]),
});

export const adminUserIdSchema = z.object({
  id: z.string().uuid(),
});
