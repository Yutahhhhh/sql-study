import { useEffect, useRef, useState } from 'react';
import type { SqlDialect, SqlEngine } from '../types/engine';
import { createEngine } from '../engines/engineFactory';

export type SqlEngineStatus = 'loading' | 'ready' | 'error';

/**
 * SQLエンジンのライフサイクルを管理する。
 * マウント時にWASMエンジンを初期化し、アンマウント/ダイアレクト変更時に
 * 必ず dispose() してWASMヒープを解放する。
 */
export function useSqlEngine(dialect: SqlDialect) {
  const [engine, setEngine] = useState<SqlEngine | null>(null);
  const [status, setStatus] = useState<SqlEngineStatus>('loading');
  const [error, setError] = useState<Error | null>(null);
  const engineRef = useRef<SqlEngine | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    setEngine(null);

    createEngine(dialect)
      .then((created) => {
        if (cancelled) {
          void created.dispose();
          return;
        }
        engineRef.current = created;
        setEngine(created);
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      });

    return () => {
      cancelled = true;
      if (engineRef.current) {
        void engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [dialect]);

  return { engine, status, error };
}
