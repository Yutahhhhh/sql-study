import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )`,
      `CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        amount INTEGER NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO customers (id, name) VALUES
        (1, '佐藤 翼'),
        (2, '鈴木 蓮'),
        (3, '高橋 陽菜'),
        (4, '田中 大輝'),
        (5, '伊藤 咲')`,
      `INSERT INTO orders (id, customer_id, amount) VALUES
        (1, 1, 4000),
        (2, 1, 4000),
        (3, 1, 4500),
        (4, 2, 1000),
        (5, 3, 1500),
        (6, 3, 1500),
        (7, 3, 1500),
        (8, 3, 1500),
        (9, 4, 5000),
        (10, 4, 6500)`,
    ],
  },
};
