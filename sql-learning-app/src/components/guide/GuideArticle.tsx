import { useState } from 'react';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import type { GuideConfig } from '../../types/guide';
import { resolveIcon } from '../../utils/iconResolver';
import { GuideBlockView } from './GuideBlockList';

export const GuideArticle = ({ config }: { config: GuideConfig }) => {
  const [activeId, setActiveId] = useState(config.sections[0]?.id);

  return (
    <div className="max-w-6xl w-full mx-auto p-6 lg:p-10 grid lg:grid-cols-[220px_1fr] gap-8">
      {/* 目次 */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">目次</p>
          <nav className="space-y-1">
            {config.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                onClick={() => setActiveId(s.id)}
                className={`block text-sm px-3 py-1.5 rounded-lg transition border-l-2 ${
                  activeId === s.id
                    ? 'border-sky-500 bg-slate-900 text-sky-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {s.title}
              </a>
            ))}
            {config.checkpoints && config.checkpoints.length > 0 && (
              <a
                href="#checkpoints"
                className="block text-sm px-3 py-1.5 rounded-lg border-l-2 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              >
                理解チェック
              </a>
            )}
          </nav>
        </div>
      </aside>

      {/* 本文 */}
      <article className="min-w-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-3">{config.title}</h1>
          <p className="text-slate-400">{config.description}</p>
          {config.intro && (
            <div
              className="mt-4 text-sm leading-relaxed text-slate-300 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_strong]:text-slate-100"
              dangerouslySetInnerHTML={{ __html: config.intro }}
            />
          )}
        </div>

        <div className="space-y-10">
          {config.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
                {section.icon && <span className="text-sky-400">{resolveIcon(section.icon, { size: 20 })}</span>}
                <h2 className="text-xl font-bold text-slate-100">{section.title}</h2>
              </div>
              <div className="space-y-4">
                {section.blocks.map((block, i) => (
                  <GuideBlockView key={i} block={block} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {config.checkpoints && config.checkpoints.length > 0 && (
          <section id="checkpoints" className="scroll-mt-24 mt-10">
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
              <CheckCircle2 size={20} className="text-emerald-400" />
              <h2 className="text-xl font-bold text-slate-100">理解チェック</h2>
            </div>
            <ul className="space-y-2">
              {config.checkpoints.map((c, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: c }} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {config.references && config.references.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-2.5 mb-4 pb-2 border-b border-slate-800">
              <ExternalLink size={18} className="text-slate-400" />
              <h2 className="text-lg font-bold text-slate-100">公式ドキュメント</h2>
            </div>
            <ul className="space-y-1.5">
              {config.references.map((r, i) => (
                <li key={i}>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1.5"
                  >
                    <ExternalLink size={13} />
                    {r.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
};
