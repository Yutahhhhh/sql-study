import { useEffect, useState } from 'react';

/**
 * lg 未満（< 1024px）かどうかを購読する。
 * デスクトップ=横並び / モバイル=縦積み の分岐に使う。
 */
export const useIsMobile = (query = '(max-width: 1023px)'): boolean => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return isMobile;
};
