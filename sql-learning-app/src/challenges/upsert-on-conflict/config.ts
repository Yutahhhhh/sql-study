import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'upsert-on-conflict',
  title: '設定保存APIをUPSERTで実装する',
  description: '「あればUPDATE、なければINSERT」をON CONFLICTで1文にまとめ、レースコンディションを排除する',
  headerLabel: 'Web開発',
  badge: 'Web開発',
  icon: 'Save',
  color: 'emerald',
  topic: 'web-dev',
  difficulty: 'intermediate',
  dialects: ['postgres'],
  scenario:
    'ユーザー設定の保存APIがあります。現在のアプリコードは「SELECTで存在確認→あればUPDATE、なければINSERT」という2段階の実装で、同じユーザーが2つのタブから同時保存すると片方が主キー重複エラーになる不具合が出ています。DBのUPSERT(INSERT ... ON CONFLICT)を使って1文で書き換えてください。今回の保存内容は「user_id=1のthemeをdarkに更新」と「user_id=3のthemeをdarkとして新規保存」です。最後に user_id, key, value を user_id, key の昇順で返すSELECTを実行して確認します。',
  requirements: [
    {
      id: 'req-upsert',
      title: '1文のUPSERTで書く',
      description: 'INSERT ... ON CONFLICT (user_id, key) DO UPDATE を使い、既存行(1, theme)の更新と新規行(3, theme)の挿入を1つのINSERT文で行う',
    },
    {
      id: 'req-excluded',
      title: '挿入しようとした値で更新する',
      description: '衝突時はEXCLUDED経由で新しいvalueに更新し、updated_atも更新する',
    },
    {
      id: 'req-verify',
      title: '結果確認',
      description: '最後に SELECT user_id, key, value FROM user_settings ORDER BY user_id, key を実行する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['user_id', 'key', 'value'],
        rows: [
          [1, 'locale', 'ja'],
          [1, 'theme', 'dark'],
          [2, 'theme', 'light'],
          [3, 'theme', 'dark'],
        ],
      },
      label: '保存後の状態が正しいか',
      failureMessage:
        '保存後の状態が期待値と一致しません。(1, theme)がdarkに更新され、(3, theme)がdarkで新規追加され、他の行は変わっていない状態にしてください。',
    },
    {
      id: 'chk-row-count',
      type: 'row-count-equals',
      expectedCount: 4,
      label: '行数が4件のままか',
      failureMessage: '行数が期待と異なります。既存行を消して入れ直すのではなく、UPSERTで上書き・追加してください。',
    },
  ],
  actions: [
    {
      id: 'act-upsert',
      title: 'UPSERTで保存して確認する',
      description: 'ON CONFLICTを使った保存と、確認のSELECTを実行します。',
      checkIds: ['chk-result', 'chk-row-count'],
      successMessage: '存在確認とINSERT/UPDATEの分岐がDB内の1文に集約され、レースコンディションが構造的に消えました。',
      failureMessage: 'まだ要件を満たせていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'なぜ「SELECTしてから分岐」は壊れるのか',
      blocks: [
        {
          type: 'paragraph',
          html: '2つのリクエストが同時に「存在しない」と判定すると、両方がINSERTに進み、後の方が主キー重複エラーになります。アプリ側でロックやリトライを書くこともできますが、DBのUPSERTなら衝突判定と更新が原子的に行われるため、そもそも競合が発生しません。',
        },
      ],
    },
    {
      id: 'step-2',
      title: 'ON CONFLICTとEXCLUDED',
      blocks: [
        {
          type: 'paragraph',
          html: 'ON CONFLICT (user_id, key) は「この一意制約に衝突したら」という意味で、対象の列にPRIMARY KEYまたはUNIQUE制約が必要です。DO UPDATE内のEXCLUDEDは「挿入しようとしていた行」を指す特別なテーブル名で、EXCLUDED.value と書くことで新しい値で上書きできます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `INSERT INTO user_settings (user_id, key, value)
VALUES (1, 'theme', 'dark'), (3, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value, updated_at = now();`,
        },
      ],
    },
    {
      id: 'step-3',
      title: 'MySQLでの同等構文',
      blocks: [
        {
          type: 'paragraph',
          html: 'MySQLでは INSERT ... ON DUPLICATE KEY UPDATE value = VALUES(value) (8.0.19以降は VALUES() の代わりに行エイリアス) が同等です。どのRDBでも「一意制約+UPSERT構文」の組み合わせで実現する、という構造は同じです。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.postgres }] },
  ],
};

export default config;
