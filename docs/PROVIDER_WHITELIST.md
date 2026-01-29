# Provider Configuration System

## Overview

The provider configuration system is the **single source of truth** for all provider-related data:
- Which providers appear on the website (whitelist)
- Display names for each provider
- Logo mappings for each provider

This centralized approach makes it easy to manage providers, add new ones, and maintain consistency across the entire site.

## How It Works

### 1. **Configuration File** (`config/providers.ts`)

This one file contains everything:

- **`ALL_AVAILABLE_PROVIDERS`**: Complete list of all 103 providers from Bifrost API
- **`WHITELISTED_PROVIDERS`**: Subset of providers to include on the site (currently 14)
- **`PROVIDER_METADATA`**: Display names and logo mappings for each provider

### 2. **Automatic Filtering**

The API functions automatically filter models:
- `processModels()` - Filters by whitelist by default
- `getModelById()` - Checks whitelist
- `getAllProviders()` - Returns only whitelisted providers

### 3. **Impact on Site**

Only whitelisted providers will:
- ✅ Appear on the homepage
- ✅ Have provider pages generated
- ✅ Have model comparison pages
- ✅ Be included in sitemaps
- ✅ Be discoverable by search engines

---

## Adding a New Provider

### Step 1: Check if Provider Exists

The provider must exist in `ALL_AVAILABLE_PROVIDERS`. If not, update the list first (see "Updating Available Providers" below).

### Step 2: Add Metadata (Display Name & Logo)

Edit `config/providers.ts` and add provider metadata:

```typescript
export const PROVIDER_METADATA: Record<string, ProviderMetadata> = {
  // ... existing providers

  // Add your new provider
  your_new_provider: {
    displayName: 'Your Provider Name',  // How it appears on the site
    logo: 'your-provider.svg',          // Logo filename in /public/provider-logo/
  },
};
```

### Step 3: Add to Whitelist

Add the provider to `WHITELISTED_PROVIDERS`:

```typescript
export const WHITELISTED_PROVIDERS = [
  'openai',
  'anthropic',
  'your_new_provider',  // ← Add here
  // ... rest
] as const;
```

### Step 4: Add Logo File

Place your logo at:
```
/public/provider-logo/your-provider.svg
```

### Step 5: Rebuild the Site

```bash
npm run build
```

This will:
- Regenerate all static pages
- Update sitemaps with new provider's models
- Create comparison pages for the new models
- Display correct provider name and logo everywhere

---

## Removing a Provider

### Step 1: Remove from Whitelist

Edit `config/providers.ts` and remove the provider from `WHITELISTED_PROVIDERS`:

```typescript
export const WHITELISTED_PROVIDERS = [
  'openai',
  'anthropic',
  // 'provider_to_remove',  ← Comment out or delete
] as const;
```

### Step 2: Rebuild the Site

```bash
npm run build
```

The removed provider's pages will no longer be generated.

---

## Updating Available Providers

To get the latest list of providers from Bifrost API:

### Option 1: Run the Update Script

```bash
./scripts/update-providers.sh
```

This will:
1. Fetch current providers from the API
2. Display the formatted list
3. Show total provider count

### Option 2: Manual Update

```bash
curl -s 'https://www.getmaxim.ai/bifrost/api/models' | \
  python3 -c "import sys, json; providers = sorted(set(model.get('provider', 'unknown') for model in json.load(sys.stdin).values())); print('\n'.join(providers))"
```

Then copy the output to `ALL_AVAILABLE_PROVIDERS` in `config/providers.ts`.

---

## Current Statistics

```
Total Available Providers: 103
Whitelisted Providers: 16
Percentage Whitelisted: 15.5%

Impact on Sitemaps:
- Total URLs: ~22,000 (down from ~44,000)
- Comparison Pages: ~19,000 (down from ~42,000)
```

---

## Whitelisted Providers (Current)

| Provider ID | Display Name | Logo |
|-------------|--------------|------|
| **Major AI Providers** |||
| `openai` | OpenAI | openai.svg |
| `anthropic` | Anthropic | anthropic.svg |
| `gemini` | Google Gemini | google.svg |
| **Cloud Platforms** |||
| `azure` | Azure | azure.svg |
| `azure_ai` | Azure AI | azure.svg |
| `vertex_ai` | Google Vertex AI | vertex.svg |
| **Popular API Providers** |||
| `together_ai` | Together AI | together.svg |
| `fireworks_ai` | Fireworks AI | fireworks.svg |
| `replicate` | Replicate | replicate.svg |
| `groq` | Groq | groq.svg |
| `deepseek` | DeepSeek | deepseek.svg |
| **Specialized Providers** |||
| `cohere` | Cohere | cohere.svg |
| `mistral` | Mistral AI | mistral.svg |
| `perplexity` | Perplexity | perplexity.svg |

**Total: 14 providers**

---

## Provider Name Examples

Note: Provider names in the API are **case-sensitive** and use **underscores**:

✅ Correct:
- `openai` (not `OpenAI`)
- `fireworks_ai` (not `fireworks-ai` or `fireworksAI`)
- `vertex_ai` (not `vertexAI`)

❌ Incorrect:
- `google` → Use `gemini` instead
- `aws` → Use `bedrock` instead
- `microsoft` → Use `azure` instead

---

## Testing Whitelist Changes

After modifying the whitelist:

### 1. Check Provider List
```bash
curl -s http://localhost:3000/sitemap-providers.xml | grep -o 'provider/[^?<]*' | sed 's|provider/||' | sort -u
```

### 2. Check Model Count
```bash
curl -s http://localhost:3000/api/models | python3 -c "import sys, json; print(len(json.load(sys.stdin)))"
```

### 3. Check Comparison Count
```bash
curl -s http://localhost:3000/sitemap-comparisons.xml | grep -c '<url>'
```

---

## Disabling Whitelist (Show All Providers)

To temporarily disable filtering for testing:

```typescript
// In your code, pass false to disable filtering:
const models = processModels(modelsData, false);  // false = show all
const providers = getAllProviders(modelsData, false);  // false = show all
```

**Note:** This is for development only. Production should always use the whitelist.

---

## FAQ

### Q: Why use a whitelist?

**A:** Benefits:
- **Better UX**: Curated, high-quality providers
- **Better SEO**: Fewer pages = better crawl budget
- **Faster Builds**: Fewer pages to generate
- **Easier Maintenance**: Focus on popular providers

### Q: How often should I update `ALL_AVAILABLE_PROVIDERS`?

**A:** Once per quarter or when major new providers launch. Run `./scripts/update-providers.sh` to check for new providers.

### Q: Can I have different whitelists for different environments?

**A:** Yes, you can use environment variables:

```typescript
export const WHITELISTED_PROVIDERS =
  process.env.NODE_ENV === 'production'
    ? PRODUCTION_PROVIDERS
    : DEVELOPMENT_PROVIDERS;
```

### Q: What happens to existing pages when I remove a provider?

**A:** They won't be regenerated on next build. Deployed pages may remain until you:
- Redeploy the site
- Clear the CDN cache
- The pages expire from cache

---

## See Also

- `config/providers.ts` - Whitelist configuration
- `lib/api.ts` - API filtering implementation
- `scripts/update-providers.sh` - Provider update script
