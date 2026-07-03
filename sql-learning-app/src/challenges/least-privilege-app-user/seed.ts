import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  postgres: {
    ddl: [
      // 再挑戦(リセット)時に前回作成したロールを掃除する。
      // テーブルはリセット処理が先に破棄しているため、この時点のロールは削除できる。
      `DROP ROLE IF EXISTS support_readonly`,
      `CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      )`,
      `CREATE TABLE payment_methods (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        card_last4 TEXT NOT NULL
      )`,
      `CREATE TABLE support_notes (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        note TEXT NOT NULL
      )`,
    ],
    dml: [
      `INSERT INTO customers (id, name, email) VALUES
        (1, '佐藤 翼', 'tsubasa@example.com'),
        (2, '鈴木 蓮', 'ren@example.com')`,
      `INSERT INTO payment_methods (id, customer_id, card_last4) VALUES
        (1, 1, '4242'),
        (2, 2, '1881')`,
      `INSERT INTO support_notes (id, customer_id, note) VALUES
        (1, 1, 'ログインできない問い合わせに対応済み'),
        (2, 2, 'プラン変更の相談を受付')`,
    ],
  },
};
