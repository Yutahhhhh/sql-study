import { Info } from 'lucide-react';
import type { SqlDialect } from '../../types/engine';

interface EngineStatusBadgeProps {
  dialect: SqlDialect;
  caveats: string[];
}

export const EngineStatusBadge = ({ dialect, caveats }: EngineStatusBadgeProps) => {
  if (dialect === 'postgres') {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-emerald-800 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
        <span className="font-bold">PostgreSQL (PGlite / 本物のWASM実行エンジン)</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2 rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-300">
      <Info size={14} className="shrink-0 mt-0.5" />
      <div>
        <p className="font-bold">MySQL (SQLiteエンジンによる構文エミュレーション)</p>
        {caveats.map((c, i) => (
          <p key={i} className="text-amber-400/80 mt-1">
            {c}
          </p>
        ))}
      </div>
    </div>
  );
};
