export interface UnifiedDiffOptions {
  readonly context?: number;
  readonly maxLines?: number;
  readonly maxCells?: number;
}
export function createUnifiedDiff(
  before: string,
  after: string,
  options: UnifiedDiffOptions = {},
): string {
  const a = before.split('\n');
  const b = after.split('\n');
  const maxLines = options.maxLines ?? 4000;
  if (a.length > maxLines || b.length > maxLines) throw new RangeError('Diff line limit exceeded');
  if ((a.length + 1) * (b.length + 1) > (options.maxCells ?? 4_000_000))
    throw new RangeError('Diff comparison budget exceeded');
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i]![j] =
        a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
    }
  const changes: { kind: ' ' | '+' | '-'; line: string }[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      changes.push({ kind: ' ', line: a[i++]! });
      j++;
    } else if (j < b.length && (i === a.length || lcs[i]![j + 1]! >= lcs[i + 1]![j]!))
      changes.push({ kind: '+', line: b[j++]! });
    else changes.push({ kind: '-', line: a[i++]! });
  }
  const context = options.context ?? 3;
  if (!Number.isSafeInteger(context) || context < 0 || context > 100)
    throw new RangeError('Context must be between 0 and 100 lines');
  const changed: number[] = [];
  changes.forEach((change, index) => {
    if (change.kind !== ' ') changed.push(index);
  });
  if (changed.length === 0) return '';
  const ranges: [number, number][] = [];
  for (const index of changed) {
    const start = Math.max(0, index - context);
    const end = Math.min(changes.length, index + context + 1);
    const last = ranges[ranges.length - 1];
    if (last && start <= last[1]) last[1] = end;
    else ranges.push([start, end]);
  }
  const output: string[] = ['--- before', '+++ after'];
  for (const [start, end] of ranges) {
    const block = changes.slice(start, end);
    const oldCount = block.filter((change) => change.kind !== '+').length;
    const newCount = block.filter((change) => change.kind !== '-').length;
    const oldLine = 1 + changes.slice(0, start).filter((change) => change.kind !== '+').length;
    const newLine = 1 + changes.slice(0, start).filter((change) => change.kind !== '-').length;
    output.push(
      `@@ -${oldCount === 0 ? oldLine - 1 : oldLine},${oldCount} +${newCount === 0 ? newLine - 1 : newLine},${newCount} @@`,
    );
    for (const change of block) output.push(`${change.kind}${change.line}`);
  }
  return `${output.join('\n')}\n`;
}
export function applyUnifiedDiff(
  original: string,
  patch: string,
  options: { readonly maxLines?: number } = {},
): string {
  const source = original.split('\n');
  if (source.length > (options.maxLines ?? 4000)) throw new RangeError('Diff line limit exceeded');
  if (patch === '') return original;
  const lines = patch.replace(/\r\n/g, '\n').split('\n');
  if (lines.length > (options.maxLines ?? 4000) * 2 + 2)
    throw new RangeError('Diff patch line limit exceeded');
  if (lines[0] !== '--- before' || lines[1] !== '+++ after')
    throw new TypeError('Expected before/after unified diff headers');
  const output: string[] = [];
  let sourceIndex = 0;
  let i = 2;
  while (i < lines.length) {
    if (lines[i] === '') break;
    const header = /^@@ -(\d+),(\d+) \+(\d+),(\d+) @@$/.exec(lines[i]!);
    if (!header) throw new TypeError(`Invalid hunk header at line ${i + 1}`);
    const oldStart = Number(header[1]);
    const oldCount = Number(header[2]);
    const newCount = Number(header[4]);
    const hunkIndex = oldCount === 0 ? oldStart : oldStart - 1;
    if (hunkIndex < sourceIndex || hunkIndex > source.length)
      throw new TypeError('Hunk is out of order or out of bounds');
    output.push(...source.slice(sourceIndex, hunkIndex));
    sourceIndex = hunkIndex;
    i++;
    let oldSeen = 0;
    let newSeen = 0;
    while (i < lines.length && /^[ +\-]/.test(lines[i]!)) {
      const line = lines[i]!;
      const body = line.slice(1);
      if (line[0] === ' ') {
        if (source[sourceIndex] !== body)
          throw new TypeError(`Diff context mismatch at source line ${sourceIndex + 1}`);
        output.push(body);
        sourceIndex++;
        oldSeen++;
        newSeen++;
      } else if (line[0] === '-') {
        if (source[sourceIndex] !== body)
          throw new TypeError(`Diff removal mismatch at source line ${sourceIndex + 1}`);
        sourceIndex++;
        oldSeen++;
      } else {
        output.push(body);
        newSeen++;
      }
      i++;
    }
    if (oldSeen !== oldCount || newSeen !== newCount)
      throw new TypeError('Hunk line counts do not match header');
  }
  output.push(...source.slice(sourceIndex));
  return output.join('\n');
}
