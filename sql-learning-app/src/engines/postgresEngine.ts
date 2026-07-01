import { PGlite } from '@electric-sql/pglite';
import type {
  ChallengeSeedStatements,
  ExplainResult,
  QueryOutcome,
  QueryResultSet,
  SchemaInfo,
  SqlEngine,
} from '../types/engine';
import { introspectPostgresSchema } from './introspection/postgresIntrospection';
import { parsePostgresExplain } from './explain/postgresExplain';
import { lastStatement } from './sqlStatements';

export class PostgresEngine implements SqlEngine {
  readonly dialect = 'postgres' as const;
  readonly caveats: string[] = [];

  private db: PGlite | null = null;

  async init(): Promise<void> {
    this.db = await PGlite.create();
  }

  private requireDb(): PGlite {
    if (!this.db) {
      throw new Error('PostgresEngine is not initialized. Call init() first.');
    }
    return this.db;
  }

  async reset(seed: ChallengeSeedStatements): Promise<void> {
    const db = this.requireDb();
    await db.exec(`
      DO $$
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    const statements = [...seed.ddl, ...(seed.dml ?? [])];
    if (statements.length > 0) {
      await db.exec(statements.join(';\n'));
    }
  }

  async exec(sql: string): Promise<QueryOutcome> {
    const db = this.requireDb();
    const start = performance.now();
    try {
      const results = await db.exec(sql, { rowMode: 'array' });
      const durationMs = performance.now() - start;
      const resultSets: QueryResultSet[] = results.map((r) => ({
        columns: r.fields.map((f) => f.name),
        rows: r.rows as unknown[][],
        rowCount: r.rows.length || r.affectedRows || 0,
        durationMs,
      }));
      return { status: 'success', results: resultSets };
    } catch (err) {
      return { status: 'error', error: normalizeError(err) };
    }
  }

  async explain(sql: string, opts?: { analyze?: boolean }): Promise<ExplainResult> {
    const db = this.requireDb();
    const analyze = opts?.analyze ?? true;
    const target = lastStatement(sql);
    const explainSql = analyze
      ? `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${target}`
      : `EXPLAIN (FORMAT JSON) ${target}`;
    const result = await db.query<{ 'QUERY PLAN': unknown }>(explainSql);
    const planJson = result.rows[0]?.['QUERY PLAN'];
    return parsePostgresExplain(planJson);
  }

  async introspectSchema(): Promise<SchemaInfo> {
    return introspectPostgresSchema(this.requireDb());
  }

  async dispose(): Promise<void> {
    await this.db?.close();
    this.db = null;
  }
}

function normalizeError(err: unknown): { message: string; detail?: string; hint?: string } {
  if (err && typeof err === 'object') {
    const e = err as { message?: string; detail?: string; hint?: string };
    return {
      message: e.message ?? String(err),
      detail: e.detail,
      hint: e.hint,
    };
  }
  return { message: String(err) };
}
