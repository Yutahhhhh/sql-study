import { useParams } from 'react-router-dom';
import { useGuideLoader } from '../hooks/useGuideLoader';
import { PageShell } from '../components/layout/PageShell';
import { GuideArticle } from '../components/guide/GuideArticle';

export const GuidePage = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { config, loading, error } = useGuideLoader(slug);

  return (
    <PageShell topicLabel={config?.headerLabel} loading={loading} error={error} notFound={!loading && !error && !config}>
      {config && <GuideArticle config={config} />}
    </PageShell>
  );
};
