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
