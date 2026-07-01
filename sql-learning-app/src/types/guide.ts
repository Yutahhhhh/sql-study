/**
 * ガイド(解説記事)ページの型定義。
 * aws-studyのGuideConfigを踏襲したドメイン非依存のブロック構造。
 */

export type GuideAccent = 'blue' | 'rose' | 'amber' | 'emerald' | 'sky' | 'purple' | 'indigo' | 'slate';

/** 段落 */
export interface GuideParagraphBlock {
  type: 'paragraph';
  html: string;
}

/** 箇条書き */
export interface GuideListBlock {
  type: 'list';
  ordered?: boolean;
  items: string[]; // HTML可
}

/** 注記(コールアウト) */
export interface GuideCalloutBlock {
  type: 'callout';
  variant: 'info' | 'tip' | 'warn' | 'danger';
  title?: string;
  html: string;
}

/** 比較表 */
export interface GuideTableBlock {
  type: 'table';
  headers: string[];
  rows: string[][]; // HTML可
  caption?: string;
}

/** 横並びのフロー図(箱→箱→箱) */
export interface GuideFlowBlock {
  type: 'flow';
  title?: string;
  steps: { label: string; sublabel?: string; accent?: GuideAccent }[];
}

/** 左右(または複数列)の比較カード */
export interface GuideCompareBlock {
  type: 'compare';
  columns: {
    title: string;
    subtitle?: string;
    accent?: GuideAccent;
    points: string[]; // HTML可
  }[];
}

/** 縦に積むステップ/決定リスト(番号付きの図解) */
export interface GuideStepsBlock {
  type: 'steps';
  steps: { title: string; html?: string; accent?: GuideAccent }[];
}

/** コード/SQL例 */
export interface GuideCodeBlock {
  type: 'code';
  code: string;
  language?: 'sql' | 'text';
  caption?: string;
}

export type GuideBlock =
  | GuideParagraphBlock
  | GuideListBlock
  | GuideCalloutBlock
  | GuideTableBlock
  | GuideFlowBlock
  | GuideCompareBlock
  | GuideStepsBlock
  | GuideCodeBlock;

/** 1つのセクション(見出し + ブロック群) */
export interface GuideSection {
  id: string;
  title: string;
  icon?: string; // Lucideアイコン名
  blocks: GuideBlock[];
}

/** 参考リンク */
export interface GuideReference {
  label: string;
  url: string;
}

/** 1つのガイド記事の全設定 */
export interface GuideConfig {
  slug: string;
  title: string;
  description: string;
  headerLabel: string;
  homeIcon: string;
  homeColor: string;
  /** 導入文(HTML可) */
  intro?: string;
  sections: GuideSection[];
  /** 理解チェック */
  checkpoints?: string[];
  /** 公式ドキュメント等 */
  references?: GuideReference[];
}

export interface GuideManifest {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
  path: string;
}
