import { useEffect, useState } from 'react';
import type { ChallengeConfig } from '../types/challenge';
import { loadChallengeConfig } from '../challenges';

export function useChallengeLoader(slug: string) {
  const [config, setConfig] = useState<ChallengeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    loadChallengeConfig(slug)
      .then(setConfig)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [slug]);

  return { config, loading, error };
}
