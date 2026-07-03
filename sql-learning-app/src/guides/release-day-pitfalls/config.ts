import type { GuideConfig } from '../../types/guide';

const config: GuideConfig = {
  slug: 'release-day-pitfalls',
  title: '本番リリース直後にぶち当たるDB問題',
  description: 'データ量で露見する遅いクエリ、コネクション枯渇、マイグレーションのロック、重複データなど、リリース直後の典型トラブルと対策',
  headerLabel: 'リリース直後',
  homeIcon: 'Siren',
  homeColor: 'blue',
  intro:
    '開発環境で完璧に動いたアプリが、本番リリース直後に悲鳴を上げる——その原因の多くはDBまわりで、しかも<strong>パターンが決まっています</strong>。このガイドでは「本番で初めて露見する」タイプのDB問題を、症状→原因→対策の形で整理します。リリース前の点検リストとしても使えます。',
  sections: [
    {
      id: 'data-volume',
      title: 'データ量が本性を現す: 遅いクエリ',
      icon: 'TrendingDown',
      blocks: [
        {
          type: 'paragraph',
          html: '開発DBの100行では、インデックスが無くても全表走査が一瞬で終わります。本番の100万行では同じクエリが数秒〜数十秒になります。<strong>「開発では速かった」は何の保証にもなりません</strong>。',
        },
        {
          type: 'table',
          headers: ['症状', 'よくある原因', '対策'],
          rows: [
            ['特定画面だけ急に遅い', 'WHERE句の列にインデックスが無い', 'EXPLAINでSeq Scanを確認→インデックス追加'],
            ['ログイン・検索が遅い', '<code>lower(col)</code>など関数包みでインデックス不使用', '式インデックス(演習あり)/保存時に正規化'],
            ['一覧の後ろのページが遅い', 'OFFSETページネーション', 'keyset方式へ(演習あり)'],
            ['一覧表示でクエリが大量発行', 'ORMのN+1', 'eager loadingでJOIN/一括取得に(演習あり)'],
            ['集計画面がタイムアウト', '毎回全行を集計', '集計テーブル/マテビュー/非同期化'],
          ],
          caption: 'リリース直後の「遅い」の型',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: '予防: 本番相当のデータ量で試験する',
          html: 'リリース前にstg環境へ<strong>本番想定の件数のダミーデータ</strong>を投入し、主要画面を触るだけで、このクラスの問題はほぼ全部見つかります。データ生成は <code>generate_series</code>(PostgreSQL)や再帰CTEで数分で書けます。',
        },
      ],
    },
    {
      id: 'connections',
      title: 'コネクションプール枯渇',
      icon: 'PlugZap',
      blocks: [
        {
          type: 'paragraph',
          html: 'PostgreSQLの接続はプロセス単位で重く、<code>max_connections</code>(RDSではインスタンスサイズ依存)を超えると新規接続がエラーになります。アプリサーバーをスケールアウトした瞬間に「サーバーを増やしたらDBが死んだ」となるのが典型です。',
        },
        {
          type: 'flow',
          title: '接続数の計算を先にやる',
          steps: [
            { label: 'アプリ1台のプールサイズ', sublabel: '例: 10', accent: 'sky' },
            { label: '× サーバー台数(最大)', sublabel: 'Auto Scaling上限で数える', accent: 'amber' },
            { label: '+ ワーカー/バッチ/管理接続', sublabel: '忘れがち', accent: 'rose' },
            { label: '< max_connections', sublabel: '余裕を残して収める', accent: 'emerald' },
          ],
        },
        {
          type: 'list',
          items: [
            '症状: <code>FATAL: too many connections</code> / <code>remaining connection slots are reserved</code>',
            '現状確認: <code>SELECT count(*), state FROM pg_stat_activity GROUP BY state;</code>',
            '<strong>idle接続が大量</strong>なら、アプリのプール設定(最大数・idleタイムアウト)を見直す',
            '接続元が多い構成(Lambda、大量コンテナ)は<strong>RDS Proxy / PgBouncer</strong>で接続を多重化する',
          ],
        },
      ],
    },
    {
      id: 'migration-locks',
      title: 'マイグレーションがサービスを止める',
      icon: 'Lock',
      blocks: [
        {
          type: 'paragraph',
          html: 'ALTER TABLEの多くはテーブルロックを取ります。稼働中のテーブルに対して無計画に流すと、<strong>ロック待ちの行列ができてサービス全体が停止</strong>します。さらに怖いのは、ALTER自体は一瞬でも「先行する長いクエリが終わるのを待つ間、後続の全クエリがALTERの後ろに並ぶ」ことです。',
        },
        {
          type: 'table',
          headers: ['操作', '危険度', '安全な代替'],
          rows: [
            ['ADD COLUMN (NULL可/PG11+のDEFAULT)', '低', 'そのままでOK。メタデータ変更のみ'],
            ['ADD COLUMN NOT NULL (既存表)', '高', '3段階: NULL追加→バックフィル→SET NOT NULL(演習あり)'],
            ['CREATE INDEX', '高(書き込みブロック)', '<code>CREATE INDEX CONCURRENTLY</code>(PostgreSQL)'],
            ['列の型変更', '高(全行書き換え)', '新列追加→二重書き込み→切替→旧列削除'],
            ['ADD FOREIGN KEY', '中(検証で全行スキャン)', '<code>NOT VALID</code>で追加→後で<code>VALIDATE CONSTRAINT</code>'],
          ],
          caption: 'オンラインDDLの定石(PostgreSQL基準)',
        },
        {
          type: 'callout',
          variant: 'danger',
          title: 'lock_timeoutを設定してから流す',
          html: 'マイグレーション実行セッションで <code>SET lock_timeout = \'5s\';</code> を設定しておくと、ロックが取れない場合にマイグレーション側が諦めて失敗します。<strong>「サービスを止めるくらいならマイグレーションが失敗する方がいい」</strong>という優先順位を機械的に強制できます。',
        },
      ],
    },
    {
      id: 'integrity',
      title: '同時アクセスが壊すデータ整合性',
      icon: 'ShieldAlert',
      blocks: [
        {
          type: 'paragraph',
          html: '開発中は1人でしか触らないので、同時実行の問題は<strong>本番のトラフィックで初めて発生</strong>します。「テストでは一度も起きなかった」が特徴です。',
        },
        {
          type: 'list',
          items: [
            '<strong>二重登録</strong>: ボタン連打・二重送信でユニークであるべきデータが重複 → UNIQUE制約(演習「二重登録データを掃除してUNIQUEで再発防止する」)',
            '<strong>売り越し・残高マイナス</strong>: 確認と更新の間の割り込み → 条件付きUPDATE+CHECK制約(演習「在庫の売り越しを防ぐ」)',
            '<strong>UPSERTの競合エラー</strong>: 「SELECTして分岐」実装 → ON CONFLICT(演習「設定保存APIをUPSERTで実装する」)',
            '<strong>ロストアップデート</strong>: 画面Aと画面Bが同じ行を上書き合う → 楽観ロック(versionカラム)や<code>FOR UPDATE</code>',
          ],
        },
        {
          type: 'callout',
          variant: 'info',
          title: '共通する考え方',
          html: 'すべて「アプリの実装マナーに頼らず、<strong>DBの制約と原子的な操作で不変条件を守る</strong>」ことで解決します。制約はバグが混入しても最後に効く防衛線です。',
        },
      ],
    },
    {
      id: 'misc-pitfalls',
      title: '地味に痛い設定系の罠',
      icon: 'Bug',
      blocks: [
        {
          type: 'table',
          headers: ['罠', '症状', '対策'],
          rows: [
            ['タイムゾーン', '表示が9時間ズレる/日次集計の境界がズレる', 'DBはUTCの<code>timestamptz</code>で統一し、表示層で変換。「JSTで保存」は混乱の元'],
            ['文字コード(MySQL)', '絵文字😀でINSERTエラー', '<code>utf8</code>ではなく<strong><code>utf8mb4</code></strong>を使う(MySQLのutf8は3バイトまで)'],
            ['照合順序', '大文字小文字の扱いが環境で違う', 'MySQLは既定で大文字小文字を区別しない比較。PostgreSQLは区別する。挙動を揃えて明示'],
            ['ID枯渇', 'ある日突然INSERTが全部失敗', '<code>INTEGER</code>(21億)ではなく<strong><code>BIGINT</code></strong>を主キーに。後からの変更は大工事'],
            ['シーケンスの飛び', 'IDが連番でないと問い合わせが来る', '正常動作(ロールバックやキャッシュで飛ぶ)。連番を業務仕様にしない'],
          ],
          caption: 'リリース後に発覚しがちな設定・型の問題',
        },
      ],
    },
    {
      id: 'pre-release-check',
      title: 'リリース前DBチェックリスト',
      icon: 'ClipboardCheck',
      blocks: [
        {
          type: 'list',
          items: [
            '主要画面のクエリを<strong>本番相当のデータ量</strong>でEXPLAINし、Seq Scanが意図通りか確認した',
            '外部キー列・WHERE頻出列・ORDER BY列にインデックスがある',
            'ビジネスルール上ユニークであるべきものに<strong>UNIQUE制約</strong>がある',
            '接続数の見積もり(プール×台数+α)が<code>max_connections</code>に収まる',
            'マイグレーションは<strong>後方互換</strong>(旧コードでも動く)で、lock_timeout付きで流す手順になっている',
            '主キーはBIGINT、タイムスタンプはUTC、(MySQLなら)utf8mb4',
            'スロークエリログ/性能統計(pg_stat_statements)が有効になっている(次のガイド「運用」参照)',
          ],
        },
      ],
    },
  ],
  checkpoints: [
    '開発環境で速かったクエリが本番で遅くなる理由と、リリース前に検出する方法を説明できる',
    '接続数の見積もり式を書き、枯渇時の調査クエリと対策(プール設定/RDS Proxy)を挙げられる',
    'CREATE INDEX CONCURRENTLYやlock_timeoutなど、稼働中DBへ安全にDDLを流す手法を説明できる',
    '二重登録・売り越しなどの同時実行問題を、DB制約と原子的操作で防ぐ考え方を説明できる',
  ],
  references: [
    { label: 'PostgreSQL: Explicit Locking', url: 'https://www.postgresql.org/docs/current/explicit-locking.html' },
    { label: 'PostgreSQL: CREATE INDEX CONCURRENTLY', url: 'https://www.postgresql.org/docs/current/sql-createindex.html' },
    { label: 'strong_migrations (安全なマイグレーションの知見集)', url: 'https://github.com/ankane/strong_migrations' },
  ],
};

export default config;
