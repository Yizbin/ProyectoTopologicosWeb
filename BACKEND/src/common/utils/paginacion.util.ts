export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginarLista<T>(
  items: T[],
  page?: number,
  limit?: number,
): ResultadoPaginado<T> {
  const total = items.length;
  const normalizedLimit = Math.max(1, limit ?? 20);
  const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));
  const normalizedPage = Math.max(1, page ?? 1);
  const offset = (normalizedPage - 1) * normalizedLimit;

  return {
    items: items.slice(offset, offset + normalizedLimit),
    total,
    page: normalizedPage,
    limit: normalizedLimit,
    totalPages,
  };
}
