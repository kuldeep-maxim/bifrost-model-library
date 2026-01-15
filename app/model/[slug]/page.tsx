import { fetchAllModels, getModelBySlug } from '@/lib/api';
import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Redirect old /model/[slug] routes to compare pages
export default async function ModelPage({ params }: PageProps) {
  const { slug } = await params;
  const modelsData = await fetchAllModels();
  const model = getModelBySlug(modelsData, slug);
  
  if (!model) {
    redirect('/');
  }
  
  // Redirect to compare page
  redirect(`/compare/${encodeURIComponent(model.provider)}/${model.slug}`);
}
