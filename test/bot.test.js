const assert = require('node:assert');
const test = require('node:test');
const { generateProgressBar, formatDuration, colors } = require('../uiBuilder');

test('formatDuration - formats seconds properly', () => {
    assert.strictEqual(formatDuration(0), '00:00');
    assert.strictEqual(formatDuration(65), '01:05');
    assert.strictEqual(formatDuration(3665), '01:01:05');
    assert.strictEqual(formatDuration(-10), '00:00');
    assert.strictEqual(formatDuration(NaN), '00:00');
});

test('generateProgressBar - generates bar string correctly', () => {
    const bar0 = generateProgressBar(0, 100, 10);
    assert.ok(bar0.includes('0%'));

    const bar50 = generateProgressBar(50, 100, 10);
    assert.ok(bar50.includes('50%'));

    const bar100 = generateProgressBar(100, 100, 10);
    assert.ok(bar100.includes('100%'));
});

test('UI Design System Colors - defined properly', () => {
    assert.strictEqual(colors.SUCCESS, '#2ECC71');
    assert.strictEqual(colors.ERROR, '#E74C3C');
    assert.strictEqual(colors.WARNING, '#F1C40F');
    assert.strictEqual(colors.INFO, '#3498DB');
});
