export const solutionQueries = {
  shared: `-- 各ユーザーの最初の契約(最小id)だけを残して重複を削除する
DELETE FROM subscriptions
WHERE id NOT IN (
  SELECT MIN(id) FROM subscriptions GROUP BY user_id
);

-- 再発防止: 1ユーザー1契約をDBレベルで保証する
CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions (user_id);

SELECT id, user_id, plan FROM subscriptions ORDER BY id;`,
};
