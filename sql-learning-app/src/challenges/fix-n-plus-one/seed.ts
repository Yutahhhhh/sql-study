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
        (1, 1, 3000),
        (2, 1, 1500),
        (3, 1, 800),
        (4, 2, 5200),
        (5, 4, 2100),
        (6, 4, 900)`,
    ],
  },
};
