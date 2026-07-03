export const solutionQueries = {
  postgres: `INSERT INTO user_settings (user_id, key, value)
VALUES
  (1, 'theme', 'dark'),
  (3, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value, updated_at = now();

SELECT user_id, key, value
FROM user_settings
ORDER BY user_id, key;`,
};
