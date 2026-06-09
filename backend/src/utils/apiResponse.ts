import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const ok = <T>(res: Response, data: T, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const created = <T>(res: Response, data: T, message = 'Created') =>
  res.status(201).json({ success: true, message, data });

export const paginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'OK',
) => res.status(200).json({ success: true, message, data, meta });

export const noContent = (res: Response) => res.status(204).send();
