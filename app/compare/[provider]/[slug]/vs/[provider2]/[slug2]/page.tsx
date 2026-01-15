import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ModelCompare from '@/components/ModelCompare';
import { buildCanonicalUrl } from '@/lib/seo';
import { fetchAllModels, getModelBySlug } from '@/lib/api';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface PageProps {
  params: Promise<{
    provider: string;
    slug: string;
    provider2: string;
    slug2: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { provider, slug, provider2, slug2 } = await params;
  const modelsData = await fetchAllModels();
  const leftModel = getModelBySlug(modelsData, decodeURIComponent(slug), decodeURIComponent(provider));
  const rightModel = getModelBySlug(modelsData, decodeURIComponent(slug2), decodeURIComponent(provider2));

  if (!leftModel || !rightModel) {
    return {
      title: 'Model Not Found',
    };
  }

  const canonical = buildCanonicalUrl(
    `/compare/${encodeURIComponent(leftModel.provider)}/${leftModel.slug}/vs/${encodeURIComponent(rightModel.provider)}/${rightModel.slug}`
  );

  return {
    title: `Compare ${leftModel.displayName} vs ${rightModel.displayName}`,
    description: `Side-by-side comparison of ${leftModel.displayName} and ${rightModel.displayName}.`,
    alternates: {
      canonical,
    },
  };
}

export default async function ComparePairPage({ params }: PageProps) {
  const { provider, slug, provider2, slug2 } = await params;
  const modelsData = await fetchAllModels();
  const leftModel = getModelBySlug(modelsData, decodeURIComponent(slug), decodeURIComponent(provider));
  const rightModel = getModelBySlug(modelsData, decodeURIComponent(slug2), decodeURIComponent(provider2));

  if (!leftModel || !rightModel) {
    notFound();
  }

  return (
    <ModelCompare
      initialLeftId={leftModel.id}
      initialRightId={rightModel.id}
      initialLeftModel={leftModel}
      initialRightModel={rightModel}
    />
  );
}

