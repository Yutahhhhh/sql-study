import type { ExplainNode, ExplainResult } from '../../types/engine';

const INDEX_USAGE_RE = /USING\s+(?:COVERING\s+)?INDEX\s+(\S+)/i;
const PK_USAGE_RE = /USING\s+(?:INTEGER\s+)?PRIMARY\s+KEY/i;
const RELATION_RE = /^(?:SEARCH|SCAN)\s+(?:TABLE\s+)?(\S+)/i;

function parseDetailLine(detail: string): ExplainNode {
  const relationMatch = detail.match(RELATION_RE);
  const indexMatch = detail.match(INDEX_USAGE_RE);
  return {
    operation: detail,
    relationName: relationMatch?.[1],
    indexName: indexMatch?.[1],
  };
}

/** sql.js(SQLite)の `EXPLAIN QUERY PLAN` 結果行から ExplainResult を構築する */
export function parseSqliteExplain(rows: { detail: string }[]): ExplainResult {
  const nodes = rows.map((r) => parseDetailLine(r.detail));

  const usesIndex = rows.some((r) => INDEX_USAGE_RE.test(r.detail) || PK_USAGE_RE.test(r.detail));
  const usesSeqScan = rows.some(
    (r) => /^SCAN/i.test(r.detail) && !INDEX_USAGE_RE.test(r.detail) && !PK_USAGE_RE.test(r.detail),
  );

  return {
    raw: rows.map((r) => r.detail).join('\n'),
    nodes,
    usesIndex,
    usesSeqScan,
  };
}
