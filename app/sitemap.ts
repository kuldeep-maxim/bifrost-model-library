import { MetadataRoute } from 'next';
import { fetchAllModels, processModels, getAllProviders } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  const modelsData = await fetchAllModels();
  const models = processModels(modelsData);
  const providers = getAllProviders(modelsData);
  const PAGE_SIZE = 100;

  const modelPages = models.map((model) => ({
    url: `${baseUrl}/compare/${encodeURIComponent(model.provider)}/${model.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const providerPages = providers.map((provider) => ({
    url: `${baseUrl}/provider/${encodeURIComponent(provider)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  // Pagination pages for homepage and provider tables
  const homeTotalPages = Math.ceil(models.length / PAGE_SIZE);
  const homePaginationPages =
    homeTotalPages > 1
      ? Array.from({ length: homeTotalPages - 1 }, (_, i) => i + 2).map((p) => ({
          url: `${baseUrl}?page=${p}`,
          lastModified: new Date(),
          changeFrequency: 'daily' as const,
          priority: 0.6,
        }))
      : [];

  const providerCounts = models.reduce((acc, m) => {
    acc[m.provider] = (acc[m.provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const providerPaginationPages = providers.flatMap((provider) => {
    const count = providerCounts[provider] || 0;
    const totalPages = Math.ceil(count / PAGE_SIZE);
    if (totalPages <= 1) return [];
    return Array.from({ length: totalPages - 1 }, (_, i) => i + 2).map((p) => ({
      url: `${baseUrl}/provider/${encodeURIComponent(provider)}?page=${p}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));
  });

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    ...homePaginationPages,
    ...providerPages,
    ...providerPaginationPages,
    ...modelPages,
  ];
}

