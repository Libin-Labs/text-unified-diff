# @lp-labs/text-unified-diff

Creates and applies text unified hunks using a bounded longest-common-subsequence algorithm.
Applying a patch verifies each source context/removal line and hunk count before accepting it.

## Install and quick start

```bash
npm install @lp-labs/text-unified-diff
```

```js
import { applyUnifiedDiff, createUnifiedDiff } from '@lp-labs/text-unified-diff';

const patch = createUnifiedDiff('before\nsame', 'after\nsame');
if (applyUnifiedDiff('before\nsame', patch) !== 'after\nsame')
  throw new Error('Diff round trip failed');
```

ESM and CommonJS builds include TypeScript declarations. There are no runtime or peer dependencies.

## API

`createUnifiedDiff(before, after, options?): string` produces `--- before` / `+++ after` headers and
one or more `@@ -start,count +start,count @@` hunks. `UnifiedDiffOptions` supports `context`
(default 3 lines, range 0–100), `maxLines` (default 4,000 per input), and `maxCells` (default
4,000,000 LCS cells).

`applyUnifiedDiff(original, patch, options?): string` applies the package's unified-hunk format.
It verifies context and removal text at exact source positions and checks old/new counts. The
optional `maxLines` default is 4,000. Empty patches leave the original unchanged.

## Errors and format limits

Invalid context, headers, ordering, hunk counts, or removal lines throw `TypeError`; line and
comparison budgets throw `RangeError`. Text is split on LF, retaining a trailing empty line when
present. The output format does not encode missing final newlines, file metadata, rename modes,
binary data, or git extensions. This is a text patch engine, not a byte-preserving VCS implementation.

## Performance and customization

Diff generation uses O(N×M) time and memory for N/M lines and rejects the configured cell budget
before allocating the table. Reduce `maxLines`, `maxCells`, or context for interactive applications.
Patch application is linear in source and patch lines. Do not remove context verification when
applying patches to files that may have changed.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
