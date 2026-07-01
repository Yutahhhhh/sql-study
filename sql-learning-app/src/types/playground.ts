import type { ChallengeSeedStatements, SqlDialect } from './engine';
import type { GuideBlock } from './guide';

export interface PlaygroundConfig {
  slug: string;
  title: string;
  description: string;
  headerLabel: string;
  icon: string;
  color: string;
  dialect: SqlDialect;
  seed: ChallengeSeedStatements;
  starterQuery?: string;
  notes?: GuideBlock[];
}

export interface PlaygroundManifest {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
  dialect: SqlDialect;
}
