import { useCallback, useEffect, useState } from 'react';
import { ClipboardList, Loader2, RotateCcw, TerminalSquare, ListChecks } from 'lucide-react';
import type { ChallengeConfig, ChallengeRunResult } from '../../types/challenge';
import type { ExplainResult, QueryOutcome, SchemaInfo, SqlDialect } from '../../types/engine';
import { useSqlEngine } from '../../hooks/useSqlEngine';
import { useDraftQuery } from '../../hooks/useDraftQuery';
import { resolveSeed, runChallenge } from '../../validators/challengeValidator';
import { RequirementsList } from './RequirementsList';
import { ActionResultPanel } from './ActionResultPanel';
import { AnswerTrace } from './AnswerTrace';
import { SqlEditor } from '../sql/SqlEditor';
import { ResultsTable } from '../sql/ResultsTable';
import { SchemaViewer } from '../sql/SchemaViewer';
import { EngineStatusBadge } from '../sql/EngineStatusBadge';
import { ExplainPanel } from '../sql/ExplainPanel';
import { lastStatement } from '../../engines/sqlStatements';

type ResultTab = 'results' | 'explain' | 'schema';
type MobileTab = 'info' | 'sql' | 'result';

const SELECT_LIKE_RE = /^\s*(SELECT|WITH)\b/i;

const MOBILE_TABS: { id: MobileTab; label: string; icon: typeof ClipboardList }[] = [
  { id: 'info', label: '要件', icon: ClipboardList },
  { id: 'sql', label: 'SQL', icon: TerminalSquare },
  { id: 'result', label: '結果', icon: ListChecks },
];

export const ChallengeWorkspace = ({ challenge }: { challenge: ChallengeConfig }) => {
  const [dialect, setDialect] = useState<SqlDialect>(challenge.dialects[0]);
  const { engine, status, error } = useSqlEngine(dialect);

  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [outcome, setOutcome] = useState<QueryOutcome | null>(null);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [runResult, setRunResult] = useState<ChallengeRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [resultTab, setResultTab] = useState<ResultTab>('results');
  const [mobileTab, setMobileTab] = useState<MobileTab>('info');

  const [query, setQuery] = useDraftQuery(`challenge:${challenge.slug}:${dialect}`, '');

  const resetEnvironment = useCallback(async () => {
    if (!engine) return;
    const seed = resolveSeed(challenge.seed, dialect);
    await engine.reset(seed);
    const freshSchema = await engine.introspectSchema();
    setSchema(freshSchema);
    setOutcome(null);
    setExplain(null);
    setRunResult(null);
  }, [engine, challenge, dialect]);

  useEffect(() => {
    if (status === 'ready') {
      void resetEnvironment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dialect]);

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

      const freshSchema = await engine.introspectSchema();
      setSchema(freshSchema);

      const result = runChallenge(challenge, {
        dialect,
        schema: freshSchema,
        queryOutcome: execOutcome,
        explain: explainResult,
        querySql: query,
      });
      setRunResult(result);
      setResultTab('results');
      setMobileTab('result'); // モバイルでは実行後に画面移動せず結果を見せる
    } finally {
      setRunning(false);
    }
  };

  const loadSolution = () => {
    const solution = challenge.solutionQueries[dialect] ?? challenge.solutionQueries.shared ?? '';
    setQuery(solution);
  };

  return (
    <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-10">
      {/* モバイル用タブ切替: 要件を確認する画面とSQL編集・結果確認の画面を行き来する必要をなくす */}
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

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <aside className={`space-y-4 ${mobileTab === 'info' ? 'block' : 'hidden'} lg:block`}>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 mb-1">{challenge.title}</h1>
            <p className="text-sm text-slate-400">{challenge.description}</p>
          </div>

          {challenge.dialects.length > 1 && (
            <div className="flex gap-2">
              {challenge.dialects.map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    dialect === d
                      ? 'bg-sky-950 border-sky-700 text-sky-300'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {d === 'postgres' ? 'PostgreSQL' : 'MySQL'}
                </button>
              ))}
            </div>
          )}

          {engine && <EngineStatusBadge dialect={dialect} caveats={engine.caveats} />}

          <RequirementsList scenario={challenge.scenario} requirements={challenge.requirements} />

          <AnswerTrace steps={challenge.answerTrace} />
          <button onClick={loadSolution} className="text-xs text-slate-500 hover:text-sky-400 underline">
            解答例をエディタに読み込む
          </button>
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
                <SqlEditor value={query} onChange={setQuery} dialect={dialect} schema={schema ?? undefined} onRun={handleRun} />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRun}
                    disabled={running}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition"
                  >
                    {running ? '実行中...' : '実行して採点する'}
                  </button>
                  <button
                    onClick={() => void resetEnvironment()}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold rounded-lg transition"
                  >
                    <RotateCcw size={13} />
                    環境をリセット
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
                  {resultTab === 'schema' && (
                    <SchemaViewer schema={schema} highlightedTableNames={runResult?.highlightedTableNames} />
                  )}
                </div>

                <ActionResultPanel result={runResult} />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
