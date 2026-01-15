export function getBaseUrl(): string {
  // Prefer explicit public base URL, fall back to existing production default
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    'http://localhost:3000'
  );
}

export function buildCanonicalUrl(
  path: string,
  query?: Record<string, string | undefined | null>
): string {
  const base = getBaseUrl().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  const url = new URL(`${base}${normalizedPath}`);

  if (query) {
    const entries = Object.entries(query)
      .filter(([, v]) => v != null && String(v) !== '')
      // stable ordering
      .sort(([a], [b]) => a.localeCompare(b));

    for (const [k, v] of entries) {
      url.searchParams.set(k, String(v));
    }
  }

  return url.toString();
}


