import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE orders_flat (
        order_id INTEGER,
        customer_name TEXT,
        customer_email TEXT,
        product_name TEXT,
        product_price NUMERIC,
        quantity INTEGER
      )`,
    ],
    dml: [
      `INSERT INTO orders_flat (order_id, customer_name, customer_email, product_name, product_price, quantity) VALUES
        (1, '佐藤 翼', 'tsubasa@example.com', 'メカニカルキーボード', 12800, 1),
        (2, '佐藤 翼', 'tsubasa@example.com', 'トラックボールマウス', 6400, 2),
        (3, '鈴木 蓮', 'ren@example.com', '4Kモニター', 32000, 1)`,
    ],
  },
};
