type ProviderInfo = {
  name: string;
  logo: string;
};

const PROVIDER_INFO: Record<string, ProviderInfo> = {
  anthropic: { name: 'Anthropic', logo: 'anthropic.svg' },
  aws: { name: 'AWS', logo: 'aws.svg' },
  'amazon-nova': { name: 'Amazon Nova', logo: 'aws.svg' },
  azure: { name: 'Azure', logo: 'azure.svg' },
  azure_ai: { name: 'Azure AI', logo: 'azure.svg' },
  bedrock: { name: 'Bedrock', logo: 'bedrock.svg' },
  bedrock_converse: { name: 'Bedrock', logo: 'bedrock.svg' },
  cerebras: { name: 'Cerebras', logo: 'cerebras.svg' },
  cohere: { name: 'Cohere', logo: 'cohere.svg' },
  elevenlabs: { name: 'ElevenLabs', logo: 'elevenlabs.svg' },
  fireworks: { name: 'Fireworks', logo: 'fireworks.svg' },
  google: { name: 'Google', logo: 'google.svg' },
  groq: { name: 'Groq', logo: 'groq.svg' },
  huggingface: { name: 'Hugging Face', logo: 'huggingface.svg' },
  litellm: { name: 'LiteLLM', logo: 'litellm.svg' },
  mistral: { name: 'Mistral', logo: 'mistral.svg' },
  ollama: { name: 'Ollama', logo: 'ollama.svg' },
  openai: { name: 'OpenAI', logo: 'openai.svg' },
  openrouter: { name: 'OpenRouter', logo: 'openrouter.svg' },
  perplexity: { name: 'Perplexity', logo: 'perplexity.svg' },
  together: { name: 'Together', logo: 'together.svg' },
  twilio: { name: 'Twilio', logo: 'twilio.svg' },
  vapi: { name: 'Vapi', logo: 'vapi.svg' },
  vertex: { name: 'Vertex', logo: 'vertex.svg' },
  xai: { name: 'xAI', logo: 'xai.svg' },
};

const FALLBACK_LOGO = 'unknown.svg';

function normalizeProvider(provider: string): string {
  return provider.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

function formatProviderNameFallback(provider: string): string {
  const formatted = toTitleCase(provider.replace(/[_-]/g, ' '));
  return formatted.replace(/ai/gi, 'AI');
}

export function getProviderInfo(provider: string): ProviderInfo {
  const normalized = normalizeProvider(provider);
  const info = PROVIDER_INFO[normalized];
  if (info) {
    return info;
  }
  return {
    name: formatProviderNameFallback(provider),
    logo: FALLBACK_LOGO,
  };
}

export function getProviderLogo(provider: string): string {
  const info = getProviderInfo(provider);
  return `/provider-logo/${info.logo}`;
}

export function getProviderDisplayName(provider: string): string {
  return getProviderInfo(provider).name;
}

