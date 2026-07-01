import { useEffect, useState } from 'react';
import type { GuideConfig } from '../types/guide';
import { loadGuideConfig } from '../guides';

export function useGuideLoader(slug: string) {
  const [config, setConfig] = useState<GuideConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadGuideConfig(slug)
      .then(setConfig)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { config, loading, error };
}
