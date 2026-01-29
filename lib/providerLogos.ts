/**
 * @deprecated This file is now a re-export from config/providers.ts
 * Import directly from @/config/providers instead
 *
 * This file is kept for backward compatibility only.
 */

import {
  getProviderMetadata,
  getProviderLogo as getProviderLogoFromConfig,
  getProviderDisplayName as getProviderDisplayNameFromConfig,
  type ProviderMetadata,
} from '@/config/providers';

type ProviderInfo = {
  name: string;
  logo: string;
};

/**
 * @deprecated Use getProviderMetadata from @/config/providers instead
 */
export function getProviderInfo(provider: string): ProviderInfo {
  const metadata = getProviderMetadata(provider);
  return {
    name: metadata.displayName,
    logo: metadata.logo,
  };
}

/**
 * @deprecated Use getProviderLogo from @/config/providers instead
 */
export function getProviderLogo(provider: string): string {
  return getProviderLogoFromConfig(provider);
}

/**
 * @deprecated Use getProviderDisplayName from @/config/providers instead
 */
export function getProviderDisplayName(provider: string): string {
  return getProviderDisplayNameFromConfig(provider);
}

