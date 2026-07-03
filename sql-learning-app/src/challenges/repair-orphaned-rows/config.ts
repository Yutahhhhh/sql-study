import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'repair-orphaned-rows',
  title: '孤児行を調査・修復して外部キーで塞ぐ',
  description: '退会処理のバグで生まれた「親のいない注文」を特定して掃除し、FKで再発を防止する',
  headerLabel: '障害対応',
  badge: '障害対応',
  icon: 'Wrench',
  color: 'emerald',
  topic: 'incident',
  difficulty: 'advanced',
  dialects: ['postgres'],
  scenario:
    '「注文一覧画面が500エラーになる」という障害報告が来ました。調査すると、退会処理のバグでusersの行だけが物理削除され、ordersに親のいない行(孤児行)が残っていました。画面はユーザー名の表示で落ちていたのです。ordersとusersの間に外部キーが張られていなかったことが根本原因でした。(1)まずNOT EXISTS(またはNOT IN)を使って孤児行を特定するSELECTで被害範囲を確認し、(2)孤児行を削除、(3)再発防止として orders.user_id に外部キー(ON DELETE RESTRICT)を追加してください。最後に SELECT id, user_id, total FROM orders ORDER BY id で確認します。削除・制約追加・確認は1回の実行にまとめて提出してください。',
  requirements: [
    {
      id: 'req-investigate',
      title: '孤児行をクエリで特定する',
      description: 'NOT EXISTSやNOT INのサブクエリで「usersに対応するidが無いorders行」(id=2, 4, 6)を機械的に特定する',
    },
    {
      id: 'req-cleanup',
      title: '孤児行を削除する',
      description: '特定した3件を削除する。手作業のid列挙ではなく、調査と同じ条件式で削除すること',
    },
    {
      id: 'req-fk',
      title: '外部キーで再発防止する',
      description: 'orders.user_id → users.id の外部キーをON DELETE RESTRICTで追加し、注文が残るユーザーの削除をDBが拒否するようにする',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-subquery',
      type: 'query-uses-construct',
      construct: 'subquery',
      label: 'サブクエリで孤児行を特定しているか',
      failureMessage: 'NOT EXISTS / NOT IN などのサブクエリが使われていません。idの手動列挙では、見えていない孤児行を取りこぼします。',
    },
    {
      id: 'chk-fk',
      type: 'constraint-exists',
      tableName: 'orders',
      constraintType: 'foreign-key',
      columns: ['user_id'],
      referencedTable: 'users',
      label: 'orders.user_id → users.id の外部キー',
      failureMessage: 'orders.user_id から users.id への外部キー制約が見つかりません。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'user_id', 'total'],
        rows: [
          [1, 1, 3000],
          [3, 3, 5200],
          [5, 5, 2100],
          [7, 1, 900],
        ],
      },
      label: '孤児行だけが削除されたか',
      failureMessage:
        '削除後の状態が期待値と一致しません。親が存在する注文(id=1, 3, 5, 7)は残し、孤児行(id=2, 4, 6)だけを削除してください。',
    },
  ],
  actions: [
    {
      id: 'act-cleanup',
      title: '孤児行を特定して削除する',
      description: 'サブクエリによる調査と同じ条件で削除します。',
      checkIds: ['chk-subquery', 'chk-result'],
      successMessage: '孤児行が解消されました。画面の500エラーも収まります。',
      failureMessage: '孤児行の掃除がまだ完了していません。',
      evaluatesAgainst: 'submitted-query',
    },
    {
      id: 'act-fk',
      title: '外部キーで再発を防ぐ',
      description: '参照整合性をDBに守らせます。',
      checkIds: ['chk-fk'],
      successMessage: '外部キーが追加されました。注文が残るユーザーの削除は今後DBが拒否します。',
      failureMessage: '外部キー制約がまだありません。',
      evaluatesAgainst: 'schema-state',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '調査クエリ: 被害範囲を先に確定する',
      blocks: [
        {
          type: 'code',
          language: 'sql',
          code: `SELECT o.*
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = o.user_id
);`,
        },
        {
          type: 'paragraph',
          html: '障害対応の第一歩は削除ではなく調査です。件数と内容を確認して被害範囲を確定し、必要ならこの結果を退避(別テーブルやCSV)してから消します。NOT INを使う場合はサブクエリ側にNULLが混ざると全行が除外される罠があるため、NOT EXISTSの方が安全な習慣です。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '調査と同じ条件で削除する',
      blocks: [
        {
          type: 'paragraph',
          html: 'DELETEのWHERE句は調査SELECTと完全に同じ条件式を使います。「調査した集合」と「削除する集合」が一致していることが、目視確認の意味を保証します。実務では、孤児行を消すのではなく親側に「削除済みユーザー」のプレースホルダ行を復元して紐づけ直す判断もあります(注文履歴を会計上残す必要がある場合など)。どちらにするかは業務要件で決めます。',
        },
      ],
    },
    {
      id: 'step-3',
      title: 'ON DELETE の選択肢',
      blocks: [
        {
          type: 'paragraph',
          html: 'RESTRICT(既定に近い動き)は「子が残っていたら親を消せない」で、今回のように履歴を守りたいテーブルに向きます。CASCADEは「親と一緒に子も消す」で、セッションやカートのような従属データに向きます。SET NULLは「親が消えたら参照をNULLにする」です。注文データにCASCADEを付けると、退会処理が注文履歴を静かに削除する別の障害を生むところでした。制約の種類まで含めて設計判断です。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.postgres }] },
  ],
};

export default config;
