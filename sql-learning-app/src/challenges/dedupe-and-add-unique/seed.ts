import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE subscriptions (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        plan TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO subscriptions (id, user_id, plan, created_at) VALUES
        (1, 1, 'pro',  '2026-06-01 10:00:00'),
        (2, 1, 'pro',  '2026-06-01 10:00:01'),
        (3, 2, 'free', '2026-06-02 09:30:00'),
        (4, 3, 'pro',  '2026-06-03 12:00:00'),
        (5, 3, 'pro',  '2026-06-03 12:00:00'),
        (6, 3, 'pro',  '2026-06-03 12:00:02'),
        (7, 4, 'free', '2026-06-04 08:15:00'),
        (8, 5, 'pro',  '2026-06-05 20:45:00')`,
    ],
  },
};
