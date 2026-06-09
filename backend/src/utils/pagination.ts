export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export const getPagination = (query: {
  page?: unknown;
  limit?: unknown;
}): PaginationParams => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

export const buildMeta = (total: number, page: number, limit: number) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
