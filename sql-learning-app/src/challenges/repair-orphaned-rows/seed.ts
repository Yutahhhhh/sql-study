import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  postgres: {
    ddl: [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )`,
      `CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        total INTEGER NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO users (id, name) VALUES
        (1, '佐藤 翼'),
        (3, '高橋 陽菜'),
        (5, '伊藤 咲')`,
      `INSERT INTO orders (id, user_id, total) VALUES
        (1, 1, 3000),
        (2, 2, 1500),
        (3, 3, 5200),
        (4, 4, 800),
        (5, 5, 2100),
        (6, 2, 4300),
        (7, 1, 900)`,
    ],
  },
};
