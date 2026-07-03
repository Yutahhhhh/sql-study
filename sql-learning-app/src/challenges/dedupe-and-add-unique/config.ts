import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'dedupe-and-add-unique',
  title: '二重登録データを掃除してUNIQUEで再発防止する',
  description: '購読ボタン連打で生まれた重複行を、最初の1件だけ残して削除し、一意制約で塞ぐ',
  headerLabel: 'リリース直後',
  badge: 'リリース直後',
  icon: 'CopyX',
  color: 'indigo',
  topic: 'release',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    'リリースした購読機能で「登録ボタンの連打」や「リクエストの二重送信」により、同じユーザーのsubscriptions行が複数できてしまいました。仕様は「1ユーザーにつき契約は1件」です。テーブルにUNIQUE制約を付けていなかったことが根本原因でした。(1)各ユーザーについて最初に作られた行(idが最小の行)だけを残して重複を削除し、(2)user_idにUNIQUEインデックスを追加して再発を防いでください。最後に SELECT id, user_id, plan FROM subscriptions ORDER BY id で確認します。削除とインデックス作成、確認SELECTは1回の実行にまとめて提出してください。',
  requirements: [
    {
      id: 'req-dedupe',
      title: '重複を「繰り返し使える」クエリで削除する',
      description: 'idを手で列挙するのではなく、サブクエリ(GROUP BYでuser_idごとのMIN(id)を求める等)を使って、何度でも・何件あっても効く形で削除する',
    },
    {
      id: 'req-unique',
      title: 'UNIQUEで再発防止する',
      description: 'subscriptions.user_id にユニークインデックス(またはUNIQUE制約)を追加する',
    },
    {
      id: 'req-verify',
      title: '結果確認',
      description: '残るのは各ユーザー最初の1件ずつ(id: 1, 3, 4, 7, 8)であることをSELECTで確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-subquery',
      type: 'query-uses-construct',
      construct: 'subquery',
      label: 'サブクエリで削除対象を求めているか',
      failureMessage: 'サブクエリが使われていません。idの手動列挙ではなく、GROUP BY + MIN(id)などで削除対象を機械的に求めてください。',
    },
    {
      id: 'chk-unique',
      type: 'index-exists',
      tableName: 'subscriptions',
      columns: ['user_id'],
      unique: true,
      label: 'user_idのユニークインデックス',
      failureMessage: 'subscriptions.user_id に一意性を保証するインデックス/制約が見つかりません。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'user_id', 'plan'],
        rows: [
          [1, 1, 'pro'],
          [3, 2, 'free'],
          [4, 3, 'pro'],
          [7, 4, 'free'],
          [8, 5, 'pro'],
        ],
      },
      label: '重複が正しく削除されたか',
      failureMessage: '削除後の状態が期待値と一致しません。各ユーザーで最小のidの行(1, 3, 4, 7, 8)だけが残るべきです。',
    },
  ],
  actions: [
    {
      id: 'act-cleanup',
      title: '重複を削除する',
      description: 'サブクエリで削除対象を求め、各ユーザー最初の1件だけを残します。',
      checkIds: ['chk-subquery', 'chk-result'],
      successMessage: '重複が解消されました。',
      failureMessage: '重複削除がまだ完了していません。',
      evaluatesAgainst: 'submitted-query',
    },
    {
      id: 'act-prevent',
      title: 'UNIQUEで再発を防ぐ',
      description: '一意制約があれば、二重送信されてもDBが2件目を拒否します。',
      checkIds: ['chk-unique'],
      successMessage: '一意制約が入りました。今後はアプリのバグでも重複は発生しません。',
      failureMessage: 'user_idのユニークインデックスがまだありません。',
      evaluatesAgainst: 'schema-state',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '「残す行」を決めてから消す',
      blocks: [
        {
          type: 'paragraph',
          html: '重複削除の定石は「残す行の集合」をまず定義することです。今回は各ユーザーの最小id、つまり GROUP BY user_id して MIN(id) を取った集合が「残す行」です。それ以外を消せば、重複が2件でも100件でも同じクエリで対応できます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `DELETE FROM subscriptions
WHERE id NOT IN (
  SELECT MIN(id) FROM subscriptions GROUP BY user_id
);`,
        },
      ],
    },
    {
      id: 'step-2',
      title: '順序が重要: 掃除→制約',
      blocks: [
        {
          type: 'paragraph',
          html: 'UNIQUEインデックスは既存データに重複があると作成に失敗します。必ず「重複の削除」→「制約の追加」の順で行います。逆に言えば、制約追加が成功した時点で掃除の完了が証明されます。本番では削除前に対象行をSELECTで確認し、件数の見当を付けてから実行します。',
        },
      ],
    },
    {
      id: 'step-3',
      title: '根本原因はアプリではなくスキーマ',
      blocks: [
        {
          type: 'paragraph',
          html: 'ボタン連打対策(二重送信防止)をフロントに入れても、リトライやAPI直叩きで重複は再発します。「1ユーザー1契約」というビジネスルールは、UNIQUE制約としてDBに置くのが唯一確実な方法です。アプリ側はUNIQUE違反エラーを受けたら「既に登録済み」として扱えば、正しい動作になります。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.shared }] },
  ],
};

export default config;
