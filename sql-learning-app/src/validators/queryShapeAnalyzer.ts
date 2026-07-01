import { Parser } from 'node-sql-parser';
import type { SqlDialect } from '../types/engine';
import type { ChallengeCheck } from '../types/challenge';

type QueryConstruct = Extract<ChallengeCheck, { type: 'query-uses-construct' }>['construct'];

const parser = new Parser();

const REGEX_FALLBACKS: Record<QueryConstruct, RegExp> = {
  subquery: /\(\s*SELECT\b/i,
  'correlated-subquery': /\(\s*SELECT\b/i,
  cte: /\bWITH\b[\s\S]+?\bAS\s*\(/i,
  join: /\bJOIN\b/i,
  'window-function': /\bOVER\s*\(/i,
  'group-by': /\bGROUP\s+BY\b/i,
  union: /\bUNION\b/i,
  'exists-clause': /\bEXISTS\s*\(/i,
};

function astDatabaseOption(dialect: SqlDialect): string {
  return dialect === 'postgres' ? 'Postgresql' : 'MySQL';
}

interface SubqueryWrapper {
  tableList: string[];
  columnList: string[];
  ast: { type: string };
}

function isSubqueryWrapper(node: unknown): node is SubqueryWrapper {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return false;
  const obj = node as Record<string, unknown>;
  return (
    Array.isArray(obj.tableList) &&
    Array.isArray(obj.columnList) &&
    typeof obj.ast === 'object' &&
    obj.ast !== null &&
    (obj.ast as { type?: string }).type === 'select'
  );
}

function isCorrelatedWrapper(wrapper: SubqueryWrapper): boolean {
  const ownTables = new Set(
    wrapper.tableList.map((t) => t.split('::')[2]).filter((t): t is string => Boolean(t)),
  );
  return wrapper.columnList.some((c) => {
    const parts = c.split('::');
    const table = parts[1];
    return Boolean(table) && table !== 'null' && !ownTables.has(table);
  });
}

interface WalkResult {
  subqueryWrappers: SubqueryWrapper[];
  hasJoin: boolean;
  hasWindowFunction: boolean;
  hasGroupBy: boolean;
  hasUnion: boolean;
  hasExists: boolean;
  hasCte: boolean;
}

function walk(node: unknown, result: WalkResult, seen = new Set<unknown>()): void {
  if (!node || typeof node !== 'object') return;
  if (seen.has(node)) return;
  seen.add(node);

  if (isSubqueryWrapper(node)) {
    result.subqueryWrappers.push(node);
  }

  if (Array.isArray(node)) {
    for (const item of node) walk(item, result, seen);
    return;
  }

  const obj = node as Record<string, unknown>;

  if (Array.isArray(obj.from)) {
    for (const fromItem of obj.from as Record<string, unknown>[]) {
      if (fromItem && typeof fromItem === 'object' && 'join' in fromItem && fromItem.join) {
        result.hasJoin = true;
      }
    }
  }
  if (obj.groupby) result.hasGroupBy = true;
  if (obj.with) result.hasCte = true;
  if (typeof obj.set_op === 'string' && /union/i.test(obj.set_op)) result.hasUnion = true;
  if (obj.over) result.hasWindowFunction = true;
  if (
    obj.type === 'function' &&
    obj.name &&
    typeof obj.name === 'object' &&
    Array.isArray((obj.name as { name?: unknown[] }).name)
  ) {
    const nameParts = (obj.name as { name: { value?: string }[] }).name;
    if (nameParts.some((p) => typeof p.value === 'string' && p.value.toUpperCase() === 'EXISTS')) {
      result.hasExists = true;
    }
  }

  for (const key of Object.keys(obj)) {
    walk(obj[key], result, seen);
  }
}

function detectViaAst(sql: string, dialect: SqlDialect, construct: QueryConstruct): boolean {
  const ast = parser.astify(sql, { database: astDatabaseOption(dialect) });
  const result: WalkResult = {
    subqueryWrappers: [],
    hasJoin: false,
    hasWindowFunction: false,
    hasGroupBy: false,
    hasUnion: false,
    hasExists: false,
    hasCte: false,
  };
  walk(ast, result);

  switch (construct) {
    case 'subquery':
      return result.subqueryWrappers.length > 0;
    case 'correlated-subquery':
      return result.subqueryWrappers.some(isCorrelatedWrapper);
    case 'cte':
      return result.hasCte;
    case 'join':
      return result.hasJoin;
    case 'window-function':
      return result.hasWindowFunction;
    case 'group-by':
      return result.hasGroupBy;
    case 'union':
      return result.hasUnion;
    case 'exists-clause':
      return result.hasExists;
    default:
      return false;
  }
}

export interface ShapeDetectionResult {
  matched: boolean;
  usedFallback: boolean;
}

/**
 * クエリが指定の構文要素(サブクエリ/JOIN/CTE等)を使っているかを判定する。
 * node-sql-parserのPostgres方言は新しめの構文でパースに失敗することがあるため、
 * 失敗時は正規表現による簡易判定にフォールバックする(完全な正確性は保証しない)。
 */
export function detectQueryConstruct(
  sql: string,
  dialect: SqlDialect,
  construct: QueryConstruct,
): ShapeDetectionResult {
  try {
    return { matched: detectViaAst(sql, dialect, construct), usedFallback: false };
  } catch {
    return { matched: REGEX_FALLBACKS[construct].test(sql), usedFallback: true };
  }
}
