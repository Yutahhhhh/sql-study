import type { PlaygroundConfig } from '../../types/playground';

const config: PlaygroundConfig = {
  slug: 'permissions-lab',
  title: '権限ラボ (ロールとGRANT)',
  description: '本物のPostgreSQL上でCREATE ROLE / GRANT / SET ROLE / RLSを自由に試せる権限演習環境です。',
  headerLabel: 'Permissions Lab',
  icon: 'KeyRound',
  color: 'purple',
  dialect: 'postgres',
  seed: {
    ddl: [
      // 再挑戦(リセット)時に、前回の実験で作られがちなロールを掃除する
      `DROP ROLE IF EXISTS readonly`,
      `DROP ROLE IF EXISTS app_readwrite`,
      `DROP ROLE IF EXISTS analyst`,
      `CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE
      )`,
      `CREATE TABLE payment_methods (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        card_last4 TEXT NOT NULL
      )`,
      `CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        tenant_id INTEGER NOT NULL DEFAULT 1,
        total INTEGER NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO customers (name, email) VALUES
        ('佐藤 翼', 'tsubasa@example.com'),
        ('鈴木 蓮', 'ren@example.com'),
        ('高橋 陽菜', 'hina@example.com')`,
      `INSERT INTO payment_methods (customer_id, card_last4) VALUES (1, '4242'), (2, '1881')`,
      `INSERT INTO orders (customer_id, tenant_id, total) VALUES
        (1, 1, 3000), (2, 1, 1500), (3, 2, 5200), (1, 2, 800)`,
    ],
  },
  starterQuery: `-- 1. 読み取り専用ロールを作って権限を試す
CREATE ROLE readonly;
GRANT SELECT ON customers, orders TO readonly;

-- 2. そのロールに成り代わって動作確認
SET ROLE readonly;
SELECT * FROM customers;            -- 読める
-- SELECT * FROM payment_methods;   -- permission denied になるはず
-- DELETE FROM customers;           -- これも拒否されるはず
RESET ROLE;

-- 3. 付与状況の確認
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'readonly'
ORDER BY table_name;`,
  notes: [
    {
      type: 'paragraph',
      html: '<code>customers</code>(通常データ) / <code>payment_methods</code>(機微データ) / <code>orders</code>(tenant_id付き) の3テーブルが用意されています。ここは本物のPostgreSQL(PGlite)なので、<strong>CREATE ROLE / GRANT / REVOKE / SET ROLE / RLS</strong> がすべて実際に動きます。',
    },
    {
      type: 'list',
      items: [
        '<code>SET ROLE ロール名;</code> でそのロールの権限に成り代わり、<code>RESET ROLE;</code> で戻れます',
        '列単位のGRANTも試せます: <code>GRANT SELECT (id, name) ON customers TO readonly;</code>',
        'RLSの実験: <code>ALTER TABLE orders ENABLE ROW LEVEL SECURITY;</code> → <code>CREATE POLICY ...</code>(ガイド「ユーザー権限とロール設計」参照)',
      ],
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'リセットについて',
      html: '「スキーマを初期状態に戻す」でテーブルと初期データが復元され、readonly / app_readwrite / analyst という名前のロールは自動で掃除されます。別名のロールを作った場合は <code>DROP ROLE 名前;</code> で自分で削除してください。',
    },
  ],
};

export default config;
