import test from 'node:test';
import assert from 'node:assert/strict';
import { applyUnifiedDiff, createUnifiedDiff } from '../dist/esm/index.js';
test('generates applicable replacement hunks', () => {
  const d = createUnifiedDiff('a\nb\nc', 'a\nB\nc');
  assert.equal(applyUnifiedDiff('a\nb\nc', d), 'a\nB\nc');
});
test('generates applicable additions and deletions at boundaries', () => {
  assert.equal(applyUnifiedDiff('a\nb', createUnifiedDiff('a\nb', 'x\na\nb\ny')), 'x\na\nb\ny');
  assert.equal(applyUnifiedDiff('a\nb', createUnifiedDiff('a\nb', 'b')), 'b');
});
test('returns empty patch for identical strings and applies it as a no-op', () => {
  const patch = createUnifiedDiff('same', 'same');
  assert.equal(patch, '');
  assert.equal(applyUnifiedDiff('same', patch), 'same');
});
test('merges nearby edits using context', () => {
  assert.equal(createUnifiedDiff('a\nb\nc', 'A\nb\nC', { context: 0 }).match(/^@@/gm).length, 2);
});
test('verifies context and removed source lines while applying', () => {
  const patch = createUnifiedDiff('a\nb', 'a\nB');
  assert.throws(() => applyUnifiedDiff('wrong\nb', patch), /mismatch/);
});
test('rejects malformed headers and hunk counts', () => {
  assert.throws(() => applyUnifiedDiff('a', 'bad'));
  assert.throws(() => applyUnifiedDiff('a', '--- before\n+++ after\n@@ -1,2 +1,2 @@\n a\n'));
});
test('enforces LCS cell budget', () => {
  assert.throws(() => createUnifiedDiff('a\nb', 'c\nd', { maxCells: 2 }), RangeError);
  assert.throws(
    () => applyUnifiedDiff('a', '--- before\n+++ after\n'.repeat(10), { maxLines: 2 }),
    RangeError,
  );
});
