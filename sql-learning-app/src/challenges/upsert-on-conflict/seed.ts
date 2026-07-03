import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  postgres: {
    ddl: [
      `CREATE TABLE user_settings (
        user_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT now(),
        PRIMARY KEY (user_id, key)
      )`,
    ],
    dml: [
      `INSERT INTO user_settings (user_id, key, value) VALUES
        (1, 'theme', 'light'),
        (1, 'locale', 'ja'),
        (2, 'theme', 'light')`,
    ],
  },
};
