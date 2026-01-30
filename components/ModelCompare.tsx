'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ProcessedModel } from '@/types/model';
import { formatProviderName } from '@/lib/api';
import { getModeDisplayName } from '@/lib/calculator';
import { getProviderLogo } from '@/lib/providerLogos';
import { formatNumber, formatTokenCount } from '@/lib/format';
import CTA2 from './CTA2';

type ModeFamily =
  | 'text'
  | 'embedding'
  | 'rerank'
  | 'image'
  | 'video'
  | 'ocr'
  | 'audio_transcription'
  | 'audio_generation'
  | 'other';

const MODE_FAMILY: Record<string, ModeFamily> = {
  chat: 'text',
  responses: 'text',
  completion: 'text',
  embedding: 'embedding',
  rerank: 'rerank',
  image_generation: 'image',
  video_generation: 'video',
  ocr: 'ocr',
  audio_transcription: 'audio_transcription',
  audio_generation: 'audio_generation',
  audio_speech: 'audio_generation',
  voice: 'audio_generation',
};

function getModeFamily(mode: string): ModeFamily {
  return MODE_FAMILY[mode] || 'other';
}

function formatPriceLine(label: string, value: number, unit: string) {
  return `${label}: $${value.toFixed(4)} ${unit}`;
}

function getPricingLines(model: ProcessedModel): string[] {
  const lines: string[] = [];
  const data = model.data;

  if (data.input_cost_per_token != null) {
    lines.push(`Input: $${(data.input_cost_per_token * 1_000_000).toFixed(2)} / 1M tokens`);
  }
  if (data.output_cost_per_token != null) {
    lines.push(`Output: $${(data.output_cost_per_token * 1_000_000).toFixed(2)} / 1M tokens`);
  }
  if (data.input_cost_per_image != null) {
    lines.push(formatPriceLine('Input image', data.input_cost_per_image, '/ image'));
  }
  if (data.output_cost_per_image != null) {
    lines.push(formatPriceLine('Output image', data.output_cost_per_image, '/ image'));
  }
  if (data.input_cost_per_second != null) {
    lines.push(formatPriceLine('Input seconds', data.input_cost_per_second, '/ second'));
  }
  if (data.output_cost_per_second != null) {
    lines.push(formatPriceLine('Output seconds', data.output_cost_per_second, '/ second'));
  }
  if (data.ocr_cost_per_page != null) {
    lines.push(formatPriceLine('OCR', data.ocr_cost_per_page, '/ page'));
  }

  return lines;
}

function formatTokens(value?: number) {
  if (!value) return '—';
  return formatTokenCount(value);
}

function ModelHeader({ model }: { model: ProcessedModel }) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={getProviderLogo(model.provider)}
        alt={`${formatProviderName(model.provider)} logo`}
        className="w-8 h-8 object-contain"
        loading="lazy"
      />
      <div>
        <div className="text-lg font-semibold text-gray-900">{model.displayName}</div>
        <div className="text-sm text-gray-600">
          {formatProviderName(model.provider)} • {getModeDisplayName(model.data.mode)}
        </div>
      </div>
    </div>
  );
}

function CapabilitiesList({ model }: { model: ProcessedModel }) {
  const caps = [
    model.data.supports_function_calling ? 'Function calling' : null,
    model.data.supports_vision ? 'Vision' : null,
    model.data.supports_reasoning ? 'Reasoning' : null,
    model.data.supports_web_search ? 'Web search' : null,
    model.data.supports_audio_input ? 'Audio input' : null,
    model.data.supports_audio_output ? 'Audio output' : null,
  ].filter(Boolean) as string[];

  if (!caps.length) return <span className="text-gray-400">—</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {caps.map((cap) => (
        <span key={cap} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded whitespace-nowrap">
          {cap}
        </span>
      ))}
    </div>
  );
}

interface ModelCompareProps {
  initialLeftId?: string;
  initialRightId?: string;
  initialLeftModel?: ProcessedModel | null;
  initialRightModel?: ProcessedModel | null;
}

function getComparePath(left: ProcessedModel, right?: ProcessedModel | null) {
  if (!right) {
    return `/compare/${encodeURIComponent(left.provider)}/${left.slug}`;
  }
  return `/compare/${encodeURIComponent(left.provider)}/${left.slug}?compare=${encodeURIComponent(right.provider)}/${right.slug}`;
}

function PricingBlock({ model }: { model: ProcessedModel }) {
  const lines = getPricingLines(model);
  return lines.length ? (
    <ul className="text-sm text-gray-700 space-y-1">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  ) : (
    <span className="text-sm text-gray-400">—</span>
  );
}

function LimitsBlock({ model }: { model: ProcessedModel }) {
  return (
    <div className="text-sm text-gray-700 space-y-1">
      <div>Max input: {formatTokens(model.data.max_input_tokens)}</div>
      <div>Max output: {formatTokens(model.data.max_output_tokens)}</div>
      <div>Max tokens: {formatTokens(model.data.max_tokens)}</div>
    </div>
  );
}

function formatPerMillion(value?: number) {
  if (value == null) return '—';
  return `$${(value * 1_000_000).toFixed(2)}/M`;
}

function formatUnitCost(value?: number, unit?: string) {
  if (value == null) return '—';
  return `$${value.toFixed(4)}${unit ? `/${unit}` : ''}`;
}

