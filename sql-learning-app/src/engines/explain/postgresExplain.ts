import type { ExplainNode, ExplainResult } from '../../types/engine';

interface RawPlanNode {
  'Node Type': string;
  'Relation Name'?: string;
  'Index Name'?: string;
  'Plan Rows'?: number;
  'Actual Total Time'?: number;
  Plans?: RawPlanNode[];
}

function convertNode(raw: RawPlanNode): ExplainNode {
  return {
    operation: raw['Node Type'],
    relationName: raw['Relation Name'],
    indexName: raw['Index Name'],
    estimatedRows: raw['Plan Rows'],
    actualTimeMs: raw['Actual Total Time'],
    children: raw.Plans?.map(convertNode),
  };
}

function collectFlat(node: ExplainNode, out: ExplainNode[]): void {
  out.push(node);
  node.children?.forEach((child) => collectFlat(child, out));
}

export function parsePostgresExplain(planValue: unknown): ExplainResult {
  let parsed: Array<{ Plan: RawPlanNode }>;
  if (typeof planValue === 'string') {
    parsed = JSON.parse(planValue);
  } else if (Array.isArray(planValue)) {
    parsed = planValue as Array<{ Plan: RawPlanNode }>;
  } else {
    parsed = [];
  }

  const rootRaw = parsed[0]?.Plan;
  const nodes: ExplainNode[] = [];
  if (rootRaw) {
    const root = convertNode(rootRaw);
    collectFlat(root, nodes);
  }

  const usesIndex = nodes.some((n) => /Index Scan|Index Only Scan|Bitmap Index Scan/i.test(n.operation));
  const usesSeqScan = nodes.some((n) => /Seq Scan/i.test(n.operation));

  return {
    raw: JSON.stringify(parsed, null, 2),
    nodes,
    usesIndex,
    usesSeqScan,
  };
}
