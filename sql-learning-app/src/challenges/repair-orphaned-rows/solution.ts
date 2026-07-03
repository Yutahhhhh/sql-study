export const solutionQueries = {
  postgres: `-- 調査: 親を失った注文(孤児行)を特定する
-- SELECT o.* FROM orders o
-- WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id);

-- 修復: 孤児行を削除する
DELETE FROM orders o
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = o.user_id);

-- 再発防止: 外部キーを追加し、注文が残るユーザーの削除を拒否する
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_user_id
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

SELECT id, user_id, total FROM orders ORDER BY id;`,
};
