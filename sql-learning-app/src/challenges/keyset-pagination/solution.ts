export const solutionQueries = {
  shared: `CREATE INDEX idx_articles_published_at_id ON articles (published_at, id);

SELECT id, title, published_at
FROM articles
WHERE (published_at, id) < (1700017940, 2996)
ORDER BY published_at DESC, id DESC
LIMIT 5;`,
};
