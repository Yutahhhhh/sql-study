import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'normalize-customer-orders',
  title: '顧客・注文テーブルの正規化',
  description: '1枚の非正規化テーブルを3NFまで分解し、外部キーで関連付ける',
  headerLabel: 'DB設計',
  badge: 'DB設計',
  icon: 'Database',
  color: 'sky',
  topic: 'db-design',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    '既存の `orders_flat` テーブルは、注文・顧客・商品の情報が1行にすべて詰め込まれた非正規化テーブルです。同じ顧客のメールアドレスが複数行に重複するなど更新異常の原因になっています。このテーブルを見て、customers / products / orders / order_items の4テーブルに正規化してください(データの移行は不要です。スキーマ定義のみで採点します)。',
  requirements: [
    {
      id: 'req-customers',
      title: 'customersテーブル',
      description: 'id(主キー), name, email(NOT NULL・UNIQUE)を持つ',
    },
    {
      id: 'req-products',
      title: 'productsテーブル',
      description: 'id(主キー), name, priceを持つ',
    },
    {
      id: 'req-orders',
      title: 'ordersテーブル',
      description: 'id(主キー), customer_id(customers.idへの外部キー)を持つ',
    },
    {
      id: 'req-order-items',
      title: 'order_itemsテーブル',
      description: 'id(主キー), order_id(orders.idへの外部キー), product_id(products.idへの外部キー), quantityを持つ',
    },
  ],
  seed,
  checks: [
    { id: 'chk-customers-exists', type: 'table-exists', tableName: 'customers', label: 'customersテーブルの存在', failureMessage: 'customersテーブルが見つかりません。' },
    { id: 'chk-customers-email', type: 'column-exists', tableName: 'customers', columnName: 'email', label: 'customers.email列の存在', failureMessage: 'customers.email列が見つかりません。' },
    { id: 'chk-customers-email-unique', type: 'constraint-exists', tableName: 'customers', constraintType: 'unique', columns: ['email'], label: 'customers.emailのUNIQUE制約', failureMessage: 'customers.emailにUNIQUE制約がありません。' },
    { id: 'chk-products-exists', type: 'table-exists', tableName: 'products', label: 'productsテーブルの存在', failureMessage: 'productsテーブルが見つかりません。' },
    { id: 'chk-products-price', type: 'column-exists', tableName: 'products', columnName: 'price', label: 'products.price列の存在', failureMessage: 'products.price列が見つかりません。' },
    { id: 'chk-orders-exists', type: 'table-exists', tableName: 'orders', label: 'ordersテーブルの存在', failureMessage: 'ordersテーブルが見つかりません。' },
    { id: 'chk-orders-fk-customer', type: 'constraint-exists', tableName: 'orders', constraintType: 'foreign-key', columns: ['customer_id'], referencedTable: 'customers', label: 'orders.customer_idの外部キー', failureMessage: 'orders.customer_idからcustomers.idへの外部キーが見つかりません。' },
    { id: 'chk-order-items-exists', type: 'table-exists', tableName: 'order_items', label: 'order_itemsテーブルの存在', failureMessage: 'order_itemsテーブルが見つかりません。' },
    { id: 'chk-order-items-fk-order', type: 'constraint-exists', tableName: 'order_items', constraintType: 'foreign-key', columns: ['order_id'], referencedTable: 'orders', label: 'order_items.order_idの外部キー', failureMessage: 'order_items.order_idからorders.idへの外部キーが見つかりません。' },
    { id: 'chk-order-items-fk-product', type: 'constraint-exists', tableName: 'order_items', constraintType: 'foreign-key', columns: ['product_id'], referencedTable: 'products', label: 'order_items.product_idの外部キー', failureMessage: 'order_items.product_idからproducts.idへの外部キーが見つかりません。' },
  ],
  actions: [
    {
      id: 'act-customers',
      title: 'customersテーブルを設計する',
      description: '主キー・email列・UNIQUE制約を確認します。',
      checkIds: ['chk-customers-exists', 'chk-customers-email', 'chk-customers-email-unique'],
      successMessage: 'customersテーブルは要件を満たしています。',
      failureMessage: 'customersテーブルの定義を見直してください。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-products',
      title: 'productsテーブルを設計する',
      description: '主キー・price列を確認します。',
      checkIds: ['chk-products-exists', 'chk-products-price'],
      successMessage: 'productsテーブルは要件を満たしています。',
      failureMessage: 'productsテーブルの定義を見直してください。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-orders',
      title: 'ordersテーブルを設計する',
      description: 'customersへの外部キーを確認します。',
      checkIds: ['chk-orders-exists', 'chk-orders-fk-customer'],
      successMessage: 'ordersテーブルは要件を満たしています。',
      failureMessage: 'ordersテーブルの定義を見直してください。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-order-items',
      title: 'order_itemsテーブルを設計する',
      description: 'ordersとproductsへの外部キーを確認します。',
      checkIds: ['chk-order-items-exists', 'chk-order-items-fk-order', 'chk-order-items-fk-product'],
      successMessage: 'order_itemsテーブルは要件を満たしています。',
      failureMessage: 'order_itemsテーブルの定義を見直してください。',
      evaluatesAgainst: 'schema-state',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: '重複の原因を特定する',
      blocks: [
        {
          type: 'paragraph',
          html: 'orders_flatでは customer_name / customer_email が注文のたびに重複しています。これは顧客情報が注文に従属してしまっているためです。',
        },
      ],
    },
    {
      id: 'step-2',
      title: 'customers / products を切り出す',
      blocks: [
        { type: 'code', language: 'sql', code: solutionQueries.postgres.split('\n\n')[0] + '\n\n' + solutionQueries.postgres.split('\n\n')[1] },
      ],
    },
    {
      id: 'step-3',
      title: 'orders / order_items で関連付ける',
      blocks: [
        {
          type: 'paragraph',
          html: 'order_id, product_id をそれぞれ外部キーとして持たせることで、1つの注文が複数商品を持てるようになります(1NFの解消)。',
        },
      ],
    },
  ],
};

export default config;
