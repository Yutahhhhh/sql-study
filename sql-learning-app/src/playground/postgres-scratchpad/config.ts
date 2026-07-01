import type { PlaygroundConfig } from '../../types/playground';

const config: PlaygroundConfig = {
  slug: 'postgres-scratchpad',
  title: 'PostgreSQL 自由演習',
  description: 'ショップスキーマ(customers / products / orders / order_items)が投入済みのPostgreSQL環境です。',
  headerLabel: 'PostgreSQL Playground',
  icon: 'TerminalSquare',
  color: 'sky',
  dialect: 'postgres',
  seed: {
    ddl: [
      `CREATE TABLE customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        status TEXT NOT NULL DEFAULT 'pending',
        ordered_at TIMESTAMP NOT NULL DEFAULT now()
      )`,
      `CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(10,2) NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO customers (name, email) VALUES
        ('佐藤 翼', 'tsubasa@example.com'),
        ('鈴木 蓮', 'ren@example.com'),
        ('高橋 陽菜', 'hina@example.com')`,
      `INSERT INTO products (name, price, stock) VALUES
        ('メカニカルキーボード', 12800.00, 25),
        ('トラックボールマウス', 6400.00, 40),
        ('4Kモニター', 32000.00, 10)`,
      `INSERT INTO orders (customer_id, status) VALUES (1, 'completed'), (1, 'pending'), (2, 'completed')`,
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
        (1, 1, 1, 12800.00),
        (1, 2, 2, 6400.00),
        (2, 3, 1, 32000.00),
        (3, 2, 1, 6400.00)`,
    ],
  },
  starterQuery: 'SELECT * FROM customers;',
  notes: [
    {
      type: 'paragraph',
      html: '<code>customers</code> / <code>products</code> / <code>orders</code> / <code>order_items</code> の4テーブルが用意されています。自由にDDL/DMLを実行して試してください。',
    },
    {
      type: 'callout',
      variant: 'tip',
      title: 'リセットについて',
      html: '「スキーマを初期状態に戻す」を押すと、全テーブルを破棄してこの初期データに戻せます。',
    },
  ],
};

export default config;
