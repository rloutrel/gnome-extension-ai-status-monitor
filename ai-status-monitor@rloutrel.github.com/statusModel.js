// PURE module: status normalization and aggregation logic.
// Zero GJS/GObject imports; unit-tested under plain Node.

export const STATUS_OPERATIONAL = 'operational';
export const STATUS_DEGRADED = 'degraded';
export const STATUS_PARTIAL_OUTAGE = 'partial-outage';
export const STATUS_MAJOR_OUTAGE = 'major-outage';
export const STATUS_MAINTENANCE = 'maintenance';
export const STATUS_UNKNOWN = 'unknown';

// Worst first; drives the overall indicator and per-provider dots.
export const STATUS_PRIORITY = [
    STATUS_MAJOR_OUTAGE,
    STATUS_PARTIAL_OUTAGE,
    STATUS_DEGRADED,
    STATUS_MAINTENANCE,
    STATUS_OPERATIONAL,
    STATUS_UNKNOWN,
];

export const STATUS_DESCRIPTIONS = {
    [STATUS_OPERATIONAL]: 'Operational',
    [STATUS_DEGRADED]: 'Degraded performance',
    [STATUS_PARTIAL_OUTAGE]: 'Partial outage',
    [STATUS_MAJOR_OUTAGE]: 'Major outage',
    [STATUS_MAINTENANCE]: 'Maintenance',
    [STATUS_UNKNOWN]: 'Unknown',
};

const STATUSPAGE_INDICATOR_MAP = {
    none: STATUS_OPERATIONAL,
    minor: STATUS_DEGRADED,
    major: STATUS_PARTIAL_OUTAGE,
    critical: STATUS_MAJOR_OUTAGE,
    maintenance: STATUS_MAINTENANCE,
};

const STATUSPAGE_COMPONENT_MAP = {
    operational: STATUS_OPERATIONAL,
    degraded_performance: STATUS_DEGRADED,
    partial_outage: STATUS_PARTIAL_OUTAGE,
    major_outage: STATUS_MAJOR_OUTAGE,
    under_maintenance: STATUS_MAINTENANCE,
};

export function fromStatuspageIndicator(indicator) {
    return STATUSPAGE_INDICATOR_MAP[indicator] ?? STATUS_UNKNOWN;
}

export function fromStatuspageComponent(componentStatus) {
    return STATUSPAGE_COMPONENT_MAP[componentStatus] ?? STATUS_UNKNOWN;
}

// Maps a Mistral Admin usage + spend-limit payload pair to a status and
// a normalized usage summary for the menu progress bar.
// - usage: /v1/admin/usage response (cost per category, currency, period)
// - spendLimit: /v1/admin/spend-limit response (amount, no_monthly_limit)
// Defensive: the Admin API is in Preview and field names may change.
export function fromMistralAdmin(usage, spendLimit) {
    const used = extractTotalCost(usage);
    const currency = typeof usage?.currency === 'string'
        ? usage.currency
        : null;
    const limit = extractSpendLimit(spendLimit);
    if (used === null)
        return {status: STATUS_UNKNOWN, usage: null};
    if (limit === null || limit <= 0)
        return {
            status: STATUS_OPERATIONAL,
            usage: {used, limit: null, currency, percent: null},
        };
    const percent = Math.round((used / limit) * 100);
    let status;
    if (percent >= 100)
        status = STATUS_MAJOR_OUTAGE;
    else if (percent >= 80)
        status = STATUS_DEGRADED;
    else
        status = STATUS_OPERATIONAL;
    return {status, usage: {used, limit, currency, percent}};
}

function extractTotalCost(usage) {
    if (!usage || typeof usage !== 'object')
        return null;
    if (typeof usage.total_cost === 'number')
        return usage.total_cost;
    if (typeof usage.amount === 'number')
        return usage.amount;
    const categories = usage.usage ?? usage.categories ?? usage;
    if (!categories || typeof categories !== 'object')
        return null;
    let total = 0;
    let found = false;
    for (const value of Object.values(categories)) {
        const cost = typeof value === 'number'
            ? value
            : value?.cost ?? value?.amount ?? value?.total;
        if (typeof cost === 'number') {
            total += cost;
            found = true;
        }
    }
    return found ? total : null;
}

function extractSpendLimit(spendLimit) {
    if (!spendLimit || typeof spendLimit !== 'object')
        return null;
    if (spendLimit.no_monthly_limit === true)
        return null;
    if (typeof spendLimit.amount === 'number')
        return spendLimit.amount;
    const inner = spendLimit.spend_limit ?? spendLimit.limit;
    if (typeof inner === 'number')
        return inner;
    if (inner && typeof inner === 'object' &&
        typeof inner.amount === 'number')
        return inner.amount;
    return null;
}

export function fromStatuspageSummary(summary) {
    if (!summary || typeof summary !== 'object')
        return STATUS_UNKNOWN;
    const statuses = [];
    if (summary.status?.indicator)
        statuses.push(fromStatuspageIndicator(summary.status.indicator));
    if (Array.isArray(summary.components)) {
        for (const component of summary.components) {
            if (component.only_show_if_affected)
                continue;
            statuses.push(fromStatuspageComponent(component.status));
        }
    }
    if (statuses.length === 0)
        return STATUS_UNKNOWN;
    return worstOf(statuses);
}

export function worstOf(statuses) {
    let worst = STATUS_UNKNOWN;
    let worstIndex = STATUS_PRIORITY.length - 1;
    for (const status of statuses) {
        const index = STATUS_PRIORITY.indexOf(status);
        if (index !== -1 && index < worstIndex) {
            worst = status;
            worstIndex = index;
        }
    }
    return worst;
}

export function describe(status) {
    return STATUS_DESCRIPTIONS[status] ?? STATUS_DESCRIPTIONS[STATUS_UNKNOWN];
}

// Shell theme classes carrying the status color, plus a marker class
// so the stylesheet can tweak spacing per status.
export const STATUS_THEME_CLASSES = {
    [STATUS_OPERATIONAL]: ['success'],
    [STATUS_DEGRADED]: ['warning'],
    [STATUS_PARTIAL_OUTAGE]: ['error'],
    [STATUS_MAJOR_OUTAGE]: ['error'],
    [STATUS_MAINTENANCE]: [],
    [STATUS_UNKNOWN]: [],
};

export function themeClasses(status) {
    return [
        `ai-status-monitor-dot-${status}`,
        ...(STATUS_THEME_CLASSES[status] ?? []),
    ];
}
