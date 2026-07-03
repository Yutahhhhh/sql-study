import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'roles-and-permissions',
  title: 'ユーザー権限とロール設計',
  description: 'ロール・GRANT/REVOKE・アプリ用最小権限・読み取り専用ユーザー・DEFAULT PRIVILEGES・行レベルセキュリティまで、DB権限の設計を学ぶ',
  headerLabel: '権限',
  homeIcon: 'KeyRound',
  homeColor: 'purple',
  intro:
    '多くのプロジェクトが「全員が管理者ユーザーで接続」から始まり、監査・情報漏洩・誤操作をきっかけに権限設計をやり直すことになります。このガイドでは、PostgreSQLのロールとGRANTを軸に、<strong>Webアプリの実務で必要な権限設計の型</strong>を整理します。権限プレイグラウンドと演習「読み取り専用ロールを最小権限で作る」で実際に手を動かせます。',
  sections: [
    {
      id: 'role-model',
      title: 'ロールモデル: ユーザーもグループも「ロール」',
      icon: 'Users',
      blocks: [
        {
          type: 'paragraph',
          html: 'PostgreSQLでは、ログインする「ユーザー」も権限をまとめる「グループ」も、同じ<strong>ロール</strong>という仕組みです(LOGIN属性の有無だけが違い)。設計の基本形は「<strong>権限は目的別ロールに付け、人・アプリはそのメンバーになる</strong>」です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 権限の入れ物(ログイン不可のグループロール)
CREATE ROLE app_readwrite;
CREATE ROLE readonly;

-- 実際に接続する主体(ログイン可能ロール)
CREATE ROLE web_app  LOGIN PASSWORD '...';
CREATE ROLE tanaka   LOGIN PASSWORD '...';

-- メンバーシップで権限を継承させる
GRANT app_readwrite TO web_app;
GRANT readonly TO tanaka;`,
          caption: '個人に直接GRANTしない。異動・退職時はメンバーシップの付け外しだけで済む',
        },
        {
          type: 'table',
          headers: ['ロール', '権限', '使う人/もの'],
          rows: [
            ['<code>app_readwrite</code>', '業務テーブルのSELECT/INSERT/UPDATE/DELETE', 'アプリケーション'],
            ['<code>app_migrator</code>', '上記+DDL(CREATE/ALTER)', 'マイグレーション実行(CI)'],
            ['<code>readonly</code>', 'SELECTのみ(機微テーブル除く)', '分析・サポート・開発者の調査'],
            ['<code>admin</code>', 'ほぼ全部', '緊急時のみ。日常では使わない'],
          ],
          caption: 'Webアプリの典型的なロール分割',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: 'アプリにDDL権限を持たせない',
          html: 'アプリ実行用ロールとマイグレーション用ロールを分けると、<strong>SQLインジェクションを受けてもDROP TABLEは実行できない</strong>という構造的な防御になります。権限分割は「侵入された後」の被害を決める設計です。',
        },
      ],
    },
    {
      id: 'grant-revoke',
      title: 'GRANT / REVOKE の実務',
      icon: 'ShieldCheck',
      blocks: [
        {
          type: 'paragraph',
          html: '権限は「対象(テーブル/スキーマ/DB)×操作(SELECT/INSERT/...)×誰に」で指定します。列単位のGRANTも可能です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- テーブル単位
GRANT SELECT, INSERT, UPDATE, DELETE ON orders, order_items TO app_readwrite;

-- スキーマ内の既存テーブル一括
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;

-- 列単位(機微列を隠す)
GRANT SELECT (id, name, created_at) ON customers TO support_readonly;

-- 剥奪
REVOKE DELETE ON orders FROM app_readwrite;

-- 忘れがち: SERIAL/SEQUENCEを使うINSERTにはシーケンス権限が要る
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_readwrite;`,
        },
        {
          type: 'callout',
          variant: 'danger',
          title: '「GRANT ALL ON ALL TABLES」で終わらせない',
          html: '一括GRANTは楽ですが、機微テーブル(決済情報・個人情報)も無差別に含まれます。<strong>機微テーブルは明示的に除外する(または専用スキーマに隔離する)</strong>のが最小権限の実務です。演習では payment_methods に触れないロールを作ります。',
        },
        {
          type: 'paragraph',
          html: '確認手段: 付与状況は <code>information_schema.table_privileges</code>、psqlなら <code>\\dp</code>。さらに <code>SET ROLE ロール名;</code> でそのロールに成り代わり、実際に拒否されることを確かめるのが確実です(<code>RESET ROLE;</code>で戻る)。',
        },
      ],
    },
    {
      id: 'default-privileges',
      title: '落とし穴: 新しいテーブルには権限が付かない',
      icon: 'AlertTriangle',
      blocks: [
        {
          type: 'paragraph',
          html: 'GRANTは<strong>実行時点で存在するテーブル</strong>にしか効きません。マイグレーションで新テーブルを追加した翌日、「readonlyユーザーで新テーブルだけ見えない」という問い合わせが来るのが定番の罠です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 「migratorロールが今後publicスキーマに作るテーブル」に自動でSELECTを付与
ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
  GRANT SELECT ON TABLES TO readonly;

ALTER DEFAULT PRIVILEGES FOR ROLE app_migrator IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_readwrite;`,
          caption: 'DEFAULT PRIVILEGESは「作成者ロールごと」の設定である点に注意(誰が作ったテーブルに効くか)',
        },
      ],
    },
    {
      id: 'rls',
      title: '行レベルセキュリティ (RLS)',
      icon: 'Rows3',
      blocks: [
        {
          type: 'paragraph',
          html: 'GRANTは「テーブル単位」の制御ですが、マルチテナントSaaSでは「<strong>同じテーブルの中の自社の行だけ</strong>」を見せたいことがあります。これを実現するのがRow Level Security(RLS)です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 接続セッションに設定されたテナントIDの行だけ見える
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.tenant_id')::int);

-- アプリはリクエストごとに設定する
SET app.tenant_id = '42';
SELECT * FROM orders;  -- tenant_id = 42 の行しか返らない`,
          caption: 'アプリのWHERE句の付け忘れというクラスのバグを、DBレベルで構造的に不可能にする',
        },
        {
          type: 'list',
          items: [
            'アプリの全クエリに <code>WHERE tenant_id = ?</code> を書く方式は、<strong>1箇所の書き忘れが情報漏洩</strong>になる。RLSは忘れても漏れない',
            'テーブル所有者やBYPASSRLS属性を持つロールにはポリシーが効かない(アプリ用ロールは所有者にしない)',
            'ポリシーの条件はクエリに毎回追加されるため、<strong>tenant_id にインデックス</strong>が必要',
          ],
        },
      ],
    },
    {
      id: 'operations',
      title: '接続と権限の運用',
      icon: 'Settings2',
      blocks: [
        {
          type: 'list',
          items: [
            '<strong>パスワードは長く・共有しない</strong>。RDSならIAM認証やSecrets Managerのローテーションも選択肢',
            '人間の調査アクセスは基本readonly。書き込みが要る作業だけ一時的に昇格し、証跡を残す(運用ガイドのデータパッチの型)',
            '本番の権限変更(GRANT/REVOKE)もマイグレーションとして<strong>コード管理</strong>する。手作業のGRANTは環境間の差分になる',
            '退職・異動時はロールのメンバーシップ剥奪だけで完結する設計にしておく(個人への直接GRANTを避けた効果)',
            '定期的に<code>table_privileges</code>を棚卸しし、「誰が何に触れるか」の一覧を監査に出せる状態を保つ',
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'MySQLとの対応',
          html: 'MySQLでは<code>CREATE USER</code>と<code>GRANT ... ON db.table TO user</code>で同様の設計ができます(8.0からはロールも利用可能)。「目的別に権限をまとめ、最小権限で配る」という設計原則はどのDBでも同じです。',
        },
      ],
    },
  ],
  checkpoints: [
    '「権限はロールに付け、人・アプリはメンバーになる」設計の利点を退職・監査の観点で説明できる',
    'アプリ用ロールとマイグレーション用ロールを分けるセキュリティ上の意味を説明できる',
    'ALTER DEFAULT PRIVILEGESが必要になる場面(新テーブルに権限が付かない罠)を説明できる',
    'RLSが解決する問題(WHERE句の付け忘れ)と、利用時の注意点(所有者バイパス・インデックス)を説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Database Roles', url: 'https://www.postgresql.org/docs/current/user-manag.html' },
    { label: 'PostgreSQL: Privileges (GRANT)', url: 'https://www.postgresql.org/docs/current/ddl-priv.html' },
    { label: 'PostgreSQL: Row Security Policies', url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html' },
  ],
};

export default config;
