import Link from 'next/link';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function buildHref(basePath: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, v);
  });
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export default function Pagination({
  basePath,
  currentPage,
  totalItems,
  pageSize,
  query = {},
}: {
  basePath: string;
  currentPage: number;
  totalItems: number;
  pageSize: number;
  query?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = clamp(currentPage, 1, totalPages);

  if (totalPages <= 1) return null;

  const windowSize = 2; // pages around current
  const start = Math.max(2, page - windowSize);
  const end = Math.min(totalPages - 1, page + windowSize);

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(totalItems, page * pageSize);

  const pageHref = (p: number) =>
    buildHref(basePath, { ...query, page: p === 1 ? undefined : String(p) });

  const PageLink = ({
    p,
    label,
    isCurrent = false,
  }: {
    p: number;
    label?: string;
    isCurrent?: boolean;
  }) => (
    <Link
      href={pageHref(p)}
      aria-current={isCurrent ? 'page' : undefined}
      className={
        isCurrent
          ? 'inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg bg-accent text-white border border-accent text-sm font-medium'
          : 'inline-flex items-center justify-center min-w-[40px] h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-accent-light hover:border-accent-border transition-colors'
      }
    >
      {label ?? String(p)}
    </Link>
  );

  const Ellipsis = () => (
    <span className="inline-flex items-center justify-center min-w-[40px] h-10 px-3 text-gray-400">
      …
    </span>
  );

  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="text-sm text-gray-600">
        Showing <span className="font-mono">{rangeStart.toLocaleString()}</span>–
        <span className="font-mono">{rangeEnd.toLocaleString()}</span> of{' '}
        <span className="font-mono">{totalItems.toLocaleString()}</span>
      </div>
      <nav className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto" aria-label="Pagination">
        <Link
          href={pageHref(Math.max(1, page - 1))}
          aria-disabled={page === 1}
          className={
            page === 1
              ? 'inline-flex items-center justify-center h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-300 pointer-events-none'
              : 'inline-flex items-center justify-center h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-accent-light hover:border-accent-border transition-colors'
          }
        >
          Prev
        </Link>

        {/* Mobile: compact indicator to avoid horizontal overflow */}
        <div className="sm:hidden flex-1 text-center text-sm text-gray-600">
          Page <span className="font-mono">{page}</span> of{' '}
          <span className="font-mono">{totalPages}</span>
        </div>

        {/* Desktop/tablet: full page controls */}
        <div className="hidden sm:flex items-center gap-2">
          <PageLink p={1} isCurrent={page === 1} />
          {start > 2 && <Ellipsis />}
          {Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => {
            const p = start + i;
            return <PageLink key={p} p={p} isCurrent={p === page} />;
          })}
          {end < totalPages - 1 && <Ellipsis />}
          {totalPages > 1 && (
            <PageLink p={totalPages} isCurrent={page === totalPages} />
          )}
        </div>

        <Link
          href={pageHref(Math.min(totalPages, page + 1))}
          aria-disabled={page === totalPages}
          className={
            page === totalPages
              ? 'inline-flex items-center justify-center h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-300 pointer-events-none'
              : 'inline-flex items-center justify-center h-10 px-3 rounded-lg bg-white border border-gray-200 text-sm text-gray-700 hover:bg-accent-light hover:border-accent-border transition-colors'
          }
        >
          Next
        </Link>
      </nav>
    </div>
  );
}


