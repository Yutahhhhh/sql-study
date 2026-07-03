import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  postgres: {
    ddl: [
      `CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_name TEXT NOT NULL
      )`,
      `CREATE TABLE order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO orders (id, customer_name) VALUES
        (1, '佐藤 翼'),
        (2, '鈴木 蓮'),
        (3, '高橋 陽菜'),
        (4, '田中 大輝'),
        (5, '伊藤 咲')`,
      `INSERT INTO order_items (id, order_id, quantity, unit_price) VALUES
        (1, 1, 2, 1200),
        (2, 1, 1, 800),
        (3, 2, 3, 500),
        (4, 3, 1, 9800),
        (5, 4, 2, 1200)`,
    ],
  },
};
