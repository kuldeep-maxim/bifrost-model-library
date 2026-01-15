import { fetchAllModels, getModelBySlug } from '@/lib/api';
import { notFound, redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ provider: string; slug: string }>;
}

export default async function ModelPage({ params }: PageProps) {
  const { provider, slug } = await params;
  const decodedProvider = decodeURIComponent(provider);
  const decodedSlug = decodeURIComponent(slug);
  const modelsData = await fetchAllModels();
  const model = getModelBySlug(modelsData, decodedSlug, decodedProvider);

  if (!model) {
    notFound();
  }

  redirect(`/compare/${encodeURIComponent(model.provider)}/${model.slug}`);
}

