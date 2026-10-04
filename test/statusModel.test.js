/**
 * Unit tests for the pure status model and provider catalog.
 *
 * Run with: node --test test/*.test.js
 *
 * Uses Node's built-in test runner (no dependencies) since this GNOME
 * Shell extension has no Node/npm test infrastructure.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    STATUS_OPERATIONAL,
    STATUS_DEGRADED,
    STATUS_PARTIAL_OUTAGE,
    STATUS_MAJOR_OUTAGE,
    STATUS_MAINTENANCE,
    STATUS_UNKNOWN,
    fromStatuspageIndicator,
    fromStatuspageComponent,
    fromStatuspageSummary,
    fromMistralAdmin,
    worstOf,
    describe,
    themeClasses,
} from '../ai-status-monitor@rloutrel.github.com/statusModel.js';
import {
    PROVIDERS,
    getProvider,
    defaultEnabledIds,
    enabledProviders,
} from '../ai-status-monitor@rloutrel.github.com/providers.js';

const SUMMARY_ALL_OK = {
    status: {indicator: 'none'},
    components: [
        {name: 'API', status: 'operational'},
        {name: 'Web', status: 'operational'},
    ],
};

const SUMMARY_MIXED = {
    status: {indicator: 'minor'},
    components: [
        {name: 'API', status: 'operational'},
        {name: 'Web', status: 'degraded_performance'},
        {name: 'Legacy', status: 'major_outage', only_show_if_affected: true},
    ],
};

test('fromStatuspageIndicator: maps all indicators', () => {
    assert.equal(fromStatuspageIndicator('none'), STATUS_OPERATIONAL);
    assert.equal(fromStatuspageIndicator('minor'), STATUS_DEGRADED);
    assert.equal(fromStatuspageIndicator('major'), STATUS_PARTIAL_OUTAGE);
    assert.equal(fromStatuspageIndicator('critical'), STATUS_MAJOR_OUTAGE);
    assert.equal(fromStatuspageIndicator('maintenance'), STATUS_MAINTENANCE);
});

test('fromStatuspageIndicator: unknown values map to unknown', () => {
    assert.equal(fromStatuspageIndicator('bogus'), STATUS_UNKNOWN);
    assert.equal(fromStatuspageIndicator(undefined), STATUS_UNKNOWN);
});

test('fromStatuspageComponent: maps all component statuses', () => {
    assert.equal(fromStatuspageComponent('operational'), STATUS_OPERATIONAL);
    assert.equal(fromStatuspageComponent('degraded_performance'),
        STATUS_DEGRADED);
    assert.equal(fromStatuspageComponent('partial_outage'),
        STATUS_PARTIAL_OUTAGE);
    assert.equal(fromStatuspageComponent('major_outage'),
        STATUS_MAJOR_OUTAGE);
    assert.equal(fromStatuspageComponent('under_maintenance'),
        STATUS_MAINTENANCE);
    assert.equal(fromStatuspageComponent('nonsense'), STATUS_UNKNOWN);
});

test('fromStatuspageSummary: all operational', () => {
    assert.equal(fromStatuspageSummary(SUMMARY_ALL_OK), STATUS_OPERATIONAL);
});

test('fromStatuspageSummary: takes worst non-conditional component', () => {
    assert.equal(fromStatuspageSummary(SUMMARY_MIXED), STATUS_DEGRADED);
});

test('fromStatuspageSummary: ignores conditional components', () => {
    const summary = {
        status: {indicator: 'none'},
        components: [
            {name: 'A', status: 'operational'},
            {name: 'B', status: 'major_outage', only_show_if_affected: true},
        ],
    };
    assert.equal(fromStatuspageSummary(summary), STATUS_OPERATIONAL);
});

test('fromStatuspageSummary: invalid input maps to unknown', () => {
    assert.equal(fromStatuspageSummary(null), STATUS_UNKNOWN);
    assert.equal(fromStatuspageSummary({}), STATUS_UNKNOWN);
    assert.equal(fromStatuspageSummary('oops'), STATUS_UNKNOWN);
});

test('worstOf: returns the worst status by priority', () => {
    assert.equal(worstOf([STATUS_OPERATIONAL, STATUS_DEGRADED]),
        STATUS_DEGRADED);
    assert.equal(worstOf([STATUS_PARTIAL_OUTAGE, STATUS_MAJOR_OUTAGE]),
        STATUS_MAJOR_OUTAGE);
    assert.equal(worstOf([STATUS_UNKNOWN, STATUS_OPERATIONAL]),
        STATUS_OPERATIONAL);
    assert.equal(worstOf([]), STATUS_UNKNOWN);
});

test('describe: human readable labels', () => {
    assert.equal(describe(STATUS_OPERATIONAL), 'Operational');
    assert.equal(describe('bogus'), 'Unknown');
});

test('themeClasses: marker class plus theme class', () => {
    assert.deepEqual(themeClasses(STATUS_OPERATIONAL),
        ['ai-status-monitor-dot-operational', 'success']);
    assert.deepEqual(themeClasses(STATUS_MAJOR_OUTAGE),
        ['ai-status-monitor-dot-major-outage', 'error']);
    assert.deepEqual(themeClasses(STATUS_UNKNOWN),
        ['ai-status-monitor-dot-unknown']);
});

test('providers: unique ids, well-formed URLs, default enabled', () => {
    const ids = PROVIDERS.map(p => p.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const provider of PROVIDERS) {
        assert.ok(provider.name.length > 0);
        assert.ok(provider.pageUrl.startsWith('https://'));
        assert.ok(provider.statusUrl.startsWith('https://'));
        assert.equal(typeof provider.defaultEnabled, 'boolean');
    }
    assert.deepEqual(ids, [...ids].sort());
    assert.deepEqual(defaultEnabledIds(), ['anthropic', 'openai']);
});

test('providers: getProvider', () => {
    assert.equal(getProvider('openai').name, 'OpenAI');
    assert.equal(getProvider('nope'), null);
});

test('providers: enabledProviders filters and keeps order', () => {
    const enabled = enabledProviders(['perplexity', 'openai']);
    assert.deepEqual(enabled.map(p => p.id), ['openai', 'perplexity']);
    assert.deepEqual(enabledProviders([]), []);
});

test('fromMistralAdmin: computes budget percentage and status', () => {
    const r1 = fromMistralAdmin({total_cost: 4, currency: 'EUR'}, {amount: 10});
    assert.equal(r1.status, STATUS_OPERATIONAL);
    assert.deepEqual(r1.usage,
        {used: 4, limit: 10, currency: 'EUR', percent: 40});

    const r2 = fromMistralAdmin({usage: {chat: 8, completion: 2}}, {amount: 10});
    assert.equal(r2.status, STATUS_MAJOR_OUTAGE);
    assert.equal(r2.usage.percent, 100);

    const r3 = fromMistralAdmin({amount: 9}, {amount: 10});
    assert.equal(r3.status, STATUS_DEGRADED);
    assert.equal(r3.usage.percent, 90);
});

test('fromMistralAdmin: no limit or unknown payload', () => {
    const r1 = fromMistralAdmin({amount: 5}, {no_monthly_limit: true});
    assert.equal(r1.status, STATUS_OPERATIONAL);
    assert.equal(r1.usage.limit, null);
    assert.equal(r1.usage.percent, null);

    const r2 = fromMistralAdmin(null, {});
    assert.equal(r2.status, STATUS_UNKNOWN);
    assert.equal(r2.usage, null);
});
