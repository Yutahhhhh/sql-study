import type { GuideConfig, GuideManifest } from '../types/guide';

const guideLoaders: Record<string, () => Promise<{ default: GuideConfig }>> = {
  'db-design-and-normalization': () => import('./db-design-and-normalization/config'),
  'indexing-fundamentals': () => import('./indexing-fundamentals/config'),
  'composite-indexes': () => import('./composite-indexes/config'),
  'query-performance-and-explain': () => import('./query-performance-and-explain/config'),
  'constraints-and-integrity': () => import('./constraints-and-integrity/config'),
  'subqueries-and-complex-queries': () => import('./subqueries-and-complex-queries/config'),
  'web-app-sql-patterns': () => import('./web-app-sql-patterns/config'),
  'release-day-pitfalls': () => import('./release-day-pitfalls/config'),
  'production-db-operations': () => import('./production-db-operations/config'),
  'incident-investigation-playbook': () => import('./incident-investigation-playbook/config'),
  'roles-and-permissions': () => import('./roles-and-permissions/config'),
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
  {
    slug: 'web-app-sql-patterns',
    title: 'Web開発で毎日使うSQLパターン',
    description: 'ページネーション・検索・UPSERT・論理削除・トランザクション境界など実装の定番パターンを整理する',
    icon: 'AppWindow',
    color: 'sky',
    badge: 'Web開発',
    path: '/guides/web-app-sql-patterns',
  },
  {
    slug: 'release-day-pitfalls',
    title: '本番リリース直後にぶち当たるDB問題',
    description: 'データ量で露見する遅いクエリ、コネクション枯渇、マイグレーションのロック、重複データなどの典型トラブルと対策',
    icon: 'Siren',
    color: 'blue',
    badge: 'リリース直後',
    path: '/guides/release-day-pitfalls',
  },
  {
    slug: 'production-db-operations',
    title: '本番DBの運用実務',
    description: 'スロークエリ監視、VACUUM/ANALYZE、バックアップとリストア、安全なデータパッチ、大量データの扱いを整理する',
    icon: 'Settings2',
    color: 'orange',
    badge: '運用',
    path: '/guides/production-db-operations',
  },
  {
    slug: 'incident-investigation-playbook',
    title: 'DB障害の調査と解消プレイブック',
    description: 'pg_stat_activityでの現状把握、ロック・長時間トランザクションの特定と解消、デッドロック、ディスクフルまでの手順書',
    icon: 'Stethoscope',
    color: 'emerald',
    badge: '障害対応',
    path: '/guides/incident-investigation-playbook',
  },
  {
    slug: 'roles-and-permissions',
    title: 'ユーザー権限とロール設計',
    description: 'ロール・GRANT/REVOKE・アプリ用最小権限・読み取り専用ユーザー・RLSまで、DB権限の設計を学ぶ',
    icon: 'KeyRound',
    color: 'purple',
    badge: '権限',
    path: '/guides/roles-and-permissions',
  },
];

export async function loadGuideConfig(slug: string): Promise<GuideConfig> {
  const loader = guideLoaders[slug];
  if (!loader) throw new Error(`Unknown guide: ${slug}`);
  const module = await loader();
  return module.default;
}
