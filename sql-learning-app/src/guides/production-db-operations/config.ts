import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'production-db-operations',
  title: '本番DBの運用実務',
  description: 'スロークエリの監視、VACUUM/ANALYZE、バックアップとリストア、安全なデータパッチ、大量データの扱いなど、稼働後のDB運用を整理する',
  headerLabel: '運用',
  homeIcon: 'Settings2',
  homeColor: 'orange',
  intro:
    'リリースはゴールではなく運用の始まりです。DBの運用実務は「<strong>悪化に気づく(監視)</strong>」「<strong>健康を保つ(メンテナンス)</strong>」「<strong>安全に手を入れる(変更作業)</strong>」の3つに分けられます。このガイドではPostgreSQLを中心に(MySQLの対応物も併記)、稼働後に必要になる知識と手順を整理します。',
  sections: [
    {
      id: 'slow-query-monitoring',
      title: '悪化に気づく: スロークエリの監視',
      icon: 'Gauge',
      blocks: [
        {
          type: 'paragraph',
          html: '性能問題は突然ではなく、データ増加とともに徐々に悪化します。「遅いクエリが常に見える」状態を最初に作るのが運用の第一歩です。',
        },
        {
          type: 'table',
          headers: ['手段', 'PostgreSQL', 'MySQL'],
          rows: [
            ['遅いクエリをログに出す', '<code>log_min_duration_statement = 500</code> (ms)', 'slow_query_log + <code>long_query_time</code>'],
            ['累積の統計で「合計で重い」クエリを見る', '<strong>pg_stat_statements</strong>拡張', 'performance_schema / sys.statement_analysis'],
            ['マネージドの可視化', 'RDS Performance Insights', 'RDS Performance Insights'],
          ],
          caption: '「1回が遅い」と「回数×時間の合計が重い」は別物。両方見る',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- pg_stat_statements: 合計時間の重い順トップ10
SELECT round(total_exec_time::numeric, 0) AS total_ms,
       calls,
       round(mean_exec_time::numeric, 1) AS mean_ms,
       left(query, 80) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;`,
          caption: '平均は速くても呼び出し回数が膨大なクエリ(N+1など)はここで見つかる',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '見るべき定点メトリクス',
          html: 'クエリ以外では <strong>接続数・レプリケーション遅延・ディスク使用量・キャッシュヒット率・デッドロック回数</strong> をダッシュボード化しておくと、障害の予兆(接続数の漸増、ディスクの右肩上がり)に前もって気づけます。',
        },
      ],
    },
    {
      id: 'vacuum-analyze',
      title: '健康を保つ: VACUUMとANALYZE',
      icon: 'HeartPulse',
      blocks: [
        {
          type: 'paragraph',
          html: 'PostgreSQLのUPDATE/DELETEは行をすぐ消さず「不要行(dead tuple)」として残します(MVCC)。これを回収するのが<strong>VACUUM</strong>、統計情報を更新してオプティマイザの判断材料を最新化するのが<strong>ANALYZE</strong>です。通常はautovacuumが自動で行いますが、仕組みを知らないと「なぜか遅い」「なぜかディスクが減らない」に説明がつきません。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'VACUUM',
              subtitle: '不要行の回収',
              accent: 'emerald',
              points: [
                'dead tupleの領域を再利用可能にする',
                '<strong>ファイルサイズ自体は縮まない</strong>(縮めるのはVACUUM FULLだが強ロック)',
                '大量UPDATE/DELETEの後は肥大化(bloat)しやすい',
                'トランザクションIDの周回対策という重要な役割もある',
              ],
            },
            {
              title: 'ANALYZE',
              subtitle: '統計情報の更新',
              accent: 'sky',
              points: [
                '列の値分布を集計し、オプティマイザの行数見積もりを支える',
                '<strong>統計が古いとインデックスがあるのに使われない</strong>ことがある',
                '大量ロード後は手動ANALYZEが定石',
                '「昨日から急に遅い」の一因になりがち',
              ],
            },
          ],
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- テーブルごとのdead tupleと最終vacuum/analyze時刻
SELECT relname, n_live_tup, n_dead_tup,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 10;`,
          caption: 'n_dead_tupが積み上がったままなら、autovacuumが追いついていないサイン',
        },
      ],
    },
    {
      id: 'backup-restore',
      title: 'バックアップとリストア',
      icon: 'DatabaseBackup',
      blocks: [
        {
          type: 'table',
          headers: ['方式', '戻せる時点', '用途'],
          rows: [
            ['自動スナップショット+WAL (PITR)', '保持期間内の<strong>任意の時刻</strong>', 'RDSなら自動。オペミス直前(誤DELETEの1分前)に戻れる'],
            ['手動スナップショット', '取得時点', 'リリース前・大規模データパッチ前に必ず取る'],
            ['論理バックアップ (pg_dump)', '取得時点', '別環境への複製、テーブル単位の救出、長期保管'],
          ],
          caption: 'PITR(ポイントインタイムリカバリ)の有無が事故対応力を決める',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'リストアは訓練していなければ存在しないのと同じ',
          html: '「スナップショットからの復元→アプリの向き先切替→動作確認」を<strong>一度も通しでやったことがない</strong>チームは、本番事故の当日に初見でやることになります。復元にかかる時間(=実際のRTO)も、やってみないと分かりません。四半期に一度でも訓練する価値があります。',
        },
        {
          type: 'list',
          items: [
            '誤操作でデータを消した場合、<strong>フルリストアではなく「別インスタンスへ復元して該当テーブルだけ救出」</strong>が現実的なことが多い',
            'バックアップの保持期間は「気づくまでの最長時間」より長く(月次バッチの誤りは翌月まで気づかない)',
            'レプリカはバックアップではない(誤DELETEは即座にレプリカにも複製される)',
          ],
        },
      ],
    },
    {
      id: 'data-patch',
      title: '安全なデータパッチ (本番データの手修正)',
      icon: 'Wrench',
      blocks: [
        {
          type: 'paragraph',
          html: '「この注文のステータスを直して」——本番データの手修正は運用で最も頻繁で、最も事故が起きやすい作業です。<strong>手順を型にする</strong>ことで事故率を下げられます。',
        },
        {
          type: 'steps',
          steps: [
            { title: '対象をSELECTで確定する', html: '更新条件と<strong>同じWHERE句</strong>でSELECTし、件数と内容を確認。「1件のつもりが5万件」はここで防ぐ。', accent: 'sky' },
            { title: 'トランザクションで囲む', html: '<code>BEGIN;</code> → UPDATE → 更新行数と結果をSELECTで確認 → 想定通りなら<code>COMMIT;</code>、違えば<code>ROLLBACK;</code>。', accent: 'emerald' },
            { title: '証跡を残す', html: '実行SQL・実行者・理由・前後の値をチケットに記録。可能なら変更前の行を退避テーブルにコピーしておく。', accent: 'amber' },
            { title: '根本対応を積む', html: '同じパッチが2回必要になったら、それはアプリのバグか業務フローの欠陥。修正タスク化する。', accent: 'rose' },
          ],
        },
        {
          type: 'code',
          language: 'sql',
          code: `BEGIN;

-- 変更前の退避(証跡 + 巻き戻し材料)
CREATE TABLE IF NOT EXISTS _patch_20260703 AS
SELECT * FROM orders WHERE id = 12345;

UPDATE orders SET status = 'cancelled' WHERE id = 12345;
-- UPDATE 1 と表示されることを確認

SELECT id, status FROM orders WHERE id = 12345;  -- 目視確認
COMMIT;`,
          caption: 'WHERE句なしUPDATEの事故は、この型を守っていれば起きない',
        },
      ],
    },
    {
      id: 'bulk-operations',
      title: '大量データの削除・更新はバッチで',
      icon: 'Layers',
      blocks: [
        {
          type: 'paragraph',
          html: '数百万行のDELETE/UPDATEを1文で流すと、長時間のロック、WAL(ログ)の急増、レプリカ遅延、autovacuumの悲鳴——と障害の総合デパートになります。<strong>小さく分けて繰り返す</strong>のが唯一の正解です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 5,000件ずつ削除を繰り返す(0件になるまでアプリ/スクリプトでループ)
DELETE FROM events
WHERE id IN (
  SELECT id FROM events
  WHERE created_at < '2025-01-01'
  LIMIT 5000
);`,
          caption: '各バッチが短いトランザクションになり、他のクエリを待たせない',
        },
        {
          type: 'list',
          items: [
            'バッチ間に短いスリープを挟むと、レプリケーションとautovacuumが追いつける',
            '「テーブルの大半を消す」なら、残す行を新テーブルへコピーしてリネームする方が速いことも',
            '定常的に古いデータを消す要件は、最初から<strong>パーティショニング</strong>(古いパーティションをDROP)を検討。演習「肥大化したテーブルをアーカイブする」も参照',
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'pg_stat_statementsで「合計時間の重いクエリ」を見る意味(平均が速くても危ないケース)を説明できる',
    'VACUUMとANALYZEの役割の違いと、統計が古いと何が起きるかを説明できる',
    'PITRで戻せることと、リストア訓練が必要な理由を説明できる',
    '本番データパッチの型(SELECT確認→トランザクション→証跡)を実演できる',
    '大量DELETEをバッチ分割すべき理由を3つ挙げられる',
  ],
  references: [
    { label: 'PostgreSQL: pg_stat_statements', url: 'https://www.postgresql.org/docs/current/pgstatstatements.html' },
    { label: 'PostgreSQL: Routine Vacuuming', url: 'https://www.postgresql.org/docs/current/routine-vacuuming.html' },
    { label: 'Amazon RDS バックアップと復元', url: 'https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_CommonTasks.BackupRestore.html' },
  ],
};

export default config;
