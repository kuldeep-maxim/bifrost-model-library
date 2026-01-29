import { ProcessedModel } from '@/types/model';

/**
 * Determines the canonical ordering for two models in a comparison URL.
 * Returns the models in a consistent order to prevent duplicate comparison pages.
 *
 * Ordering rules:
 * 1. Sort by provider (alphabetically)
 * 2. If same provider, sort by slug (alphabetically)
 *
 * This ensures "A vs B" and "B vs A" always resolve to the same canonical URL.
 */
export function getCanonicalModelOrder(
  model1: ProcessedModel,
  model2: ProcessedModel
): { first: ProcessedModel; second: ProcessedModel; isCanonicalOrder: boolean } {
  const key1 = `${model1.provider.toLowerCase()}_${model1.slug.toLowerCase()}`;
  const key2 = `${model2.provider.toLowerCase()}_${model2.slug.toLowerCase()}`;

  const isCanonicalOrder = key1 < key2;

  return {
    first: isCanonicalOrder ? model1 : model2,
    second: isCanonicalOrder ? model2 : model1,
    isCanonicalOrder,
  };
}

/**
 * Builds the canonical comparison URL for two models.
 * Always returns the URL in the canonical order.
 */
export function buildCanonicalComparisonUrl(
  model1: ProcessedModel,
  model2: ProcessedModel,
  baseUrl: string = ''
): string {
  const { first, second } = getCanonicalModelOrder(model1, model2);

  return `${baseUrl}/compare/${encodeURIComponent(first.provider)}/${first.slug}?compare=${encodeURIComponent(second.provider)}/${second.slug}`;
}

/**
 * Checks if the current URL parameters are in canonical order.
 */
export function isCanonicalComparisonUrl(
  provider1: string,
  slug1: string,
  provider2: string,
  slug2: string
): boolean {
  const key1 = `${provider1.toLowerCase()}_${slug1.toLowerCase()}`;
  const key2 = `${provider2.toLowerCase()}_${slug2.toLowerCase()}`;

  return key1 < key2;
}
