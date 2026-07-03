import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'least-privilege-app-user',
  title: '読み取り専用ロールを最小権限で作る',
  description: 'CREATE ROLEとGRANTで、機微テーブルに触れないサポート用の読み取り専用ロールを設計する',
  headerLabel: '権限',
  badge: '権限',
  icon: 'UserCog',
  color: 'sky',
  topic: 'security',
  difficulty: 'intermediate',
  dialects: ['postgres'],
  scenario:
    'カスタマーサポートチームから「問い合わせ対応のために顧客情報を参照したい」という依頼が来ました。現在は全員が管理者アカウントでDBに入っており、監査で「最小権限になっていない」と指摘されています。サポート用のロール support_readonly を作成し、customers と support_notes の SELECT だけを許可してください。カード情報を含む payment_methods には一切の権限を与えてはいけません。最後に information_schema.table_privileges から、このロールに付与された権限一覧(table_name, privilege_type をこの順の列で、table_name, privilege_type 昇順)を取得して確認します。',
  requirements: [
    {
      id: 'req-role',
      title: 'ロールを作成する',
      description: 'CREATE ROLE support_readonly でサポートチーム用のロールを作る',
    },
    {
      id: 'req-grant',
      title: '必要最小限のGRANT',
      description: 'customers と support_notes への SELECT のみを許可する。INSERT/UPDATE/DELETE や payment_methods への権限は付与しない',
    },
    {
      id: 'req-verify',
      title: '付与結果を確認する',
      description: 'SELECT table_name, privilege_type FROM information_schema.table_privileges WHERE grantee = \'support_readonly\' ORDER BY table_name, privilege_type で確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-privileges',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['table_name', 'privilege_type'],
        rows: [
          ['customers', 'SELECT'],
          ['support_notes', 'SELECT'],
        ],
      },
      label: '権限がSELECT×2テーブルだけか',
      failureMessage:
        '付与された権限が期待値と一致しません。customersとsupport_notesのSELECTのみ(計2行)であるべきです。GRANT ALLや payment_methods への付与をしていないか、確認クエリの列と並び順が指定どおりかを確認してください。',
    },
  ],
  actions: [
    {
      id: 'act-grant',
      title: '最小権限のロールを完成させる',
      description: 'ロール作成、GRANT、権限一覧の確認までを実行します。',
      checkIds: ['chk-privileges'],
      successMessage: 'サポートチームは必要なデータだけを読める状態になりました。カード情報には構造的に到達できません。',
      failureMessage: '権限の付与内容がまだ最小権限になっていません。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'ロール=権限の入れ物',
      blocks: [
        {
          type: 'paragraph',
          html: 'PostgreSQLではユーザーもグループも「ロール」です。個人にGRANTを直接付けると退職や異動のたびに棚卸しが必要になるため、目的別のロール(support_readonly, app_writer, analyst など)に権限をまとめ、人やアプリはロールのメンバーになる、というのが権限設計の基本形です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `CREATE ROLE support_readonly;
GRANT SELECT ON customers, support_notes TO support_readonly;

-- 実際の運用では、ログインできる個人ユーザーをメンバーにする
-- CREATE ROLE tanaka LOGIN PASSWORD '...';
-- GRANT support_readonly TO tanaka;`,
        },
      ],
    },
    {
      id: 'step-2',
      title: '「与えない」ことが仕事',
      blocks: [
        {
          type: 'paragraph',
          html: '最小権限の要点は、GRANT ALLやスキーマ全体への一括GRANTを使わず、必要なテーブルの必要な操作だけを列挙することです。payment_methodsに権限を付けなければ、サポート担当のSQLがどう間違ってもカード情報には到達できません。「アプリのバグや人のミスがあっても、権限が壁になる」のがDBレベルで権限を絞る価値です。',
        },
      ],
    },
    {
      id: 'step-3',
      title: '権限の確認と動作テスト',
      blocks: [
        {
          type: 'paragraph',
          html: '付与状況は information_schema.table_privileges(標準SQL)や、psqlの \\dp コマンドで確認できます。さらに SET ROLE support_readonly; で実際にそのロールになり、SELECT * FROM payment_methods; が permission denied になることを確かめるのが確実です(RESET ROLE; で戻れます)。新しく作られるテーブルに自動で権限を効かせたい場合は ALTER DEFAULT PRIVILEGES を使います。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.postgres }] },
  ],
};

export default config;
