import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ModelCompare from '@/components/ModelCompare';
import { buildCanonicalUrl } from '@/lib/seo';
import { fetchAllModels, getModelBySlug, processModels } from '@/lib/api';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ provider: string; slug: string }>;
}

export async function generateStaticParams() {
  const modelsData = await fetchAllModels();
  const processedModels = processModels(modelsData);

  return processedModels.map((model) => ({
    provider: encodeURIComponent(model.provider),
    slug: model.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provider, slug } = await params;
  const decodedProvider = decodeURIComponent(provider);
  const decodedSlug = decodeURIComponent(slug);
  const modelsData = await fetchAllModels();
  const model = getModelBySlug(modelsData, decodedSlug, decodedProvider);

  if (!model) {
    return {
      title: 'Model Not Found',
    };
  }

  const canonical = buildCanonicalUrl(`/compare/${encodeURIComponent(model.provider)}/${model.slug}`);

  return {
    title: `Compare ${model.displayName}`,
    description: `Compare ${model.displayName} with other models of the same mode.`,
    alternates: {
      canonical,
    },
  };
}

export default async function CompareSinglePage({ params }: PageProps) {
  const { provider, slug } = await params;
  const decodedProvider = decodeURIComponent(provider);
  const decodedSlug = decodeURIComponent(slug);
  const modelsData = await fetchAllModels();
  const model = getModelBySlug(modelsData, decodedSlug, decodedProvider);

  if (!model) {
    notFound();
  }

  return <ModelCompare initialLeftId={model.id} initialLeftModel={model} />;
}

