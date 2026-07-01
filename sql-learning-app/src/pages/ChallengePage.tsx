import { useParams } from 'react-router-dom';
import { useChallengeLoader } from '../hooks/useChallengeLoader';
import { PageShell } from '../components/layout/PageShell';
import { ChallengeWorkspace } from '../components/challenge/ChallengeWorkspace';

export const ChallengePage = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { config, loading, error } = useChallengeLoader(slug);

  return (
    <PageShell topicLabel={config?.headerLabel} loading={loading} error={error} notFound={!loading && !error && !config}>
      {config && <ChallengeWorkspace challenge={config} />}
    </PageShell>
  );
};
