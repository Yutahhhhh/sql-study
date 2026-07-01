import type { SqlDialect, SqlEngine } from '../types/engine';

/**
 * エンジン生成をアプリ全体で直列化するロック。
 * PGlite/sql.jsのWASM初期化は内部でfetchしたResponseを再利用する実装になっており、
 * 複数の生成呼び出しが並行すると「Response is already read」エラーで失敗することがある
 * (React StrictModeの開発時二重effect実行や、素早いページ遷移で発生しうる)。
 * 生成処理自体を1件ずつ直列化することで、各呼び出しは引き続き独立したインスタンスを返しつつ
 * WASMロードの競合を避ける。
 */
let creationLock: Promise<void> = Promise.resolve();

/**
 * ダイアレクトに応じて必要なWASM実装のみを動的importする。
 * Postgresトラックを開いたユーザーはsql.jsのWASMを取得せず、その逆も同様。
 */
export async function createEngine(dialect: SqlDialect): Promise<SqlEngine> {
  const previousLock = creationLock;
  let release: () => void = () => {};
  creationLock = new Promise((resolve) => {
    release = resolve;
  });
  await previousLock;

  try {
    if (dialect === 'postgres') {
      const { PostgresEngine } = await import('./postgresEngine');
      const engine = new PostgresEngine();
      await engine.init();
      return engine;
    }
    const { MysqlEngine } = await import('./mysqlEngine');
    const engine = new MysqlEngine();
    await engine.init();
    return engine;
  } finally {
    release();
  }
}
