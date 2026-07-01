import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'cte-and-set-operations-report',
  title: 'CTEと集合演算で複合レポートを作る',
  description: '複数の集計をCTEで整理し、UNIONで1つのレポートにまとめる',
  headerLabel: 'サブクエリ',
  badge: 'サブクエリ',
  icon: 'GitMerge',
  color: 'purple',
  topic: 'subqueries',
  difficulty: 'advanced',
  dialects: ['postgres', 'mysql'],
  scenario:
    'マーケティングチームから「優良顧客レポート」の作成を依頼されました。要件は次の2種類の顧客を1つのレポートにまとめることです: (1) 累計購入金額が10,000円を超える「big_spender」、(2) 注文回数が3回以上の「frequent」。両方に該当する顧客は両方の理由でそれぞれ1行ずつ出力してください。CTEで集計を整理し、UNIONで結合してください。',
  requirements: [
    { id: 'req-cte', title: 'CTEで集計を整理する', description: 'WITH句を使って顧客ごとの合計金額・注文回数の集計を1箇所にまとめる' },
    { id: 'req-union', title: 'UNIONで結合する', description: '2つの条件に該当する顧客リストをUNIONで1つの結果にまとめる' },
    {
      id: 'req-columns',
      title: '出力列',
      description: 'id, name, reason(\'big_spender\' または \'frequent\')の順。id昇順、同じidの中ではreason昇順で並べる',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-uses-cte',
      type: 'query-uses-construct',
      construct: 'cte',
      label: 'CTE(WITH句)を使っているか',
      failureMessage: 'WITH句(CTE)が使われていません。',
    },
    {
      id: 'chk-uses-union',
      type: 'query-uses-construct',
      construct: 'union',
      label: 'UNIONを使っているか',
      failureMessage: 'UNIONが使われていません。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'name', 'reason'],
        rows: [
          [1, '佐藤 翼', 'big_spender'],
          [1, '佐藤 翼', 'frequent'],
          [3, '高橋 陽菜', 'frequent'],
          [4, '田中 大輝', 'big_spender'],
        ],
      },
      label: 'レポート内容が期待値と一致するか',
      failureMessage: '結果が期待値と一致しません。両方の条件に該当する顧客は2行出力される点に注意してください。',
    },
  ],
  actions: [
    {
      id: 'act-report',
      title: '優良顧客レポートを作成する',
      description: 'CTE・UNIONの利用と、結果の正しさを確認します。',
      checkIds: ['chk-uses-cte', 'chk-uses-union', 'chk-result'],
      successMessage: 'レポートが正しく作成されました。',
      failureMessage: 'まだ要件を満たせていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '集計をCTEにまとめる',
      blocks: [
        {
          type: 'paragraph',
          html: 'まず顧客ごとの合計金額(total_amount)と注文回数(order_count)を1つのCTE(order_stats)で計算しておくと、後続の条件分岐で同じ集計を2回書かずに済みます。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '条件ごとにCTEを分ける',
      blocks: [
        {
          type: 'paragraph',
          html: 'big_spenders・frequent_customersという2つのCTEでそれぞれの条件を満たす顧客IDを絞り込みます。',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'UNIONで結合する',
      blocks: [
        {
          type: 'paragraph',
          html: '両方のCTEをcustomersとJOINし、reason列を付けてUNIONで結合します。UNION ALLではなくUNIONにする必要はありません(reason列が異なるため元々重複しませんが、習慣としてUNIONで統一しています)。',
        },
        { type: 'code', language: 'sql', code: solutionQueries.shared },
      ],
    },
  ],
};

export default config;
