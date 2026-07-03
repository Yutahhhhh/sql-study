import type {
  ChallengeSeedStatements,
  ConstraintInfo,
  ExplainResult,
  QueryOutcome,
  SqlDialect,
} from './engine';
import type { GuideBlock } from './guide';

export interface ChallengeRequirement {
  id: string;
  title: string;
  description: string;
}

/** ダイアレクトごとのシード差分。sharedをベースにdialect別ddl/dmlを追加または上書きする */
export interface ChallengeSeed {
  shared?: ChallengeSeedStatements;
  postgres?: ChallengeSeedStatements;
  mysql?: ChallengeSeedStatements;
}

export type ChallengeCheck =
  | {
      id: string;
      type: 'table-exists';
      tableName: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'column-exists';
      tableName: string;
      columnName: string;
      dataTypeOneOf?: string[];
      /** trueならNOT NULL列であることも要求する(NOT NULLはconstraint-exists型では検出できないため) */
      notNull?: boolean;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'constraint-exists';
      tableName: string;
      constraintType: ConstraintInfo['type'];
      columns: string[];
      referencedTable?: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'index-exists';
      tableName: string;
      /** 複合インデックスはカラム順を厳密比較する */
      columns: string[];
      unique?: boolean;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'query-result-matches';
      expected: { columns: string[]; rows: unknown[][] };
      orderSensitive: boolean;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'row-count-equals';
      expectedCount: number;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'query-uses-construct';
      construct:
        | 'subquery'
        | 'correlated-subquery'
        | 'cte'
        | 'join'
        | 'window-function'
        | 'group-by'
        | 'union'
        | 'exists-clause';
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'query-uses-index';
      expectIndexName?: string;
      label: string;
      failureMessage: string;
    }
  | {
      id: string;
      type: 'query-avoids-seq-scan';
      tableName?: string;
      label: string;
      failureMessage: string;
    };

export interface ChallengeAction {
  id: string;
  title: string;
  description: string;
  checkIds: string[];
  successMessage: string;
  failureMessage: string;
  /** スキーマ変更系アクション（インデックス作成等）かクエリ提出系アクションかを区別する */
  evaluatesAgainst: 'submitted-query' | 'schema-state';
}

export interface ChallengeActionResult {
  actionId: string;
  title: string;
  status: 'success' | 'failure';
  message: string;
  failedChecks: ChallengeCheck[];
}

export interface ChallengeRunResult {
  status: 'success' | 'failure';
  title: string;
  message: string;
  actionResults: ChallengeActionResult[];
  queryOutcome: QueryOutcome | null;
  explain?: ExplainResult;
  highlightedTableNames: string[];
  highlightedColumnNames?: string[];
}

export interface AnswerTraceStep {
  id: string;
  title: string;
  blocks: GuideBlock[];
}

export interface ChallengeConfig {
  slug: string;
  title: string;
  description: string;
  headerLabel: string;
  badge: string;
  icon: string;
  color: string;
  scenario: string;
  topic:
    | 'db-design'
    | 'indexing'
    | 'performance'
    | 'constraints'
    | 'subqueries'
    | 'web-dev'
    | 'release'
    | 'operations'
    | 'incident'
    | 'security';
  difficulty: 'intermediate' | 'advanced';
  dialects: SqlDialect[];
  requirements: ChallengeRequirement[];
  seed: ChallengeSeed;
  checks: ChallengeCheck[];
  actions: ChallengeAction[];
  solutionQueries: { shared?: string; postgres?: string; mysql?: string };
  answerTrace: AnswerTraceStep[];
}

export interface ChallengeManifest {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
  path: string;
  dialects: SqlDialect[];
}
