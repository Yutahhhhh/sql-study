export const solutionQueries = {
  shared: `-- 手順1: 同じ構造の空のアーカイブテーブルを作る
CREATE TABLE notifications_archive AS
SELECT * FROM notifications WHERE 1 = 0;

-- 手順2: 対象(既読 かつ 2026-04-01より古い)をコピーする
INSERT INTO notifications_archive
SELECT * FROM notifications
WHERE is_read = 1 AND created_at < '2026-04-01';

-- 手順3: コピーが終わってから元テーブルを削除する
DELETE FROM notifications
WHERE is_read = 1 AND created_at < '2026-04-01';

-- 確認: 現役7件 / アーカイブ5件
SELECT
  (SELECT COUNT(*) FROM notifications) AS active_count,
  (SELECT COUNT(*) FROM notifications_archive) AS archived_count;`,
};
