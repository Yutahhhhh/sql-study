import { Link } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, Eye, FileText, ListChecks, PenTool, TerminalSquare } from 'lucide-react';
import { Header } from '../components/common/Header';
import { guideManifest } from '../guides';
import { challengeManifest } from '../challenges';
import { playgroundManifest } from '../playground';
import type { GuideManifest } from '../types/guide';
import type { ChallengeManifest } from '../types/challenge';
import type { PlaygroundManifest } from '../types/playground';
import { resolveIcon } from '../utils/iconResolver';

type CardEntry = GuideManifest | ChallengeManifest | PlaygroundManifest;

/** Tailwindの動的クラス名生成(`bg-${color}-950`)はJITスキャナに拾われないため、静的マップで解決する */
const COLOR_STYLES: Record<string, { iconBg: string; iconBorder: string; iconText: string; badgeBg: string; badgeText: string; badgeBorder: string }> = {
  sky: { iconBg: 'bg-sky-950', iconBorder: 'border-sky-800', iconText: 'text-sky-400', badgeBg: 'bg-sky-950', badgeText: 'text-sky-400', badgeBorder: 'border-sky-800' },
  blue: { iconBg: 'bg-blue-950', iconBorder: 'border-blue-800', iconText: 'text-blue-400', badgeBg: 'bg-blue-950', badgeText: 'text-blue-400', badgeBorder: 'border-blue-800' },
  indigo: { iconBg: 'bg-indigo-950', iconBorder: 'border-indigo-800', iconText: 'text-indigo-400', badgeBg: 'bg-indigo-950', badgeText: 'text-indigo-400', badgeBorder: 'border-indigo-800' },
  amber: { iconBg: 'bg-amber-950', iconBorder: 'border-amber-800', iconText: 'text-amber-400', badgeBg: 'bg-amber-950', badgeText: 'text-amber-400', badgeBorder: 'border-amber-800' },
  emerald: { iconBg: 'bg-emerald-950', iconBorder: 'border-emerald-800', iconText: 'text-emerald-400', badgeBg: 'bg-emerald-950', badgeText: 'text-emerald-400', badgeBorder: 'border-emerald-800' },
  purple: { iconBg: 'bg-purple-950', iconBorder: 'border-purple-800', iconText: 'text-purple-400', badgeBg: 'bg-purple-950', badgeText: 'text-purple-400', badgeBorder: 'border-purple-800' },
  orange: { iconBg: 'bg-orange-950', iconBorder: 'border-orange-800', iconText: 'text-orange-400', badgeBg: 'bg-orange-950', badgeText: 'text-orange-400', badgeBorder: 'border-orange-800' },
};

const Card = ({ entry, badge }: { entry: CardEntry; badge?: string }) => {
  const style = COLOR_STYLES[entry.color] ?? COLOR_STYLES.sky;
  return (
    <Link
      to={entry.path}
      className="group relative bg-slate-900 border-2 border-slate-800 hover:border-sky-600 rounded-xl p-4 sm:p-5 md:p-6 transition-all hover:shadow-2xl hover:shadow-sky-900/20"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className={`shrink-0 p-2.5 sm:p-3 ${style.iconBg} rounded-lg border ${style.iconBorder}`}>
          <span className={style.iconText}>{resolveIcon(entry.icon, { size: 22 })}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <h3 className="min-w-0 break-words text-base font-bold leading-snug text-slate-100 transition-colors group-hover:text-sky-400 sm:text-lg lg:text-xl">
              {entry.title}
            </h3>
            {badge && (
              <span
                className={`self-start shrink-0 whitespace-nowrap text-[10px] sm:text-xs px-2 py-0.5 ${style.badgeBg} ${style.badgeText} border ${style.badgeBorder} rounded-full font-bold`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs leading-relaxed text-slate-400 sm:text-sm">{entry.description}</p>
        </div>
        <ArrowRight
          className="mt-1 hidden shrink-0 text-slate-600 transition-all group-hover:translate-x-1 group-hover:text-sky-400 sm:block"
          size={20}
        />
      </div>
    </Link>
  );
};

export const Home = () => {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-12">
        <div className="text-center mb-12">
          <div className="inline-block mb-4">
            <span className="bg-sky-600 text-white font-bold px-3 py-1 rounded text-sm tracking-wider">
              SQL LEARNING
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
            SQL学習プラットフォーム
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed sm:text-lg max-w-2xl mx-auto">
            DB設計・インデックス・パフォーマンス・制約・複雑なクエリを、ブラウザ上で実際にテーブルを作りクエリを実行しながら学ぶ
          </p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <PenTool className="shrink-0 text-sky-400" size={22} />
            <h2 className="text-lg font-bold leading-snug sm:text-2xl">演習</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">要件を満たすSQLを書き、実行結果と要件チェックで答え合わせをする</p>
          <div className="grid gap-6">
            {challengeManifest.map((challenge) => (
              <Card key={challenge.slug} entry={challenge} badge={challenge.badge} />
            ))}
          </div>
        </div>

        <div className="space-y-6 mt-14">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="shrink-0 text-amber-400" size={22} />
            <h2 className="text-xl font-bold sm:text-2xl">ガイド</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">図解・比較表で設計の考え方を読み解く</p>
          <div className="grid gap-6">
            {guideManifest.map((guide) => (
              <Card key={guide.slug} entry={guide} badge={guide.badge} />
            ))}
          </div>
        </div>

        <div className="space-y-6 mt-14">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <TerminalSquare className="shrink-0 text-emerald-400" size={22} />
            <h2 className="text-xl font-bold sm:text-2xl">自由演習(プレイグラウンド)</h2>
          </div>
          <p className="text-sm text-slate-500 -mt-3">採点なしで、自由にテーブル作成・クエリ実行を試せる環境</p>
          <div className="grid gap-6">
            {playgroundManifest.map((pg) => (
              <Card key={pg.slug} entry={pg} />
            ))}
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            { title: '本物のPostgreSQL', description: 'PGliteでブラウザ内に本物のPostgreSQLを実行', icon: <Eye size={24} aria-hidden="true" /> },
            { title: '採点付き演習', description: '要件を満たすかその場でチェック', icon: <ListChecks size={24} aria-hidden="true" /> },
            { title: '実務直結のテーマ', description: '設計・インデックス・制約・複雑なクエリを網羅', icon: <BookOpenCheck size={24} aria-hidden="true" /> },
          ].map((feature, index) => (
            <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-sky-900/60 bg-sky-950/40 text-sky-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2 text-slate-200">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
        <p>&copy; 2026 SQL学習プラットフォーム. Built with React + TypeScript + Tailwind CSS</p>
      </footer>
    </div>
  );
};
