import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'constraints-and-integrity',
  title: '制約と整合性(PK/FK/UNIQUE/CHECK)',
  description: 'アプリケーション側のバリデーションだけに頼らず、DB側で不正なデータを物理的に防ぐ',
  headerLabel: '制約周り',
  homeIcon: 'ShieldCheck',
  homeColor: 'emerald',
  intro:
    'アプリケーションのバリデーションは「バグがあれば素通りする」可能性が常にあります。DB制約は<strong>最後の砦</strong>として、どんな経路でデータが入ってきても不整合を許さない仕組みです。',
  sections: [
    {
      id: 'constraint-types',
      title: '制約の種類と役割',
      icon: 'ListChecks',
      blocks: [
        {
          type: 'table',
          headers: ['制約', '役割', '例'],
          rows: [
            ['PRIMARY KEY', '行を一意に識別する。NOT NULL + UNIQUE を兼ねる', '<code>id SERIAL PRIMARY KEY</code>'],
            ['FOREIGN KEY', '参照先に存在しない値の登録を防ぐ(参照整合性)', '<code>customer_id INTEGER REFERENCES customers(id)</code>'],
            ['UNIQUE', '重複を許さない(PRIMARY KEY以外の一意性)', '<code>email TEXT UNIQUE</code>'],
            ['NOT NULL', 'NULLを許さない', '<code>name TEXT NOT NULL</code>'],
            ['CHECK', '任意の条件式を満たさない値を拒否する', '<code>CHECK (price >= 0)</code>'],
          ],
        },
      ],
    },
    {
      id: 'fk-cascade',
      title: '外部キーのON DELETE挙動',
      icon: 'GitBranch',
      blocks: [
        {
          type: 'paragraph',
          html: '親レコードが削除されたとき、子レコードをどう扱うかは <code>ON DELETE</code> 句で明示します。何も指定しない場合、参照されている親は削除できずエラーになります(<code>NO ACTION</code>相当)。',
        },
        {
          type: 'table',
          headers: ['ON DELETE', '挙動', '向いている場面'],
          rows: [
            ['RESTRICT / NO ACTION(既定)', '子レコードが残っている限り親を削除できない', '在庫・注文など、消えると困る参照'],
            ['CASCADE', '親の削除と同時に子も自動で削除する', '注文とその明細行(order_items)のような強い所有関係'],
            ['SET NULL', '親の削除時、子の外部キー列をNULLにする', '任意の紐付け(担当者が退職しても記録は残したい等)'],
          ],
        },
        {
          type: 'code',
          language: 'sql',
          code: `CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);`,
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'CASCADEの乱用に注意',
          html: 'CASCADEを安易に使うと、意図せず大量の関連レコードが連鎖削除されることがあります。「本当に親と運命を共にすべきデータか」を都度考えてください。',
        },
      ],
    },
    {
      id: 'app-vs-db',
      title: 'アプリケーション側のバリデーションとの役割分担',
      icon: 'Split',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'アプリケーション側で担う',
              accent: 'sky',
              points: [
                'ユーザーへの分かりやすいエラーメッセージ表示',
                '複雑なビジネスルール(在庫と割引の組み合わせ判定など)',
                '入力途中のリアルタイムなフィードバック',
              ],
            },
            {
              title: 'DB制約で担う',
              accent: 'emerald',
              points: [
                'どの経路(バッチ処理・別マイクロサービス・手動SQL)から書き込まれても守られるべき不変条件',
                '参照整合性(親のいない子レコードを作らせない)',
                '最終防衛ライン。アプリのバグがあっても壊れたデータを許さない',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '両方書くのが基本',
          html: 'アプリ側バリデーションとDB制約は「どちらか」ではなく「両方」です。アプリ側はUXのため、DB制約は最終防衛ラインのためと役割が異なります。',
        },
      ],
    },
  ],
  checkpoints: [
    'PRIMARY KEYとUNIQUEの違いを説明できる',
    'ON DELETE CASCADE / RESTRICT / SET NULLの挙動の違いを具体例で説明できる',
    'なぜアプリ側バリデーションだけでは不十分で、DB制約が必要なのかを説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Constraints', url: 'https://www.postgresql.org/docs/current/ddl-constraints.html' },
  ],
};

export default config;
