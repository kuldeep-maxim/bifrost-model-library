import { NextResponse } from 'next/server';
import { fetchAllModels, processModels } from '@/lib/api';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  const modelsData = await fetchAllModels();
  let models = processModels(modelsData);

  if (provider) {
    const decoded = decodeURIComponent(provider);
    models = models.filter((m) => m.provider === decoded);
  }

  return NextResponse.json(models, {
    headers: {
      // Cache at the edge for a bit; this is a search index.
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}


