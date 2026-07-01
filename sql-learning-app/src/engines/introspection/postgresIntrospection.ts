import type { PGlite } from '@electric-sql/pglite';
import type { ColumnInfo, ConstraintInfo, IndexInfo, SchemaInfo, TableInfo } from '../../types/engine';

interface ColumnRow {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface PkRow {
  table_name: string;
  column_name: string;
}

interface IndexRow {
  table_name: string;
  index_name: string;
  is_unique: boolean;
  is_primary: boolean;
  column_name: string;
  ord: number;
}

interface ConstraintBaseRow {
  oid: number;
  conname: string;
  contype: 'p' | 'f' | 'u' | 'c' | string;
  table_name: string;
  referenced_table: string | null;
}

interface ConstraintColumnRow {
  oid: number;
  column_name: string;
  ord: number;
}

interface CheckDefRow {
  oid: number;
  definition: string;
}

const CONSTRAINT_TYPE_MAP: Record<string, ConstraintInfo['type']> = {
  p: 'primary-key',
  f: 'foreign-key',
  u: 'unique',
  c: 'check',
};

export async function introspectPostgresSchema(db: PGlite): Promise<SchemaInfo> {
  const tablesResult = await db.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;`,
  );

  const columnsResult = await db.query<ColumnRow>(`
    SELECT table_name, column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  const pkResult = await db.query<PkRow>(`
    SELECT tc.table_name, kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public';
  `);
  const pkColumns = new Set(pkResult.rows.map((r) => `${r.table_name}.${r.column_name}`));

  const indexRowsResult = await db.query<IndexRow>(`
    SELECT
      t.relname AS table_name,
      i.relname AS index_name,
      ix.indisunique AS is_unique,
      ix.indisprimary AS is_primary,
      a.attname AS column_name,
      k.ord
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
    WHERE n.nspname = 'public'
    ORDER BY t.relname, i.relname, k.ord;
  `);

  const constraintBaseResult = await db.query<ConstraintBaseRow>(`
    SELECT con.oid::int AS oid, con.conname, con.contype::text AS contype, t.relname AS table_name, ft.relname AS referenced_table
    FROM pg_constraint con
    JOIN pg_class t ON t.oid = con.conrelid
    LEFT JOIN pg_class ft ON ft.oid = con.confrelid
    WHERE t.relnamespace = 'public'::regnamespace;
  `);

  const constraintColumnsResult = await db.query<ConstraintColumnRow>(`
    SELECT con.oid::int AS oid, a.attname AS column_name, u.ord
    FROM pg_constraint con
    JOIN pg_class t ON t.oid = con.conrelid
    JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS u(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = u.attnum
    WHERE t.relnamespace = 'public'::regnamespace
    ORDER BY con.oid, u.ord;
  `);

  const refColumnsResult = await db.query<ConstraintColumnRow>(`
    SELECT con.oid::int AS oid, a.attname AS column_name, u.ord
    FROM pg_constraint con
    JOIN pg_class ft ON ft.oid = con.confrelid
    JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS u(attnum, ord) ON true
    JOIN pg_attribute a ON a.attrelid = ft.oid AND a.attnum = u.attnum
    WHERE con.contype = 'f';
  `);

  const checkDefResult = await db.query<CheckDefRow>(`
    SELECT con.oid::int AS oid, pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    WHERE con.contype = 'c';
  `);

  const columnsByOid = new Map<number, string[]>();
  for (const row of constraintColumnsResult.rows) {
    const list = columnsByOid.get(row.oid) ?? [];
    list[row.ord - 1] = row.column_name;
    columnsByOid.set(row.oid, list);
  }
  const refColumnsByOid = new Map<number, string[]>();
  for (const row of refColumnsResult.rows) {
    const list = refColumnsByOid.get(row.oid) ?? [];
    list[row.ord - 1] = row.column_name;
    refColumnsByOid.set(row.oid, list);
  }
  const checkDefByOid = new Map(checkDefResult.rows.map((r) => [r.oid, r.definition]));

  const constraints: ConstraintInfo[] = constraintBaseResult.rows
    .filter((row) => row.contype in CONSTRAINT_TYPE_MAP)
    .map((row) => ({
      name: row.conname,
      type: CONSTRAINT_TYPE_MAP[row.contype],
      tableName: row.table_name,
      columns: columnsByOid.get(row.oid) ?? [],
      referencedTable: row.referenced_table ?? undefined,
      referencedColumns: refColumnsByOid.get(row.oid),
      checkExpression: checkDefByOid.get(row.oid),
    }));

  const indexesByTable = new Map<string, Map<string, IndexInfo>>();
  for (const row of indexRowsResult.rows) {
    let tableIndexes = indexesByTable.get(row.table_name);
    if (!tableIndexes) {
      tableIndexes = new Map();
      indexesByTable.set(row.table_name, tableIndexes);
    }
    let index = tableIndexes.get(row.index_name);
    if (!index) {
      index = {
        name: row.index_name,
        tableName: row.table_name,
        columns: [],
        isUnique: row.is_unique,
        isPrimaryKey: row.is_primary,
      };
      tableIndexes.set(row.index_name, index);
    }
    index.columns[row.ord - 1] = row.column_name;
  }

  const columnsByTable = new Map<string, ColumnInfo[]>();
  for (const row of columnsResult.rows) {
    const list = columnsByTable.get(row.table_name) ?? [];
    list.push({
      name: row.column_name,
      dataType: row.data_type,
      nullable: row.is_nullable === 'YES',
      defaultValue: row.column_default ?? undefined,
      isPrimaryKey: pkColumns.has(`${row.table_name}.${row.column_name}`),
    });
    columnsByTable.set(row.table_name, list);
  }

  const tables: TableInfo[] = tablesResult.rows.map((row) => ({
    name: row.tablename,
    columns: columnsByTable.get(row.tablename) ?? [],
    indexes: Array.from(indexesByTable.get(row.tablename)?.values() ?? []),
    constraints: constraints.filter((c) => c.tableName === row.tablename),
  }));

  return { tables };
}
