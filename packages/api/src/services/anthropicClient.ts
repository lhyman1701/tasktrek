import Anthropic from '@anthropic-ai/sdk';

// Cache clients by API key to avoid creating new instances
const clientCache = new Map<string, Anthropic>();

/**
 * Get an Anthropic client. Uses a custom API key if provided,
 * otherwise falls back to the ANTHROPIC_API_KEY environment variable.
 */
export function getAnthropicClient(customApiKey?: string): Anthropic {
  const apiKey = customApiKey || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('No Anthropic API key available. Set ANTHROPIC_API_KEY or provide a custom key.');
  }

  // Use cached client if available
  if (clientCache.has(apiKey)) {
    return clientCache.get(apiKey)!;
  }

  // Create new client
  const client = new Anthropic({ apiKey });
  clientCache.set(apiKey, client);

  return client;
}
