import type { PlaygroundConfig } from '../../types/playground';

const config: PlaygroundConfig = {
  slug: 'mysql-scratchpad',
  title: 'MySQL 自由演習',
  description: 'ショップスキーマ(customers / products / orders / order_items)が投入済みのMySQL風(SQLiteエミュレーション)環境です。',
  headerLabel: 'MySQL Playground',
  icon: 'TerminalSquare',
  color: 'orange',
  dialect: 'mysql',
  seed: {
    ddl: [
      `CREATE TABLE customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        ordered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id)
      )`,
      `CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
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
      variant: 'warn',
      title: 'MySQL構文エミュレーションについて',
      html: 'このトラックは内部的にSQLiteエンジンで動いています。<code>ON DUPLICATE KEY UPDATE</code> 等の一部MySQL固有構文は非対応です。',
    },
  ],
};

export default config;
