import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )`,
      `CREATE INDEX idx_users_email ON users (email)`,
    ],
    dml: [
      `WITH RECURSIVE seq(n) AS (
        SELECT 1
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < 3000
      )
      INSERT INTO users (id, name, email)
      SELECT n, 'user-' || n, 'User' || n || '@Example.com'
      FROM seq`,
      `ANALYZE users`,
    ],
  },
};
