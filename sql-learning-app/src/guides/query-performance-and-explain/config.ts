import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'query-performance-and-explain',
  title: 'クエリパフォーマンスとEXPLAINの読み方',
  description: 'EXPLAINの出力からボトルネックを特定し、N+1などの典型的な落とし穴を避ける',
  headerLabel: 'パフォーマンス',
  homeIcon: 'Gauge',
  homeColor: 'amber',
  intro:
    '「なんとなく遅い」を「どこが遅いか」に変えるのがEXPLAINです。実行計画を読めるようになると、インデックス追加・クエリ書き換え・スキーマ変更のどれが効くのかを根拠を持って判断できます。',
  sections: [
    {
      id: 'explain-basics',
      title: 'EXPLAINの読み方',
      icon: 'FileSearch',
      blocks: [
        {
          type: 'paragraph',
          html: 'PostgreSQLでは <code>EXPLAIN ANALYZE</code> を使うと、見積もり(estimate)だけでなく実際の実行時間・行数も確認できます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `EXPLAIN ANALYZE
SELECT * FROM orders WHERE customer_id = 5;

-- Seq Scan on orders (cost=0.00..1834.00 rows=50 width=42) (actual time=0.02..12.40 rows=48 loops=1)
--   Filter: (customer_id = 5)
--   Rows Removed by Filter: 99952`,
        },
        {
          type: 'table',
          headers: ['読み方のポイント', '意味'],
          rows: [
            ['<code>Seq Scan</code> / <code>Index Scan</code>', 'どのアクセス方法が選ばれたか'],
            ['<code>rows=50</code>(見積もり) vs <code>rows=48</code>(実際)', '統計情報の精度。乖離が大きいとANALYZEでの統計更新が必要な兆候'],
            ['<code>actual time=0.02..12.40</code>', '最初の行が返るまでと、全行返し終わるまでの時間(ms)'],
            ['<code>Rows Removed by Filter</code>', 'フィルタで捨てられた行数。大きいほどインデックスの必要性が高い'],
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'MySQL(SQLite)トラックでは',
          html: 'このプラットフォームのMySQLトラックはSQLiteエンジンで動くため、<code>EXPLAIN QUERY PLAN</code>を使います。<code>SEARCH ... USING INDEX</code>ならインデックス利用、<code>SCAN ...</code>のみなら全表走査です。',
        },
      ],
    },
    {
      id: 'n-plus-one',
      title: 'N+1問題',
      icon: 'Repeat',
      blocks: [
        {
          type: 'paragraph',
          html: 'アプリケーションコードでよくある「1件取得してから関連データをループで1件ずつ取りに行く」パターンは、DBに対してN+1回のクエリを発行してしまいます。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'N+1になっている例',
              accent: 'rose',
              points: [
                '1. <code>SELECT * FROM customers</code>(N件取得)',
                '2. 取得したN件それぞれに対して<code>SELECT * FROM orders WHERE customer_id = ?</code>を実行',
                '合計 N+1 回のクエリ',
              ],
            },
            {
              title: 'JOINで解消した例',
              accent: 'emerald',
              points: [
                '<code>SELECT c.*, o.* FROM customers c JOIN orders o ON o.customer_id = c.id</code>',
                '1回のクエリで完結',
                'または <code>IN (...)</code> でまとめて取得する方法もある',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'JOINが常に正解とは限らない',
          html: '結合後の行数が大きく膨れる(1対多で多側が非常に多い)場合は、JOINではなく<code>WHERE customer_id IN (...)</code>で親IDをまとめて渡し、アプリ側でグルーピングする方が効率的なこともあります。',
        },
      ],
    },
    {
      id: 'common-pitfalls',
      title: 'よくあるパフォーマンスの落とし穴',
      icon: 'AlertTriangle',
      blocks: [
        {
          type: 'list',
          items: [
            '<code>SELECT *</code> で不要な列まで取得し、カバリングインデックスが使えなくなる',
            'ページネーションで <code>OFFSET</code> を大きくすると、DBはOFFSET分の行を数えてから捨てるため遅くなる(キーセットページネーションで回避)',
            '<code>COUNT(*)</code> を毎回リアルタイムに計算している(概算で十分な場面ではキャッシュや統計情報を使う)',
            'トランザクションを開いたまま外部API呼び出し等の時間がかかる処理を挟み、ロックを長時間保持してしまう',
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'EXPLAIN ANALYZEの出力から、見積もり行数と実際の行数の乖離が何を示すか説明できる',
    'N+1問題がなぜ発生し、JOINやIN句でどう解消できるか説明できる',
    'OFFSETを使った大きなページネーションがなぜ遅くなるか説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Using EXPLAIN', url: 'https://www.postgresql.org/docs/current/using-explain.html' },
  ],
};

export default config;
