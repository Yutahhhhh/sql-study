import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'archive-old-rows',
  title: '肥大化したテーブルをアーカイブする',
  description: '古い既読通知をアーカイブテーブルへ移動し、現役テーブルを軽く保つ運用作業を実践する',
  headerLabel: '運用',
  badge: '運用',
  icon: 'Archive',
  color: 'orange',
  topic: 'operations',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    'notificationsテーブルが肥大化し、一覧表示が遅くなってきました。調査の結果、アクセスされるのはほぼ直近の通知だけで、古い既読通知が大半を占めていることが分かりました。「2026-04-01より前に作成され、かつ既読(is_read = 1)」の通知をアーカイブテーブルへ移動してください。手順は (1)notificationsと同じ構造の notifications_archive を作成、(2)対象行をINSERT ... SELECTでコピー、(3)コピー完了後に元テーブルからDELETE、です。最後に現役テーブルとアーカイブテーブルの件数を1行(active_count, archived_count)で返すSELECTで確認します。',
  requirements: [
    {
      id: 'req-archive-table',
      title: 'アーカイブテーブルを作る',
      description: 'notificationsと同じ列構造の notifications_archive を作成する(CREATE TABLE ... AS SELECT で構造だけコピーすると簡単)',
    },
    {
      id: 'req-move',
      title: 'コピーしてから削除する',
      description: '「既読 かつ created_at < 2026-04-01」の5件をINSERT ... SELECTで退避し、その後DELETEする。未読の古い通知(id=6, 7)は移動しない',
    },
    {
      id: 'req-verify',
      title: '件数を確認する',
      description: 'スカラーサブクエリを使い、SELECT (SELECT COUNT(*) FROM notifications) AS active_count, (SELECT COUNT(*) FROM notifications_archive) AS archived_count で確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-archive-table',
      type: 'table-exists',
      tableName: 'notifications_archive',
      label: 'notifications_archiveテーブル',
      failureMessage: 'notifications_archive テーブルが作成されていません。',
    },
    {
      id: 'chk-subquery',
      type: 'query-uses-construct',
      construct: 'subquery',
      label: 'サブクエリで件数を確認しているか',
      failureMessage: '確認クエリでスカラーサブクエリが使われていません。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['active_count', 'archived_count'],
        rows: [[7, 5]],
      },
      label: '現役7件・アーカイブ5件になっているか',
      failureMessage:
        '件数が期待値(現役7件・アーカイブ5件)と一致しません。移動対象は「既読 かつ 2026-04-01より前」の5件です。未読の古い通知(id=6, 7)は現役に残してください。',
    },
  ],
  actions: [
    {
      id: 'act-table',
      title: 'アーカイブテーブルを用意する',
      description: '同じ構造の退避先テーブルを作成します。',
      checkIds: ['chk-archive-table'],
      successMessage: 'アーカイブテーブルが作成されました。',
      failureMessage: 'notifications_archive がまだありません。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-verify',
      title: '移動結果を確認する',
      description: 'コピー→削除の完了後、両テーブルの件数を確認します。',
      checkIds: ['chk-subquery', 'chk-result'],
      successMessage: 'アーカイブ移動が完了しました。現役テーブルはこれで軽く保てます。',
      failureMessage: '移動結果がまだ正しくありません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '順序の原則: 増やしてから減らす',
      blocks: [
        {
          type: 'paragraph',
          html: '移動処理は必ず「コピー(INSERT)→確認→削除(DELETE)」の順にします。逆にすると、途中で失敗した場合にデータが消失します。コピーと削除のWHERE条件は完全に同一の式を使い回すことが重要です。条件が1文字でも違うと「コピーしていない行を消す」事故になります。本番ではBEGIN〜COMMITのトランザクションで囲み、原子性を保証します。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '構造コピーの小技: WHERE 1 = 0',
      blocks: [
        {
          type: 'code',
          language: 'sql',
          code: `CREATE TABLE notifications_archive AS
SELECT * FROM notifications WHERE 1 = 0;`,
        },
        {
          type: 'paragraph',
          html: '常に偽になる条件を付けたCTASは「列構造だけコピーして0行のテーブルを作る」定番イディオムです。ただし制約やインデックスまではコピーされません。アーカイブテーブルは検索頻度が低いため最小限のインデックスで十分なことが多く、むしろ好都合です。',
        },
      ],
    },
    {
      id: 'step-3',
      title: '本番での応用',
      blocks: [
        {
          type: 'paragraph',
          html: '本番の巨大テーブルでは、DELETEを1回で流すと長時間ロックとWAL(ログ)の急増を招きます。LIMIT付きで数千件ずつ繰り返す「バッチ削除」が定石です。さらに大規模になると、日付パーティショニングを使って「古いパーティションを切り離す(DROP/DETACH)」方式に進化させます。これはDELETEと違い一瞬で終わります。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.shared }] },
  ],
};

export default config;
