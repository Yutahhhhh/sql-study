export const solutionQueries = {
  shared: `CREATE INDEX idx_users_email_lower ON users (lower(email));

SELECT id, name FROM users WHERE lower(email) = 'user1234@example.com';`,
};
