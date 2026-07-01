/**
 * MySQL構文 → SQLite(sql.js)実行用構文への変換アダプタ。
 *
 * MySQLの本物のWASM実行エンジンは存在しないため、sql.js(SQLite WASM)を
 * 実行基盤としてMySQL構文の大部分を吸収する。完全な互換性はなく、
 * 非対応の構文は明示的にエラーを返す（黙って誤動作させない）。
 */

import { splitStatements } from './sqlStatements';

export const MYSQL_EMULATION_NOTICE =
  'このトラックはSQLiteエンジンによるMySQL構文エミュレーションです。一部のMySQL固有動作（ON DUPLICATE KEY UPDATE、ON UPDATE CURRENT_TIMESTAMP の自動更新、UNSIGNED のオーバーフロー挙動 等）は再現されません。';

export interface RewriteOutcome {
  /** SQLiteで実行可能な形に変換済みの単一ステートメント */
  sql: string;
  /** 実行後に結果セットの列を整形する必要がある場合のタグ */
  resultRemap: 'describe' | 'show-create-table' | null;
  /** resultRemapが必要とする付帯情報（対象テーブル名など） */
  remapContext?: string;
  /** 非致命的だが利用者に伝えるべき警告 */
  warnings: string[];
}

class UnsupportedMysqlSyntaxError extends Error {}

function convertBackticks(sql: string): string {
  return sql.replace(/`([^`]+)`/g, '"$1"');
}

function normalizeTypes(sql: string): string {
  return sql
    .replace(/\b(TINYINT|SMALLINT|MEDIUMINT|BIGINT)\b/gi, 'INTEGER')
    .replace(/\b(DECIMAL|FLOAT|DOUBLE)\b/gi, 'REAL')
    .replace(/\b(DATETIME|TIMESTAMP)\b/gi, 'TEXT');
}

function stripTableOptions(sql: string): string {
  return sql
    .replace(/\bENGINE\s*=\s*\w+/gi, '')
    .replace(/\bDEFAULT\s+CHARSET\s*=\s*\w+/gi, '')
    .replace(/\bCHARACTER\s+SET\s*=?\s*\w+/gi, '')
    .replace(/\bCOLLATE\s*=?\s*\w+/gi, '')
    .replace(/\bUNSIGNED\b/gi, '');
}

function convertFunctions(sql: string): string {
  return sql
    .replace(/\bIF\s*\(/gi, 'IIF(')
    .replace(/\bNOW\s*\(\s*\)/gi, "datetime('now')")
    .replace(/\bCURDATE\s*\(\s*\)/gi, "date('now')");
}

/** トップレベルのカンマで分割する（括弧の深さを見て、ネストしたカンマでは分割しない） */
function splitTopLevelCommas(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

/**
 * CREATE TABLE 内の AUTO_INCREMENT カラムを
 * `INTEGER PRIMARY KEY AUTOINCREMENT` 形式へ構造的に書き換える。
 * 同じカラムを参照する重複した `PRIMARY KEY (...)` テーブル制約があれば除去する。
 */
function rewriteAutoIncrement(sql: string): string {
  if (!/AUTO_INCREMENT/i.test(sql)) return sql;

  const openParenIndex = sql.indexOf('(');
  const closeParenIndex = sql.lastIndexOf(')');
  if (openParenIndex === -1 || closeParenIndex === -1) return sql;

  const before = sql.slice(0, openParenIndex + 1);
  const inside = sql.slice(openParenIndex + 1, closeParenIndex);
  const after = sql.slice(closeParenIndex);

  const defs = splitTopLevelCommas(inside);
  let autoIncrementColumn: string | null = null;

  const rewrittenDefs = defs.map((def) => {
    if (!/AUTO_INCREMENT/i.test(def)) return def;
    const trimmed = def.trim();
    const columnName = trimmed.split(/\s+/)[0];
    autoIncrementColumn = columnName;
    return ` ${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`;
  });

  const finalDefs = rewrittenDefs.filter((def) => {
    if (!autoIncrementColumn) return true;
    const isDuplicatePk = new RegExp(
      `^\\s*(CONSTRAINT\\s+\\S+\\s+)?PRIMARY\\s+KEY\\s*\\(\\s*"?${autoIncrementColumn}"?\\s*\\)\\s*$`,
      'i',
    ).test(def);
    return !isDuplicatePk;
  });

  return `${before}${finalDefs.join(',')}${after}`;
}

function detectUnsupported(sql: string, warnings: string[]): void {
  if (/\bON\s+DUPLICATE\s+KEY\s+UPDATE\b/i.test(sql)) {
    throw new UnsupportedMysqlSyntaxError(
      'ON DUPLICATE KEY UPDATE はこのMySQLエミュレーション(SQLiteエンジン)では非対応です。INSERT OR REPLACE や ON CONFLICT ... DO UPDATE への書き換えを検討してください。',
    );
  }
  if (/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/i.test(sql)) {
    warnings.push('ON UPDATE CURRENT_TIMESTAMP はSQLiteに対応機構がないため無視されました。');
  }
}

function stripOnUpdateCurrentTimestamp(sql: string): string {
  return sql.replace(/\bON\s+UPDATE\s+CURRENT_TIMESTAMP\b/gi, '');
}

const SHOW_TABLES_RE = /^\s*SHOW\s+TABLES\s*$/i;
const DESCRIBE_RE = /^\s*(?:DESCRIBE|DESC|SHOW\s+COLUMNS\s+FROM)\s+["`]?(\w+)["`]?\s*$/i;
const SHOW_CREATE_TABLE_RE = /^\s*SHOW\s+CREATE\s+TABLE\s+["`]?(\w+)["`]?\s*$/i;

/** 1ステートメントをSQLite実行可能な形へ変換する */
export function rewriteStatement(rawStatement: string): RewriteOutcome {
  const warnings: string[] = [];
  const trimmed = rawStatement.trim();

  if (SHOW_TABLES_RE.test(trimmed)) {
    return {
      sql: `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
      resultRemap: null,
      warnings,
    };
  }

  const describeMatch = trimmed.match(DESCRIBE_RE);
  if (describeMatch) {
    return {
      sql: `PRAGMA table_info("${describeMatch[1]}")`,
      resultRemap: 'describe',
      remapContext: describeMatch[1],
      warnings,
    };
  }

  const showCreateMatch = trimmed.match(SHOW_CREATE_TABLE_RE);
  if (showCreateMatch) {
    return {
      sql: `SELECT sql FROM sqlite_master WHERE type='table' AND name='${showCreateMatch[1]}'`,
      resultRemap: 'show-create-table',
      remapContext: showCreateMatch[1],
      warnings,
    };
  }

  detectUnsupported(trimmed, warnings);

  let sql = trimmed;
  sql = convertBackticks(sql);
  sql = rewriteAutoIncrement(sql);
  sql = normalizeTypes(sql);
  sql = stripTableOptions(sql);
  sql = stripOnUpdateCurrentTimestamp(sql);
  sql = convertFunctions(sql);

  return { sql, resultRemap: null, warnings };
}

