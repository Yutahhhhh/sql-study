import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        status TEXT NOT NULL,
        ordered_at TEXT NOT NULL
      )`,
    ],
    dml: [
      `WITH RECURSIVE seq(n) AS (
        SELECT 1
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < 3000
      )
      INSERT INTO orders (id, customer_id, status, ordered_at)
      SELECT
        n,
        (n % 300) + 1,
        CASE n % 13 WHEN 0 THEN 'completed' WHEN 1 THEN 'pending' ELSE 'cancelled' END,
        '2026-01-01'
      FROM seq`,
      `ANALYZE orders`,
    ],
  },
};
