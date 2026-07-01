# SQL Learning Platform - プロジェクト指示

## プロジェクト概要

中級者以上向けのSQL学習プラットフォーム。DB設計・インデックス・パフォーマンス・制約・複雑なクエリをテーマ別に学ぶ。ブラウザ上で実際にテーブル作成・クエリ実行ができる演習(チャレンジ)と、採点なしの自由演習(プレイグラウンド)を備える。

## 技術スタック

- React 19 + TypeScript 6 + Vite 8
- TailwindCSS 4(PostCSS経由)
- React Router DOM 7
- lucide-react(アイコン)
- ダークテーマ固定(slate-950ベース)
- **PostgreSQL**: `@electric-sql/pglite`(本物のPostgreSQLをWASM化したもの、ブラウザ内で完結)
- **MySQL**: `sql.js`(SQLite WASM)を実行基盤とし、`src/engines/mysqlAdapter.ts` で構文を変換する自作エミュレーション
- `@uiw/react-codemirror` + `@codemirror/lang-sql`(SQLエディタ、スキーマ連動オートコンプリート)
- `node-sql-parser`(クエリのAST解析。JOIN/サブクエリ/CTE/ウィンドウ関数などの使用判定)

## アーキテクチャの原則

### データ駆動

全てのページはデータ(GuideConfig / ChallengeConfig / PlaygroundConfig)によって描画される。コンポーネント側にコンテンツ固有のテキストやロジックを持たせない。

### SqlEngineインターフェースによる抽象化

PostgreSQLとMySQL(SQLiteエミュレーション)は `src/types/engine.ts` の `SqlEngine` インターフェース(`init/reset/exec/explain/introspectSchema/dispose`)を通して同じ形で扱う。個別実装は `src/engines/postgresEngine.ts` / `src/engines/mysqlEngine.ts`。UIコンポーネントは常にこのインターフェース越しにエンジンを操作し、ダイアレクト固有の分岐を持たない。

### 採点ロジックの一元化

チャレンジの採点は `src/validators/challengeValidator.ts` の `runChallenge()` が一手に担う。ページ/コンポーネント側は「ユーザーが実行した結果(QueryOutcome・ExplainResult・最新スキーマ)」を渡すだけで、`ChallengeCheck` の判別共用体に従って合否を判定する。新しい判定パターンが必要な場合はこのファイルの `ChallengeCheck` 型とそのevaluateCheckのswitch文を拡張する。

---

## 新しいガイドの追加手順

1. `src/guides/{slug}/config.ts` を作成し、`GuideConfig` を1つdefault exportする(`intro` + `sections`(各セクションは `GuideBlock` の配列) + 任意で `checkpoints`/`references`)。`GuideBlock` は paragraph/list/callout/table/flow/compare/steps/code の8種類(`src/types/guide.ts`)。
2. `src/guides/index.ts` の `guideLoaders` に動的importを追加し、`guideManifest` にHome表示用のエントリを追加する。
3. これだけで `/guides/{slug}` が自動的に動作する。コンポーネントの変更は不要。

## 新しいチャレンジ(演習)の追加手順

チャレンジは1ディレクトリに3ファイルで構成する(可読性のため役割を分離):

```
src/challenges/{slug}/
  seed.ts       ← ChallengeSeed(shared/postgres/mysql別のDDL/DML)
  solution.ts   ← 正解クエリ(shared、または postgres/mysql 別)。「解答例をエディタに読み込む」ボタンで使われる
  config.ts     ← ChallengeConfig本体。seed/solutionQueriesをimportして集約
```

### 1. `seed.ts`

`ChallengeSeed` を作成する。`shared` に両ダイアレクト共通のDDL/DMLを書き、構文差分(SERIAL vs AUTO_INCREMENTなど)がある場合のみ `postgres`/`mysql` に追記する。MySQL側はSQLiteエミュレーションのため、`src/engines/mysqlAdapter.ts` が変換できる構文かを意識する(バッククォート・AUTO_INCREMENT・SHOW/DESCRIBE系は変換されるが、`ON DUPLICATE KEY UPDATE` 等は非対応)。

### 2. `solution.ts`

`solutionQueries: { shared?, postgres?, mysql? }` をexportする。

### 3. `config.ts`

`ChallengeConfig` を組み立てる。特に `checks` と `actions` が採点ロジックの核。

