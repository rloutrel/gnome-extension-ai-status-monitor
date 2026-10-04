// PURE module: formatting of normalized usage summaries for the menu.
// Zero GJS/GObject imports; unit-tested under plain Node.

export function formatUsage(usage) {
    if (!usage)
        return '';
    const used = formatAmount(usage.used);
    if (usage.limit === null || usage.limit === undefined)
        return `${used} used this month`;
    const limit = formatAmount(usage.limit);
    const percent = usage.percent !== null && usage.percent !== undefined
        ? ` (${usage.percent}%)`
        : '';
    const currency = usage.currency ? ` ${usage.currency}` : '';
    return `${used}${currency} / ${limit}${currency}${percent}`;
}

export function formatAmount(amount) {
    if (typeof amount !== 'number' || !Number.isFinite(amount))
        return '?';
    if (amount >= 1000)
        return amount.toFixed(0);
    if (amount >= 10)
        return amount.toFixed(1);
    return amount.toFixed(2);
}
