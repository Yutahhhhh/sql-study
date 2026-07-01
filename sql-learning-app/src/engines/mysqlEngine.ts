import type { SqlJsDatabase } from './sqljsLoader';
import { loadSqlJs } from './sqljsLoader';
import {
  MYSQL_EMULATION_NOTICE,
  remapDescribeResult,
  remapShowCreateTableResult,
  rewriteScript,
  rewriteStatement,
} from './mysqlAdapter';
import { lastStatement, splitStatements } from './sqlStatements';
import { introspectSqliteSchema } from './introspection/sqliteIntrospection';
import { parseSqliteExplain } from './explain/sqliteExplain';
import type {
  ChallengeSeedStatements,
  ExplainResult,
  QueryOutcome,
  QueryResultSet,
  SchemaInfo,
  SqlEngine,
} from '../types/engine';

export class MysqlEngine implements SqlEngine {
  readonly dialect = 'mysql' as const;
  readonly caveats: string[] = [MYSQL_EMULATION_NOTICE];

  private db: SqlJsDatabase | null = null;

  async init(): Promise<void> {
    const SQL = await loadSqlJs();
    this.db = new SQL.Database();
  }

  private requireDb(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('MysqlEngine is not initialized. Call init() first.');
    }
    return this.db;
  }

  async reset(seed: ChallengeSeedStatements): Promise<void> {
    const db = this.requireDb();
    const tableRows = db.exec(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
    );
    const tableNames = tableRows[0]?.values.map((row) => String(row[0])) ?? [];
    for (const name of tableNames) {
      db.exec(`DROP TABLE IF EXISTS "${name}"`);
    }
    const statements = [...seed.ddl, ...(seed.dml ?? [])];
    if (statements.length > 0) {
      const { sql } = rewriteScript(statements.join(';\n'));
      db.exec(sql);
    }
  }

  async exec(sql: string): Promise<QueryOutcome> {
    const db = this.requireDb();
    const start = performance.now();
    try {
      const resultSets: QueryResultSet[] = [];
      for (const rawStatement of splitStatements(sql)) {
        const { sql: rewritten, resultRemap, remapContext } = rewriteStatement(rawStatement);
        const execResults = db.exec(rewritten);
        for (const result of execResults) {
          let { columns, values } = result;
          if (resultRemap === 'describe') {
            ({ columns, values } = remapDescribeResult(columns, values));
          } else if (resultRemap === 'show-create-table' && remapContext) {
            ({ columns, values } = remapShowCreateTableResult(remapContext, columns, values));
          }
          resultSets.push({
            columns,
            rows: values,
            rowCount: values.length,
            durationMs: performance.now() - start,
          });
        }
      }
      return { status: 'success', results: resultSets };
    } catch (err) {
      return { status: 'error', error: normalizeError(err) };
    }
  }

  async explain(sql: string): Promise<ExplainResult> {
    const db = this.requireDb();
    const { sql: rewritten } = rewriteStatement(lastStatement(sql));
    const results = db.exec(`EXPLAIN QUERY PLAN ${rewritten}`);
    if (results.length === 0) {
      return { raw: '', nodes: [], usesIndex: false, usesSeqScan: false };
    }
    const { columns, values } = results[0];
    const detailIdx = columns.indexOf('detail');
    const rows = values.map((row) => ({ detail: String(row[detailIdx]) }));
    return parseSqliteExplain(rows);
  }

  async introspectSchema(): Promise<SchemaInfo> {
    return introspectSqliteSchema(this.requireDb());
  }

  async dispose(): Promise<void> {
    this.db?.close();
    this.db = null;
  }
}

function normalizeError(err: unknown): { message: string; detail?: string; hint?: string } {
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: String(err) };
}
