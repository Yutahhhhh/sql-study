import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'web-app-sql-patterns',
  title: 'Web開発で毎日使うSQLパターン',
  description: 'ページネーション・検索・UPSERT・論理削除・トランザクション境界など、Webアプリ実装の定番SQLパターンを整理する',
  headerLabel: 'Web開発',
  homeIcon: 'AppWindow',
  homeColor: 'sky',
  intro:
    'Webアプリの機能の大半は、少数のSQLパターンの組み合わせでできています。このガイドでは「一覧」「検索」「保存」「削除」「更新の整合性」という日常の実装で使う定番パターンと、それぞれの落とし穴を整理します。ORMを使う場合でも、<strong>最終的に発行されるSQLがどの型なのか</strong>を意識できると、性能問題やバグの原因を自力で特定できるようになります。',
  sections: [
    {
      id: 'pagination',
      title: '一覧とページネーション',
      icon: 'ArrowDownWideNarrow',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: 'OFFSET方式',
              subtitle: '実装が簡単',
              accent: 'amber',
              points: [
                '<code>LIMIT 20 OFFSET 200</code> のようにページ番号から計算',
                '「◯ページ目へジャンプ」ができる',
                '<strong>深いページほど遅い</strong>(読み飛ばす行も走査する)',
                '行の挿入・削除でページがズレ、重複・欠落が起きる',
              ],
            },
            {
              title: 'カーソル(keyset)方式',
              subtitle: '無限スクロールの標準',
              accent: 'sky',
              points: [
                '「最後に見た行」をWHERE条件にする',
                '<strong>何ページ目でもコスト一定</strong>(インデックスで直接ジャンプ)',
                'ズレが起きない(カーソルは行そのものを指す)',
                'ページジャンプは苦手。並び順の列+一意な列のインデックスが必須',
              ],
            },
          ],
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- keyset: 前ページ最後の行 (published_at=1700017940, id=2996) の続き
SELECT id, title, published_at
FROM articles
WHERE (published_at, id) < (1700017940, 2996)
ORDER BY published_at DESC, id DESC
LIMIT 20;`,
          caption: '並び順にタイブレーカー(id)を含めるのが鉄則。演習「深いページも速いページネーション」で実践できます',
        },
        {
          type: 'callout',
          variant: 'warn',
          title: '件数表示のCOUNT(*)にも注意',
          html: '「全1,234件中…」の表示のために毎回 <code>COUNT(*)</code> を発行すると、一覧本体より件数取得の方が重いことがあります。概算で良ければ統計情報を使う、上限付きで数える(<code>SELECT COUNT(*) FROM (... LIMIT 1001)</code>)、件数表示自体をやめる、などの選択肢を検討します。',
        },
      ],
    },
    {
      id: 'search',
      title: '検索条件とインデックスの相性',
      icon: 'Search',
      blocks: [
        {
          type: 'paragraph',
          html: '検索機能の性能は「WHERE句がインデックスを使える形か」でほぼ決まります。書き方によって同じ意味でも速度が数百倍変わります。',
        },
        {
          type: 'table',
          headers: ['パターン', 'インデックス', '備考'],
          rows: [
            ['<code>email = ?</code>', '✅ 使える', '等値検索。最も効率的'],
            ['<code>name LIKE \'abc%\'</code>', '✅ 前方一致は使える', 'B-treeの並び順で探索できる'],
            ['<code>name LIKE \'%abc%\'</code>', '❌ 中間一致は使えない', '全文検索(PostgreSQLのpg_trgm/tsvector等)を検討'],
            ['<code>lower(email) = ?</code>', '❌ 関数で包むと使えない', '<strong>式インデックス</strong>を作れば✅(演習あり)'],
            ['<code>status IN (\'a\',\'b\')</code>', '✅ 使える', '等値の集合。問題なし'],
            ['<code>date_col >= ? AND date_col < ?</code>', '✅ 範囲も使える', 'BETWEEN相当。範囲列は複合インデックスの最後に置く'],
          ],
          caption: 'WHERE句の形とインデックス利用可否',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '迷ったらEXPLAIN',
          html: '「このクエリはインデックスを使えているか?」は推測せずEXPLAINで確認する習慣をつけます。本プラットフォームの演習では実行のたびにEXPLAINタブで実際のプランを確認できます。',
        },
      ],
    },
    {
      id: 'upsert',
      title: '保存系: UPSERTと冪等な書き込み',
      icon: 'Save',
      blocks: [
        {
          type: 'paragraph',
          html: '「あれば更新、なければ作成」をアプリ側のif文で書くと、同時リクエストで壊れます(存在確認と書き込みの間に割り込まれる)。<strong>一意制約+UPSERT構文</strong>でDBに任せるのが正解です。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- PostgreSQL
INSERT INTO user_settings (user_id, key, value)
VALUES (1, 'theme', 'dark')
ON CONFLICT (user_id, key)
DO UPDATE SET value = EXCLUDED.value;

-- MySQL
INSERT INTO user_settings (user_id, \`key\`, value)
VALUES (1, 'theme', 'dark') AS new
ON DUPLICATE KEY UPDATE value = new.value;`,
          caption: 'どちらも「一意制約に衝突したら更新」という同じ構造',
        },
        {
          type: 'list',
          items: [
            'UPSERTの衝突判定には<strong>PRIMARY KEYかUNIQUE制約が必須</strong>。制約設計とセットで考える',
            'リトライされても結果が変わらない(冪等)ため、キュー処理やWebhook受信の保存にも向く',
            '「何もしない」でよければ <code>ON CONFLICT DO NOTHING</code>(重複を静かに無視)',
          ],
        },
      ],
    },
    {
      id: 'soft-delete',
      title: '論理削除と物理削除',
      icon: 'Trash2',
      blocks: [
        {
          type: 'compare',
          columns: [
            {
              title: '論理削除 (deleted_at)',
              subtitle: '復元・監査ができる',
              accent: 'emerald',
              points: [
                '<code>deleted_at TIMESTAMP NULL</code> を立てるだけ',
                '誤削除からの復元、削除履歴の監査が可能',
                '<strong>全クエリに <code>WHERE deleted_at IS NULL</code> が必要</strong>(漏れがバグに)',
                'UNIQUE制約が「削除済みも含めて」効いてしまう問題がある',
              ],
            },
            {
              title: '物理削除 (DELETE)',
              subtitle: 'シンプルで正確',
              accent: 'rose',
              points: [
                'データが実際に消え、クエリはシンプル',
                '復元はバックアップからのみ',
                '外部キーの<strong>ON DELETE挙動</strong>(RESTRICT/CASCADE/SET NULL)の設計が必須',
                '個人情報の削除要求(GDPR等)にはこちらが必要',
              ],
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '論理削除とUNIQUEを両立させる部分インデックス',
          html: '「削除済みなら同じメールアドレスで再登録できる」仕様は、PostgreSQLなら部分ユニークインデックスで表現できます: <code>CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL;</code>。生きている行の中でだけ一意性が効きます。',
        },
      ],
    },
    {
      id: 'transactions',
      title: 'トランザクション境界と整合性',
      icon: 'GitCommitHorizontal',
      blocks: [
        {
          type: 'paragraph',
          html: '「注文を作って在庫を減らしてポイントを付ける」のような複数テーブル更新は、<strong>1つのトランザクション</strong>にまとめます。途中で失敗したら全部巻き戻る(原子性)ことで、中途半端な状態がDBに残りません。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `BEGIN;
INSERT INTO orders (user_id, total) VALUES (1, 3000);
UPDATE products SET stock = stock - 1 WHERE id = 10 AND stock >= 1;
UPDATE users SET points = points + 30 WHERE id = 1;
COMMIT;  -- どれか失敗したら ROLLBACK`,
        },
        {
          type: 'list',
          items: [
            '<strong>トランザクションは短く</strong>。中で外部API呼び出しやユーザー入力待ちをしない(ロックを持ったまま待つことになる)',
            '同時更新の競合には「条件付きUPDATE」(在庫演習で実践)や <code>SELECT ... FOR UPDATE</code> を使う',
            '複数行を更新する処理同士は、<strong>更新順序を揃える</strong>(例: 常にid昇順)とデッドロックを避けられる',
            'Webアプリでは「1リクエスト=1トランザクション」を基本形に、重い読み取りは外に出す',
          ],
        },
      ],
    },
    {
      id: 'n-plus-one',
      title: 'ORMとN+1、発行されるSQLを見る',
      icon: 'Layers',
      blocks: [
        {
          type: 'paragraph',
          html: 'ORMの便利な遅延ロードは、ループの中で1件ずつSELECTを発行するN+1問題の温床です。「一覧20件の表示でクエリが21回」は典型症状です。対策はORMのeager loading(preload/includes/JOIN)で<strong>1〜2本のクエリにまとめる</strong>ことです。',
        },
        {
          type: 'flow',
          title: '性能調査の基本ループ',
          steps: [
            { label: 'クエリログを見る', sublabel: '何本・何が発行されたか', accent: 'sky' },
            { label: '遅い1本を特定', sublabel: 'スロークエリログ/統計', accent: 'amber' },
            { label: 'EXPLAINで原因を見る', sublabel: 'Seq Scan? ソート?', accent: 'indigo' },
            { label: 'インデックス/書き換え', sublabel: '対策して再計測', accent: 'emerald' },
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: '開発中からクエリログを出す',
          html: '開発環境ではORMのSQLログを常時出しておくと、N+1やUPDATEのWHERE漏れに<strong>実装した瞬間に</strong>気づけます。本番で気づくのとはコストが桁違いです。',
        },
      ],
    },
  ],
  checkpoints: [
    'OFFSET方式とkeyset方式のコスト特性の違いと、keysetにタイブレーカー列が必要な理由を説明できる',
    'LIKE中間一致や関数で包んだ列でインデックスが使えない理由と対策を説明できる',
    '「SELECTで確認してから書き込む」実装が同時実行で壊れる理由と、UPSERT/条件付きUPDATEでの解決を説明できる',
    '論理削除を選んだ時に発生する追加コスト(WHERE漏れ・UNIQUE制約)を説明できる',
  ],
  references: [
    { label: 'Use The Index, Luke! (インデックスとSQLの教科書)', url: 'https://use-the-index-luke.com/ja' },
    { label: 'PostgreSQL: INSERT ... ON CONFLICT', url: 'https://www.postgresql.org/docs/current/sql-insert.html' },
  ],
};

export default config;
