import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE notifications (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO notifications (id, user_id, message, is_read, created_at) VALUES
        (1, 1, 'ようこそ！', 1, '2026-01-05 09:00:00'),
        (2, 2, 'プロフィールを設定しましょう', 1, '2026-01-20 12:00:00'),
        (3, 1, '新機能のお知らせ', 1, '2026-02-10 18:30:00'),
        (4, 3, 'メンテナンスのお知らせ', 1, '2026-02-28 22:00:00'),
        (5, 2, 'キャンペーン開始', 1, '2026-03-15 10:00:00'),
        (6, 4, '支払い方法を確認してください', 0, '2026-03-20 08:00:00'),
        (7, 1, '利用規約の改定', 0, '2026-03-30 17:00:00'),
        (8, 2, '新しいログインがありました', 1, '2026-04-02 07:45:00'),
        (9, 3, 'コメントが付きました', 0, '2026-05-11 14:20:00'),
        (10, 4, 'フォローされました', 1, '2026-06-01 19:00:00'),
        (11, 1, 'いいねされました', 0, '2026-06-20 21:10:00'),
        (12, 5, '週間サマリー', 0, '2026-06-29 06:00:00')`,
    ],
  },
};
