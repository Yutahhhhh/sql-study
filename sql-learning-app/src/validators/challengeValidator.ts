import type {
  ChallengeSeedStatements,
  ExplainResult,
  QueryOutcome,
  QueryResultSet,
  SchemaInfo,
  SqlDialect,
} from '../types/engine';
import type {
  ChallengeAction,
  ChallengeActionResult,
  ChallengeCheck,
  ChallengeConfig,
  ChallengeRunResult,
  ChallengeSeed,
} from '../types/challenge';
import { detectQueryConstruct } from './queryShapeAnalyzer';
import { resultSetsMatch } from './resultComparer';

/** shared + dialect別の差分を1つのシード文へ合成する */
export function resolveSeed(seed: ChallengeSeed, dialect: SqlDialect): ChallengeSeedStatements {
  const dialectSeed = dialect === 'postgres' ? seed.postgres : seed.mysql;
  return {
    ddl: [...(seed.shared?.ddl ?? []), ...(dialectSeed?.ddl ?? [])],
    dml: [...(seed.shared?.dml ?? []), ...(dialectSeed?.dml ?? [])],
  };
}

export interface CheckEvalContext {
  dialect: SqlDialect;
  schema: SchemaInfo;
  queryOutcome: QueryOutcome | null;
  explain: ExplainResult | null;
  querySql: string;
}

function lastResultSet(outcome: QueryOutcome | null): QueryResultSet | null {
  if (!outcome || outcome.status !== 'success' || outcome.results.length === 0) return null;
  return outcome.results[outcome.results.length - 1];
}

function findTable(schema: SchemaInfo, tableName: string) {
  return schema.tables.find((t) => t.name.toLowerCase() === tableName.toLowerCase());
}

function columnsEqualOrdered(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((col, i) => col.toLowerCase() === b[i]?.toLowerCase());
}

function columnsEqualAsSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a.map((c) => c.toLowerCase()));
  return b.every((c) => setA.has(c.toLowerCase()));
}

export function evaluateCheck(check: ChallengeCheck, ctx: CheckEvalContext): { passed: boolean; detail?: string } {
  switch (check.type) {
    case 'table-exists': {
      return { passed: Boolean(findTable(ctx.schema, check.tableName)) };
    }
    case 'column-exists': {
      const table = findTable(ctx.schema, check.tableName);
      const column = table?.columns.find((c) => c.name.toLowerCase() === check.columnName.toLowerCase());
      if (!column) return { passed: false };
      if (check.notNull && column.nullable) {
        return { passed: false, detail: 'NOT NULL制約がありません' };
      }
      if (check.dataTypeOneOf && check.dataTypeOneOf.length > 0) {
        const matches = check.dataTypeOneOf.some((t) =>
          column.dataType.toUpperCase().includes(t.toUpperCase()),
        );
        return { passed: matches, detail: `実際の型: ${column.dataType}` };
      }
      return { passed: true };
    }
    case 'constraint-exists': {
      const table = findTable(ctx.schema, check.tableName);
      if (check.constraintType === 'check') {
        // SQLite側はCHECK式が参照する列を構造的に特定できないため、
        // 式テキストに対象列名が含まれるかで緩く判定する
        const matched = table?.constraints.find(
          (c) =>
            c.type === 'check' &&
            check.columns.every((col) => new RegExp(`\\b${col}\\b`, 'i').test(c.checkExpression ?? '')),
        );
        return { passed: Boolean(matched) };
      }
      const matched = table?.constraints.find(
        (c) =>
          c.type === check.constraintType &&
          columnsEqualAsSet(c.columns, check.columns) &&
          (!check.referencedTable || c.referencedTable?.toLowerCase() === check.referencedTable.toLowerCase()),
      );
      return { passed: Boolean(matched) };
    }
    case 'index-exists': {
      const table = findTable(ctx.schema, check.tableName);
      const matched = table?.indexes.find(
        (idx) =>
          columnsEqualOrdered(idx.columns, check.columns) &&
          (check.unique === undefined || idx.isUnique === check.unique),
      );
      return { passed: Boolean(matched) };
    }
    case 'query-result-matches': {
      const result = lastResultSet(ctx.queryOutcome);
      if (!result) return { passed: false, detail: 'クエリが正常に実行されていません' };
      const matched = resultSetsMatch(result, check.expected, check.orderSensitive);
      return { passed: matched };
    }
    case 'row-count-equals': {
      const result = lastResultSet(ctx.queryOutcome);
      if (!result) return { passed: false };
      return { passed: result.rowCount === check.expectedCount, detail: `実際の件数: ${result.rowCount}` };
    }
    case 'query-uses-construct': {
      if (!ctx.querySql.trim()) return { passed: false };
      const detection = detectQueryConstruct(ctx.querySql, ctx.dialect, check.construct);
      return {
        passed: detection.matched,
        detail: detection.usedFallback ? '(簡易構文判定によるフォールバック結果)' : undefined,
      };
    }
    case 'query-uses-index': {
      if (!ctx.explain) return { passed: false, detail: 'EXPLAIN結果がありません' };
      if (check.expectIndexName) {
        return { passed: ctx.explain.nodes.some((n) => n.indexName === check.expectIndexName) };
      }
      return { passed: ctx.explain.usesIndex };
    }
    case 'query-avoids-seq-scan': {
      if (!ctx.explain) return { passed: false, detail: 'EXPLAIN結果がありません' };
      if (check.tableName) {
        const offending = ctx.explain.nodes.some(
          (n) =>
            n.relationName?.toLowerCase() === check.tableName!.toLowerCase() &&
            /seq scan|^scan\b/i.test(n.operation) &&
            !n.indexName,
        );
        return { passed: !offending };
      }
      return { passed: !ctx.explain.usesSeqScan };
    }
    default: {
      const _exhaustive: never = check;
      return _exhaustive;
    }
  }
}

function evaluateAction(
  action: ChallengeAction,
  checksById: Map<string, ChallengeCheck>,
  ctx: CheckEvalContext,
): ChallengeActionResult {
  const failedChecks: ChallengeCheck[] = [];
  for (const checkId of action.checkIds) {
    const check = checksById.get(checkId);
    if (!check) continue;
    const { passed } = evaluateCheck(check, ctx);
    if (!passed) failedChecks.push(check);
  }
  const status: 'success' | 'failure' = failedChecks.length === 0 ? 'success' : 'failure';
  return {
    actionId: action.id,
    title: action.title,
    status,
    message: status === 'success' ? action.successMessage : action.failureMessage,
    failedChecks,
  };
}

export function runChallenge(challenge: ChallengeConfig, ctx: CheckEvalContext): ChallengeRunResult {
  const checksById = new Map(challenge.checks.map((c) => [c.id, c]));
  const actionResults = challenge.actions.map((action) => evaluateAction(action, checksById, ctx));

  const allSuccess = actionResults.every((r) => r.status === 'success');
  const highlightedTableNames = Array.from(
    new Set(
      actionResults
        .flatMap((r) => r.failedChecks)
        .map((c) => ('tableName' in c ? c.tableName : undefined))
        .filter((t): t is string => Boolean(t)),
    ),
  );

  return {
    status: allSuccess ? 'success' : 'failure',
    title: allSuccess ? 'すべての要件を満たしました' : '一部の要件が未達成です',
    message: allSuccess
      ? challenge.title + ' を完了しました。'
      : '失敗したアクションの詳細を確認してください。',
    actionResults,
    queryOutcome: ctx.queryOutcome,
    explain: ctx.explain ?? undefined,
    highlightedTableNames,
  };
}
