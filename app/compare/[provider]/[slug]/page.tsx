import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ModelCompare from '@/components/ModelCompare';
import { buildCanonicalUrl } from '@/lib/seo';
import { fetchAllModels, getModelBySlug, processModels } from '@/lib/api';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ provider: string; slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateStaticParams() {
  const modelsData = await fetchAllModels();
  const processedModels = processModels(modelsData);

  return processedModels.map((model) => ({
    provider: encodeURIComponent(model.provider),
    slug: model.slug,
  }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { provider, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const decodedProvider = decodeURIComponent(provider);
  const decodedSlug = decodeURIComponent(slug);
  const modelsData = await fetchAllModels();
  const model = getModelBySlug(modelsData, decodedSlug, decodedProvider);

  if (!model) {
    return {
      title: 'Model Not Found',
    };
  }

  // Check for comparison model
  const compareParam = resolvedSearchParams?.compare;
  let secondModel: any = null;

  if (typeof compareParam === 'string') {
    const [provider2, slug2] = compareParam.split('/');
    if (provider2 && slug2) {
      secondModel = getModelBySlug(modelsData, decodeURIComponent(slug2), decodeURIComponent(provider2));
    }
  }

  if (secondModel) {
    const canonical = buildCanonicalUrl(`/compare/${encodeURIComponent(model.provider)}/${model.slug}?compare=${encodeURIComponent(secondModel.provider)}/${secondModel.slug}`);
    return {
      title: `Compare ${model.displayName} vs ${secondModel.displayName}`,
      description: `Compare pricing, limits, and capabilities between ${model.displayName} and ${secondModel.displayName}.`,
      alternates: {
        canonical,
      },
    };
  }

  const canonical = buildCanonicalUrl(`/compare/${encodeURIComponent(model.provider)}/${model.slug}`);

  return {
    title: `Compare ${model.displayName} with other models`,
    description: `Compare pricing, limits, and capabilities of ${model.displayName} with other models.`,
    alternates: {
      canonical,
    },
  };
}

export default async function CompareSinglePage({ params, searchParams }: PageProps) {
  const { provider, slug } = await params;
  const resolvedSearchParams = await searchParams;
  const decodedProvider = decodeURIComponent(provider);
  const decodedSlug = decodeURIComponent(slug);
  const modelsData = await fetchAllModels();
  const model = getModelBySlug(modelsData, decodedSlug, decodedProvider);

  if (!model) {
    notFound();
  }

  // Check for comparison model
  const compareParam = resolvedSearchParams?.compare;
  let secondModel: any = null;

  if (typeof compareParam === 'string') {
    const parts = compareParam.split('/');
    if (parts.length >= 2) {
      // Handle cases where slug might contain slashes, though less likely with current slug structure
      const provider2 = parts[0];
      const slug2 = parts.slice(1).join('/');
      secondModel = getModelBySlug(modelsData, decodeURIComponent(slug2), decodeURIComponent(provider2));
    }
  }

  return (
    <ModelCompare
      initialLeftId={model.id}
      initialLeftModel={model}
      initialRightId={secondModel?.id}
      initialRightModel={secondModel}
    />
  );
}

