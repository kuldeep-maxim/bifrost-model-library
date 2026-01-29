/**
 * Provider Configuration
 *
 * This file is the single source of truth for all provider-related configuration:
 * 1. Complete list of all available providers from getbifrost.ai
 * 2. Whitelist of providers to include in the site
 * 3. Display names and logos for each provider
 *
 * Only models from whitelisted providers will be:
 * - Shown on the website
 * - Included in sitemaps
 * - Available for comparison
 */

/**
 * Provider metadata (display name and logo)
 */
export interface ProviderMetadata {
  displayName: string;
  logo: string;
}

/**
 * Provider information mapping
 * Maps provider ID to display name and logo filename
 */
export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  // Major AI Providers
  anthropic: { displayName: 'Anthropic', logo: 'anthropic.svg' },
  openai: { displayName: 'OpenAI', logo: 'openai.svg' },
  gemini: { displayName: 'Google Gemini', logo: 'google.svg' },

  // Cloud Platforms
  azure: { displayName: 'Azure', logo: 'azure.svg' },
  azure_ai: { displayName: 'Azure AI', logo: 'azure.svg' },
  bedrock: { displayName: 'AWS Bedrock', logo: 'bedrock.svg' },
  bedrock_converse: { displayName: 'AWS Bedrock', logo: 'bedrock.svg' },
  vertex_ai: { displayName: 'Google Vertex AI', logo: 'vertex.svg' },

  // Popular API Providers
  together_ai: { displayName: 'Together AI', logo: 'together.svg' },
  fireworks_ai: { displayName: 'Fireworks AI', logo: 'fireworks.svg' },
  replicate: { displayName: 'Replicate', logo: 'replicate.svg' },
  groq: { displayName: 'Groq', logo: 'groq.svg' },
  deepseek: { displayName: 'DeepSeek', logo: 'deepseek.svg' },

  // Specialized Providers
  cohere: { displayName: 'Cohere', logo: 'cohere.svg' },
  mistral: { displayName: 'Mistral AI', logo: 'mistral.svg' },
  perplexity: { displayName: 'Perplexity', logo: 'perplexity.svg' },

  // Additional providers (for fallback)
  aws: { displayName: 'AWS', logo: 'aws.svg' },
  amazon_nova: { displayName: 'Amazon Nova', logo: 'aws.svg' },
  cerebras: { displayName: 'Cerebras', logo: 'cerebras.svg' },
  elevenlabs: { displayName: 'ElevenLabs', logo: 'elevenlabs.svg' },
  google: { displayName: 'Google', logo: 'google.svg' },
  huggingface: { displayName: 'Hugging Face', logo: 'huggingface.svg' },
  litellm: { displayName: 'LiteLLM', logo: 'litellm.svg' },
  ollama: { displayName: 'Ollama', logo: 'ollama.svg' },
  openrouter: { displayName: 'OpenRouter', logo: 'openrouter.svg' },
  xai: { displayName: 'xAI', logo: 'xai.svg' },
};

/**
 * Complete list of all providers available in the Bifrost API
 * Last updated: 2026-01-20
 * Source: https://www.getmaxim.ai/bifrost/api/models
 *
 * This list should be periodically updated to include new providers.
 * To update, run:
 * curl -s https://www.getmaxim.ai/bifrost/api/models | \
 * python3 -c "import sys, json; providers = sorted(set(model.get('provider', 'unknown') for model in json.load(sys.stdin))); print('\n'.join(providers))"
 */
