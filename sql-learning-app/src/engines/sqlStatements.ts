/** `;` をトップレベル(文字列リテラル外)で分割する簡易スプリッタ(PG/MySQL/SQLite共通で使う) */
export function splitStatements(script: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    if (inString) {
      current += ch;
      if (ch === stringChar) {
        if (script[i + 1] === stringChar) {
          current += script[++i];
        } else {
          inString = false;
        }
      }
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = true;
      stringChar = ch;
      current += ch;
      continue;
    }
    if (ch === ';') {
      if (current.trim()) statements.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

/** 複数ステートメントのうち最後の1文を取り出す(EXPLAINは1文にしか適用できないため) */
export function lastStatement(script: string): string {
  const statements = splitStatements(script);
  return statements[statements.length - 1] ?? '';
}