function getPrimaryInputCost(model: ProcessedModel) {
  if (model.data.input_cost_per_token != null) {
    return formatPerMillion(model.data.input_cost_per_token);
  }
  if (model.data.input_cost_per_image != null) {
    return formatUnitCost(model.data.input_cost_per_image, 'image');
  }
  if (model.data.input_cost_per_second != null) {
    return formatUnitCost(model.data.input_cost_per_second, 'sec');
  }
  if (model.data.ocr_cost_per_page != null) {
    return formatUnitCost(model.data.ocr_cost_per_page, 'page');
  }
  return '—';
}

function getPrimaryOutputCost(model: ProcessedModel) {
  if (model.data.output_cost_per_token != null) {
    return formatPerMillion(model.data.output_cost_per_token);
  }
  if (model.data.output_cost_per_image != null) {
    return formatUnitCost(model.data.output_cost_per_image, 'image');
  }
  if (model.data.output_cost_per_second != null) {
    return formatUnitCost(model.data.output_cost_per_second, 'sec');
  }
  return '—';
}

function inferInputModalities(model: ProcessedModel): string[] {
  if (model.data.supported_modalities?.length) return model.data.supported_modalities;

  const mode = model.data.mode;
  if (mode === 'image_generation' || mode === 'ocr') return ['Image'];
  if (mode === 'audio_transcription' || mode === 'audio_generation' || mode === 'audio_speech' || mode === 'voice') return ['Audio'];
  return ['Text'];
}

function inferOutputModalities(model: ProcessedModel): string[] {
  if (model.data.supported_output_modalities?.length) return model.data.supported_output_modalities;

  const mode = model.data.mode;
  if (mode === 'image_generation') return ['Image'];
  if (mode === 'video_generation') return ['Video'];
  if (mode === 'audio_generation' || mode === 'audio_speech' || mode === 'voice') return ['Audio'];
  if (mode === 'ocr' || mode === 'audio_transcription') return ['Text'];
  return ['Text'];
}

function formatModalities(modalities: string[]) {
  return modalities.length ? modalities.join(', ') : '—';
}

function formatYesNo(value?: boolean) {
  if (value == null) return '—';
  return value ? 'Yes' : 'No';
}

function formatList(values?: string[]) {
  return values && values.length ? values.join(', ') : '—';
}

function getModesDisplay(model: ProcessedModel) {
  const modeList =
    model.data.modes?.length ? model.data.modes : model.data.supported_modes?.length ? model.data.supported_modes : null;

  if (modeList && modeList.length) {
    const uniqueModes = Array.from(new Set(modeList));
    return uniqueModes.map((mode) => getModeDisplayName(mode)).join(', ');
  }

  return getModeDisplayName(model.data.mode);
}