/** 複数ステートメントからなるスクリプト(シードDDL/DML)全体を変換する */
export function rewriteScript(script: string): { sql: string; warnings: string[] } {
  const warnings: string[] = [];
  const statements = splitStatements(script).map((stmt) => {
    const result = rewriteStatement(stmt);
    warnings.push(...result.warnings);
    return result.sql;
  });
  return { sql: statements.join(';\n'), warnings };
}

/** sql.jsのSqlValue(number | string | Uint8Array | null)と構造的に一致する型 */
type SqlCellValue = number | string | Uint8Array | null;

export function remapDescribeResult(
  columns: string[],
  values: SqlCellValue[][],
): { columns: string[]; values: SqlCellValue[][] } {
  // PRAGMA table_info columns: cid, name, type, notnull, dflt_value, pk
  const idx = (name: string) => columns.indexOf(name);
  const nameIdx = idx('name');
  const typeIdx = idx('type');
  const notnullIdx = idx('notnull');
  const dfltIdx = idx('dflt_value');
  const pkIdx = idx('pk');

  const remappedValues = values.map((row) => [
    row[nameIdx],
    row[typeIdx],
    row[notnullIdx] === 0 ? 'YES' : 'NO',
    row[pkIdx] !== 0 ? 'PRI' : '',
    row[dfltIdx] ?? null,
    '',
  ]);

  return { columns: ['Field', 'Type', 'Null', 'Key', 'Default', 'Extra'], values: remappedValues };
}

export function remapShowCreateTableResult(
  tableName: string,
  columns: string[],
  values: SqlCellValue[][],
): { columns: string[]; values: SqlCellValue[][] } {
  const sqlIdx = columns.indexOf('sql');
  const ddl = String(values[0]?.[sqlIdx] ?? '');
  // 表示用にダブルクォート識別子をバッククォートへ戻す（MySQL風に見せる）
  const cosmeticDdl = ddl.replace(/"([^"]+)"/g, '`$1`');
  return { columns: ['Table', 'Create Table'], values: [[tableName, cosmeticDdl]] };
}
