import type { ChallengeConfig, ChallengeManifest } from '../types/challenge';

const challengeLoaders: Record<string, () => Promise<{ default: ChallengeConfig }>> = {
  'normalize-customer-orders': () => import('./normalize-customer-orders/config'),
  'single-index-for-lookup': () => import('./single-index-for-lookup/config'),
  'composite-index-column-order': () => import('./composite-index-column-order/config'),
  'fix-n-plus-one': () => import('./fix-n-plus-one/config'),
  'enforce-referential-integrity': () => import('./enforce-referential-integrity/config'),
  'latest-per-group-subquery': () => import('./latest-per-group-subquery/config'),
  'cte-and-set-operations-report': () => import('./cte-and-set-operations-report/config'),
};

export const challengeManifest: ChallengeManifest[] = [
  {
    slug: 'normalize-customer-orders',
    title: '顧客・注文テーブルの正規化',
    description: '1枚の非正規化テーブルを3NFまで分解し、外部キーで関連付ける',
    icon: 'Database',
    color: 'sky',
    badge: 'DB設計',
    path: '/challenges/normalize-customer-orders',
    dialects: ['postgres', 'mysql'],
  },
  {
    slug: 'single-index-for-lookup',
    title: '遅い検索クエリに単一インデックスを追加する',
    description: 'EXPLAINでSeq Scanを確認し、適切な単一インデックスで解消する',
    icon: 'ListTree',
    color: 'blue',
    badge: '単一インデックス',
    path: '/challenges/single-index-for-lookup',
    dialects: ['postgres', 'mysql'],
  },
  {
    slug: 'composite-index-column-order',
    title: '複合インデックスの列順序を最適化する',
    description: 'WHERE句とORDER BYの両方を活かせる列順序を見極める',
    icon: 'Rows3',
    color: 'indigo',
    badge: '複合インデックス',
    path: '/challenges/composite-index-column-order',
    dialects: ['postgres', 'mysql'],
  },
  {
    slug: 'fix-n-plus-one',
    title: 'N+1クエリをJOINで解消する',
    description: '繰り返し発行されていた問い合わせを1本のJOINクエリに書き換える',
    icon: 'Gauge',
    color: 'amber',
    badge: 'パフォーマンス',
    path: '/challenges/fix-n-plus-one',
    dialects: ['postgres', 'mysql'],
  },
  {
    slug: 'enforce-referential-integrity',
    title: '壊れたスキーマに制約を追加する',
    description: 'NOT NULL・外部キー・CHECK制約でデータ不整合を防ぐ',
    icon: 'ShieldCheck',
    color: 'emerald',
    badge: '制約周り',
    path: '/challenges/enforce-referential-integrity',
    dialects: ['postgres', 'mysql'],
  },
  {
    slug: 'latest-per-group-subquery',
    title: 'グループごとの最新レコードを取得する',
    description: '相関サブクエリまたはウィンドウ関数でグループ最新行を1件ずつ抽出する',
    icon: 'GitMerge',
    color: 'purple',
    badge: 'サブクエリ',
    path: '/challenges/latest-per-group-subquery',
    dialects: ['postgres', 'mysql'],
  },
  {
    slug: 'cte-and-set-operations-report',
    title: 'CTEと集合演算で複合レポートを作る',
    description: '複数の集計をCTEで整理し、UNIONで1つのレポートにまとめる',
    icon: 'GitMerge',
    color: 'purple',
    badge: 'サブクエリ',
    path: '/challenges/cte-and-set-operations-report',
    dialects: ['postgres', 'mysql'],
  },
];

export async function loadChallengeConfig(slug: string): Promise<ChallengeConfig> {
  const loader = challengeLoaders[slug];
  if (!loader) throw new Error(`Unknown challenge: ${slug}`);
  const module = await loader();
  return module.default;
}
