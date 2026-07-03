import type { ChallengeConfig } from '../../types/challenge';
import { seed } from './seed';
import { solutionQueries } from './solution';

const config: ChallengeConfig = {
  slug: 'keyset-pagination',
  title: '深いページも速いページネーションを作る',
  description: 'OFFSETページングの弱点を、複合インデックス+カーソル(keyset)方式で解消する',
  headerLabel: 'Web開発',
  badge: 'Web開発',
  icon: 'ArrowDownWideNarrow',
  color: 'sky',
  topic: 'web-dev',
  difficulty: 'intermediate',
  dialects: ['postgres', 'mysql'],
  scenario:
    '記事一覧APIは新着順で1ページ5件を返します。現在は `ORDER BY published_at DESC, id DESC LIMIT 5 OFFSET ?` で実装されていますが、OFFSETは読み飛ばす行も全て走査するため、後ろのページほど遅くなります。また、1ページ目を見た後に新記事が投稿されると2ページ目で同じ記事が重複表示されるバグも報告されています。カーソル(keyset)方式に書き換えてください。1ページ目の最後の記事は published_at = 1700017940, id = 2996 でした。この続きの5件(2ページ目)を返すクエリを作ります。',
  requirements: [
    {
      id: 'req-index',
      title: '並び順に対応する複合インデックス',
      description: 'articles (published_at, id) の複合インデックスを作成する(ORDER BY published_at DESC, id DESC を支える)',
    },
    {
      id: 'req-keyset',
      title: 'カーソル条件で「続き」を取得する',
      description: 'OFFSETを使わず、カーソル(published_at = 1700017940, id = 2996)より前の記事をWHERE条件で絞る。published_atは同時刻の記事があるため、idをタイブレーカーに含めること',
    },
    {
      id: 'req-output',
      title: '出力形式',
      description: 'id, title, published_at を published_at DESC, id DESC の順で5件返す(インデックス作成と同じ実行にまとめて提出してよい)',
    },
  ],
  seed,
  checks: [
    {
      id: 'chk-index',
      type: 'index-exists',
      tableName: 'articles',
      columns: ['published_at', 'id'],
      label: '(published_at, id) の複合インデックス',
      failureMessage: 'articles (published_at, id) の複合インデックスが見つかりません。列の順序も一致させてください。',
    },
    {
      id: 'chk-result',
      type: 'query-result-matches',
      orderSensitive: true,
      expected: {
        columns: ['id', 'title', 'published_at'],
        rows: [
          [2995, 'article-2995', 1700017940],
          [2994, 'article-2994', 1700017940],
          [2993, 'article-2993', 1700017940],
          [2992, 'article-2992', 1700017940],
          [2991, 'article-2991', 1700017940],
        ],
      },
      label: '2ページ目の5件が正しいか',
      failureMessage:
        '結果が期待される2ページ目と一致しません。published_atが同じ値の記事が並んでいるため、published_atだけで絞ると行が抜けたり重複したりします。idをタイブレーカーに使ってください。',
    },
    {
      id: 'chk-no-seqscan',
      type: 'query-avoids-seq-scan',
      tableName: 'articles',
      label: '全表走査になっていないか',
      failureMessage: 'articlesがSeq Scan(全表走査)されています。カーソル条件がインデックスを活かせる形か確認してください。',
    },
    {
      id: 'chk-uses-index',
      type: 'query-uses-index',
      label: 'インデックスが使われているか',
      failureMessage: 'EXPLAIN結果でインデックスの利用が確認できません。',
    },
  ],
  actions: [
    {
      id: 'act-index',
      title: '複合インデックスを作成する',
      description: '並び順(published_at, id)を支えるインデックスを作ります。',
      checkIds: ['chk-index'],
      successMessage: '複合インデックスが作成されました。',
      failureMessage: '(published_at, id) の複合インデックスがまだありません。',
      evaluatesAgainst: 'schema-state',
    },
    {
      id: 'act-page2',
      title: 'カーソル方式で2ページ目を取得する',
      description: 'OFFSETなしで「published_at=1700017940, id=2996 の続き」5件を返します。',
      checkIds: ['chk-result', 'chk-no-seqscan', 'chk-uses-index'],
      successMessage: '深いページでも一定コストで取得できるkeysetページネーションになりました。',
      failureMessage: 'まだ要件を満たせていません(結果の一致とEXPLAINタブを確認してください)。',
      evaluatesAgainst: 'submitted-query',
    },
  ],
  solutionQueries,
  answerTrace: [
    {
      id: 'step-1',
      title: 'OFFSETの何が問題か',
      blocks: [
        {
          type: 'paragraph',
          html: 'OFFSET 1000 は「1000行読んで捨てる」という意味です。ページが深くなるほど読み捨てが増え、コストはページ番号に比例して悪化します。さらに、ページ間で行が挿入・削除されると表示のズレ(重複・欠落)が起きます。',
        },
      ],
    },
    {
      id: 'step-2',
      title: 'カーソル = 「最後に見た行」を条件にする',
      blocks: [
        {
          type: 'paragraph',
          html: '「最後に見た行より前(古い側)」をWHEREで指定すれば、DBはインデックスでその位置に直接ジャンプでき、何ページ目でもコストが一定になります。並び順が (published_at DESC, id DESC) なので、条件も同じ2列で書きます。',
        },
        {
          type: 'code',
          language: 'sql',
          code: `-- 行値比較(PostgreSQL/SQLiteで使える簡潔な書き方)
WHERE (published_at, id) < (1700017940, 2996)

-- 展開した等価な書き方(どのDBでも書ける)
WHERE published_at < 1700017940
   OR (published_at = 1700017940 AND id < 2996)`,
        },
      ],
    },
    {
      id: 'step-3',
      title: 'なぜidのタイブレーカーが必須か',
      blocks: [
        {
          type: 'paragraph',
          html: 'このデータでは同じpublished_atの記事が複数あります(実務でも同時刻投稿は普通に起きます)。もし published_at < 1700017940 だけで絞ると、カーソルと同時刻の残り記事(2995〜2991)がすべてスキップされます。並び順を一意にする列(id)を必ずカーソルに含めるのがkeysetの鉄則です。',
        },
      ],
    },
    { id: 'step-4', title: '完成形', blocks: [{ type: 'code', language: 'sql', code: solutionQueries.shared }] },
  ],
};

export default config;
