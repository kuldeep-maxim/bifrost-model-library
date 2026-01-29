
const BIFROST_API_URL = 'https://getbifrost.ai/datasheet';

const WHITELISTED_PROVIDERS = [
    'openai',
    'anthropic',
    'gemini',
    'azure',
    'vertex_ai',
    'together_ai',
    'groq',
    'cohere',
    'mistral',
    'perplexity',
];

function isProviderWhitelisted(provider) {
    return WHITELISTED_PROVIDERS.includes(provider);
}

function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && value !== null;
}

function normalizeCostPerToken(cost) {
    if (!isValidNumber(cost) || cost === undefined) {
        return undefined;
    }
    if (cost >= 0.001) {
        return cost / 1000000;
    }
    return cost;
}

async function main() {
    console.log('Fetching data...');
    const response = await fetch(BIFROST_API_URL);
    if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
    }
    const models = await response.json();

    console.log(`Total raw models: ${Object.keys(models).length}`);

    const processedModels = Object.entries(models)
        .map(([id, data]) => {
            const parts = id.split('/');
            const modelName = parts[parts.length - 1];

            if (!modelName || modelName.trim() === '') return null;
            if (!isProviderWhitelisted(data.provider)) return null;

            const mode = data.mode;
            if (!mode || mode.trim() === '' || mode.toLowerCase() === 'na' || mode.toLowerCase() === 'n/a') {
                return null;
            }

            const normalizedData = {
                ...data,
                input_cost_per_token: normalizeCostPerToken(data.input_cost_per_token),
                output_cost_per_token: normalizeCostPerToken(data.output_cost_per_token),
            };

            const hasInputCost = normalizedData.input_cost_per_token != null || normalizedData.input_cost_per_image != null || normalizedData.input_cost_per_second != null;
            const hasOutputCost = normalizedData.output_cost_per_token != null || normalizedData.output_cost_per_image != null || normalizedData.output_cost_per_second != null;
            const hasPricing = hasInputCost || hasOutputCost;
            const hasInputTokens = normalizedData.max_input_tokens != null && normalizedData.max_input_tokens > 0;
            const hasOutputTokens = normalizedData.max_output_tokens != null && normalizedData.max_output_tokens > 0;
            const hasContextLength = normalizedData.context_length != null && normalizedData.context_length > 0;

            if (!hasPricing && !hasInputTokens && !hasOutputTokens && !hasContextLength) {
                return null;
            }

            return {
                id,
                provider: normalizedData.provider,
                slug: modelName.replace(/[:@]/g, '-').toLowerCase(),
            };
        })
        .filter(Boolean);

    const totalModels = processedModels.length;
    const providers = new Set(processedModels.map(m => m.provider));
    const totalProviders = providers.size;

    console.log('--------------------------------');
    console.log(`Total Valid Models (Pages): ${totalModels}`);
    console.log(`Total Providers (Pages): ${totalProviders}`);
    console.log(`Static Pages (estimated): 2`);
    console.log('--------------------------------');
    console.log(`Total Pages to Breakdown:`);
    console.log(`  - Compare Pages: ${totalModels}`);
    console.log(`  - Provider Pages: ${totalProviders}`);
    console.log(`  - Static (Root + 404): 2`);
    console.log(`TOTAL ESTIMATED BUILD PAGES: ${totalModels + totalProviders + 2}`);
}

main().catch(console.error);
