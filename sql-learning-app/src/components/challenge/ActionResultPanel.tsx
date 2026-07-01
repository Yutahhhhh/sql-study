import { CheckCircle2, XCircle } from 'lucide-react';
import type { ChallengeRunResult } from '../../types/challenge';

export const ActionResultPanel = ({ result }: { result: ChallengeRunResult | null }) => {
  if (!result) {
    return <p className="text-sm text-slate-500 italic">「実行」を押すと、要件を満たしているか確認できます。</p>;
  }

  return (
    <div className="space-y-3">
      <div
        className={`rounded-lg border p-3 ${
          result.status === 'success'
            ? 'border-emerald-700 bg-emerald-950/30 status-flash-success'
            : 'border-rose-800 bg-rose-950/20'
        }`}
      >
        <p className={`flex items-center gap-2 text-sm font-bold ${result.status === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
          {result.status === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          {result.title}
        </p>
        <p className="text-xs text-slate-400 mt-1">{result.message}</p>
      </div>

      <div className="space-y-2">
        {result.actionResults.map((action) => (
          <div
            key={action.actionId}
            className={`rounded-lg border p-3 ${
              action.status === 'success' ? 'border-slate-800 bg-slate-900/40' : 'border-rose-900/60 bg-rose-950/10'
            }`}
          >
            <p className="flex items-center gap-2 text-sm font-bold text-slate-200">
              {action.status === 'success' ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <XCircle size={14} className="text-rose-500 shrink-0" />
              )}
              {action.title}
            </p>
            <p className="text-xs text-slate-400 mt-1">{action.message}</p>
            {action.failedChecks.length > 0 && (
              <ul className="mt-2 space-y-1 pl-5 list-disc">
                {action.failedChecks.map((check) => (
                  <li key={check.id} className="text-xs text-rose-300">
                    {check.label}: {check.failureMessage}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
