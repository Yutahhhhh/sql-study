import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'latest-per-group-subquery',
  title: 'グループごとの最新レコードを取得する',
  description: '相関サブクエリまたはウィンドウ関数でグループ最新行を1件ずつ抽出する',
  headerLabel: 'サブクエリ',
  badge: 'サブクエリ',
  icon: 'GitMerge',
  color: 'purple',
  topic: 'subqueries',
  difficulty: 'advanced',
  dialects: ['postgres', 'mysql'],
  scenario:
    'orders テーブルには顧客ごとに複数の注文が入っています。各顧客の「最新の注文」だけを1行ずつ取得するクエリを書いてください。実装方法は自由です(相関サブクエリでもウィンドウ関数でも構いません)。',
  requirements: [
    { id: 'req-one-per-group', title: '顧客ごとに1行', description: '各customer_idにつき、ordered_atが最も新しい行を1件だけ返す' },
    { id: 'req-columns', title: '出力列', description: 'id, customer_id, ordered_at, amount の順で返す' },
    { id: 'req-order', title: '並び順', description: 'customer_idの昇順で返す' },
  ],
  seed,
  checks: [
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'customer_id', 'ordered_at', 'amount'],
        rows: [
          [2, 1, '2026-01-05', 2000],
          [5, 2, '2026-02-10', 900],
          [6, 3, '2026-03-01', 700],
        ],
      },
      label: '各顧客の最新注文が正しく抽出されているか',
      failureMessage: '結果が期待値と一致しません。各顧客の最新(ordered_atが最大)の1件だけを返しているか確認してください。',
    },
  ],
  actions: [
    {
      id: 'act-latest-per-group',
      title: '顧客ごとの最新注文を抽出する',
      description: '結果が期待通りか確認します。',
      checkIds: ['chk-result'],
      successMessage: '各顧客の最新注文を正しく抽出できました。',
      failureMessage: 'まだ正しい結果が得られていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '相関サブクエリで解く',
      blocks: [
        {
          type: 'paragraph',
          html: '外側の行(o)と同じcustomer_idを持つ行の中から最大のordered_atを相関サブクエリで求め、それと一致する行だけを残します。',
        },
        { type: 'code', language: 'sql', code: solutionQueries.shared },
      ],
    },
    {
      id: 'step-2',
      title: 'ウィンドウ関数で解く(別解)',
      blocks: [
        {
          type: 'code',
          language: 'sql',
          code: `SELECT id, customer_id, ordered_at, amount FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC) AS rn
  FROM orders
) ranked
WHERE rn = 1
ORDER BY customer_id;`,
        },
        {
          type: 'callout',
          variant: 'info',
          title: '同着(同じordered_at)がある場合の挙動の違い',
          html: '相関サブクエリ版は同着の場合すべて残ります。ROW_NUMBER版は同着でも必ず1件だけに絞られます(どちらが選ばれるかはORDER BYのタイブレーク次第)。要件に応じて使い分けてください。',
        },
      ],
    },
  ],
};

export default config;
