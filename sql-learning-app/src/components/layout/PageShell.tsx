import type { ReactNode } from 'react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { Header } from '../common/Header';

interface PageShellProps {
  topicLabel?: string;
  loading: boolean;
  error: Error | null;
  notFound?: boolean;
  children: ReactNode;
}

export const PageShell = ({ topicLabel, loading, error, notFound, children }: PageShellProps) => {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
      <Header topicLabel={topicLabel} />
      <main className="flex-1">
        {loading && (
          <div className="flex flex-1 items-center justify-center py-24 text-slate-500">
            <Loader2 size={20} className="animate-spin mr-2" />
            読み込み中...
          </div>
        )}
        {!loading && (error || notFound) && (
          <div className="flex flex-col items-center justify-center py-24 text-rose-400 gap-2">
            <TriangleAlert size={24} />
            <p className="text-sm">{error ? error.message : 'コンテンツが見つかりませんでした。'}</p>
          </div>
        )}
        {!loading && !error && !notFound && children}
      </main>
    </div>
  );
};
