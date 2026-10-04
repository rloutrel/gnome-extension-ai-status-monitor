/**
 * Unit tests for the sample pure module.
 *
 * Run with: node --test test/*.test.js
 *
 * Uses Node's built-in test runner (no dependencies) since this GNOME
 * Shell extension has no Node/npm test infrastructure.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { greet } from '../ai-status-monitor@rloutrel.github.com/sampleModule.js';

test('greet: returns a greeting for a name', () => {
    assert.equal(greet('GNOME'), 'Hello, GNOME!');
});

test('greet: handles empty input', () => {
    assert.equal(greet(''), 'Hello, !');
});
