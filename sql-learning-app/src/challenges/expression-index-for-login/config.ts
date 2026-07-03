import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'expression-index-for-login',
  title: 'リリース後にログインが遅くなった',
  description: '関数で包んだWHERE句はインデックスが効かない。式インデックスで解消する',
  headerLabel: 'リリース直後',
  badge: 'リリース直後',
  icon: 'LogIn',
  color: 'blue',
  topic: 'release',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    'リリース前は快適だったログインが、ユーザー数の増加とともに遅くなってきました。ログイン処理は「メールアドレスの大文字小文字を区別しない」仕様のため、直前のリリースで検索条件を lower(email) = lower(?) に変更しています。usersテーブルにはemailのインデックス(idx_users_email)があるのに、です。まず `SELECT id, name FROM users WHERE lower(email) = \'user1234@example.com\';` を実行してEXPLAINタブを確認してください。既存インデックスが使われず全表走査になっているはずです。原因を解消し、同じクエリがインデックスを使うようにしてください。',
  requirements: [
    {
      id: 'req-why',
      title: '既存インデックスが使えない理由を確認する',
      description: 'idx_users_email は email の生の値で並んでいるため、lower(email) の結果では探索できない。EXPLAINでSeq Scan(全表走査)になることを確認する',
    },
    {
      id: 'req-expr-index',
      title: '式インデックスを作成する',
      description: 'lower(email) の計算結果に対するインデックス CREATE INDEX ... ON users (lower(email)) を作成する',
    },
    {
      id: 'req-query',
      title: '同じ検索を高速化する',
      description: '`SELECT id, name FROM users WHERE lower(email) = \'user1234@example.com\';` を再実行し、インデックスが使われることを確認する',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: false,
      expected: {
        columns: ['id', 'name'],
        rows: [[1234, 'user-1234']],
      },
      label: '対象ユーザーを取得できているか',
      failureMessage: 'user1234@example.com のユーザー(id=1234)が取得できていません。',
    },
    {
      id: 'chk-no-seqscan',
      type: 'query-avoids-seq-scan',
      tableName: 'users',
      label: '全表走査を回避できているか',
      failureMessage: 'usersがまだSeq Scan(全表走査)されています。lower(email)に対する式インデックスを作成してください。',
    },
    {
      id: 'chk-uses-index',
      type: 'query-uses-index',
      label: 'インデックスが使われているか',
      failureMessage: 'EXPLAIN結果でインデックスの利用が確認できません。WHERE句の式とインデックスの式が完全に一致しているか確認してください。',
    },
  ],
  actions: [
    {
      id: 'act-fast-login',
      title: 'ログイン検索がインデックスを使う',
      description: '式インデックスを作成し、lower(email)での検索がIndex Scanになることを確認します。',
      checkIds: ['chk-result', 'chk-no-seqscan', 'chk-uses-index'],
      successMessage: 'lower(email)での検索がインデックスを使うようになりました。データ量が増えても検索コストはほぼ一定です。',
      failureMessage: 'まだ全表走査のままです(EXPLAINタブを確認してください)。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'なぜ既存インデックスが使えないのか',
      blocks: [
        {
          type: 'paragraph',
          html: 'idx_users_email は email の「生の値」でソートされた索引です。lower(email) = ... という条件は「変換後の値」での探索なので、この索引の並び順では探せません。列を関数で包んだ瞬間、その列の普通のインデックスは使えなくなる——これはWHERE句だけでなく、date_trunc(created_at)やCAST等でも同じで、本番のデータ量になって初めて発覚する典型パターンです。',
        },
      ],
    },
    {
      id: 'step-2',
      title: '式インデックスを作る',
      blocks: [
        {
          type: 'code',
          language: 'sql',
          code: 'CREATE INDEX idx_users_email_lower ON users (lower(email));',
        },
        {
          type: 'paragraph',
          html: '式インデックスは「lower(email)の計算結果」を索引化します。WHERE句の式がインデックス定義の式と一致すると、オプティマイザがこの索引を使えます。INSERTやUPDATEのたびに計算コストが少し増える点はトレードオフです。',
        },
      ],
    },
    {
      id: 'step-3',
      title: '別解: 設計で解決する',
      blocks: [
        {
          type: 'paragraph',
          html: '実務では「保存時に小文字へ正規化してしまう」「PostgreSQLならcitext型を使う」という設計側の解決策もあります。既に本番で動いているテーブルに対しては、アプリ変更なしで効く式インデックスが最も低リスクな一手です。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.shared }] },
  ],
};

export default config;
