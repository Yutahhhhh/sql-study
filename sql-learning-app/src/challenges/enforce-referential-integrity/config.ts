import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'enforce-referential-integrity',
  title: '在庫テーブルに制約を追加する',
  description: 'NOT NULL・UNIQUE・CHECK・外部キーで在庫データの不整合を防ぐ',
  headerLabel: '制約周り',
  badge: '制約周り',
  icon: 'ShieldCheck',
  color: 'emerald',
  topic: 'constraints',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    '既存の warehouses テーブル(倉庫マスタ)に対して、在庫を管理する products_inventory テーブルを新規に設計します。過去にアプリ側のバリデーション漏れで「存在しない倉庫IDが登録される」「価格や在庫数がマイナスになる」といった不整合が起きたことがあるため、DB側の制約で確実に防いでください。',
  requirements: [
    { id: 'req-sku', title: 'sku列', description: 'NOT NULL かつ UNIQUE な商品コード列' },
    { id: 'req-price', title: 'price列', description: 'NOT NULL、CHECK制約で0以上のみ許可' },
    { id: 'req-stock', title: 'stock列', description: 'NOT NULL、CHECK制約で0以上のみ許可' },
    { id: 'req-warehouse', title: 'warehouse_id列', description: 'NOT NULL、warehouses.idへの外部キー' },
  ],
  seed,
  checks: [
    { id: 'chk-table', type: 'table-exists', tableName: 'products_inventory', label: 'products_inventoryテーブルの存在', failureMessage: 'products_inventoryテーブルが見つかりません。' },
    { id: 'chk-sku-notnull', type: 'column-exists', tableName: 'products_inventory', columnName: 'sku', notNull: true, label: 'sku列(NOT NULL)', failureMessage: 'sku列がNOT NULLになっていません。' },
    { id: 'chk-sku-unique', type: 'constraint-exists', tableName: 'products_inventory', constraintType: 'unique', columns: ['sku'], label: 'skuのUNIQUE制約', failureMessage: 'skuにUNIQUE制約がありません。' },
    { id: 'chk-price-notnull', type: 'column-exists', tableName: 'products_inventory', columnName: 'price', notNull: true, label: 'price列(NOT NULL)', failureMessage: 'price列がNOT NULLになっていません。' },
    { id: 'chk-price-check', type: 'constraint-exists', tableName: 'products_inventory', constraintType: 'check', columns: ['price'], label: 'priceのCHECK制約', failureMessage: 'priceに0以上を強制するCHECK制約がありません。' },
    { id: 'chk-stock-notnull', type: 'column-exists', tableName: 'products_inventory', columnName: 'stock', notNull: true, label: 'stock列(NOT NULL)', failureMessage: 'stock列がNOT NULLになっていません。' },
    { id: 'chk-stock-check', type: 'constraint-exists', tableName: 'products_inventory', constraintType: 'check', columns: ['stock'], label: 'stockのCHECK制約', failureMessage: 'stockに0以上を強制するCHECK制約がありません。' },
    { id: 'chk-warehouse-notnull', type: 'column-exists', tableName: 'products_inventory', columnName: 'warehouse_id', notNull: true, label: 'warehouse_id列(NOT NULL)', failureMessage: 'warehouse_id列がNOT NULLになっていません。' },
    { id: 'chk-warehouse-fk', type: 'constraint-exists', tableName: 'products_inventory', constraintType: 'foreign-key', columns: ['warehouse_id'], referencedTable: 'warehouses', label: 'warehouse_idの外部キー', failureMessage: 'warehouse_idからwarehouses.idへの外部キーがありません。' },
  ],
  actions: [
    {
      id: 'act-sku',
      title: 'skuを一意にする',
      description: 'sku列がNOT NULLかつUNIQUEか確認します。',
      checkIds: ['chk-table', 'chk-sku-notnull', 'chk-sku-unique'],
      successMessage: 'skuの制約は満たされています。',
      failureMessage: 'skuの制約が未達成です。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-price',
      title: '価格がマイナスにならないようにする',
      description: 'price列のNOT NULLとCHECK制約を確認します。',
      checkIds: ['chk-price-notnull', 'chk-price-check'],
      successMessage: 'priceの制約は満たされています。',
      failureMessage: 'priceの制約が未達成です。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-stock',
      title: '在庫数がマイナスにならないようにする',
      description: 'stock列のNOT NULLとCHECK制約を確認します。',
      checkIds: ['chk-stock-notnull', 'chk-stock-check'],
      successMessage: 'stockの制約は満たされています。',
      failureMessage: 'stockの制約が未達成です。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-warehouse',
      title: '存在しない倉庫を参照できないようにする',
      description: 'warehouse_idのNOT NULLと外部キーを確認します。',
      checkIds: ['chk-warehouse-notnull', 'chk-warehouse-fk'],
      successMessage: 'warehouse_idの制約は満たされています。',
      failureMessage: 'warehouse_idの制約が未達成です。',
      evaluatesAgainst: 'schema-state',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'CHECK制約で境界値を防ぐ',
      blocks: [
        { type: 'paragraph', html: '<code>CHECK (price &gt;= 0)</code> のように書くことで、アプリ側のバグでマイナスの値が送られてきてもDBレベルで拒否できます。' },
      ],
    },
    {
      id: 'step-2',
      title: '外部キーで存在しない倉庫IDを防ぐ',
      blocks: [
        { type: 'paragraph', html: '<code>warehouse_id INTEGER NOT NULL REFERENCES warehouses(id)</code> により、warehousesに存在しないIDをINSERT/UPDATEしようとするとエラーになります。' },
      ],
    },
    { id: 'step-3', title: '完成形(PostgreSQL)', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.postgres }] },
  ],
};

export default config;
