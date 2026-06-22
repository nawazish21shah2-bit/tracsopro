export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function normalizePagination(
  pagination: Partial<PaginationMeta> | undefined,
  fallback: { page: number; limit: number; total: number },
): PaginationMeta {
  const page = pagination?.page ?? fallback.page;
  const limit = pagination?.limit ?? fallback.limit;
  const total = pagination?.total ?? fallback.total;
  const pages = pagination?.pages ?? Math.max(1, Math.ceil(total / limit) || 1);
  return { page, limit, total, pages };
}

export function hasMorePages(pagination?: Partial<PaginationMeta> | null): boolean {
  if (!pagination || pagination.page == null || pagination.pages == null) {
    return false;
  }
  return pagination.page < pagination.pages;
}

export function unwrapApiPayload<T>(response: { data: unknown }): T {
  const body = response.data as Record<string, unknown> | null | undefined;
  if (body && typeof body === 'object' && body.success === true && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}
