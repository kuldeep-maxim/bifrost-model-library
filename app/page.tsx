import { fetchAllModels, processModels, getAllProviders, getAllModes } from '@/lib/api';
import ModelsTable from '@/components/ModelsTable';
import ProvidersList from '@/components/ProvidersList';
import Pagination from '@/components/Pagination';
import { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo';

interface PageProps {
  searchParams: Promise<{ showAllProviders?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { showAllProviders, page } = await searchParams;
  const canonical = buildCanonicalUrl('/', {
    showAllProviders: showAllProviders || undefined,
    page: page && page !== '1' ? page : undefined,
  });

  return {
    title: 'AI Model Library - Explore Providers and Capabilities',
    description:
      'Browse AI models across providers. Compare capabilities, context limits, and pricing details for chat, image generation, audio, and more.',
    keywords: 'AI model library, model catalog, AI providers, model capabilities, model pricing',
    alternates: {
      canonical,
    },
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const { showAllProviders, page } = await searchParams;
  const modelsData = await fetchAllModels();
  const models = processModels(modelsData);
  const providers = getAllProviders(modelsData);
  const modes = getAllModes(modelsData);

  const PAGE_SIZE = 100;
  const currentPage = Math.max(1, parseInt(page || '1', 10) || 1);
  const totalModels = models.length;
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const pagedModels = models.slice(startIdx, startIdx + PAGE_SIZE);

  // Group models by provider for nested display
  const modelsByProvider = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, typeof models>);

  // Filter out providers with 0 models
  const providersWithModels = providers.filter(provider => 
    (modelsByProvider[provider]?.length || 0) > 0
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="text-center">
            <span className="provider-badge">
               [ AI MODEL LIBRARY ]
            </span>
            <h1 className="text-4xl md:text-5xl font-normal text-gray-900 mb-4 leading-[1.2] tracking-tight text-center">
              Explore AI Models Across Providers
            </h1>
            <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Discover model capabilities, context limits, and pricing across chat, image generation, audio, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-medium font-mono">[ OUR NUMBERS AT A GLANCE ]</p>
        </div>
        <div className="flex justify-center">
          <div className="border-t border-b border-gray-200 max-w-2xl w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="text-center py-4 md:py-5 px-6">
              <div className="text-sm text-gray-500 uppercase tracking-wider font-medium font-mono">Models</div>

                <div className="text-xl md:text-2xl text-accent mb-1 leading-none font-mono">
                  {models.length.toLocaleString()}
                </div>
                
              </div>
              <div className="text-center py-4 md:py-5 px-6">
              <div className="text-sm text-gray-500 uppercase tracking-wider font-medium font-mono">Providers</div>

                <div className="text-xl md:text-2xl text-accent mb-1 leading-none font-mono">
                  {providers.length}
                </div>
                
              </div>
              <div className="text-center py-4 md:py-5 px-6">
              <div className="text-sm text-gray-500 uppercase tracking-wider font-medium font-mono">Modes</div>
                <div className="text-xl md:text-2xl text-accent mb-1 leading-none font-mono">
                  {modes.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="mb-4">
          <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-2 tracking-tight">Browse by Provider</h2>
          <p className="text-gray-600 text-sm">
            View all models from a specific provider
          </p>
        </div>
        <ProvidersList
          providers={providersWithModels.map(provider => ({
            name: provider,
            count: modelsByProvider[provider]?.length || 0,
          }))}
          maxVisible={20}
          showAllProvidersParam={showAllProviders === 'true'}
        />
      </div>

      {/* Models Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-medium text-gray-900 mb-2 tracking-tight">All Models</h2>
          <p className="text-gray-600 text-sm">
            Click on any model to view detailed pricing and capabilities
          </p>
        </div>
        <ModelsTable
          models={pagedModels}
          totalModels={totalModels}
          searchScope="all"
          serverPaginationContainerId="home-pagination"
        />
        {totalModels > PAGE_SIZE && (
          <div id="home-pagination">
            <Pagination
              basePath="/"
              currentPage={currentPage}
              totalItems={totalModels}
              pageSize={PAGE_SIZE}
              query={{ showAllProviders }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
