import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'composite-index-column-order',
  title: '複合インデックスの列順序を最適化する',
  description: 'WHERE句の複数条件を活かせる列順序の複合インデックスを設計する',
  headerLabel: '複合インデックス',
  badge: '複合インデックス',
  icon: 'Rows3',
  color: 'indigo',
  topic: 'indexing',
  difficulty: 'advanced',
  dialects: ['postgres', 'mysql'],
  scenario:
    'orders テーブルには3,000件の注文があります。「特定の顧客の、特定ステータスの注文」を取得するクエリ `SELECT * FROM orders WHERE customer_id = 7 AND status = \'completed\';` が遅いという報告がありました。customer_idとstatusの両方を活かせる複合インデックスを、正しい列順序で作成してください。',
  requirements: [
    {
      id: 'req-composite-index',
      title: '複合インデックスを作成する',
      description: '(customer_id, status) の順序で複合インデックスを作成する。逆順(status, customer_id)では要件を満たさない。',
    },
    {
      id: 'req-query',
      title: '両条件で検索する',
      description: '`SELECT * FROM orders WHERE customer_id = 7 AND status = \'completed\';` を実行し、インデックスが使われることを確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-composite-index',
      type: 'index-exists',
      tableName: 'orders',
      columns: ['customer_id', 'status'],
      label: '(customer_id, status)の順の複合インデックス',
      failureMessage: '(customer_id, status)の順序の複合インデックスが見つかりません。列の順序も確認してください。',
    },
    {
      id: 'chk-avoids-seqscan',
      type: 'query-avoids-seq-scan',
      tableName: 'orders',
      label: 'Seq Scanを回避できているか',
      failureMessage: 'まだSeq Scan(全表走査)になっています。',
    },
    {
      id: 'chk-uses-index',
      type: 'query-uses-index',
      expectIndexName: 'idx_orders_customer_status',
      label: '想定のインデックスが使われているか',
      failureMessage: 'idx_orders_customer_statusという名前のインデックスが使われていません。',
    },
  ],
  actions: [
    {
      id: 'act-create-index',
      title: '複合インデックスを作成する',
      description: '(customer_id, status)の順序で作成します。',
      checkIds: ['chk-composite-index'],
      successMessage: '正しい順序の複合インデックスが作成されました。',
      failureMessage: '複合インデックスがまだ正しく作成されていません。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-query-uses-index',
      title: 'クエリがインデックスを使う',
      description: '両条件を含むクエリを実行し、EXPLAINで確認します。',
      checkIds: ['chk-avoids-seqscan', 'chk-uses-index'],
      successMessage: 'クエリが複合インデックスを使って実行されました。',
      failureMessage: 'このクエリはまだインデックスを使えていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'なぜインデックス名を idx_orders_customer_status にするか',
      blocks: [
        {
          type: 'paragraph',
          html: 'この課題は採点の都合上、インデックス名を <code>idx_orders_customer_status</code> に固定しています(実務では名前は自由です)。重要なのは列の順序です。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '複合インデックスを作成する',
      blocks: [{ type: 'code', language: 'sql', code: 'CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);' }],
    },
    {
      id: 'step-3',
      title: '列順序を逆にすると何が起きるか',
      blocks: [
        {
          type: 'paragraph',
          html: '(status, customer_id)の順で作ると、statusの選択性が低い(3種類しかない)ため、絞り込み効果が薄く、customer_idでの絞り込みを活かせません。等価条件で強く絞り込める列を先に置くのが基本です。',
        },
      ],
    },
  ],
};

export default config;
