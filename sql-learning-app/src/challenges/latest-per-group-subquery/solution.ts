export const solutionQueries = {
  shared: `SELECT o.id, o.customer_id, o.ordered_at, o.amount
FROM orders o
WHERE o.ordered_at = (
  SELECT MAX(o2.ordered_at) FROM orders o2 WHERE o2.customer_id = o.customer_id
)
ORDER BY o.customer_id;`,
};
