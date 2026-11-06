import { applyUnifiedDiff, createUnifiedDiff } from '@lp-labs/text-unified-diff';
const result: string = applyUnifiedDiff('x', createUnifiedDiff('x', 'y'));
// @ts-expect-error input text must be a string.
createUnifiedDiff(1, 'y');
void result;
