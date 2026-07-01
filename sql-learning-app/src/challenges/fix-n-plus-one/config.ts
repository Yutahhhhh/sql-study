import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'fix-n-plus-one',
  title: 'N+1クエリをJOINで解消する',
  description: '顧客ごとにループして注文件数を取得していたN+1パターンを1本のクエリに書き換える',
  headerLabel: 'パフォーマンス',
  badge: 'パフォーマンス',
  icon: 'Gauge',
  color: 'amber',
  topic: 'performance',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    '既存のアプリケーションコードは、まず `SELECT * FROM customers` で全顧客を取得し、その後1顧客ごとに `SELECT COUNT(*) FROM orders WHERE customer_id = ?` を発行して注文件数を数えています。顧客が5人なら6回、5,000人なら5,001回のクエリが発行されます。これを1本のクエリで置き換えてください。',
  requirements: [
    {
      id: 'req-single-query',
      title: '1本のクエリで完結させる',
      description: 'customersとordersをJOINし、GROUP BYで顧客ごとの注文件数を集計する',
    },
    {
      id: 'req-shape',
      title: '注文が0件の顧客も含める',
      description: 'LEFT JOINを使い、注文が1件もない顧客もorder_count=0として含める',
    },
    {
      id: 'req-output',
      title: '出力形式',
      description: 'id, name, order_count(SELECT列挙順)を、id昇順で返す',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-uses-join',
      type: 'query-uses-construct',
      construct: 'join',
      label: 'JOINを使っているか',
      failureMessage: 'クエリでJOINが使われていません。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'name', 'order_count'],
        rows: [
          [1, '佐藤 翼', 3],
          [2, '鈴木 蓮', 1],
          [3, '高橋 陽菜', 0],
          [4, '田中 大輝', 2],
          [5, '伊藤 咲', 0],
        ],
      },
      label: '結果が期待値と一致するか',
      failureMessage: '結果が期待される出力と一致しません(id昇順で、注文0件の顧客も含めてください)。',
    },
  ],
  actions: [
    {
      id: 'act-single-query',
      title: '1本のクエリでJOIN集計する',
      description: 'JOINを使い、期待される結果を返すクエリか確認します。',
      checkIds: ['chk-uses-join', 'chk-result'],
      successMessage: 'N+1だったクエリを1本のJOINクエリに書き換えられました。',
      failureMessage: 'まだ要件を満たせていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'LEFT JOINで0件の顧客も残す',
      blocks: [
        {
          type: 'paragraph',
          html: '通常のJOIN(INNER JOIN)だと、注文が1件もない顧客(高橋さん・伊藤さん)が結果から消えてしまいます。LEFT JOINならordersに一致行がなくても顧客側は残ります。',
        },
      ],
    },
    {
      id: 'step-2',
      title: 'COUNT(o.id)で数える',
      blocks: [
        {
          type: 'paragraph',
          html: 'COUNT(*)ではなくCOUNT(o.id)を使うのがポイントです。LEFT JOINでマッチしなかった行はo.idがNULLになり、COUNTはNULLを数えないため正しく0件と集計されます。COUNT(*)だと1件とカウントされてしまいます。',
        },
      ],
    },
    { id: 'step-3', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.shared }] },
  ],
};

export default config;
