/**
 * SQL実行エンジンの抽象化レイヤーの型定義。
 * PostgreSQLトラック（PGlite）とMySQLトラック（sql.js + 構文アダプタ）の
 * 両実装がこのインターフェースを満たす。
 */

export type SqlDialect = 'postgres' | 'mysql';

export interface QueryResultSet {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  durationMs: number;
}

export interface QueryError {
  message: string;
  detail?: string;
  hint?: string;
}

export type QueryOutcome =
  | { status: 'success'; results: QueryResultSet[] }
  | { status: 'error'; error: QueryError };

export interface ExplainNode {
  operation: string;
  relationName?: string;
  indexName?: string;
  estimatedRows?: number;
  actualTimeMs?: number;
  children?: ExplainNode[];
}

export interface ExplainResult {
  raw: string;
  nodes: ExplainNode[];
  usesIndex: boolean;
  usesSeqScan: boolean;
}

export interface ColumnInfo {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
}

export interface IndexInfo {
  name: string;
  tableName: string;
  columns: string[];
  isUnique: boolean;
  isPrimaryKey: boolean;
}

export interface ConstraintInfo {
  name: string;
  type: 'primary-key' | 'foreign-key' | 'unique' | 'check' | 'not-null';
  tableName: string;
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  checkExpression?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
}

export interface SchemaInfo {
  tables: TableInfo[];
}

export interface ChallengeSeedStatements {
  ddl: string[];
  dml?: string[];
}

export interface SqlEngine {
  readonly dialect: SqlDialect;
  /** 既知の制約・注記（UIのEngineStatusBadgeに表示する） */
  readonly caveats: string[];
  init(): Promise<void>;
  /** 全テーブルを破棄してシードを再投入する（リトライボタン用） */
  reset(seed: ChallengeSeedStatements): Promise<void>;
  exec(sql: string): Promise<QueryOutcome>;
  explain(sql: string, opts?: { analyze?: boolean }): Promise<ExplainResult>;
  introspectSchema(): Promise<SchemaInfo>;
  dispose(): Promise<void>;
}
