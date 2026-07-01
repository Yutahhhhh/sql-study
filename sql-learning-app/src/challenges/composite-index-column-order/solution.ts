export const solutionQueries = {
  shared: `CREATE INDEX idx_orders_customer_status ON orders (customer_id, status);

SELECT * FROM orders WHERE customer_id = 7 AND status = 'completed';`,
};
