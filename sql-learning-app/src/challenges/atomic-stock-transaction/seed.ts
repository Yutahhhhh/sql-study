import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  postgres: {
    ddl: [
      `CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        stock INTEGER NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO products (id, name, stock) VALUES
        (1, '限定スニーカー', 1),
        (2, 'ベーシックTシャツ', 10),
        (3, 'ロゴキャップ', 0)`,
    ],
  },
};
