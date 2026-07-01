export const solutionQueries = {
  shared: `WITH order_stats AS (
  SELECT customer_id, SUM(amount) AS total_amount, COUNT(*) AS order_count
  FROM orders
  GROUP BY customer_id
),
big_spenders AS (
  SELECT customer_id FROM order_stats WHERE total_amount > 10000
),
frequent_customers AS (
  SELECT customer_id FROM order_stats WHERE order_count >= 3
)
SELECT c.id, c.name, 'big_spender' AS reason
FROM big_spenders bs JOIN customers c ON c.id = bs.customer_id
UNION
SELECT c.id, c.name, 'frequent' AS reason
FROM frequent_customers fc JOIN customers c ON c.id = fc.customer_id
ORDER BY id, reason;`,
};
