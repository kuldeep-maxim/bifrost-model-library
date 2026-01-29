import { MetadataRoute } from 'next';
import { fetchAllModels, processModels, getAllProviders } from '@/lib/api';

export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://www.getmaxim.ai/bifrost/model-library'
      : 'http://localhost:3000');

  const modelsData = await fetchAllModels();
  const models = processModels(modelsData);
  const providers = getAllProviders(modelsData);

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Home Page
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 2. Provider Pages
  providers.forEach((provider) => {
    sitemapEntries.push({
      url: `${baseUrl}/provider/${encodeURIComponent(provider)}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  });

  // 3. Individual Model Pages
  models.forEach((model) => {
    sitemapEntries.push({
      url: `${baseUrl}/compare/${encodeURIComponent(model.provider)}/${model.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return sitemapEntries;
}
