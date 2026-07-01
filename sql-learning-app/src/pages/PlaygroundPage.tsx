import { useParams } from 'react-router-dom';
import { usePlaygroundLoader } from '../hooks/usePlaygroundLoader';
import { PageShell } from '../components/layout/PageShell';
import { PlaygroundWorkspace } from '../components/playground/PlaygroundWorkspace';

export const PlaygroundPage = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { config, loading, error } = usePlaygroundLoader(slug);

  return (
    <PageShell topicLabel={config?.headerLabel} loading={loading} error={error} notFound={!loading && !error && !config}>
      {config && <PlaygroundWorkspace config={config} />}
    </PageShell>
  );
};
