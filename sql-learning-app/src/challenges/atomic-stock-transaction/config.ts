import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'atomic-stock-transaction',
  title: '在庫の売り越しを防ぐ',
  description: 'CHECK制約と条件付きUPDATEで、同時購入でも在庫がマイナスにならない引き当て処理を作る',
  headerLabel: 'Web開発',
  badge: 'Web開発',
  icon: 'PackageCheck',
  color: 'amber',
  topic: 'web-dev',
  difficulty: 'intermediate',
  dialects: ['postgres'],
  scenario:
    'ECサイトでセール中に「在庫1点の限定スニーカー」が2人に売れてしまい、stockが-1になる障害が起きました。原因はアプリの実装が「SELECTで在庫確認→OKならUPDATEで減算」という2段階になっており、同時リクエストで両方が在庫ありと判定したことです。(1)DBレベルで在庫がマイナスになれないCHECK制約を追加し、(2)在庫が足りる場合にだけ引き当てる条件付きUPDATEに書き換えてください。動作確認として「Tシャツ(id=2)を3枚購入」(成功するはず)と「スニーカー(id=1)を2足購入」(在庫1なので引き当てられないはず)を実行し、最後に SELECT id, name, stock FROM products ORDER BY id で状態を確認します。',
  requirements: [
    {
      id: 'req-check',
      title: 'CHECK制約で最終防衛線を張る',
      description: 'products.stock が0以上であることをCHECK制約で保証する(ALTER TABLE ... ADD CONSTRAINT)',
    },
    {
      id: 'req-conditional-update',
      title: '条件付きUPDATEで引き当てる',
      description: 'WHERE句に「在庫が購入数以上ある」条件を含めたUPDATEで減算する。在庫不足なら0行更新になる(エラーではなく引き当て失敗として扱える)',
    },
    {
      id: 'req-verify',
      title: '結果確認',
      description: 'Tシャツ3枚の購入は成功し(10→7)、スニーカー2足の購入は引き当てられず(1のまま)、という状態をSELECTで確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-check-constraint',
      type: 'constraint-exists',
      tableName: 'products',
      constraintType: 'check',
      columns: ['stock'],
      label: 'stock >= 0 のCHECK制約',
      failureMessage: 'products.stock に対するCHECK制約が見つかりません。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'name', 'stock'],
        rows: [
          [1, '限定スニーカー', 1],
          [2, 'ベーシックTシャツ', 7],
          [3, 'ロゴキャップ', 0],
        ],
      },
      label: '引き当て後の在庫が正しいか',
      failureMessage:
        '在庫の状態が期待値と一致しません。Tシャツは10→7に減り、スニーカーは在庫不足のため1のまま、キャップは0のままであるべきです。無条件に減算すると在庫不足でもマイナスになってしまいます。',
    },
  ],
  actions: [
    {
      id: 'act-constraint',
      title: 'CHECK制約を追加する',
      description: '在庫がマイナスになれないことをDBレベルで保証します。',
      checkIds: ['chk-check-constraint'],
      successMessage: 'CHECK制約が追加されました。どんな実装バグでもマイナス在庫はDBが拒否します。',
      failureMessage: 'products.stock のCHECK制約がまだありません。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-purchase',
      title: '条件付きUPDATEで購入を処理する',
      description: '2件の購入を処理し、最終状態をSELECTで確認します。',
      checkIds: ['chk-result'],
      successMessage: '在庫が足りる時だけ引き当てる、売り越しのない購入処理になりました。',
      failureMessage: 'まだ要件を満たせていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '「確認してから更新」はなぜ壊れるのか',
      blocks: [
        {
          type: 'paragraph',
          html: 'SELECTでstock=1を見た2つのリクエストが、両方ともUPDATE stock = stock - 1 を実行すると-1になります。SELECTとUPDATEの間に他のトランザクションが割り込めることが根本原因です。対策は「判定と更新を1つの原子的な操作にする」ことです。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '条件付きUPDATE: 判定と更新を1文にする',
      blocks: [
        {
          type: 'code',
          language: 'sql',
          code: `UPDATE products
SET stock = stock - 3
WHERE id = 2 AND stock >= 3;`,
        },
        {
          type: 'paragraph',
          html: 'WHERE句の stock >= 3 が「在庫確認」です。UPDATEは対象行をロックしてから条件を評価するため、同時実行されても順番に処理され、条件を満たさなくなった方は0行更新になります。アプリは更新行数(affected rows)を見て「在庫切れです」と返せます。',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'CHECK制約は最終防衛線',
      blocks: [
        {
          type: 'paragraph',
          html: '条件付きUPDATEを徹底しても、将来誰かが素朴な減算コードを書くかもしれません。CHECK (stock >= 0) があれば、そのようなバグはUPDATE時にエラーになり、不正なデータがコミットされることは決してありません。「アプリで守り、DBでも守る」の二段構えが実務の型です。SELECT ... FOR UPDATEで行ロックを先に取る方式もありますが、1行の減算ならこの形が最も簡潔です。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.postgres }] },
  ],
};

export default config;
