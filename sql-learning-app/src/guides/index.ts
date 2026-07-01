import type { GuideConfig, GuideManifest } from '../types/guide';

const guideLoaders: Record<string, () => Promise<{ default: GuideConfig }>> = {
  'db-design-and-normalization': () => import('./db-design-and-normalization/config'),
  'indexing-fundamentals': () => import('./indexing-fundamentals/config'),
  'composite-indexes': () => import('./composite-indexes/config'),
  'query-performance-and-explain': () => import('./query-performance-and-explain/config'),
  'constraints-and-integrity': () => import('./constraints-and-integrity/config'),
  'subqueries-and-complex-queries': () => import('./subqueries-and-complex-queries/config'),
};

export const guideManifest: GuideManifest[] = [
  {
    slug: 'db-design-and-normalization',
    title: 'DB設計と正規化',
    description: '非正規化されたテーブルをER設計と正規化の手順で整理する',
    icon: 'Database',
    color: 'sky',
    badge: 'DB設計',
    path: '/guides/db-design-and-normalization',
  },
  {
    slug: 'indexing-fundamentals',
    title: '単一インデックスの基礎とオプティマイザの選択',
    description: 'インデックスがどう使われるか、オプティマイザの判断基準を理解する',
    icon: 'ListTree',
    color: 'blue',
    badge: '単一インデックス',
    path: '/guides/indexing-fundamentals',
  },
  {
    slug: 'composite-indexes',
    title: '複合インデックスとカラム順序・カバリングインデックス',
    description: '複合インデックスの列順序がなぜ重要かを実例で理解する',
    icon: 'Rows3',
    color: 'indigo',
    badge: '複合インデックス',
    path: '/guides/composite-indexes',
  },
  {
    slug: 'query-performance-and-explain',
    title: 'クエリパフォーマンスとEXPLAINの読み方',
    description: 'EXPLAINの出力からボトルネックを特定し、N+1などの典型的な落とし穴を避ける',
    icon: 'Gauge',
    color: 'amber',
    badge: 'パフォーマンス',
    path: '/guides/query-performance-and-explain',
  },
  {
    slug: 'constraints-and-integrity',
    title: '制約と整合性(PK/FK/UNIQUE/CHECK)',
    description: '制約をアプリケーション側ではなくDB側で守らせる設計を学ぶ',
    icon: 'ShieldCheck',
    color: 'emerald',
    badge: '制約周り',
    path: '/guides/constraints-and-integrity',
  },
  {
    slug: 'subqueries-and-complex-queries',
    title: 'サブクエリ・CTE・ウィンドウ関数・集合演算',
    description: '複雑な集計や順位付けをサブクエリやウィンドウ関数で表現する',
    icon: 'GitMerge',
    color: 'purple',
    badge: 'サブクエリ',
    path: '/guides/subqueries-and-complex-queries',
  },
];

export async function loadGuideConfig(slug: string): Promise<GuideConfig> {
  const loader = guideLoaders[slug];
  if (!loader) throw new Error(`Unknown guide: ${slug}`);
  const module = await loader();
  return module.default;
}