export const ALL_AVAILABLE_PROVIDERS = [
  'ai21',
  'aiml',
  'aleph_alpha',
  'amazon_nova',
  'anthropic',
  'anyscale',
  'assemblyai',
  'aws_polly',
  'azure',
  'azure_ai',
  'azure_text',
  'bedrock',
  'bedrock_converse',
  'cerebras',
  'cloudflare',
  'codestral',
  'cohere',
  'cohere_chat',
  'dashscope',
  'databricks',
  'dataforseo',
  'deepgram',
  'deepinfra',
  'deepseek',
  'elevenlabs',
  'exa_ai',
  'fal_ai',
  'featherless_ai',
  'firecrawl',
  'fireworks_ai',
  'fireworks_ai-embedding-models',
  'friendliai',
  'gemini',
  'gigachat',
  'github_copilot',
  'google_pse',
  'gradient_ai',
  'groq',
  'heroku',
  'hyperbolic',
  'jina_ai',
  'lambda_ai',
  'lemonade',
  'linkup',
  'llamagate',
  'meta_llama',
  'minimax',
  'mistral',
  'moonshot',
  'morph',
  'nlp_cloud',
  'novita',
  'nscale',
  'nvidia_nim',
  'oci',
  'ollama',
  'openai',
  'openrouter',
  'ovhcloud',
  'palm',
  'parallel_ai',
  'perplexity',
  'publicai',
  'recraft',
  'replicate',
  'runwayml',
  'sagemaker',
  'sambanova',
  'searxng',
  'snowflake',
  'stability',
  'tavily',
  'text-completion-codestral',
  'text-completion-openai',
  'together_ai',
  'v0',
  'vercel_ai_gateway',
  'vertex_ai',
  'vertex_ai-ai21_models',
  'vertex_ai-anthropic_models',
  'vertex_ai-chat-models',
  'vertex_ai-code-chat-models',
  'vertex_ai-code-text-models',
  'vertex_ai-deepseek_models',
  'vertex_ai-embedding-models',
  'vertex_ai-image-models',
  'vertex_ai-language-models',
  'vertex_ai-llama_models',
  'vertex_ai-minimax_models',
  'vertex_ai-mistral_models',
  'vertex_ai-moonshot_models',
  'vertex_ai-openai_models',
  'vertex_ai-qwen_models',
  'vertex_ai-text-models',
  'vertex_ai-video-models',
  'vertex_ai-vision-models',
  'vertex_ai-zai_models',
  'volcengine',
  'voyage',
  'wandb',
  'watsonx',
  'xai',
  'zai',
] as const;

/**
 * Whitelisted providers - only these will be included in the site
 *
 * To add a new provider:
 * 1. Check if it exists in ALL_AVAILABLE_PROVIDERS
 * 2. Add it to this array
 * 3. Rebuild the site to regenerate pages and sitemaps
 *
 * Popular providers to consider:
 * - Major cloud providers: openai, anthropic, google/gemini, azure, bedrock
 * - Open source: together_ai, fireworks_ai, replicate, groq
 * - Specialized: assemblyai (audio), stability (images), deepgram (audio)
 */
export const WHITELISTED_PROVIDERS = [
  // Major AI providers
  'openai',
  'anthropic',
  'gemini', // Google's Gemini models

  // Cloud platforms
  'azure',
  'vertex_ai',

  // Popular API providers
  'together_ai',
  // 'fireworks_ai',
  'groq',

  // Specialized providers
  'cohere',
  'mistral',
  'perplexity',
] as const;

/**
 * Type for whitelisted provider names
 */
export type WhitelistedProvider = typeof WHITELISTED_PROVIDERS[number];

/**
 * Type for all available provider names
 */
export type AvailableProvider = typeof ALL_AVAILABLE_PROVIDERS[number];

/**
 * Check if a provider is whitelisted
 */
export function isProviderWhitelisted(provider: string): boolean {
  return WHITELISTED_PROVIDERS.includes(provider as WhitelistedProvider);
}

/**
 * Get the whitelist as a Set for efficient lookups
 */
export function getWhitelistSet(): Set<string> {
  return new Set(WHITELISTED_PROVIDERS);
}

/**
 * Get statistics about available vs whitelisted providers
 */
export function getProviderStats() {
  return {
    total: ALL_AVAILABLE_PROVIDERS.length,
    whitelisted: WHITELISTED_PROVIDERS.length,
    percentage: ((WHITELISTED_PROVIDERS.length / ALL_AVAILABLE_PROVIDERS.length) * 100).toFixed(1),
  };
}

/**
 * Normalize provider name for consistent lookups
 */
function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Convert string to title case
 */
function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Fallback provider name formatter
 */
function formatProviderNameFallback(provider: string): string {
  const formatted = toTitleCase(provider.replace(/[_-]/g, ' '));
  return formatted.replace(/ai/gi, 'AI');
}

/**
 * Get provider metadata (display name and logo)
 */
export function getProviderMetadata(provider: string): ProviderMetadata {
  const normalized = normalizeProvider(provider);
  const metadata = PROVIDER_METADATA[normalized];

  if (metadata) {
    return metadata;
  }

  // Fallback for unknown providers
  return {
    displayName: formatProviderNameFallback(provider),
    logo: 'unknown.svg',
  };
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: string): string {
  return getProviderMetadata(provider).displayName;
}

/**
 * Get provider logo path
 */
export function getProviderLogo(provider: string): string {
  const metadata = getProviderMetadata(provider);
  return `/provider-logo/${metadata.logo}`;
}
