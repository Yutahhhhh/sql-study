import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'subqueries-and-complex-queries',
  title: 'サブクエリ・CTE・ウィンドウ関数・集合演算',
  description: '複雑な集計や順位付けを、可読性を保ちながらSQLだけで表現する',
  headerLabel: 'サブクエリ・複雑なクエリ',
  homeIcon: 'GitMerge',
  homeColor: 'purple',
  intro:
    'アプリケーション側でループしながら集計するより、SQLの集合演算・ウィンドウ関数を使う方が高速かつ宣言的です。ここでは代表的なパターンを整理します。',
  sections: [
    {
      id: 'subquery-types',
      title: 'サブクエリの種類',
      icon: 'Layers',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: '非相関サブクエリ',
              accent: 'sky',
              points: [
                '外側のクエリと独立して1回だけ実行できる',
                '例: <code>WHERE price > (SELECT AVG(price) FROM products)</code>',
                '実行計画上も単純にキャッシュしやすい',
              ],
            },
            {
              title: '相関サブクエリ',
              accent: 'rose',
              points: [
                '外側の各行を参照するため、行ごとに再評価される',
                '例: <code>WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)</code>',
                '件数が多いと遅くなりやすく、JOINやウィンドウ関数で書き換えられないか検討する',
              ],
            },
          ],
        },
        {
          type: 'code',
          language: 'sql',
          caption: '相関サブクエリでグループごとの最新行を取る例',
          code: `SELECT o.*
FROM orders o
WHERE o.ordered_at = (
  SELECT MAX(o2.ordered_at)
  FROM orders o2
  WHERE o2.customer_id = o.customer_id
);`,
        },
      ],
    },
    {
      id: 'cte',
      title: 'CTE(WITH句)で複雑なクエリを整理する',
      icon: 'ListTree',
      blocks: [
        {
          type: 'paragraph',
          html: 'CTE(Common Table Expression)は、クエリの一部に名前を付けて中間結果のように扱える機能です。深くネストしたサブクエリを、読みやすい段階的な処理に分解できます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `WITH customer_totals AS (
  SELECT customer_id, SUM(unit_price * quantity) AS total_spent
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  GROUP BY customer_id
),
top_customers AS (
  SELECT customer_id, total_spent
  FROM customer_totals
  WHERE total_spent > 10000
)
SELECT c.name, tc.total_spent
FROM top_customers tc
JOIN customers c ON c.id = tc.customer_id
ORDER BY tc.total_spent DESC;`,
        },
        {
          type: 'callout',
          variant: 'info',
          title: 'PostgreSQLのCTEは最適化の壁になりうる',
          html: 'PostgreSQL 12以降、CTEは可能な場合インライン化(最適化)されますが、<code>WITH x AS MATERIALIZED (...)</code>と明示すると常に一度だけ評価され結果が固定されます。再利用や副作用の分離が目的なら明示的にMATERIALIZEDを検討してください。',
        },
      ],
    },
    {
      id: 'window-functions',
      title: 'ウィンドウ関数で相関サブクエリを置き換える',
      icon: 'Rows3',
      blocks: [
        {
          type: 'paragraph',
          html: 'ウィンドウ関数は、行を集約して減らさずに「グループ内での順位・累計・比較」を計算できます。相関サブクエリより効率的に書けることが多いです。',
        },
        {
          type: 'code',
          language: 'sql',
          caption: 'グループごとの最新行を1件だけ取得(ROW_NUMBER版)',
          code: `SELECT *
FROM (
  SELECT o.*,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY ordered_at DESC) AS rn
  FROM orders o
) ranked
WHERE rn = 1;`,
        },
        {
          type: 'table',
          headers: ['関数', '用途'],
          rows: [
            ['<code>ROW_NUMBER()</code>', 'グループ内で重複なく連番を振る(1件だけ抽出する用途に最適)'],
            ['<code>RANK()</code> / <code>DENSE_RANK()</code>', '同順位を考慮した順位付け'],
            ['<code>SUM() OVER (...)</code>', '行を減らさずに累計・移動合計を計算'],
            ['<code>LAG()</code> / <code>LEAD()</code>', '前後の行の値を参照する(前月比などに便利)'],
          ],
        },
      ],
    },
    {
      id: 'set-operations',
      title: '集合演算(UNION / INTERSECT / EXCEPT)',
      icon: 'GitMerge',
      blocks: [
        {
          type: 'table',
          headers: ['演算子', '意味'],
          rows: [
            ['<code>UNION</code>', '2つの結果を統合し重複を除去する'],
            ['<code>UNION ALL</code>', '2つの結果を統合するが重複を除去しない(高速)'],
            ['<code>INTERSECT</code>', '両方に存在する行だけを返す'],
            ['<code>EXCEPT</code>', '1つ目にあり2つ目にない行を返す'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '重複除去が不要ならUNION ALL',
          html: '<code>UNION</code>は重複除去のために内部的にソート/ハッシュ処理が入り<code>UNION ALL</code>より遅くなります。重複が発生しないと分かっている場合は<code>UNION ALL</code>を使いましょう。',
        },
      ],
    },
  ],
  checkpoints: [
    '相関サブクエリと非相関サブクエリの違いと、パフォーマンス上の注意点を説明できる',
    'CTEを使うことで、ネストしたサブクエリと比べて何が改善するかを説明できる',
    'ROW_NUMBER()を使ってグループごとの最新行を1件だけ取得するクエリを書ける',
    'UNIONとUNION ALLの違いを説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Window Functions', url: 'https://www.postgresql.org/docs/current/tutorial-window.html' },
    { label: 'PostgreSQL: WITH Queries (CTE)', url: 'https://www.postgresql.org/docs/current/queries-with.html' },
  ],
};

export default config;
