export const solutionQueries = {
  postgres: `-- 再発防止: 在庫がマイナスになれない制約を張る
ALTER TABLE products
  ADD CONSTRAINT chk_products_stock_non_negative CHECK (stock >= 0);

-- 購入1: Tシャツを3枚 (在庫10 → 7)
UPDATE products SET stock = stock - 3 WHERE id = 2 AND stock >= 3;

-- 購入2: スニーカーを2足 (在庫1しかないので引き当てない → 0行更新)
UPDATE products SET stock = stock - 2 WHERE id = 1 AND stock >= 2;

SELECT id, name, stock FROM products ORDER BY id;`,
};
