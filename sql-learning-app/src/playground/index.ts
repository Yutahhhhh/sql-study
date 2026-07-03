import type { PlaygroundConfig, PlaygroundManifest } from '../types/playground';

const playgroundLoaders: Record<string, () => Promise<{ default: PlaygroundConfig }>> = {
  'postgres-scratchpad': () => import('./postgres-scratchpad/config'),
  'mysql-scratchpad': () => import('./mysql-scratchpad/config'),
  'permissions-lab': () => import('./permissions-lab/config'),
};

export const playgroundManifest: PlaygroundManifest[] = [
  {
    slug: 'postgres-scratchpad',
    title: 'PostgreSQL 自由演習',
    description: 'ショップスキーマが投入済みのPostgreSQL(PGlite)環境で自由にSQLを試す',
    icon: 'TerminalSquare',
    color: 'sky',
    path: '/playground/postgres-scratchpad',
    dialect: 'postgres',
  },
  {
    slug: 'mysql-scratchpad',
    title: 'MySQL 自由演習',
    description: 'ショップスキーマが投入済みのMySQL風(SQLiteエミュレーション)環境で自由にSQLを試す',
    icon: 'TerminalSquare',
    color: 'orange',
    path: '/playground/mysql-scratchpad',
    dialect: 'mysql',
  },
  {
    slug: 'permissions-lab',
    title: '権限ラボ (ロールとGRANT)',
    description: '本物のPostgreSQL上でCREATE ROLE / GRANT / SET ROLE / RLSを自由に試す',
    icon: 'KeyRound',
    color: 'purple',
    path: '/playground/permissions-lab',
    dialect: 'postgres',
  },
];

export async function loadPlaygroundConfig(slug: string): Promise<PlaygroundConfig> {
  const loader = playgroundLoaders[slug];
  if (!loader) throw new Error(`Unknown playground: ${slug}`);
  const module = await loader();
  return module.default;
}
