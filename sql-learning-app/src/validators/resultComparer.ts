const NUMERIC_STRING_RE = /^-?\d+(\.\d+)?$/;

/**
 * クエリ結果セットの比較。NULLや数値/文字列表現ゆれを軽く正規化してから比較する。
 * PostgreSQL(PGlite)はNUMERIC/bigint列を文字列で返す一方、SQLite(sql.js)は
 * REAL/INTEGER列をJSの数値で返すため、数値らしき文字列は数値として扱う。
 */
function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) return ' NULL';
  if (typeof value === 'number') return `n:${value}`;
  if (typeof value === 'boolean') return `b:${value}`;
  if (typeof value === 'string' && NUMERIC_STRING_RE.test(value)) return `n:${Number(value)}`;
  return `s:${String(value)}`;
}

function normalizeRow(row: unknown[]): string {
  return row.map(normalizeValue).join('|');
}

export function resultSetsMatch(
  actual: { columns: string[]; rows: unknown[][] },
  expected: { columns: string[]; rows: unknown[][] },
  orderSensitive: boolean,
): boolean {
  if (actual.rows.length !== expected.rows.length) return false;

  const actualRows = actual.rows.map(normalizeRow);
  const expectedRows = expected.rows.map(normalizeRow);

  if (orderSensitive) {
    return actualRows.every((row, i) => row === expectedRows[i]);
  }

  const actualSorted = [...actualRows].sort();
  const expectedSorted = [...expectedRows].sort();
  return actualSorted.every((row, i) => row === expectedSorted[i]);
}
