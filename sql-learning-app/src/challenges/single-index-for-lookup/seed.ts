import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE events (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
    dml: [
      `WITH RECURSIVE seq(n) AS (
        SELECT 1
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < 3000
      )
      INSERT INTO events (id, user_id, event_type, created_at)
      SELECT n, (n % 500) + 1, CASE WHEN n % 7 = 0 THEN 'purchase' ELSE 'view' END, '2026-01-01'
      FROM seq`,
      `ANALYZE events`,
    ],
  },
};
