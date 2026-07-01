import { ClipboardList } from 'lucide-react';
import type { ChallengeRequirement } from '../../types/challenge';

export const RequirementsList = ({
  scenario,
  requirements,
}: {
  scenario: string;
  requirements: ChallengeRequirement[];
}) => {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-slate-300">{scenario}</p>
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <ClipboardList size={13} />
          要件
        </p>
        <ul className="space-y-2">
          {requirements.map((req) => (
            <li key={req.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-sm font-bold text-slate-200">{req.title}</p>
              <p className="text-xs text-slate-400 mt-1">{req.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
