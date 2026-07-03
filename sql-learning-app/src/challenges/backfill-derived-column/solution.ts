export const solutionQueries = {
  postgres: `-- 手順1: まずNULL許容のまま列を追加する(既存行の書き換えが発生せず一瞬で終わる)
ALTER TABLE orders ADD COLUMN total_amount INTEGER;

-- 手順2: 既存データから値を埋める(バックフィル)
UPDATE orders o
SET total_amount = COALESCE((
  SELECT SUM(oi.quantity * oi.unit_price)
  FROM order_items oi
  WHERE oi.order_id = o.id
), 0);

-- 手順3: 全行が埋まってからNOT NULL化し、新規行にはDEFAULTを与える
ALTER TABLE orders ALTER COLUMN total_amount SET NOT NULL;
ALTER TABLE orders ALTER COLUMN total_amount SET DEFAULT 0;

SELECT id, customer_name, total_amount FROM orders ORDER BY id;`,
};
