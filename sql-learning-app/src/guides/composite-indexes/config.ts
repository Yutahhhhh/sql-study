import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'composite-indexes',
  title: '複合インデックスとカラム順序・カバリングインデックス',
  description: '複数列にまたがるインデックスで、なぜ列の順序が結果を左右するのかを理解する',
  headerLabel: '複合インデックス',
  homeIcon: 'Rows3',
  homeColor: 'indigo',
  intro:
    '複合(多列)インデックスは「複数の単一インデックスを重ねたもの」ではありません。<strong>列の指定順序でソートされた1本の木構造</strong>であり、その順序によって効く検索パターンが大きく変わります。',
  sections: [
    {
      id: 'left-prefix',
      title: '最左プレフィックスの原則',
      icon: 'AlignLeft',
      blocks: [
        {
          type: 'paragraph',
          html: '<code>(customer_id, status)</code> という複合インデックスは、電話帳が「姓→名」の順に並んでいるのと同じです。姓だけで引くことはできますが、名だけで引くことはできません。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);

-- 使われる: 先頭列(customer_id)から始まる検索
SELECT * FROM orders WHERE customer_id = 5;
SELECT * FROM orders WHERE customer_id = 5 AND status = 'pending';

-- 使われない(もしくは非効率): 先頭列を飛ばしている
SELECT * FROM orders WHERE status = 'pending';`,
        },
        {
          type: 'callout',
          variant: 'info',
          title: '逆向きの複合インデックスも用意できる',
          html: '<code>status</code>だけで頻繁に検索するなら、別途 <code>(status)</code> 単体のインデックスを追加するか、用途に応じて <code>(status, customer_id)</code> の順序のインデックスを検討します。',
        },
      ],
    },
    {
      id: 'order-by-pattern',
      title: 'WHERE と ORDER BY を両立させる列順序',
      icon: 'ArrowDownUp',
      blocks: [
        {
          type: 'paragraph',
          html: '「<code>customer_id</code>で絞り込み、<code>ordered_at</code>で新しい順に並べる」というクエリは頻出パターンです。これを1本のインデックスで両立させるには、<strong>等価条件(=)で使う列を先、範囲/ソートに使う列を後</strong>に置きます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `CREATE INDEX idx_orders_customer_ordered_at ON orders (customer_id, ordered_at DESC);

SELECT * FROM orders
WHERE customer_id = 5
ORDER BY ordered_at DESC
LIMIT 20;
-- customer_id=5の範囲に絞った時点で、ordered_atの順序も
-- インデックス内で既にソート済みなので追加のソート処理が不要になる`,
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '列順序を逆にすると効果が薄れる',
          html: '<code>(ordered_at, customer_id)</code> の順で作ると、<code>customer_id</code>の等価条件だけでは先頭列(ordered_at)を絞り込めないため、範囲スキャンの効率が落ちます。',
        },
      ],
    },
    {
      id: 'covering-index',
      title: 'カバリングインデックス',
      icon: 'Layers',
      blocks: [
        {
          type: 'paragraph',
          html: 'SELECTで必要な列が全てインデックスに含まれていれば、データベースはテーブル本体(ヒープ)にアクセスせずインデックスだけで結果を返せます。これを<strong>カバリングインデックス(Index Only Scan)</strong>と呼びます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- customer_id, statusで絞り込み、idだけを返すクエリ
CREATE INDEX idx_orders_covering ON orders (customer_id, status, id);

EXPLAIN ANALYZE
SELECT id FROM orders WHERE customer_id = 5 AND status = 'pending';
-- Index Only Scan using idx_orders_covering ...`,
        },
        {
          type: 'compare',
          columns: [
            {
              title: 'Index Scan',
              accent: 'blue',
              points: ['インデックスで行の場所を特定', 'テーブル本体(ヒープ)にもアクセスする', '取得列がインデックスに無い場合はこちら'],
            },
            {
              title: 'Index Only Scan',
              accent: 'emerald',
              points: ['インデックスだけで完結', 'ヒープアクセスが不要で高速', '取得列が全てインデックスに含まれる場合のみ'],
            },
          ],
        },
      ],
    },
  ],
  checkpoints: [
    '最左プレフィックスの原則を、電話帳の例で他人に説明できる',
    '「絞り込みに使う列を先・ソートに使う列を後」という複合インデックスの設計指針を説明できる',
    'カバリングインデックスがなぜテーブル本体へのアクセスを省略できるのかを説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Multicolumn Indexes', url: 'https://www.postgresql.org/docs/current/indexes-multicolumn.html' },
    { label: 'PostgreSQL: Index-Only Scans', url: 'https://www.postgresql.org/docs/current/indexes-index-only-scans.html' },
  ],
};

export default config;
