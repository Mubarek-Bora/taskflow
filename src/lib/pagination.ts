export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page: number; pageSize: number } = { page: 1, pageSize: 20 }
) {
  const page = Math.max(1, Number(searchParams.get("page")) || defaults.page);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || defaults.pageSize));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginationMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
