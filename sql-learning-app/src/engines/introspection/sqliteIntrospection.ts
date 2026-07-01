import type { SqlJsDatabase } from '../sqljsLoader';
import type { ColumnInfo, ConstraintInfo, IndexInfo, SchemaInfo, TableInfo } from '../../types/engine';

function execToObjects(db: SqlJsDatabase, sql: string): Record<string, unknown>[] {
  const results = db.exec(sql);
  if (results.length === 0) return [];
  const { columns, values } = results[0];
  return values.map((row) => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

function extractCheckExpressions(tableDdl: string): string[] {
  const checks: string[] = [];
  const re = /\bCHECK\s*\(((?:[^()]|\([^()]*\))*)\)/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tableDdl)) !== null) {
    checks.push(match[1].trim());
  }
  return checks;
}

export function introspectSqliteSchema(db: SqlJsDatabase): SchemaInfo {
  const tableRows = execToObjects(
    db,
    `SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`,
  );

  const tables: TableInfo[] = tableRows.map((tableRow) => {
    const tableName = String(tableRow.name);
    const ddl = String(tableRow.sql ?? '');

    const columnRows = execToObjects(db, `PRAGMA table_info("${tableName}")`);
    const columns: ColumnInfo[] = columnRows.map((c) => ({
      name: String(c.name),
      dataType: String(c.type),
      nullable: Number(c.notnull) === 0,
      defaultValue: c.dflt_value == null ? undefined : String(c.dflt_value),
      isPrimaryKey: Number(c.pk) !== 0,
    }));

    const indexListRows = execToObjects(db, `PRAGMA index_list("${tableName}")`);
    const indexes: IndexInfo[] = indexListRows.map((idx) => {
      const indexName = String(idx.name);
      const indexInfoRows = execToObjects(db, `PRAGMA index_info("${indexName}")`);
      const orderedColumns = indexInfoRows
        .sort((a, b) => Number(a.seqno) - Number(b.seqno))
        .map((r) => String(r.name));
      return {
        name: indexName,
        tableName,
        columns: orderedColumns,
        isUnique: Number(idx.unique) !== 0,
        isPrimaryKey: idx.origin === 'pk',
      };
    });

    const fkRows = execToObjects(db, `PRAGMA foreign_key_list("${tableName}")`);
    const fkById = new Map<number, ConstraintInfo>();
    for (const row of fkRows) {
      const id = Number(row.id);
      let fk = fkById.get(id);
      if (!fk) {
        fk = {
          name: `fk_${tableName}_${id}`,
          type: 'foreign-key',
          tableName,
          columns: [],
          referencedTable: String(row.table),
          referencedColumns: [],
        };
        fkById.set(id, fk);
      }
      const seq = Number(row.seq);
      fk.columns[seq] = String(row.from);
      fk.referencedColumns![seq] = String(row.to);
    }

    const pkColumns = columns.filter((c) => c.isPrimaryKey).map((c) => c.name);
    const constraints: ConstraintInfo[] = [];
    if (pkColumns.length > 0) {
      constraints.push({
        name: `pk_${tableName}`,
        type: 'primary-key',
        tableName,
        columns: pkColumns,
      });
    }
    constraints.push(...fkById.values());
    for (const idx of indexes) {
      if (idx.isUnique && !idx.isPrimaryKey) {
        constraints.push({
          name: idx.name,
          type: 'unique',
          tableName,
          columns: idx.columns,
        });
      }
    }
    for (const checkExpression of extractCheckExpressions(ddl)) {
      constraints.push({
        name: `check_${tableName}_${constraints.length}`,
        type: 'check',
        tableName,
        columns: [],
        checkExpression,
      });
    }

    return { name: tableName, columns, indexes, constraints };
  });

  return { tables };
}
