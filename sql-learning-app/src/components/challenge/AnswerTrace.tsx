import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import type { AnswerTraceStep } from '../../types/challenge';
import { GuideBlockList } from '../guide/GuideBlockList';

export const AnswerTrace = ({ steps }: { steps: AnswerTraceStep[] }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-amber-300">
          <Lightbulb size={14} />
          解答例の解説を見る(ネタバレ注意)
        </span>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      {open && (
        <div className="border-t border-slate-800 p-3 space-y-4">
          {steps.map((step, i) => (
            <div key={step.id}>
              <p className="text-sm font-bold text-slate-200 mb-2">
                {i + 1}. {step.title}
              </p>
              <GuideBlockList blocks={step.blocks} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
