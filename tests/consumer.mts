import {
  applyUnifiedDiff,
  createUnifiedDiff,
  type UnifiedDiffOptions,
} from '@lp-labs/text-unified-diff';
const options: UnifiedDiffOptions = { context: 1, maxCells: 100 };
const patch: string = createUnifiedDiff('a', 'b', options);
const output: string = applyUnifiedDiff('a', patch);
// @ts-expect-error context is numeric.
createUnifiedDiff('a', 'b', { context: 'one' });
void output;
