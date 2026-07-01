import { Link } from 'react-router-dom';

interface HeaderProps {
  topicLabel?: string;
}

export const Header = ({ topicLabel }: HeaderProps) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="hidden md:flex px-6 py-4 justify-between items-center">
        <div className="flex items-center space-x-3">
          <span className="bg-sky-600 text-white font-bold px-2.5 py-0.5 rounded text-xs tracking-wider">
            {topicLabel ?? 'SQL LEARNING'}
          </span>
          <Link to="/" className="text-lg font-bold tracking-tight hover:text-sky-400 transition-colors">
            SQL学習プラットフォーム
          </Link>
        </div>
      </div>

      <div className="md:hidden h-12 px-3 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="min-w-0 flex items-center gap-2 text-slate-100 hover:text-sky-300 transition-colors"
          aria-label="ホームへ戻る"
        >
          <span className="bg-sky-600 text-white font-black px-2 py-1 rounded text-[10px] leading-none tracking-wider">
            SQL
          </span>
          <span className="min-w-0 truncate text-xs font-bold tracking-tight">{topicLabel ?? 'SQL学習'}</span>
        </Link>
      </div>
    </header>
  );
};
