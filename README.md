# SQL学習プロジェクト

中級者以上向けのSQL学習プラットフォーム。ブラウザ上で実際にテーブルを作成し、クエリを実行しながら学ぶ。

## 📂 プロジェクト構成

### [SQL学習プラットフォーム](sql-learning-app/)

Reactで構築されたインタラクティブな学習プラットフォーム

- **ガイド**: DB設計・インデックス・パフォーマンス・制約・複雑なクエリを図解で学ぶ
- **演習(チャレンジ)**: 要件を満たすSQLを書き、その場で採点する
- **プレイグラウンド**: 採点なしで自由にテーブル作成・クエリ実行を試せる環境

### 実行エンジン

- **PostgreSQL**: [PGlite](https://pglite.dev/)によるブラウザ内WASM実行。本物のPostgreSQLがそのまま動く。
- **MySQL**: 本物のMySQLをブラウザで動かす実用的な手段が存在しないため、[sql.js](https://sql.js.org/)(SQLite WASM)を実行基盤とし、`src/engines/mysqlAdapter.ts` の自作アダプタでMySQL構文の大部分を吸収している。`ON DUPLICATE KEY UPDATE` など一部のMySQL固有構文は非対応(UI上に明示)。

## 🚀 クイックスタート

### ルートから起動

```bash
npm run install-all
npm run dev
npm run build
npm run preview
```

開発サーバーは `http://localhost:5173/` で起動します。

## 🌐 GitHub Pagesへの自動デプロイ

`main` ブランチへのpushで `.github/workflows/deploy-pages.yml` が自動ビルド・デプロイする。

## 新しいコンテンツの追加方法

`sql-learning-app/CLAUDE.md` を参照。
