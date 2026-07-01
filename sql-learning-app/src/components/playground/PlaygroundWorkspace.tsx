import { useEffect, useState } from 'react';
import { Info, Loader2, ListChecks, RotateCcw, TerminalSquare } from 'lucide-react';
import type { PlaygroundConfig } from '../../types/playground';
import type { ExplainResult, QueryOutcome, SchemaInfo } from '../../types/engine';
import { useSqlEngine } from '../../hooks/useSqlEngine';
import { useDraftQuery } from '../../hooks/useDraftQuery';
import { SqlEditor } from '../sql/SqlEditor';
import { ResultsTable } from '../sql/ResultsTable';
import { SchemaViewer } from '../sql/SchemaViewer';
import { EngineStatusBadge } from '../sql/EngineStatusBadge';
import { ExplainPanel } from '../sql/ExplainPanel';
import { GuideBlockList } from '../guide/GuideBlockList';
import { lastStatement } from '../../engines/sqlStatements';

type ResultTab = 'results' | 'explain' | 'schema';
type MobileTab = 'info' | 'sql' | 'result';
const SELECT_LIKE_RE = /^\s*(SELECT|WITH)\b/i;

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof Info }[] = [
  { id: 'info', label: '情報', icon: Info },
  { id: 'sql', label: 'SQL', icon: TerminalSquare },
  { id: 'result', label: '結果', icon: ListChecks },
];

export const PlaygroundWorkspace = ({ config }: { config: PlaygroundConfig }) => {
  const { engine, status, error } = useSqlEngine(config.dialect);
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [outcome, setOutcome] = useState<QueryOutcome | null>(null);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [running, setRunning] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>('results');
  const [mobileTab, setMobileTab] = useState<MobileTab>('sql');

  const [query, setQuery] = useDraftQuery(`playground:${config.slug}`, config.starterQuery ?? '');

  const resetEnvironment = async () => {
    if (!engine) return;
    await engine.reset(config.seed);
    setSchema(await engine.introspectSchema());
    setOutcome(null);
    setExplain(null);
  };

  useEffect(() => {
    if (status === 'ready') {
      void resetEnvironment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const handleRun = async () => {
    if (!engine || running) return;
    setRunning(true);
    try {
      const execOutcome = await engine.exec(query);
      setOutcome(execOutcome);

      let explainResult: ExplainResult | null = null;
      if (SELECT_LIKE_RE.test(lastStatement(query))) {
        try {
          explainResult = await engine.explain(query);
        } catch {
          explainResult = null;
        }
      }
      setExplain(explainResult);
      setSchema(await engine.introspectSchema());
      setResultTab('results');
      setMobileTab('result'); // モバイルでは実行後に画面移動せず結果を見せる
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10">
      {/* モバイル用タブ切替: 情報確認・SQL編集・結果確認を画面遷移なしで行き来する */}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-slate-800 bg-slate-900 p-1 lg:hidden">
        {MOBILE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setMobileTab(id)}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-bold transition ${
              mobileTab === id ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className={`space-y-4 ${mobileTab === 'info' ? 'block' : 'hidden'} lg:block`}>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">{config.title}</h1>
            <p className="text-sm text-slate-400">{config.description}</p>
          </div>
          {engine && <EngineStatusBadge dialect={config.dialect} caveats={engine.caveats} />}
          {config.notes && <GuideBlockList blocks={config.notes} />}
        </aside>

        <section className="space-y-4 min-w-0">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              SQLエンジンを初期化しています...
            </div>
          )}
          {status === 'error' && (
            <p className="text-sm text-rose-400">エンジンの初期化に失敗しました: {error?.message}</p>
          )}

          {status === 'ready' && (
            <>
              <div className={`space-y-4 ${mobileTab === 'sql' ? 'block' : 'hidden'} lg:block`}>
                <SqlEditor
                  value={query}
                  onChange={setQuery}
                  dialect={config.dialect}
                  schema={schema ?? undefined}
                  onRun={handleRun}
                  height="320px"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
                  >
                    {running ? '実行中...' : '実行'}
                  </button>
                  <button
                    onClick={() => void resetEnvironment()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition"
                  >
                    <RotateCcw size={13} />
                    スキーマを初期状態に戻す
                  </button>
                </div>
              </div>

              <div className={`space-y-4 ${mobileTab === 'result' ? 'block' : 'hidden'} lg:block`}>
                <div className="flex gap-1 border-b border-slate-800">
                  {(['results', 'explain', 'schema'] as ResultTab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setResultTab(tab)}
                      className={`px-3 py-2 text-xs font-bold border-b-2 -mb-px transition ${
                        resultTab === tab ? 'border-sky-500 text-sky-300' : 'border-transparent text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab === 'results' ? '結果' : tab === 'explain' ? 'EXPLAIN' : 'スキーマ'}
                    </button>
                  ))}
                </div>

                <div>
                  {resultTab === 'results' && <ResultsTable outcome={outcome} />}
                  {resultTab === 'explain' && <ExplainPanel explain={explain} />}
                  {resultTab === 'schema' && <SchemaViewer schema={schema} />}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