- `checks`: `ChallengeCheck`(判別共用体、`src/types/challenge.ts`)の配列。`table-exists` / `column-exists`(`notNull`オプションあり) / `constraint-exists` / `index-exists`(複合インデックスは列順序を厳密比較) / `query-result-matches` / `row-count-equals` / `query-uses-construct`(subquery/cte/join/window-function等) / `query-uses-index` / `query-avoids-seq-scan` が使える。
- `actions`: `checkIds` でchecksをグループ化し、`evaluatesAgainst: 'schema-state' | 'submitted-query'` で「スキーマ変更系(CREATE INDEX等)」か「クエリ提出系(SELECT等)」かを区別する。ユーザーが「実行」ボタンを押すたびに、その時点のSQL文とその結果(スキーマ・クエリ結果・EXPLAIN)に対して**全アクション**が再評価される。

`query-result-matches` の `expected` は、コンテンツ作成時に正解クエリを実際に実行して得た結果をそのまま埋め込む(実行時にリファレンスエンジンを走らせて比較する方式は取っていない)。列名の一致は見ず、行の値のみを列挙順・行順(`orderSensitive`)で比較する。

`src/challenges/index.ts` の `challengeLoaders`/`challengeManifest` に登録する。

## 新しいプレイグラウンド(自由演習)の追加手順

`src/playground/{slug}/config.ts` に `PlaygroundConfig`(単一ダイアレクト、`seed` + 任意の `starterQuery`/`notes`)を作成し、`src/playground/index.ts` に登録する。採点ロジックは持たない。

---

## ディレクトリ構造

```
src/
  App.tsx                    ← ルーター(Guide/Challenge/Playgroundページは遅延ロード)
  types/
    engine.ts                 ← SqlDialect, QueryOutcome, ExplainResult, SchemaInfo, SqlEngine
    guide.ts                  ← GuideBlock, GuideConfig, GuideManifest
    challenge.ts               ← ChallengeCheck, ChallengeConfig, ChallengeRunResult
    playground.ts               ← PlaygroundConfig

  engines/
    engineFactory.ts            ← createEngine(dialect) — 動的importで使う方のWASMのみ取得
    postgresEngine.ts             ← PGlite実装
    mysqlEngine.ts                  ← sql.js実装
    mysqlAdapter.ts                   ← MySQL→SQLite構文変換
    sqljsLoader.ts                     ← sql.js WASMの共有ローダー
    sqlStatements.ts                    ← 文字列リテラル対応のステートメント分割
    introspection/{postgres,sqlite}Introspection.ts
    explain/{postgres,sqlite}Explain.ts

  validators/
    challengeValidator.ts        ← evaluateCheck/runChallenge
    queryShapeAnalyzer.ts          ← node-sql-parserでAST解析(失敗時は正規表現フォールバック)
    resultComparer.ts               ← 結果セット比較

  components/
    sql/       SqlEditor, ResultsTable, SchemaViewer, EngineStatusBadge, ExplainPanel
    challenge/ ChallengeWorkspace, RequirementsList, ActionResultPanel, AnswerTrace
    playground/PlaygroundWorkspace
    guide/     GuideArticle, GuideBlockList

  hooks/
    useSqlEngine.ts       ← エンジンのinit/dispose(アンマウント時に必ずdispose)
    useDraftQuery.ts        ← localStorageへのクエリ下書き保存
    use{Guide,Challenge,Playground}Loader.ts

  guides/{slug}/config.ts
  challenges/{slug}/{seed,solution,config}.ts
  playground/{slug}/config.ts

  pages/  Home, GuidePage, ChallengePage, PlaygroundPage
```

## 既知の制約

- MySQLトラックは実際にはSQLiteエンジン上のエミュレーションであり、`ON DUPLICATE KEY UPDATE` 等一部構文は非対応(`EngineStatusBadge` にバナー表示)
- CHECK制約の存在確認はMySQLトラックでは生DDLの正規表現抽出によるため、Postgresトラックほど厳密ではない(列の対応関係までは検証していない)
- node-sql-parserのPostgres方言は新しめの構文で稀にパース失敗することがあり、その場合は正規表現フォールバックで判定する
- v1では `SqlEngine` はメインスレッドで直接実行する(Web Worker隔離は未実装)。プレイグラウンドで極端に重いクエリ(大きな再帰CTE等)を書くとタブが一時的にフリーズしうる
