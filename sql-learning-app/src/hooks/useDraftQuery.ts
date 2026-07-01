import { useEffect, useState } from 'react';

function readDraft(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** SQLエディタの入力内容を localStorage に永続化する(誤リロードでの入力消失を防ぐ) */
export function useDraftQuery(storageKey: string, initialValue: string) {
  const [value, setValue] = useState(() => readDraft(storageKey, initialValue));

  useEffect(() => {
    setValue(readDraft(storageKey, initialValue));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, value);
    } catch {
      // private browsing等でlocalStorageが使えない場合は無視する
    }
  }, [storageKey, value]);

  return [value, setValue] as const;
}
