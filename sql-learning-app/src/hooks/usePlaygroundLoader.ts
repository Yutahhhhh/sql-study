import { useEffect, useState } from 'react';
import type { PlaygroundConfig } from '../types/playground';
import { loadPlaygroundConfig } from '../playground';

export function usePlaygroundLoader(slug: string) {
  const [config, setConfig] = useState<PlaygroundConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadPlaygroundConfig(slug)
      .then(setConfig)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { config, loading, error };
}
