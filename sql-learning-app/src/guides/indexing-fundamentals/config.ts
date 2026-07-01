import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'indexing-fundamentals',
  title: '単一インデックスの基礎とオプティマイザの選択',
  description: 'インデックスがどのようなデータ構造で、オプティマイザがいつそれを使うのかを理解する',
  headerLabel: '単一インデックス',
  homeIcon: 'ListTree',
  homeColor: 'blue',
  intro:
    'インデックスは「魔法の高速化スイッチ」ではありません。<strong>B-tree(平衡木)というデータ構造</strong>を追加で持つことで、特定の検索パターンを高速化する代わりに、書き込みコストとストレージを犠牲にする仕組みです。',
  sections: [
    {
      id: 'btree',
      title: 'B-treeインデックスの仕組み',
      icon: 'GitBranch',
      blocks: [
        {
          type: 'paragraph',
          html: 'インデックスがない状態で <code>WHERE email = \'a@example.com\'</code> を実行すると、データベースは先頭から1行ずつ全件を確認する<strong>Seq Scan(全表走査)</strong>を行います。テーブルが10万行あれば最悪10万回の比較が必要です。',
        },
        {
          type: 'paragraph',
          html: 'B-treeインデックスは、列の値をソート済みの木構造で保持します。これにより二分探索的にO(log n)で目的の行を見つけられ、10万行でも17回程度の比較で済みます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `CREATE INDEX idx_customers_email ON customers (email);

EXPLAIN ANALYZE SELECT * FROM customers WHERE email = 'a@example.com';
-- Index Scan using idx_customers_email ... (インデックスがあれば)
-- Seq Scan on customers ... (インデックスがなければ)`,
        },
      ],
    },
    {
      id: 'when-used',
      title: 'オプティマイザがインデックスを使う条件',
      icon: 'Brain',
      blocks: [
        {
          type: 'paragraph',
          html: 'インデックスを作っても、オプティマイザが「使う方が速い」と判断しなければ使われません。判断材料はテーブルの行数・該当する行の割合(選択性)・統計情報です。',
        },
        {
          type: 'table',
          headers: ['状況', 'インデックスは使われるか', '理由'],
          rows: [
            ['対象が全行の1%未満(高選択性)', '使われやすい', 'インデックス経由の方が読み取るブロック数が少ない'],
            ['対象が全行の30%以上(低選択性)', '使われにくい', 'Seq Scanの方がランダムI/Oが少なく速いとオプティマイザが判断する'],
            ['テーブルの行数が非常に少ない', '使われない', 'メモリに収まる小さいテーブルはSeq Scanの方が単純に速い'],
            ['<code>WHERE email LIKE \'%example.com\'</code>(前方一致でない)', '使われない', 'B-treeは前方一致(<code>LIKE \'a%\'</code>)しか効率的に絞り込めない'],
            ['列に関数を適用している(<code>WHERE LOWER(email) = ...</code>)', '使われない', '式インデックスでない限り、関数適用後の値はインデックスと対応しない'],
          ],
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'インデックスがあるのに使われない典型例',
          html: '<code>WHERE LOWER(email) = \'a@example.com\'</code> のように列に関数をかけると、通常のB-treeインデックスは使われません。<code>CREATE INDEX ... ON customers (LOWER(email))</code> のような式インデックスが必要です。',
        },
      ],
    },
    {
      id: 'tradeoffs',
      title: 'インデックスのコスト',
      icon: 'Scale',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>書き込みコスト</strong>: INSERT/UPDATE/DELETEのたびに、テーブル本体だけでなく全てのインデックスも更新する必要がある',
            '<strong>ストレージコスト</strong>: インデックスはテーブルとは別の領域を消費する。大きい列(長いTEXTなど)に貼ると無視できないサイズになる',
            '<strong>不要なインデックスは害になる</strong>: 使われていないインデックスは書き込みを遅くするだけのコストになる',
          ],
        },
        {
          type: 'flow',
          title: 'インデックスを追加する判断フロー',
          steps: [
            { label: 'WHERE/JOIN/ORDER BYで\n使われる列か?', accent: 'sky' },
            { label: '選択性は高いか?\n(対象行が少ないか)', accent: 'blue' },
            { label: '書き込み頻度は\n許容範囲か?', accent: 'indigo' },
            { label: 'インデックスを追加', accent: 'emerald' },
          ],
        },
      ],
    },
  ],
  checkpoints: [
    'B-treeインデックスがなぜO(log n)で検索できるのかを説明できる',
    '選択性が低い列にインデックスを貼っても効果が薄い理由を説明できる',
    '列に関数を適用した検索でインデックスが効かなくなる理由と対処法(式インデックス)を説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
  ],
};

export default config;
