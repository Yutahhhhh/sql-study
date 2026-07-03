export const solutionQueries = {
  postgres: `-- サポートチーム用の読み取り専用ロールを作成する
CREATE ROLE support_readonly;

-- 必要なテーブルのSELECTだけを許可する(payment_methodsは許可しない)
GRANT SELECT ON customers, support_notes TO support_readonly;

-- 確認: 付与された権限の一覧
SELECT table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'support_readonly'
ORDER BY table_name, privilege_type;`,
};
