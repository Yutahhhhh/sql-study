import type { GuideBlock, GuideAccent } from '../../types/guide';

/** accent名 → 実在するTailwindクラス(リテラルで列挙しビルド時に生成させる) */
const ACCENT: Record<GuideAccent, { border: string; text: string; bg: string; dot: string }> = {
  blue: { border: 'border-blue-700', text: 'text-blue-300', bg: 'bg-blue-950/40', dot: 'bg-blue-500' },
  rose: { border: 'border-rose-700', text: 'text-rose-300', bg: 'bg-rose-950/40', dot: 'bg-rose-500' },
  amber: { border: 'border-amber-700', text: 'text-amber-300', bg: 'bg-amber-950/40', dot: 'bg-amber-500' },
  emerald: { border: 'border-emerald-700', text: 'text-emerald-300', bg: 'bg-emerald-950/40', dot: 'bg-emerald-500' },
  sky: { border: 'border-sky-700', text: 'text-sky-300', bg: 'bg-sky-950/40', dot: 'bg-sky-500' },
  purple: { border: 'border-purple-700', text: 'text-purple-300', bg: 'bg-purple-950/40', dot: 'bg-purple-500' },
  indigo: { border: 'border-indigo-700', text: 'text-indigo-300', bg: 'bg-indigo-950/40', dot: 'bg-indigo-500' },
  slate: { border: 'border-slate-600', text: 'text-slate-300', bg: 'bg-slate-800/40', dot: 'bg-slate-500' },
};

const accentOf = (a?: GuideAccent) => ACCENT[a ?? 'slate'];

export const GuideBlockView = ({ block }: { block: GuideBlock }) => {
  switch (block.type) {
    case 'paragraph':
      return (
        <div
          className="text-sm leading-relaxed text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[12px] [&_strong]:text-slate-100"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );

    case 'list':
      return block.ordered ? (
        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100">
          {block.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </ol>
      ) : (
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100">
          {block.items.map((it, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
          ))}
        </ul>
      );

    case 'callout': {
      const variantStyle = {
        info: { border: 'border-blue-700', bg: 'bg-blue-950/40', text: 'text-blue-300' },
        tip: { border: 'border-emerald-700', bg: 'bg-emerald-950/40', text: 'text-emerald-300' },
        warn: { border: 'border-amber-700', bg: 'bg-amber-950/40', text: 'text-amber-300' },
        danger: { border: 'border-rose-700', bg: 'bg-rose-950/40', text: 'text-rose-300' },
      }[block.variant];
      return (
        <div className={`rounded-lg border ${variantStyle.border} ${variantStyle.bg} p-4`}>
          {block.title && <p className={`font-bold text-sm mb-1 ${variantStyle.text}`}>{block.title}</p>}
          <div
            className="text-sm text-slate-300 leading-relaxed [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </div>
      );
    }

    case 'table':
      return (
        <div className="overflow-x-auto">
          {block.caption && <p className="text-xs text-slate-500 mb-2">{block.caption}</p>}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left py-2 px-3 font-bold text-slate-200 bg-slate-900">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-slate-800">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="py-2 px-3 align-top text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
                      dangerouslySetInnerHTML={{ __html: cell }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'flow':
      return (
        <div>
          {block.title && <p className="text-xs font-bold text-slate-400 mb-2">{block.title}</p>}
          <div className="flex flex-col md:flex-row md:items-stretch gap-2">
            {block.steps.map((s, i) => {
              const a = accentOf(s.accent);
              return (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-2 md:flex-1">
                  <div className={`flex-1 rounded-lg border ${a.border} ${a.bg} px-3 py-2.5 text-center`}>
                    <p className={`font-bold text-sm ${a.text}`}>{s.label}</p>
                    {s.sublabel && <p className="text-[11px] text-slate-400 mt-0.5">{s.sublabel}</p>}
                  </div>
                  {i < block.steps.length - 1 && (
                    <span className="text-slate-600 text-center shrink-0">→</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );

    case 'compare':
      return (
        <div className={`grid gap-3 ${block.columns.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {block.columns.map((col, i) => {
            const a = accentOf(col.accent);
            return (
              <div key={i} className={`rounded-lg border ${a.border} ${a.bg} p-4`}>
                <p className={`font-bold ${a.text}`}>{col.title}</p>
                {col.subtitle && <p className="text-[11px] text-slate-400 mb-2">{col.subtitle}</p>}
                <ul className="mt-2 space-y-1.5">
                  {col.points.map((p, pi) => (
                    <li key={pi} className="flex gap-2 text-[13px] text-slate-300">
                      <span className={`mt-1.5 h-1.5 w-1.5 rounded-full ${a.dot} shrink-0`} />
                      <span
                        className="[&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
                        dangerouslySetInnerHTML={{ __html: p }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );

    case 'steps':
      return (
        <div className="space-y-2">
          {block.steps.map((s, i) => {
            const a = accentOf(s.accent);
            return (
              <div key={i} className={`flex gap-3 rounded-lg border ${a.border} ${a.bg} p-3`}>
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${a.dot} text-xs font-bold text-slate-950`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${a.text}`}>{s.title}</p>
                  {s.html && (
                    <div
                      className="text-[13px] text-slate-300 mt-1 leading-relaxed [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
                      dangerouslySetInnerHTML={{ __html: s.html }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );

    case 'code':
      return (
        <div>
          {block.caption && <p className="text-xs text-slate-500 mb-1">{block.caption}</p>}
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-900 p-4 text-[12px] leading-relaxed text-slate-300 font-mono">
            <code>{block.code}</code>
          </pre>
        </div>
      );

    default:
      return null;
  }
};

export const GuideBlockList = ({ blocks }: { blocks: GuideBlock[] }) => (
  <div className="space-y-4">
    {blocks.map((block, i) => (
      <GuideBlockView key={i} block={block} />
    ))}
  </div>
);
