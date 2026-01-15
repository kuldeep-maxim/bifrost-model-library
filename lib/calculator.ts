import { ModelData, ModelMode } from '@/types/model';

export interface CalculationInput {
  inputTokens?: number;
  outputTokens?: number;
  images?: number;
  seconds?: number;
  pages?: number;
}

export interface CalculationResult {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  breakdown: {
    input?: number;
    output?: number;
    images?: number;
    audio?: number;
    video?: number;
    ocr?: number;
  };
}

export function calculateCost(
  modelData: ModelData,
  input: CalculationInput
): CalculationResult {
  const breakdown: CalculationResult['breakdown'] = {};
  let inputCost = 0;
  let outputCost = 0;

  const mode = modelData.mode;

  // Chat / Responses mode - token-based pricing
  if (mode === 'chat' || mode === 'responses') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
    if (modelData.output_cost_per_token && input.outputTokens) {
      outputCost = modelData.output_cost_per_token * input.outputTokens;
      breakdown.output = outputCost;
    }
    
    // Handle image costs in chat mode (vision models)
    if (modelData.input_cost_per_image && input.images) {
      const imageCost = modelData.input_cost_per_image * input.images;
      inputCost += imageCost;
      breakdown.images = imageCost;
    }
  }

  // Image generation mode
  if (mode === 'image_generation') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
    if (modelData.output_cost_per_image && input.images) {
      outputCost = modelData.output_cost_per_image * input.images;
      breakdown.images = outputCost;
    }
  }

  // Audio transcription mode
  if (mode === 'audio_transcription') {
    // Prefer token-based pricing when available (most transcription models in our dataset)
    const hasTokenPricing =
      !!modelData.input_cost_per_token || !!modelData.output_cost_per_token;

    if (hasTokenPricing) {
      if (modelData.input_cost_per_token && input.inputTokens) {
        inputCost = modelData.input_cost_per_token * input.inputTokens;
        breakdown.input = inputCost;
      }
      if (modelData.output_cost_per_token && input.outputTokens) {
        outputCost = modelData.output_cost_per_token * input.outputTokens;
        breakdown.output = outputCost;
      }
    } else {
      // Fallback: per-second pricing (if present in the future)
      if (modelData.input_cost_per_second && input.seconds) {
        inputCost = modelData.input_cost_per_second * input.seconds;
        breakdown.audio = inputCost;
      }
      if (modelData.output_cost_per_second && input.seconds) {
        outputCost = modelData.output_cost_per_second * input.seconds;
        breakdown.audio = (breakdown.audio || 0) + outputCost;
      }
    }
  }

  // Audio generation / Voice mode
  if (mode === 'audio_generation' || mode === 'voice') {
    if (modelData.input_cost_per_second && input.seconds) {
      inputCost = modelData.input_cost_per_second * input.seconds;
      breakdown.audio = inputCost;
    }
    if (modelData.output_cost_per_second && input.seconds) {
      outputCost = modelData.output_cost_per_second * input.seconds;
      breakdown.audio = (breakdown.audio || 0) + outputCost;
    }
  }

  // Video generation mode
  if (mode === 'video_generation') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
    if (modelData.output_cost_per_second && input.seconds) {
      outputCost = modelData.output_cost_per_second * input.seconds;
      breakdown.video = outputCost;
    }
  }

  // OCR mode
  if (mode === 'ocr') {
    if (modelData.ocr_cost_per_page && input.pages) {
      inputCost = modelData.ocr_cost_per_page * input.pages;
      breakdown.ocr = inputCost;
    }
    if (modelData.input_cost_per_token && input.inputTokens) {
      const tokenCost = modelData.input_cost_per_token * input.inputTokens;
      inputCost += tokenCost;
      breakdown.input = (breakdown.input || 0) + tokenCost;
    }
    if (modelData.output_cost_per_token && input.outputTokens) {
      outputCost = modelData.output_cost_per_token * input.outputTokens;
      breakdown.output = outputCost;
    }
  }

  // Embedding mode
  if (mode === 'embedding') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
  }

  // Rerank mode
  if (mode === 'rerank') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
    if (modelData.output_cost_per_token && input.outputTokens) {
      outputCost = modelData.output_cost_per_token * input.outputTokens;
      breakdown.output = outputCost;
    }
  }

  // Completion mode - token-based pricing (similar to chat)
  if (mode === 'completion') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
    if (modelData.output_cost_per_token && input.outputTokens) {
      outputCost = modelData.output_cost_per_token * input.outputTokens;
      breakdown.output = outputCost;
    }
  }

  // Audio speech mode - uses input tokens, output tokens, and output seconds
  if (mode === 'audio_speech') {
    if (modelData.input_cost_per_token && input.inputTokens) {
      inputCost = modelData.input_cost_per_token * input.inputTokens;
      breakdown.input = inputCost;
    }
    if (modelData.output_cost_per_token && input.outputTokens) {
      const tokenOutputCost = modelData.output_cost_per_token * input.outputTokens;
      outputCost += tokenOutputCost;
      breakdown.output = (breakdown.output || 0) + tokenOutputCost;
    }
    if (modelData.output_cost_per_second && input.seconds) {
      const audioOutputCost = modelData.output_cost_per_second * input.seconds;
      outputCost += audioOutputCost;
      breakdown.audio = audioOutputCost;
    }
  }

  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    breakdown,
  };
}

export function formatCurrency(amount: number): string {
  // Always show full decimal representation without abbreviations
  if (amount < 0.000001) {
    // For very small amounts, show up to 10 decimal places
    return `$${amount.toFixed(10)}`;
  }
  if (amount < 0.001) {
    // For small amounts, show up to 8 decimal places
    return `$${amount.toFixed(8)}`;
  }
  if (amount < 1) {
    // For amounts less than 1, show 6 decimal places
    return `$${amount.toFixed(6)}`;
  }
  // For amounts >= 1, show 2 decimal places
  return `$${amount.toFixed(2)}`;
}

/**
 * Convert a string to sentence case (first letter of first word uppercase, rest lowercase)
 * Handles underscores and hyphens by converting them to spaces
 * Preserves acronyms (all uppercase) and common proper nouns
 */
function toSentenceCase(str: string): string {
  if (!str || str.trim() === '') return str;
  
  // Replace underscores and hyphens with spaces
  const withSpaces = str.replace(/[_-]/g, ' ');
  
  // Split by spaces and process each word
  const words = withSpaces.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 0) return str;
  
  // Common acronyms that should stay uppercase
  const acronyms = new Set(['ocr', 'api', 'ai', 'llm', 'nlp', 'gpt', 'claude']);
  
  // Common proper nouns that should be capitalized (for modes)
  const properNouns = new Set(['transcription', 'generation', 'completion']);
  
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      
      // Acronyms: keep uppercase
      if (acronyms.has(lower) && word.length <= 5) {
        return word.toUpperCase();
      }
      
      // First word: capitalize first letter
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Proper nouns: capitalize first letter
      if (properNouns.has(lower)) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      
      // Other words: lowercase
      return lower;
    })
    .join(' ');
}

export function getModeDisplayName(mode: string): string {
  if (!mode || mode.trim() === '') return mode;
  
  // Convert to sentence case
  return toSentenceCase(mode);
}

