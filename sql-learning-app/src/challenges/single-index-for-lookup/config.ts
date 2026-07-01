import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'single-index-for-lookup',
  title: '遅い検索クエリに単一インデックスを追加する',
  description: 'EXPLAINでSeq Scanを確認し、適切な単一インデックスで解消する',
  headerLabel: '単一インデックス',
  badge: '単一インデックス',
  icon: 'ListTree',
  color: 'blue',
  topic: 'indexing',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    'events テーブルには3,000件のイベントログが入っています。「特定のユーザーのイベント一覧を取得する」処理が遅いという報告がありました。まず `SELECT * FROM events WHERE user_id = 42;` を実行して結果とEXPLAINタブを確認し、Seq Scanになっていることを確認してください。その後、適切なインデックスを追加し、再度クエリを実行してIndex Scanに変わることを確認してください。',
  requirements: [
    {
      id: 'req-index',
      title: 'user_id列にインデックスを追加する',
      description: 'events.user_idに対する単一列インデックスを作成する(CREATE INDEX)',
    },
    {
      id: 'req-query',
      title: 'user_id = 42 で検索する',
      description: 'インデックス作成後に `SELECT * FROM events WHERE user_id = 42;` を実行し、Index Scanになることを確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-index-exists',
      type: 'index-exists',
      tableName: 'events',
      columns: ['user_id'],
      label: 'events.user_idへのインデックス',
      failureMessage: 'events.user_idにインデックスが見つかりません。CREATE INDEXを実行してください。',
    },
    {
      id: 'chk-avoids-seqscan',
      type: 'query-avoids-seq-scan',
      tableName: 'events',
      label: 'Seq Scanを回避できているか',
      failureMessage: 'まだSeq Scan(全表走査)になっています。インデックスが使われるクエリか確認してください。',
    },
    {
      id: 'chk-uses-index',
      type: 'query-uses-index',
      label: 'インデックスが使われているか',
      failureMessage: 'EXPLAIN結果でインデックスの利用が確認できません。',
    },
  ],
  actions: [
    {
      id: 'act-create-index',
      title: 'インデックスを作成する',
      description: 'events.user_idに単一列インデックスを作成します。',
      checkIds: ['chk-index-exists'],
      successMessage: 'インデックスが作成されました。',
      failureMessage: 'events.user_idへのインデックスがまだ作成されていません。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-query-uses-index',
      title: 'クエリがインデックスを使う',
      description: '`SELECT * FROM events WHERE user_id = 42;` を実行し、EXPLAINでインデックスが使われているか確認します。',
      checkIds: ['chk-avoids-seqscan', 'chk-uses-index'],
      successMessage: 'クエリがインデックスを使って実行されました。',
      failureMessage: 'このクエリはまだインデックスを使えていません(EXPLAINタブを確認してください)。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'まずSeq Scanになることを確認する',
      blocks: [
        {
          type: 'paragraph',
          html: 'インデックスがない状態で `SELECT * FROM events WHERE user_id = 42;` を実行すると、EXPLAINタブで `Seq Scan` (PostgreSQL) または `SCAN` (MySQL/SQLite) と表示されます。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '単一列インデックスを作成する',
      blocks: [{ type: 'code', language: 'sql', code: 'CREATE INDEX idx_events_user_id ON events (user_id);' }],
    },
    {
      id: 'step-3',
      title: '再実行してIndex Scanを確認する',
      blocks: [
        {
          type: 'paragraph',
          html: '同じクエリを再実行すると、`Index Scan using idx_events_user_id` のように表示が変わります。user_id=42は3,000件中わずか数件しか該当しないため、インデックス経由の方が圧倒的に効率的です。',
        },
      ],
    },
  ],
};

export default config;