function hasValue(value: unknown) {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function shouldShowRow(leftValue: unknown, rightValue: unknown) {
  return hasValue(leftValue) || hasValue(rightValue);
}

function getContextLength(model: ProcessedModel) {
  return (
    model.data.max_input_tokens ||
    model.data.max_tokens ||
    0
  );
}

function formatK(value: number) {
  if (!value) return '—';
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return formatNumber(value);
}

export default function ModelCompare({
  initialLeftId,
  initialRightId,
  initialLeftModel,
  initialRightModel,
}: ModelCompareProps) {
  const router = useRouter();
  const [models, setModels] = useState<ProcessedModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [leftId, setLeftId] = useState<string | null>(
    initialLeftId || initialLeftModel?.id || null
  );
  const [rightId, setRightId] = useState<string | null>(
    initialRightId || initialRightModel?.id || null
  );

  const [leftQuery, setLeftQuery] = useState('');
  const [rightQuery, setRightQuery] = useState('');
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);
  const leftDropdownRef = useRef<HTMLDivElement>(null);
  const rightDropdownRef = useRef<HTMLDivElement>(null);
  const comparisonTableRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('/api/models');
        if (!res.ok) {
          throw new Error(`Failed to load models (${res.status})`);
        }
        const data = (await res.json()) as ProcessedModel[];
        setModels(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load models');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const leftModel = useMemo(() => {
    if (models.length > 0) {
      return models.find((m) => m.id === leftId) || null;
    }
    return initialLeftModel || null;
  }, [models, leftId, initialLeftModel]);

  const rightModel = useMemo(() => {
    if (models.length > 0) {
      return models.find((m) => m.id === rightId) || null;
    }
    return initialRightModel || null;
  }, [models, rightId, initialRightModel]);

  const leftSelectedLabel = leftModel
    ? `${formatProviderName(leftModel.provider)}: ${leftModel.displayName}`
    : '';
  const rightSelectedLabel = rightModel
    ? `${formatProviderName(rightModel.provider)}: ${rightModel.displayName}`
    : '';

  const leftFamily = leftModel ? getModeFamily(leftModel.data.mode) : null;
  const rightFamily = rightModel ? getModeFamily(rightModel.data.mode) : null;
  const isComparable =
    leftModel && rightModel ? leftFamily === rightFamily : false;

  const leftContextValue = leftModel ? getContextLength(leftModel) : 0;
  const rightContextValue = rightModel ? getContextLength(rightModel) : 0;
  const leftInputCostValue =
    leftModel?.data.input_cost_per_token ??
    leftModel?.data.input_cost_per_image ??
    leftModel?.data.input_cost_per_second ??
    leftModel?.data.ocr_cost_per_page;
  const rightInputCostValue =
    rightModel?.data.input_cost_per_token ??
    rightModel?.data.input_cost_per_image ??
    rightModel?.data.input_cost_per_second ??
    rightModel?.data.ocr_cost_per_page;
  const leftOutputCostValue =
    leftModel?.data.output_cost_per_token ??
    leftModel?.data.output_cost_per_image ??
    leftModel?.data.output_cost_per_second;
  const rightOutputCostValue =
    rightModel?.data.output_cost_per_token ??
    rightModel?.data.output_cost_per_image ??
    rightModel?.data.output_cost_per_second;
  const leftModesValue = leftModel?.data.modes ?? leftModel?.data.supported_modes ?? leftModel?.data.mode;
  const rightModesValue = rightModel?.data.modes ?? rightModel?.data.supported_modes ?? rightModel?.data.mode;

  const capabilityDefinitions = [
    { key: 'supports_function_calling', label: 'Function Calling' },
    { key: 'supports_vision', label: 'Vision' },
    { key: 'supports_reasoning', label: 'Reasoning' },
    { key: 'supports_web_search', label: 'Web Search' },
    { key: 'supports_audio_input', label: 'Audio Input' },
    { key: 'supports_audio_output', label: 'Audio Output' },
    { key: 'supports_tool_choice', label: 'Tool Choice' },
    { key: 'supports_response_schema', label: 'Response Schema' },
    { key: 'supports_parallel_function_calling', label: 'Parallel Function Calling' },
    { key: 'supports_prompt_caching', label: 'Prompt Caching' },
    { key: 'supports_system_messages', label: 'System Messages' },
  ] as const;

  const buildModelFacts = (model: ProcessedModel) => {
    const inputCostRaw =
      model.data.input_cost_per_token ??
      model.data.input_cost_per_image ??
      model.data.input_cost_per_second ??
      model.data.ocr_cost_per_page;
    const outputCostRaw =
      model.data.output_cost_per_token ??
      model.data.output_cost_per_image ??
      model.data.output_cost_per_second;

    const contextLength = getContextLength(model);
    const facts: Array<{ category: string; items: string[] }> = [];

    // Provider and mode information
    const basicInfo: string[] = [];
    basicInfo.push(`${model.displayName} is a ${getModesDisplay(model).toLowerCase()} model provided by ${formatProviderName(model.provider)}.`);

    if (contextLength > 0) {
      if (contextLength >= 1000000) {
        basicInfo.push(`This model offers an exceptional context window of ${formatK(contextLength)} tokens, making it ideal for processing extensive documents, long conversations, or large codebases.`);
      } else if (contextLength >= 100000) {
        basicInfo.push(`With a context window of ${formatK(contextLength)} tokens, this model can handle substantial inputs such as detailed documents or extended conversation histories.`);
      } else if (contextLength >= 32000) {
        basicInfo.push(`The model supports a ${formatK(contextLength)}-token context window, suitable for moderate-sized documents and multi-turn conversations.`);
      } else {
        basicInfo.push(`This model has a context capacity of ${formatK(contextLength)} tokens.`);
      }
    }

    if (basicInfo.length > 0) {
      facts.push({ category: 'Overview', items: basicInfo });
    }

    // Pricing information
    const pricingInfo: string[] = [];
    if (model.data.input_cost_per_token != null) {
      const costPer1M = (model.data.input_cost_per_token * 1_000_000).toFixed(2);
      pricingInfo.push(`Input processing costs $${costPer1M} per million tokens.`);
    }
    if (model.data.output_cost_per_token != null) {
      const costPer1M = (model.data.output_cost_per_token * 1_000_000).toFixed(2);
      pricingInfo.push(`Output generation costs $${costPer1M} per million tokens.`);
    }
    if (model.data.input_cost_per_image != null) {
      pricingInfo.push(`Image input processing is priced at $${model.data.input_cost_per_image.toFixed(4)} per image.`);
    }
    if (model.data.output_cost_per_image != null) {
      pricingInfo.push(`Image generation costs $${model.data.output_cost_per_image.toFixed(4)} per image.`);
    }
    if (model.data.input_cost_per_second != null) {
      pricingInfo.push(`Audio input processing costs $${model.data.input_cost_per_second.toFixed(4)} per second.`);
    }
    if (model.data.output_cost_per_second != null) {
      pricingInfo.push(`Audio or video output generation costs $${model.data.output_cost_per_second.toFixed(4)} per second.`);
    }
    if (model.data.ocr_cost_per_page != null) {
      pricingInfo.push(`OCR processing is priced at $${model.data.ocr_cost_per_page.toFixed(4)} per page.`);
    }

    if (pricingInfo.length > 0) {
      facts.push({ category: 'Pricing', items: pricingInfo });
    }

    // Token limits
    const limitsInfo: string[] = [];
    if (model.data.max_output_tokens) {
      limitsInfo.push(`The model can generate up to ${formatK(model.data.max_output_tokens)} tokens in a single response.`);
    }
    if (model.data.max_query_tokens) {
      limitsInfo.push(`Query operations support up to ${formatK(model.data.max_query_tokens)} tokens.`);
    }

    if (limitsInfo.length > 0) {
      facts.push({ category: 'Output Capabilities', items: limitsInfo });
    }

    // Endpoints and support
    const supportInfo: string[] = [];
    if (model.data.supported_endpoints && model.data.supported_endpoints.length > 0) {
      supportInfo.push(`Available through the following endpoints: ${formatList(model.data.supported_endpoints)}.`);
    }
    if (model.data.deprecation_date) {
      supportInfo.push(`Please note: This model is scheduled for deprecation on ${model.data.deprecation_date}.`);
    }

    if (supportInfo.length > 0) {
      facts.push({ category: 'Availability', items: supportInfo });
    }

    return facts;
  };

  const buildCapabilityRows = (model: ProcessedModel) => {
    const capabilities: string[] = [];
    const data = model.data;

    if (data.supports_function_calling) {
      capabilities.push('Supports function calling, enabling integration with external tools and APIs for extended functionality.');
    }
    if (data.supports_vision) {
      capabilities.push('Includes vision capabilities to process and analyze images alongside text inputs.');
    }
    if (data.supports_reasoning) {
      capabilities.push('Features advanced reasoning capabilities for complex problem-solving and multi-step logical tasks.');
    }
    if (data.supports_web_search) {
      capabilities.push('Provides web search integration for accessing real-time information and current data.');
    }
    if (data.supports_audio_input) {
      capabilities.push('Accepts audio input, allowing for voice-based interactions and audio processing.');
    }
    if (data.supports_audio_output) {
      capabilities.push('Generates audio output for text-to-speech and voice response applications.');
    }
    if (data.supports_tool_choice) {
      capabilities.push('Allows explicit tool selection, giving developers fine-grained control over function execution.');
    }
    if (data.supports_response_schema) {
      capabilities.push('Supports structured response schemas for consistent, predictable output formatting.');
    }
    if (data.supports_parallel_function_calling) {
      capabilities.push('Enables parallel function calling to execute multiple operations simultaneously for improved efficiency.');
    }
    if (data.supports_prompt_caching) {
      capabilities.push('Implements prompt caching to reduce costs and latency for repeated or similar queries.');
    }
    if (data.supports_system_messages) {
      capabilities.push('Supports system messages for customizing model behavior and setting operational parameters.');
    }

    return capabilities;
  };

  const buildComparisonAnalysis = useMemo(() => {
    if (!leftModel || !rightModel) return null;

    const analysis: Array<{ title: string; content: string }> = [];

    // Context window comparison
    if (leftContextValue && rightContextValue && leftContextValue !== rightContextValue) {
      const larger = leftContextValue > rightContextValue ? leftModel : rightModel;
      const smaller = leftContextValue > rightContextValue ? rightModel : leftModel;
      const largerValue = Math.max(leftContextValue, rightContextValue);
      const smallerValue = Math.min(leftContextValue, rightContextValue);
      const ratio = (largerValue / smallerValue).toFixed(1);

      let contextAnalysis = `${larger.displayName} offers a ${formatK(largerValue)}-token context window, which is ${ratio}x larger than ${smaller.displayName}'s ${formatK(smallerValue)}-token capacity. `;

      if (largerValue >= 200000) {
        contextAnalysis += 'This substantial difference makes it significantly better suited for processing lengthy documents, extensive codebases, or maintaining long conversation histories.';
      } else if (largerValue >= 100000) {
        contextAnalysis += 'This advantage allows for handling larger inputs such as comprehensive reports, extended dialogues, or substantial code repositories.';
      } else {
        contextAnalysis += 'This difference may be relevant when working with moderately sized documents or multi-turn conversations.';
      }

      analysis.push({
        title: 'Context Window Capacity',
        content: contextAnalysis
      });
    }

    // Pricing comparison
    if (leftInputCostValue != null && rightInputCostValue != null && leftInputCostValue !== rightInputCostValue) {
      const cheaper = leftInputCostValue < rightInputCostValue ? leftModel : rightModel;
      const moreExpensive = leftInputCostValue < rightInputCostValue ? rightModel : leftModel;
      const cheaperCost = Math.min(leftInputCostValue, rightInputCostValue);
      const expensiveCost = Math.max(leftInputCostValue, rightInputCostValue);

      let percentDiff = 0;
      if (cheaperCost > 0) {
        percentDiff = ((expensiveCost - cheaperCost) / cheaperCost * 100);
      }

      let pricingAnalysis = '';
      if (leftModel.data.input_cost_per_token != null || rightModel.data.input_cost_per_token != null) {
        const cheaperCostPer1M = (cheaperCost * 1_000_000).toFixed(2);
        const expensiveCostPer1M = (expensiveCost * 1_000_000).toFixed(2);
        pricingAnalysis = `${cheaper.displayName} has more competitive input pricing at $${cheaperCostPer1M} per million tokens, compared to ${moreExpensive.displayName}'s $${expensiveCostPer1M} per million tokens`;
      } else {
        pricingAnalysis = `${cheaper.displayName} offers lower input costs at ${getPrimaryInputCost(cheaper)}, compared to ${moreExpensive.displayName} at ${getPrimaryInputCost(moreExpensive)}`;
      }

      if (percentDiff > 0) {
        pricingAnalysis += ` — approximately ${percentDiff.toFixed(0)}% more cost-effective`;
      }
      pricingAnalysis += '. This difference becomes significant in high-volume applications or when processing large amounts of input data.';

      analysis.push({
        title: 'Input Cost Comparison',
        content: pricingAnalysis
      });
    }

    // Output cost comparison
    if (leftOutputCostValue != null && rightOutputCostValue != null && leftOutputCostValue !== rightOutputCostValue) {
      const cheaper = leftOutputCostValue < rightOutputCostValue ? leftModel : rightModel;
      const moreExpensive = leftOutputCostValue < rightOutputCostValue ? rightModel : leftModel;
      const cheaperCost = Math.min(leftOutputCostValue, rightOutputCostValue);
      const expensiveCost = Math.max(leftOutputCostValue, rightOutputCostValue);

      let percentDiff = 0;
      if (cheaperCost > 0) {
        percentDiff = ((expensiveCost - cheaperCost) / cheaperCost * 100);
      }

      let outputAnalysis = '';
      if (leftModel.data.output_cost_per_token != null || rightModel.data.output_cost_per_token != null) {
        const cheaperCostPer1M = (cheaperCost * 1_000_000).toFixed(2);
        const expensiveCostPer1M = (expensiveCost * 1_000_000).toFixed(2);
        outputAnalysis = `For generated content, ${cheaper.displayName} is more economical at $${cheaperCostPer1M} per million output tokens versus ${moreExpensive.displayName}'s $${expensiveCostPer1M} per million tokens`;
      } else {
        outputAnalysis = `${cheaper.displayName} provides better value for output generation at ${getPrimaryOutputCost(cheaper)}, compared to ${moreExpensive.displayName} at ${getPrimaryOutputCost(moreExpensive)}`;
      }

      if (percentDiff > 0) {
        outputAnalysis += ` (${percentDiff.toFixed(0)}% difference)`;
      }
      outputAnalysis += '. Consider this when your use case involves generating substantial amounts of text or requires frequent model responses.';

      analysis.push({
        title: 'Output Generation Costs',
        content: outputAnalysis
      });
    }

    // Output capacity comparison
    if (leftModel.data.max_output_tokens && rightModel.data.max_output_tokens &&
      leftModel.data.max_output_tokens !== rightModel.data.max_output_tokens) {
      const larger = leftModel.data.max_output_tokens > rightModel.data.max_output_tokens ? leftModel : rightModel;
      const smaller = leftModel.data.max_output_tokens > rightModel.data.max_output_tokens ? rightModel : leftModel;
      const largerTokens = Math.max(leftModel.data.max_output_tokens, rightModel.data.max_output_tokens);
      const smallerTokens = Math.min(leftModel.data.max_output_tokens, rightModel.data.max_output_tokens);

      const outputAnalysis = `${larger.displayName} supports generating up to ${formatK(largerTokens)} tokens in a single response, while ${smaller.displayName} is limited to ${formatK(smallerTokens)} tokens. This ${formatK(largerTokens - smallerTokens)}-token advantage makes ${larger.displayName} better suited for tasks requiring longer outputs such as comprehensive reports, detailed code generation, or extensive creative writing.`;

      analysis.push({
        title: 'Maximum Output Length',
        content: outputAnalysis
      });
    }

    // Capability differences
    const leftCapabilities = new Set<string>();
    const rightCapabilities = new Set<string>();

    if (leftModel.data.supports_function_calling) leftCapabilities.add('function_calling');
    if (rightModel.data.supports_function_calling) rightCapabilities.add('function_calling');
    if (leftModel.data.supports_vision) leftCapabilities.add('vision');
    if (rightModel.data.supports_vision) rightCapabilities.add('vision');
    if (leftModel.data.supports_reasoning) leftCapabilities.add('reasoning');
    if (rightModel.data.supports_reasoning) rightCapabilities.add('reasoning');
    if (leftModel.data.supports_web_search) leftCapabilities.add('web_search');
    if (rightModel.data.supports_web_search) rightCapabilities.add('web_search');
    if (leftModel.data.supports_audio_input) leftCapabilities.add('audio_input');
    if (rightModel.data.supports_audio_input) rightCapabilities.add('audio_input');
    if (leftModel.data.supports_audio_output) leftCapabilities.add('audio_output');
    if (rightModel.data.supports_audio_output) rightCapabilities.add('audio_output');
    if (leftModel.data.supports_prompt_caching) leftCapabilities.add('prompt_caching');
    if (rightModel.data.supports_prompt_caching) rightCapabilities.add('prompt_caching');

    const leftOnlyCaps = Array.from(leftCapabilities).filter(cap => !rightCapabilities.has(cap));
    const rightOnlyCaps = Array.from(rightCapabilities).filter(cap => !leftCapabilities.has(cap));

    const capabilityLabels: Record<string, string> = {
      function_calling: 'function calling',
      vision: 'vision processing',
      reasoning: 'advanced reasoning',
      web_search: 'web search',
      audio_input: 'audio input',
      audio_output: 'audio output',
      prompt_caching: 'prompt caching'
    };

    if (leftOnlyCaps.length > 0 || rightOnlyCaps.length > 0) {
      let capabilityAnalysis = '';

      if (leftOnlyCaps.length > 0) {
        const caps = leftOnlyCaps.map(c => capabilityLabels[c] || c).join(', ');
        capabilityAnalysis += `${leftModel.displayName} uniquely offers ${caps}, `;
      }
      if (rightOnlyCaps.length > 0) {
        const caps = rightOnlyCaps.map(c => capabilityLabels[c] || c).join(', ');
        if (capabilityAnalysis) capabilityAnalysis += `while `;
        capabilityAnalysis += `${rightModel.displayName} provides ${caps}`;
      }

      capabilityAnalysis += '. These distinct capabilities may be decisive factors depending on your application requirements.';

      analysis.push({
        title: 'Unique Capabilities',
        content: capabilityAnalysis
      });
    }

    // Provider comparison
    if (leftModel.provider !== rightModel.provider) {
      const providerAnalysis = `These models are offered by different providers: ${formatProviderName(leftModel.provider)} and ${formatProviderName(rightModel.provider)}. Consider factors such as regional availability, API reliability, support quality, existing infrastructure integrations, and compliance requirements when choosing between providers.`;

      analysis.push({
        title: 'Provider Considerations',
        content: providerAnalysis
      });
    }

    return analysis;
  }, [
    leftModel,
    rightModel,
    leftContextValue,
    rightContextValue,
    leftInputCostValue,
    rightInputCostValue,
    leftOutputCostValue,
    rightOutputCostValue,
  ]);

  const filteredLeftOptions = useMemo(() => {
    const q = leftQuery.trim().toLowerCase();
    return models.filter((m) => {
      // Exclude the right model from left options
      if (rightId && m.id === rightId) return false;
      if (!q) return true;
      const label = `${m.displayName} ${m.id} ${m.provider}`.toLowerCase();
      return label.includes(q);
    });
  }, [models, leftQuery, rightId]);

  const filteredRightOptions = useMemo(() => {
    const q = rightQuery.trim().toLowerCase();
    return models.filter((m) => {
      // Exclude the left model from right options
      if (leftId && m.id === leftId) return false;
      if (leftFamily && getModeFamily(m.data.mode) !== leftFamily) return false;
      if (!q) return true;
      const label = `${m.displayName} ${m.id} ${m.provider}`.toLowerCase();
      return label.includes(q);
    });
  }, [models, rightQuery, leftFamily, leftId]);

  const handleLeftSelect = (modelId: string) => {
    setLeftId(modelId);
    const nextLeft = models.find((m) => m.id === modelId) || null;
    if (!nextLeft) return;

    if (rightId) {
      const nextRight = models.find((m) => m.id === rightId) || null;
      if (nextRight && getModeFamily(nextRight.data.mode) !== getModeFamily(nextLeft.data.mode)) {
        setRightId(null);
        router.push(getComparePath(nextLeft));
        return;
      }
      if (nextRight) {
        router.push(getComparePath(nextLeft, nextRight));
        return;
      }
    }

    router.push(getComparePath(nextLeft));
  };

  const handleRightSelect = (modelId: string) => {
    // Preserve scroll position before navigation
    const currentScrollY = window.scrollY;
    scrollPositionRef.current = currentScrollY;

    if (!leftModel) {
      setLeftId(modelId);
      const nextLeft = models.find((m) => m.id === modelId) || null;
      if (nextLeft) {
        startTransition(() => {
          router.push(getComparePath(nextLeft));
          // Restore scroll immediately to prevent jump
          requestAnimationFrame(() => {
            window.scrollTo(0, currentScrollY);
          });
        });
      }
      return;
    }

    const nextRight = models.find((m) => m.id === modelId) || null;
    setRightId(modelId);
    if (nextRight) {
      startTransition(() => {
        router.push(getComparePath(leftModel, nextRight));
        // Restore scroll immediately to prevent jump
        requestAnimationFrame(() => {
          window.scrollTo(0, currentScrollY);
        });
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        leftDropdownRef.current &&
        leftInputRef.current &&
        !leftDropdownRef.current.contains(target) &&
        !leftInputRef.current.contains(target)
      ) {
        setLeftOpen(false);
      }
      if (
        rightDropdownRef.current &&
        rightInputRef.current &&
        !rightDropdownRef.current.contains(target) &&
        !rightInputRef.current.contains(target)
      ) {
        setRightOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Restore scroll position after model selection to prevent jumping
  useLayoutEffect(() => {
    if (scrollPositionRef.current > 0) {
      // Restore scroll position synchronously before browser paint
      window.scrollTo(0, scrollPositionRef.current);
      scrollPositionRef.current = 0;
    }
  }, [leftModel, rightModel]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <span className="provider-badge">[ MODEL COMPARISON ]</span>
        <h1 className="text-3xl md:text-4xl font-[400] text-gray-900 mb-3">
          {leftModel && rightModel
            ? `Compare ${leftModel.displayName} vs ${rightModel.displayName}`
            : leftModel
              ? `Compare ${leftModel.displayName} with other models`
              : 'Compare Two AI Models'}
        </h1>
        <p className="text-gray-600 text-sm">
          {leftModel && rightModel
            ? `Compare pricing, limits, and capabilities between ${leftModel.displayName} and ${rightModel.displayName}.`
            : leftModel
              ? `Select another model to compare pricing, limits, and capabilities with ${leftModel.displayName}.`
              : 'Pick two models with similar modes to compare pricing, limits, and capabilities.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 mb-10">
        <div className="bg-transparent p-1">
          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
              {leftModel && (
                <img
                  src={getProviderLogo(leftModel.provider)}
                  alt={`${formatProviderName(leftModel.provider)} logo`}
                  className="w-5 h-5 object-contain mr-2"
                  loading="lazy"
                />
              )}
              <input
                ref={leftInputRef}
                type="text"
                placeholder="Search model name or provider"
                value={leftOpen ? leftQuery : (leftSelectedLabel || leftQuery)}
                onChange={(e) => {
                  setLeftQuery(e.target.value);
                  setLeftOpen(true);
                }}
                onFocus={() => setLeftOpen(true)}
                className="w-full border-0 bg-transparent px-0 py-0 focus:outline-none"
              />
              <svg
                className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${leftOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {leftOpen && (
              <div
                ref={leftDropdownRef}
                className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg divide-y divide-gray-100"
              >
                {filteredLeftOptions.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      handleLeftSelect(model.id);
                      setLeftOpen(false);
                      setLeftQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-light transition-colors ${leftId === model.id ? 'bg-accent-light text-accent-dark' : 'text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={getProviderLogo(model.provider)}
                        alt={`${formatProviderName(model.provider)} logo`}
                        className="w-4 h-4 object-contain"
                        loading="lazy"
                      />
                      <div className="font-medium">{model.displayName}</div>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      {formatProviderName(model.provider)} · {getModeDisplayName(model.data.mode)}
                    </div>
                  </button>
                ))}
                {filteredLeftOptions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">No matching models.</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="text-gray-400 font-semibold text-lg text-center">VS</div>

        <div className="bg-transparent p-1">
          <div className="relative">
            <div className="flex items-center border border-gray-300 rounded-lg bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-accent focus-within:border-transparent">
              {rightModel && (
                <img
                  src={getProviderLogo(rightModel.provider)}
                  alt={`${formatProviderName(rightModel.provider)} logo`}
                  className="w-5 h-5 object-contain mr-2"
                  loading="lazy"
                />
              )}
              <input
                ref={rightInputRef}
                type="text"
                placeholder={leftFamily ? 'Search within similar modes' : 'Search model name or provider'}
                value={rightOpen ? rightQuery : (rightSelectedLabel || rightQuery)}
                onChange={(e) => {
                  setRightQuery(e.target.value);
                  setRightOpen(true);
                }}
                onFocus={() => setRightOpen(true)}
                disabled={!leftModel}
                className="w-full border-0 bg-transparent px-0 py-0 focus:outline-none disabled:text-gray-400"
              />
              <svg
                className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${rightOpen ? 'rotate-180' : ''}`}
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            {rightOpen && (
              <div
                ref={rightDropdownRef}
                className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg divide-y divide-gray-100"
              >
                {filteredRightOptions.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      handleRightSelect(model.id);
                      setRightOpen(false);
                      setRightQuery('');
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-light transition-colors ${rightId === model.id ? 'bg-accent-light text-accent-dark' : 'text-gray-700'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={getProviderLogo(model.provider)}
                        alt={`${formatProviderName(model.provider)} logo`}
                        className="w-4 h-4 object-contain"
                        loading="lazy"
                      />
                      <div className="font-medium">{model.displayName}</div>
                    </div>
                    <div className="text-xs text-gray-500 ml-6">
                      {formatProviderName(model.provider)} · {getModeDisplayName(model.data.mode)}
                    </div>
                  </button>
                ))}
                {filteredRightOptions.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    {leftModel ? 'No matching models.' : 'Select Model A first.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && <div className="text-gray-500">Loading models…</div>}
      {error && <div className="text-red-600">{error}</div>}

      {leftModel && rightModel && !isComparable && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 mb-8">
          These models have different modes and cannot be compared. Please select models with similar modes.
        </div>
      )}

      {(leftModel || rightModel) && (
        <div className="space-y-8">
          <div ref={comparisonTableRef} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-5 border-b border-gray-200">
              <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Models</div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {leftModel && (
                      <img
                        src={getProviderLogo(leftModel.provider)}
                        alt={`${formatProviderName(leftModel.provider)} logo`}
                        className="w-5 h-5 object-contain"
                        loading="lazy"
                      />
                    )}
                    <span className="text-lg font-semibold text-gray-900 truncate">
                      {leftModel ? leftModel.displayName : '—'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{leftModel ? leftModel.provider : '—'}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {rightModel && (
                      <img
                        src={getProviderLogo(rightModel.provider)}
                        alt={`${formatProviderName(rightModel.provider)} logo`}
                        className="w-5 h-5 object-contain"
                        loading="lazy"
                      />
                    )}
                    <span className="text-lg font-semibold text-gray-900 truncate">
                      {rightModel ? rightModel.displayName : '—'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 truncate">{rightModel ? rightModel.provider : '—'}</div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {shouldShowRow(leftContextValue, rightContextValue) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Context Length</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatK(leftContextValue) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatK(rightContextValue) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.max_output_tokens, rightModel?.data.max_output_tokens) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Max Output</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatK(leftModel.data.max_output_tokens || 0) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatK(rightModel.data.max_output_tokens || 0) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftInputCostValue, rightInputCostValue) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Input Cost</div>
                  <div className="text-gray-800 font-medium">{leftModel ? getPrimaryInputCost(leftModel) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? getPrimaryInputCost(rightModel) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftOutputCostValue, rightOutputCostValue) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Output Cost</div>
                  <div className="text-gray-800 font-medium">{leftModel ? getPrimaryOutputCost(leftModel) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? getPrimaryOutputCost(rightModel) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModesValue, rightModesValue) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Mode</div>
                  <div className="text-gray-800 font-medium">{leftModel ? getModesDisplay(leftModel) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? getModesDisplay(rightModel) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.max_input_tokens, rightModel?.data.max_input_tokens) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Max Input Tokens</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatK(leftModel.data.max_input_tokens || 0) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatK(rightModel.data.max_input_tokens || 0) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.max_tokens, rightModel?.data.max_tokens) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Max Tokens</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatK(leftModel.data.max_tokens || 0) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatK(rightModel.data.max_tokens || 0) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.max_query_tokens, rightModel?.data.max_query_tokens) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Max Query Tokens</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatK(leftModel.data.max_query_tokens || 0) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatK(rightModel.data.max_query_tokens || 0) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.supported_endpoints, rightModel?.data.supported_endpoints) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Supported Endpoints</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatList(leftModel.data.supported_endpoints) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatList(rightModel.data.supported_endpoints) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.provider, rightModel?.provider) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Provider</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatProviderName(leftModel.provider) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatProviderName(rightModel.provider) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.supports_tool_choice, rightModel?.data.supports_tool_choice) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Tool Choice</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatYesNo(leftModel.data.supports_tool_choice) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatYesNo(rightModel.data.supports_tool_choice) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.supports_response_schema, rightModel?.data.supports_response_schema) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Response Schema</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatYesNo(leftModel.data.supports_response_schema) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatYesNo(rightModel.data.supports_response_schema) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.supports_parallel_function_calling, rightModel?.data.supports_parallel_function_calling) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Parallel Function Calling</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatYesNo(leftModel.data.supports_parallel_function_calling) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatYesNo(rightModel.data.supports_parallel_function_calling) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.supports_prompt_caching, rightModel?.data.supports_prompt_caching) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Prompt Caching</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatYesNo(leftModel.data.supports_prompt_caching) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatYesNo(rightModel.data.supports_prompt_caching) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.supports_system_messages, rightModel?.data.supports_system_messages) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">System Messages</div>
                  <div className="text-gray-800 font-medium">{leftModel ? formatYesNo(leftModel.data.supports_system_messages) : '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel ? formatYesNo(rightModel.data.supports_system_messages) : '—'}</div>
                </div>
              )}

              {shouldShowRow(leftModel?.data.deprecation_date, rightModel?.data.deprecation_date) && (
                <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 px-6 py-4">
                  <div className="text-gray-500 text-sm font-semibold uppercase tracking-wider">Deprecation Date</div>
                  <div className="text-gray-800 font-medium">{leftModel?.data.deprecation_date || '—'}</div>
                  <div className="text-gray-800 font-medium">{rightModel?.data.deprecation_date || '—'}</div>
                </div>
              )}

            </div>
          </div>
          <div className="w-full mt-10">
            <CTA2 />
          </div>
        </div>
      )}

      {(leftModel || rightModel) && (
        <section className="mt-12">
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-[400] text-gray-900 mb-2">
              Comparison Insights
            </h2>
            <p className="text-sm text-gray-600">
              Comprehensive analysis based on the latest model metadata from the comparison table above.
            </p>
          </div>

          <div className="space-y-3">
            {leftModel && (
              <details className="group border border-gray-200 rounded-lg bg-white">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-base font-medium text-gray-900">
                    What should I know about {leftModel.displayName}?
                  </span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-3 border-t border-gray-200">
                  {buildModelFacts(leftModel).map((section, idx) => (
                    <div key={idx} className={idx > 0 ? 'mt-4' : ''}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{section.category}</h4>
                      <ul className="list-disc list-outside space-y-2 text-sm pl-6 leading-relaxed text-gray-700">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {rightModel && (
              <details className="group border border-gray-200 rounded-lg bg-white">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-base font-medium text-gray-900">
                    What should I know about {rightModel.displayName}?
                  </span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-3 border-t border-gray-200">
                  {buildModelFacts(rightModel).map((section, idx) => (
                    <div key={idx} className={idx > 0 ? 'mt-4' : ''}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{section.category}</h4>
                      <ul className="list-disc list-outside space-y-2 text-sm pl-6 leading-relaxed text-gray-700">
                        {section.items.map((item, itemIdx) => (
                          <li key={itemIdx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {leftModel && buildCapabilityRows(leftModel).length > 0 && (
              <details className="group border border-gray-200 rounded-lg bg-white">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-base font-medium text-gray-900">
                    What capabilities does {leftModel.displayName} support?
                  </span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-3 border-t border-gray-200">
                  <ul className="list-disc list-outside space-y-2 text-sm pl-6 leading-relaxed text-gray-700">
                    {buildCapabilityRows(leftModel).map((capability, idx) => (
                      <li key={idx}>{capability}</li>
                    ))}
                  </ul>
                </div>
              </details>
            )}

            {rightModel && buildCapabilityRows(rightModel).length > 0 && (
              <details className="group border border-gray-200 rounded-lg bg-white">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-base font-medium text-gray-900">
                    What capabilities does {rightModel.displayName} support?
                  </span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-3 border-t border-gray-200">
                  <ul className="list-disc list-outside space-y-2 text-sm pl-6 leading-relaxed text-gray-700">
                    {buildCapabilityRows(rightModel).map((capability, idx) => (
                      <li key={idx}>{capability}</li>
                    ))}
                  </ul>
                </div>
              </details>
            )}

            {leftModel && rightModel && buildComparisonAnalysis && buildComparisonAnalysis.length > 0 && (
              <details className="group border border-gray-200 rounded-lg bg-white" open>
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-4">
                  <span className="text-base font-medium text-gray-900">
                    How do {leftModel.displayName} and {rightModel.displayName} compare?
                  </span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </summary>
                <div className="px-5 pb-5 pt-3 border-t border-gray-200 space-y-4">
                  {buildComparisonAnalysis.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{section.title}</h4>
                      <p className="text-sm leading-relaxed text-gray-700">{section.content}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

