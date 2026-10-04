/**
 * Unit tests for the pure usage formatting module.
 *
 * Run with: node --test test/*.test.js
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {formatUsage, formatAmount} from '../ai-status-monitor@rloutrel.github.com/usageFormat.js';

test('formatUsage: with limit and percent', () => {
    assert.equal(
        formatUsage({used: 4, limit: 10, currency: 'EUR', percent: 40}),
        '4.00 EUR / 10.0 EUR (40%)');
});

test('formatUsage: without limit', () => {
    assert.equal(
        formatUsage({used: 5, limit: null, currency: null, percent: null}),
        '5.00 used this month');
});

test('formatUsage: null input', () => {
    assert.equal(formatUsage(null), '');
});

test('formatAmount: rounding', () => {
    assert.equal(formatAmount(1500), '1500');
    assert.equal(formatAmount(42.5), '42.5');
    assert.equal(formatAmount(4), '4.00');
    assert.equal(formatAmount('nope'), '?');
});
