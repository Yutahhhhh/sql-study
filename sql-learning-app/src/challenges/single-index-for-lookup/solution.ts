export const solutionQueries = {
  shared: `CREATE INDEX idx_events_user_id ON events (user_id);

SELECT * FROM events WHERE user_id = 42;`,
};
