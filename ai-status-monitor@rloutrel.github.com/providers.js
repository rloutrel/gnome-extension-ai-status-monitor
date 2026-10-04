// PURE module: catalog of AI providers with a public status feed.
// Zero GJS/GObject imports; unit-tested under plain Node.

export const FEED_STATUSPAGE = 'statuspage';

export const PROVIDERS = [
    {
        id: 'openai',
        name: 'OpenAI',
        feed: FEED_STATUSPAGE,
        statusUrl: 'https://status.openai.com/api/v2/summary.json',
        pageUrl: 'https://status.openai.com/',
        defaultEnabled: true,
    },
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        feed: FEED_STATUSPAGE,
        statusUrl: 'https://status.claude.com/api/v2/summary.json',
        pageUrl: 'https://status.claude.com/',
        defaultEnabled: true,
    },
    {
        id: 'groq',
        name: 'Groq',
        feed: FEED_STATUSPAGE,
        statusUrl: 'https://status.groq.com/api/v2/summary.json',
        pageUrl: 'https://status.groq.com/',
        defaultEnabled: false,
    },
    {
        id: 'perplexity',
        name: 'Perplexity',
        feed: FEED_STATUSPAGE,
        statusUrl: 'https://www.perplexity.statuspage.io/api/v2/summary.json',
        pageUrl: 'https://www.perplexity.statuspage.io/',
        defaultEnabled: false,
    },
];

export function getProvider(id) {
    return PROVIDERS.find(provider => provider.id === id) ?? null;
}

export function defaultEnabledIds() {
    return PROVIDERS
        .filter(provider => provider.defaultEnabled)
        .map(provider => provider.id);
}

export function enabledProviders(enabledIds) {
    const ids = new Set(enabledIds);
    return PROVIDERS.filter(provider => ids.has(provider.id));
}
