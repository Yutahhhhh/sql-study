import { AlertTriangle } from 'lucide-react';
import type { QueryOutcome } from '../../types/engine';

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export const ResultsTable = ({ outcome }: { outcome: QueryOutcome | null }) => {
  if (!outcome) {
    return <p className="text-sm text-slate-500 italic">まだクエリが実行されていません。</p>;
  }

  if (outcome.status === 'error') {
    return (
      <div className="flex gap-2 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-300 status-flash-error">
        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">{outcome.error.message}</p>
          {outcome.error.detail && <p className="text-xs text-rose-400 mt-1">{outcome.error.detail}</p>}
          {outcome.error.hint && <p className="text-xs text-rose-400 mt-1">ヒント: {outcome.error.hint}</p>}
        </div>
      </div>
    );
  }

  if (outcome.results.length === 0) {
    return <p className="text-sm text-emerald-400 status-flash-success">実行が完了しました(結果セットなし)。</p>;
  }

  return (
    <div className="space-y-4">
      {outcome.results.map((result, i) => (
        <div key={i} className="result-row-enter">
          <p className="text-xs text-slate-500 mb-1">
            {result.rowCount}行 / {result.durationMs.toFixed(1)}ms
          </p>
          {result.columns.length === 0 ? (
            <p className="text-sm text-slate-500">(列を持つ結果はありません)</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800">
                    {result.columns.map((col, ci) => (
                      <th key={ci} className="text-left px-3 py-2 font-bold text-slate-300 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-800/60 hover:bg-slate-900/50">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-1.5 text-slate-400 whitespace-nowrap">
                          {formatCell(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
