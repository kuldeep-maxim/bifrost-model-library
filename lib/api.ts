import { ModelEntry, ProcessedModel, ModelData } from '@/types/model';
import { isProviderWhitelisted, getProviderDisplayName } from '@/config/providers';

const BIFROST_API_URL = 'https://getbifrost.ai/datasheet';

/**
 * Check if a value is a valid number (not null, not undefined, and is a number)
 */
function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && value !== null;
}

/**
 * Convert string to title case for model names
 * Capitalizes the first letter of each word while preserving acronyms and numbers
 */
function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map(word => {
      // If word is all uppercase (acronym), keep it as is
      if (word === word.toUpperCase() && word.length > 1 && /^[A-Z]+$/.test(word)) {
        return word;
      }
      
      // If word contains numbers or special chars, capitalize first letter only
      if (/[0-9]/.test(word) || /[._-]/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Standard title case: capitalize first letter, lowercase rest
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Format provider name to title case
 * Handles underscores, hyphens, and other separators
 * Capitalizes "ai" as "AI" when present in the name (as a word or part of a word)
 */
export function formatProviderName(provider: string): string {
  return getProviderDisplayName(provider);
}

/**
 * Normalize cost per token to standard format (per token, not per million)
 * Some APIs provide costs already in per-million-token format (e.g., 0.015)
 * We normalize these to per-token format (e.g., 0.015 / 1000000 = 0.000000015)
 * Threshold: if value >= 0.001, treat as per-million-token and normalize
 */
function normalizeCostPerToken(cost: number | undefined): number | undefined {
  if (!isValidNumber(cost) || cost === undefined) {
    return undefined;
  }
  
  // If cost is >= 0.001, it's likely already per-million-token format
  // Normalize it to per-token format by dividing by 1 million
  if (cost >= 0.001) {
    return cost / 1000000;
  }
  
  // Otherwise, assume it's already in per-token format
  return cost;
}

export async function fetchAllModels(): Promise<ModelEntry> {
  try {
    const response = await fetch(BIFROST_API_URL, {
      next: { revalidate: 3600 }, // Revalidate every hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    
    const data: ModelEntry = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

export function processModels(models: ModelEntry, filterWhitelist: boolean = true): ProcessedModel[] {
  return Object.entries(models)
    .map(([id, data]) => {
      // Extract model name from ID (e.g., "openai/gpt-4" -> "gpt-4")
      const parts = id.split('/');
      const modelName = parts[parts.length - 1];

      // Discard entries without model name
      if (!modelName || modelName.trim() === '') {
        return null;
      }

      // Filter by provider whitelist if enabled
      if (filterWhitelist && !isProviderWhitelisted(data.provider)) {
        return null;
      }

      // Discard entries with empty or NA mode
      const mode = data.mode;
      if (!mode || mode.trim() === '' || mode.toLowerCase() === 'na' || mode.toLowerCase() === 'n/a') {
        return null;
      }

      // Normalize pricing to per-token format
      const normalizedData: ModelData = {
        ...data,
        input_cost_per_token: normalizeCostPerToken(data.input_cost_per_token),
        output_cost_per_token: normalizeCostPerToken(data.output_cost_per_token),
      };

      // Filter out models with incomplete essential data
      // A model must have at least ONE of these data points to be useful:
      // 1. Input/output pricing (for cost comparison)
      // 2. Max input tokens (for capacity planning)
      // 3. Max output tokens (for response length planning)
      const hasInputCost = normalizedData.input_cost_per_token != null || normalizedData.input_cost_per_image != null || normalizedData.input_cost_per_second != null;
      const hasOutputCost = normalizedData.output_cost_per_token != null || normalizedData.output_cost_per_image != null || normalizedData.output_cost_per_second != null;
      const hasPricing = hasInputCost || hasOutputCost;
      const hasInputTokens = normalizedData.max_input_tokens != null && normalizedData.max_input_tokens > 0;
      const hasOutputTokens = normalizedData.max_output_tokens != null && normalizedData.max_output_tokens > 0;
      const hasContextLength = normalizedData.context_length != null && normalizedData.context_length > 0;

      // Skip models that have no useful data
      if (!hasPricing && !hasInputTokens && !hasOutputTokens && !hasContextLength) {
        return null;
      }

      // Use model name as-is without title case conversion
      const displayName = modelName;

      // Create URL-friendly slug from model name only (for nested routes)
      // Replace both : and @ with - for URL safety
      const slug = modelName.replace(/[:@]/g, '-').toLowerCase();

      return {
        id,
        name: modelName,
        provider: normalizedData.provider,
        data: normalizedData,
        slug,
        displayName,
      };
    })
    .filter((model): model is ProcessedModel => model !== null);
}

export function getModelById(models: ModelEntry, modelId: string, filterWhitelist: boolean = true): ProcessedModel | null {
  const modelData = models[modelId];
  if (!modelData) return null;

  // Filter by provider whitelist if enabled
  if (filterWhitelist && !isProviderWhitelisted(modelData.provider)) {
    return null;
  }

  const parts = modelId.split('/');
  const modelName = parts[parts.length - 1];

  // Discard entries without model name
  if (!modelName || modelName.trim() === '') {
    return null;
  }

  // Normalize pricing to per-token format
  const normalizedData = {
    ...modelData,
    input_cost_per_token: normalizeCostPerToken(modelData.input_cost_per_token),
    output_cost_per_token: normalizeCostPerToken(modelData.output_cost_per_token),
  };

  // Use model name as-is without title case conversion
  const displayName = modelName;
  // Replace both : and @ with - for URL safety
  const slug = modelName.replace(/[:@]/g, '-').toLowerCase();

  return {
    id: modelId,
    name: modelName,
    provider: normalizedData.provider,
    data: normalizedData,
    slug,
    displayName,
  };
}

export function getModelBySlug(models: ModelEntry, slug: string, provider?: string): ProcessedModel | null {
  // Search for model by slug (model name) and optionally by provider
  const lowerSlug = slug.toLowerCase();
  
  for (const [id, data] of Object.entries(models)) {
    // Extract model name from ID
    const parts = id.split('/');
    const modelName = parts[parts.length - 1];
    // Replace both : and @ with - to match slug generation
    const modelSlug = modelName.replace(/[:@]/g, '-').toLowerCase();
    
    // Match slug and optionally provider
    if (modelSlug === lowerSlug) {
      // If provider is specified, it must match
      if (provider && data.provider.toLowerCase() !== provider.toLowerCase()) {
        continue;
      }
      
      const model = getModelById(models, id);
      // getModelById already filters out invalid models
      if (model) {
        return model;
      }
    }
  }
  
  return null;
}

export function getModelsByName(models: ModelEntry, modelName: string): ProcessedModel[] {
  const processed = processModels(models);
  return processed.filter(model => 
    model.name.toLowerCase() === modelName.toLowerCase() ||
    model.displayName.toLowerCase() === modelName.toLowerCase()
  );
}

export function getModelsByDisplayName(models: ModelEntry, displayName: string): ProcessedModel[] {
  const processed = processModels(models);
  return processed.filter(model => 
    model.displayName.toLowerCase() === displayName.toLowerCase()
  );
}

export function getModelsByProvider(models: ModelEntry, provider: string): ProcessedModel[] {
  return processModels(models).filter(model => 
    model.provider.toLowerCase() === provider.toLowerCase()
  );
}

export function getModelsByMode(models: ModelEntry, mode: string): ProcessedModel[] {
  return processModels(models).filter(model => 
    model.data.mode === mode
  );
}

export function getAllProviders(models: ModelEntry, filterWhitelist: boolean = true): string[] {
  // First, get all valid models (with names and pricing), optionally filtered by whitelist
  const validModels = processModels(models, filterWhitelist);

  // Get unique providers from valid models only
  const providers = new Set<string>();
  validModels.forEach(model => {
    if (model.provider) {
      providers.add(model.provider);
    }
  });
  return Array.from(providers).sort();
}

export function getAllModes(models: ModelEntry): string[] {
  // Use processed models to ensure we only count modes from valid models
  const validModels = processModels(models);
  
  // Get unique modes from valid models only, filtering out empty/invalid modes
  // Count all modes that exist in the processed models (not just those in ModelMode type)
  // This ensures the count matches what's displayed in the UI
  const modes = new Set<string>();
  validModels.forEach(model => {
    const mode = model.data.mode;
    // Only include non-empty modes (don't restrict to ModelMode type since API has more modes)
    if (mode && typeof mode === 'string' && mode.trim() !== '') {
      modes.add(mode);
    }
  });
  return Array.from(modes).sort();
}

