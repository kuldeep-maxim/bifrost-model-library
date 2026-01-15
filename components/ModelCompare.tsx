'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProcessedModel } from '@/types/model';
import { formatProviderName } from '@/lib/api';
import { getModeDisplayName } from '@/lib/calculator';
import { getProviderLogo } from '@/lib/providerLogos';

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
  if (value > 100000) return `${(value / 1000).toFixed(0)}k`;
  return value.toLocaleString();
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
  return `/compare/${encodeURIComponent(left.provider)}/${left.slug}/vs/${encodeURIComponent(right.provider)}/${right.slug}`;
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
  return value.toLocaleString();
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

  const filteredLeftOptions = useMemo(() => {
    const q = leftQuery.trim().toLowerCase();
    return models.filter((m) => {
      if (!q) return true;
      const label = `${m.displayName} ${m.id} ${m.provider}`.toLowerCase();
      return label.includes(q);
    });
  }, [models, leftQuery]);

  const filteredRightOptions = useMemo(() => {
    const q = rightQuery.trim().toLowerCase();
    return models.filter((m) => {
      if (leftFamily && getModeFamily(m.data.mode) !== leftFamily) return false;
      if (!q) return true;
      const label = `${m.displayName} ${m.id} ${m.provider}`.toLowerCase();
      return label.includes(q);
    });
  }, [models, rightQuery, leftFamily]);

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
    if (!leftModel) {
      setLeftId(modelId);
      const nextLeft = models.find((m) => m.id === modelId) || null;
      if (nextLeft) {
        router.push(getComparePath(nextLeft));
      }
      return;
    }

    const nextRight = models.find((m) => m.id === modelId) || null;
    setRightId(modelId);
    if (nextRight) {
      router.push(getComparePath(leftModel, nextRight));
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 text-center">
        <span className="provider-badge">[ MODEL COMPARISON ]</span>
        <h1 className="text-3xl md:text-4xl font-[400] text-gray-900 mb-3">
          Compare Two AI Models
        </h1>
        <p className="text-gray-600 text-sm">
          Pick two models with similar modes to compare pricing, limits, and capabilities.
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
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-light transition-colors ${
                      leftId === model.id ? 'bg-accent-light text-accent-dark' : 'text-gray-700'
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
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-accent-light transition-colors ${
                      rightId === model.id ? 'bg-accent-light text-accent-dark' : 'text-gray-700'
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
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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
      )}
    </div>
  );
}

