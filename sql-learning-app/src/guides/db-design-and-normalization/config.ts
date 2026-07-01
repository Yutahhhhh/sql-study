import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'db-design-and-normalization',
  title: 'DB設計と正規化',
  description: '1枚の巨大なテーブルをどう分解し、整合性を保ちながら拡張可能な設計にするか',
  headerLabel: 'DB設計',
  homeIcon: 'Database',
  homeColor: 'sky',
  intro:
    '正規化は「無駄なルールのための儀式」ではなく、<strong>更新時異常(更新・挿入・削除の矛盾)を防ぐための実務的な技術</strong>です。ここでは非正規化されたテーブルを例に、第1〜第3正規形まで段階的に分解していきます。',
  sections: [
    {
      id: 'problem',
      title: '非正規化テーブルが引き起こす問題',
      icon: 'AlertTriangle',
      blocks: [
        {
          type: 'paragraph',
          html: '次のような「注文」テーブルを考えます。1行に顧客情報・商品情報・注文情報が全て詰め込まれています。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 非正規化された注文テーブル
CREATE TABLE orders_flat (
  order_id INT,
  customer_name TEXT,
  customer_email TEXT,
  product_name TEXT,
  product_price NUMERIC,
  quantity INT,
  ordered_at TIMESTAMP
);`,
        },
        {
          type: 'list',
          items: [
            '<strong>更新異常</strong>: 同じ顧客が複数注文すると、メールアドレスが行ごとに重複して保存される。顧客がメールアドレスを変更すると全行を更新しないと矛盾が起きる。',
            '<strong>挿入異常</strong>: まだ注文していない新規顧客の情報を登録したくても、注文がない限り顧客単体のレコードを作れない。',
            '<strong>削除異常</strong>: ある顧客の唯一の注文をキャンセル(削除)すると、その顧客の情報自体が失われてしまう。',
          ],
        },
      ],
    },
    {
      id: 'normal-forms',
      title: '正規形を段階的に適用する',
      icon: 'Layers',
      blocks: [
        {
          type: 'steps',
          steps: [
            {
              title: '第1正規形(1NF): 繰り返しグループを排除する',
              accent: 'sky',
              html: '1つのセルに複数の値を詰め込まない。1注文に複数商品がある場合、商品ごとに行を分ける(order_items相当)。',
            },
            {
              title: '第2正規形(2NF): 部分関数従属を排除する',
              accent: 'blue',
              html: '複合主キー(order_id, product_id)の一部(product_idだけ)に従属する商品名・単価は、productsテーブルへ切り出す。',
            },
            {
              title: '第3正規形(3NF): 推移的関数従属を排除する',
              accent: 'indigo',
              html: '主キーに直接従属しない項目(customer_emailはcustomer_idを経由してorder_idに従属)はcustomersテーブルへ切り出す。',
            },
          ],
        },
        {
          type: 'code',
          language: 'sql',
          caption: '正規化後のスキーマ',
          code: `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  ordered_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL -- 注文時点の単価を保存(productsのpriceは将来変わるため)
);`,
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'unit_priceをorder_itemsに複製する理由',
          html: '正規化は「同じ情報を二重に持たない」が原則ですが、<code>order_items.unit_price</code>は例外です。products.priceは将来値上げ・値下げされますが、過去の注文は注文時点の価格を記録し続ける必要があるため、これは正規化違反ではなく意図的な履歴の保持です。',
        },
      ],
    },
    {
      id: 'denormalization',
      title: 'あえて非正規化する判断',
      icon: 'Scale',
      blocks: [
        {
          type: 'paragraph',
          html: '正規化は整合性を優先する設計です。一方で、集計のたびに何段もJOINするのが重い場合、<strong>意図的に非正規化(冗長化)してパフォーマンスを優先する</strong>判断もあります(例: 注文一覧に顧客名をキャッシュして持つ、集計用のサマリーテーブルを別途用意する)。',
        },
        {
          type: 'compare',
          columns: [
            {
              title: '正規化を優先',
              accent: 'sky',
              points: [
                '更新頻度が高いデータ',
                '整合性が業務上クリティカル(在庫・残高など)',
                '読み取りより書き込みが多い',
              ],
            },
            {
              title: '非正規化を検討',
              accent: 'amber',
              points: [
                '読み取り頻度が圧倒的に多い(レポート・ダッシュボード)',
                'JOINの段数が多すぎてパフォーマンスがボトルネックになっている',
                '多少のデータ遅延が許容できる(集計バッチで反映するサマリー等)',
              ],
            },
          ],
        },
      ],
    },
  ],
  checkpoints: [
    '1つのテーブルに同じ情報(顧客名・メールなど)が複数行にわたって重複して保存されていないか説明できる',
    '複合主キーの一部にしか従属しない列が、なぜ別テーブルに切り出すべきかを説明できる',
    '正規化と非正規化のトレードオフを、読み取り/書き込み頻度の観点で説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Database Normalization 関連ドキュメント', url: 'https://www.postgresql.org/docs/current/ddl.html' },
  ],
};

export default config;
