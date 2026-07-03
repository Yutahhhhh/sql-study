import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'backfill-derived-column',
  title: '稼働中テーブルに列を追加してバックフィルする',
  description: 'NULL許容で追加→既存データから埋める→NOT NULL化、という安全な3段階マイグレーションを実践する',
  headerLabel: '運用',
  badge: '運用',
  icon: 'Columns3',
  color: 'purple',
  topic: 'operations',
  difficulty: 'advanced',
  dialects: ['postgres'],
  scenario:
    '注文一覧画面の高速化のため、毎回order_itemsを集計する代わりに、ordersテーブルへ合計金額列 total_amount を持たせることになりました。ordersは本番で稼働中のテーブルです。安全な手順は (1)まずNULL許容のまま列を追加、(2)既存行をorder_itemsの集計値でバックフィル(明細のない注文は0)、(3)全行が埋まったことを確認してからNOT NULL化+DEFAULT 0を設定、の3段階です。この手順を実行し、最後に SELECT id, customer_name, total_amount FROM orders ORDER BY id で確認してください。',
  requirements: [
    {
      id: 'req-add-column',
      title: 'NULL許容で列を追加する',
      description: 'ALTER TABLE orders ADD COLUMN total_amount INTEGER (この時点ではNOT NULLを付けない)',
    },
    {
      id: 'req-backfill',
      title: '既存データからバックフィルする',
      description: 'order_itemsの quantity * unit_price の合計で各注文のtotal_amountを更新する。明細が1件もない注文(id=5)は0にする(COALESCEを使う)',
    },
    {
      id: 'req-not-null',
      title: 'NOT NULL化とDEFAULT設定',
      description: '全行が埋まってから ALTER TABLE ... SET NOT NULL と SET DEFAULT 0 を適用する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-column',
      type: 'column-exists',
      tableName: 'orders',
      columnName: 'total_amount',
      notNull: true,
      label: 'total_amount列(NOT NULL)',
      failureMessage: 'orders.total_amount がNOT NULL列として存在していません。列追加→バックフィル→SET NOT NULLの順に進めてください。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'customer_name', 'total_amount'],
        rows: [
          [1, '佐藤 翼', 3200],
          [2, '鈴木 蓮', 1500],
          [3, '高橋 陽菜', 9800],
          [4, '田中 大輝', 2400],
          [5, '伊藤 咲', 0],
        ],
      },
      label: 'バックフィル結果が正しいか',
      failureMessage:
        'total_amountの値が期待値と一致しません。quantity * unit_price をorder_idごとに合計し、明細のない注文(id=5)は0にしてください(COALESCEがないとNULLになります)。',
    },
  ],
  actions: [
    {
      id: 'act-schema',
      title: '列がNOT NULLで存在する',
      description: '3段階の手順を終えると、total_amountはNOT NULL + DEFAULT付きの列になります。',
      checkIds: ['chk-column'],
      successMessage: 'total_amountがNOT NULL列として定義されました。',
      failureMessage: 'total_amount列がまだNOT NULLになっていません。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-verify',
      title: 'バックフィル結果を確認する',
      description: '全注文の合計金額が正しく埋まっていることを確認します。',
      checkIds: ['chk-result'],
      successMessage: '安全な3段階マイグレーションが完了しました。',
      failureMessage: 'バックフィルの結果がまだ正しくありません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'なぜいきなりNOT NULLで追加しないのか',
      blocks: [
        {
          type: 'paragraph',
          html: '既存行があるテーブルに NOT NULL列をDEFAULTなしで追加するとエラーになります。ではDEFAULT付きなら良いかというと、古いPostgreSQL(11未満)や一部のDBでは全行の書き換えが走り、巨大テーブルでは長時間のロック=サービス停止につながっていました。「NULL許容で追加→バックフィル→NOT NULL化」の3段階は、どのDB・どのバージョンでも安全に通る運用の定石です。',
        },
      ],
    },
    {
      id: 'step-2',
      title: 'バックフィルは相関サブクエリ+COALESCE',
      blocks: [
        {
          type: 'code',
          language: 'sql',
          code: `UPDATE orders o
SET total_amount = COALESCE((
  SELECT SUM(oi.quantity * oi.unit_price)
  FROM order_items oi
  WHERE oi.order_id = o.id
), 0);`,
        },
        {
          type: 'paragraph',
          html: '明細が1件もない注文ではSUMがNULLを返すため、COALESCEで0に倒します。これを忘れるとid=5がNULLのまま残り、手順3のSET NOT NULLが失敗します。「NOT NULL化が失敗する=埋め漏れがある」という検出器として機能するのもこの手順の利点です。本番の巨大テーブルでは、このUPDATEをid範囲で分割して少しずつ流します。',
        },
      ],
    },
    {
      id: 'step-3',
      title: '導出列は「ズレ」との戦い',
      blocks: [
        {
          type: 'paragraph',
          html: 'total_amountのような導出列(他のデータから計算できる列)は、以後order_itemsが変わるたびにアプリ(またはトリガー)で更新し続ける必要があります。高速化の代償として整合性維持のコストを引き受ける判断だ、という点は設計レビューで明示しておくべきポイントです。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.postgres }] },
  ],
};

export default config;
