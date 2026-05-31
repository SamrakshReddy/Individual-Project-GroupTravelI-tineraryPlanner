export function normalizeStatus(status) {
  if (!status) return undefined;
  const value = String(status).toLowerCase();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildTripQuery(query, userId) {
  const filter = { user: userId };

  if (query.status) filter.status = normalizeStatus(query.status);

  if (query.search) {
    const search = new RegExp(String(query.search).trim(), 'i');
    filter.$or = [{ title: search }, { destination: search }];
  }

  return filter;
}

export function getPagination(query) {
  const page = Math.max(Number(query.page || 1), 1);
  const limit = Math.min(Math.max(Number(query.limit || 50), 1), 100);
  return { page, limit, skip: (page - 1) * limit };
}

export function getSort(sort = '-createdAt') {
  const allowed = new Set(['title', 'destination', 'startDate', 'endDate', 'budget', 'status', 'createdAt', '-title', '-destination', '-startDate', '-endDate', '-budget', '-status', '-createdAt']);
  return allowed.has(sort) ? sort : '-createdAt';
}
