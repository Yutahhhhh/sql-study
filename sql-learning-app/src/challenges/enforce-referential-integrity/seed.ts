import type { ChallengeSeed } from '../../types/challenge';

export const seed: ChallengeSeed = {
  shared: {
    ddl: [
      `CREATE TABLE warehouses (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL
      )`,
    ],
    dml: [`INSERT INTO warehouses (id, name) VALUES (1, '東京倉庫'), (2, '大阪倉庫')`],
  },
};
