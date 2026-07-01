import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        ordered_at TEXT NOT NULL,
        amount INTEGER NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO orders (id, customer_id, ordered_at, amount) VALUES
        (1, 1, '2026-01-01', 1000),
        (2, 1, '2026-01-05', 2000),
        (3, 1, '2026-01-03', 1500),
        (4, 2, '2026-02-01', 500),
        (5, 2, '2026-02-10', 900),
        (6, 3, '2026-03-01', 700)`,
    ],
  },
};
