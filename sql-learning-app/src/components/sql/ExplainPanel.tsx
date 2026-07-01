import { Gauge, ScanSearch, Zap } from 'lucide-react';
import type { ExplainResult } from '../../types/engine';

function flatten(nodes: ExplainResult['nodes']): ExplainResult['nodes'] {
  const out: ExplainResult['nodes'] = [];
  const visit = (list: ExplainResult['nodes']) => {
    for (const n of list) {
      out.push(n);
      if (n.children) visit(n.children);
    }
  };
  visit(nodes);
  return out;
}

export const ExplainPanel = ({ explain }: { explain: ExplainResult | null }) => {
  if (!explain) {
    return <p className="text-sm text-slate-500 italic">EXPLAINはまだ実行されていません。</p>;
  }

  const flatNodes = flatten(explain.nodes);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            explain.usesIndex
              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800'
              : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}
        >
          <Zap size={11} />
          {explain.usesIndex ? 'インデックス使用あり' : 'インデックス未使用'}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
            explain.usesSeqScan
              ? 'bg-rose-950/40 text-rose-300 border border-rose-800'
              : 'bg-slate-900 text-slate-500 border border-slate-800'
          }`}
        >
          <ScanSearch size={11} />
          {explain.usesSeqScan ? 'シーケンシャルスキャンあり' : 'シーケンシャルスキャンなし'}
        </span>
      </div>
      <div className="space-y-1">
        {flatNodes.map((node, i) => (
          <div key={i} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-[11px] font-mono">
            <Gauge size={12} className="text-sky-400 shrink-0" />
            <span className="text-slate-300">{node.operation}</span>
            {node.relationName && <span className="text-slate-500">on {node.relationName}</span>}
            {node.indexName && <span className="text-indigo-400">using {node.indexName}</span>}
            {node.actualTimeMs !== undefined && (
              <span className="text-slate-600 ml-auto">{node.actualTimeMs.toFixed(2)}ms</span>
            )}
          </div>
        ))}
      </div>
      <details className="text-[11px] text-slate-500">
        <summary className="cursor-pointer">raw出力を見る</summary>
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-slate-400">{explain.raw}</pre>
      </details>
    </div>
  );
};
