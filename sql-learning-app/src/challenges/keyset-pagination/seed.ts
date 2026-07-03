import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE articles (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        published_at INTEGER NOT NULL
      )`,
    ],
    dml: [
      `WITH RECURSIVE seq(n) AS (
        SELECT 1
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < 3000
      )
      INSERT INTO articles (id, title, published_at)
      SELECT n, 'article-' || n, 1700000000 + (n / 10) * 60
      FROM seq`,
      `ANALYZE articles`,
    ],
  },
};
