import initSqlJs from 'sql.js';

export type SqlJsStatic = Awaited<ReturnType<typeof initSqlJs>>;
export type SqlJsDatabase = InstanceType<SqlJsStatic['Database']>;

let sqlJsPromise: Promise<SqlJsStatic> | null = null;

/** sql.jsのWASMモジュールを一度だけロードする（複数エンジンインスタンスで共有） */
export function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlJsPromise) {
    sqlJsPromise = initSqlJs({
      locateFile: (file: string) => `${import.meta.env.BASE_URL}${file}`,
    });
  }
  return sqlJsPromise;
}
