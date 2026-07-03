import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'incident-investigation-playbook',
  title: 'DB障害の調査と解消プレイブック',
  description: 'pg_stat_activityでの現状把握、ロック・長時間トランザクションの特定と解消、デッドロック、ディスクフルまで、障害時の手順書',
  headerLabel: '障害対応',
  homeIcon: 'Stethoscope',
  homeColor: 'emerald',
  intro:
    '「アプリが固まった」「全リクエストがタイムアウトする」——DB起因の障害は、調査コマンドを知っているかどうかで解決時間が桁で変わります。このガイドは障害の現場で上から順に実行していける<strong>プレイブック(手順書)</strong>形式でまとめます。PostgreSQLを主、MySQLを従で併記します。',
  sections: [
    {
      id: 'first-look',
      title: '最初の5分: 今DBで何が起きているか',
      icon: 'Eye',
      blocks: [
        {
          type: 'paragraph',
          html: '最初に見るのは<strong>pg_stat_activity</strong>(MySQLなら<code>SHOW PROCESSLIST</code>)です。「何本の接続が」「何のクエリを」「どんな状態で」「いつから」実行しているかが1枚で分かります。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 実行中クエリを古い順に(調査の起点)
SELECT pid,
       now() - query_start AS duration,
       state,
       wait_event_type,
       left(query, 100) AS query
FROM pg_stat_activity
WHERE state <> 'idle'
ORDER BY query_start;`,
          caption: 'MySQL: SHOW FULL PROCESSLIST; / SELECT * FROM information_schema.processlist',
        },
        {
          type: 'table',
          headers: ['見えた状態', '意味', '次の一手'],
          rows: [
            ['durationが異常に長いクエリがいる', '暴走クエリ or ロック待ち', 'wait_event_typeを確認。Lockならロック調査へ'],
            ['<code>idle in transaction</code>が長時間', '<strong>トランザクション開けっ放し</strong>。ロックとVACUUM阻害の元凶', '該当セッションの特定・停止へ'],
            ['活動中クエリが大量で全部同じSQL', 'スパイク or キャッシュ喪失', 'アプリ側の流量を絞る/該当機能を止める'],
            ['接続数が上限近い', 'コネクション枯渇', 'idle接続の整理、プール設定、RDS Proxy'],
          ],
          caption: '状態の読み方',
        },
      ],
    },
    {
      id: 'locks',
      title: 'ロック詰まりの特定と解消',
      icon: 'Lock',
      blocks: [
        {
          type: 'paragraph',
          html: '「特定のテーブルに触るクエリが全部固まる」時は、ほぼロックの連鎖です。重要なのは<strong>待たされている側ではなく、待たせている根本(ブロッカー)</strong>を見つけることです。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 誰が誰をブロックしているか(ブロッカーの特定)
SELECT blocked.pid  AS blocked_pid,
       left(blocked.query, 60)  AS blocked_query,
       blocking.pid AS blocking_pid,
       blocking.state AS blocking_state,
       left(blocking.query, 60) AS blocking_query
FROM pg_stat_activity blocked
JOIN LATERAL unnest(pg_blocking_pids(blocked.pid)) AS b(pid) ON true
JOIN pg_stat_activity blocking ON blocking.pid = b.pid;`,
          caption: 'MySQL(InnoDB): sys.innodb_lock_waits ビューが同等の情報を出す',
        },
        {
          type: 'steps',
          steps: [
            { title: 'ブロッカーを特定する', html: '上のクエリでblocking_pidを見つける。ブロッカーが<code>idle in transaction</code>なら「コミットし忘れたまま放置された接続」が犯人。', accent: 'sky' },
            { title: 'まず穏当に止める', html: '<code>SELECT pg_cancel_backend(pid);</code> で実行中クエリのキャンセルを試す(接続は残る)。', accent: 'amber' },
            { title: 'ダメなら接続ごと切る', html: '<code>SELECT pg_terminate_backend(pid);</code>。そのセッションのトランザクションはロールバックされる。<strong>何のクエリを切るのか確認してから</strong>実行する。', accent: 'rose' },
            { title: '再発防止', html: 'アプリの接続に<code>idle_in_transaction_session_timeout</code>や<code>statement_timeout</code>を設定し、「無限に待つ・無限に持つ」を構造的に禁止する。', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'idle in transactionはなぜ生まれるか',
          html: '典型は「トランザクション中に外部API呼び出しや重い処理を挟むアプリ実装」「例外時にROLLBACKしない接続処理」「手作業のBEGINのまま离席」。ロックを持ったまま何もしない接続は、<strong>後続を全部止めた上にVACUUMも妨げる</strong>最悪の存在です。',
        },
      ],
    },
    {
      id: 'deadlock',
      title: 'デッドロックの読み方と対策',
      icon: 'GitCompareArrows',
      blocks: [
        {
          type: 'paragraph',
          html: 'デッドロックは「AがXを持ってYを待ち、BがYを持ってXを待つ」相互待ちです。DBが自動検知して片方を強制ロールバックするため、<strong>サービス全体は止まりません</strong>。ログのエラーが手がかりです。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `ERROR:  deadlock detected
DETAIL:  Process 1234 waits for ShareLock on transaction 567; blocked by process 5678.
         Process 5678 waits for ShareLock on transaction 566; blocked by process 1234.
HINT:  See server log for query details.`,
          caption: 'ログには両プロセスの実行中クエリも出る。「どの2つの処理が」「どのテーブルで」交差したかを読む',
        },
        {
          type: 'list',
          items: [
            '<strong>最大の対策は更新順序の統一</strong>: 複数行・複数テーブルを更新する処理は、常に同じ順序(例: id昇順、テーブルA→B)でロックを取る',
            'トランザクションを短くし、持つロックの数と時間を減らす',
            '大きな一括更新はバッチ分割する(ロック範囲が狭くなる)',
            'アプリはデッドロックエラー(PostgreSQL: 40P01)を<strong>リトライ</strong>する実装にしておく(片方は成功しているので、もう片方はやり直せば通る)',
          ],
        },
      ],
    },
    {
      id: 'disk-replication',
      title: 'ディスクフルとレプリケーション遅延',
      icon: 'HardDrive',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'ディスクフル',
              subtitle: 'DBが書き込み不能になる前に',
              accent: 'rose',
              points: [
                '原因の典型: ログ肥大、<strong>WAL滞留</strong>(レプリケーションスロットの放置)、一時ファイル、bloat',
                '調査: テーブルサイズは<code>pg_total_relation_size</code>、RDSならFreeStorageSpaceメトリクス',
                '応急処置: 不要な巨大テーブル/古いパーティションの削除、RDSはストレージ拡張',
                '<strong>使用率アラームを70%程度</strong>で張っておくのが本当の対策',
              ],
            },
            {
              title: 'レプリケーション遅延',
              subtitle: '「更新したのに表示が古い」',
              accent: 'amber',
              points: [
                '読み取りをレプリカへ逃がす構成では、書き込み直後の読み取りが古いことがある',
                '調査: レプリカで<code>now() - pg_last_xact_replay_timestamp()</code>、RDSはReplicaLagメトリクス',
                '原因の典型: レプリカ性能不足、大量一括更新、長時間クエリとの競合',
                'アプリ対策: <strong>自分が書いた直後の読み取りはプライマリへ</strong>向ける(read-your-writes)',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'incident-flow',
      title: '障害対応の全体フロー',
      icon: 'Map',
      blocks: [
        {
          type: 'flow',
          title: '症状から原因へ',
          steps: [
            { label: '影響範囲の確認', sublabel: '全体か特定機能か', accent: 'slate' },
            { label: 'pg_stat_activity', sublabel: '今何が動いているか', accent: 'sky' },
            { label: 'ロック/長時間Txを疑う', sublabel: 'ブロッカー特定', accent: 'amber' },
            { label: '止血 (cancel/terminate)', sublabel: 'サービス回復を優先', accent: 'rose' },
            { label: '記録と再発防止', sublabel: 'タイムアウト設定/制約/リトライ', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '回復が先、根本原因は後',
          html: '障害中の目標は「原因の完全解明」ではなく<strong>サービスの回復</strong>です。ブロッカーを切る、機能を一時的に止める、レプリカへ逃がす——止血してから、保存したpg_stat_activityのスナップショットとログでゆっくり根本原因を追います。<strong>調査結果を貼り付けたタイムライン</strong>を残すことが、次の障害を短くします。',
        },
      ],
    },
  ],
  checkpoints: [
    'pg_stat_activity(SHOW PROCESSLIST)から、暴走クエリ・ロック待ち・idle in transactionを読み分けられる',
    'pg_blocking_pidsでブロッカーを特定し、pg_cancel_backend→pg_terminate_backendの順で解消できる',
    'デッドロックのログを読み、更新順序の統一とリトライという対策を説明できる',
    'statement_timeout / idle_in_transaction_session_timeout を設定する理由を説明できる',
  ],
  references: [
    { label: 'PostgreSQL: The Statistics Collector (pg_stat_activity)', url: 'https://www.postgresql.org/docs/current/monitoring-stats.html' },
    { label: 'PostgreSQL: Lock Monitoring (Wiki)', url: 'https://wiki.postgresql.org/wiki/Lock_Monitoring' },
    { label: 'MySQL: sys.innodb_lock_waits', url: 'https://dev.mysql.com/doc/refman/8.0/en/sys-innodb-lock-waits.html' },
  ],
};

export default config;
