import { useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql, PostgreSQL, MySQL, type SQLNamespace } from '@codemirror/lang-sql';
import { keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { Play } from 'lucide-react';
import type { SqlDialect, SchemaInfo } from '../../types/engine';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  dialect: SqlDialect;
  schema?: SchemaInfo;
  onRun?: () => void;
  height?: string;
  readOnly?: boolean;
}

function schemaToNamespace(schema?: SchemaInfo): SQLNamespace {
  if (!schema) return {};
  return Object.fromEntries(schema.tables.map((t) => [t.name, t.columns.map((c) => c.name)]));
}

export const SqlEditor = ({ value, onChange, dialect, schema, onRun, height = '220px', readOnly }: SqlEditorProps) => {
  const extensions = useMemo(() => {
    const ext: Extension[] = [
      sql({
        dialect: dialect === 'postgres' ? PostgreSQL : MySQL,
        schema: schemaToNamespace(schema),
        upperCaseKeywords: true,
      }),
    ];
    if (onRun) {
      ext.push(
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              onRun();
              return true;
            },
          },
        ]),
      );
    }
    return ext;
  }, [dialect, schema, onRun]);

  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between gap-2 bg-slate-900 px-3 py-1.5 border-b border-slate-800">
        <span className="min-w-0 flex-1 truncate text-[11px] font-mono text-slate-500">
          {dialect === 'postgres' ? 'PostgreSQL' : 'MySQL'}
        </span>
        {onRun && (
          <button
            onClick={onRun}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded transition"
          >
            <Play size={12} />
            <span className="hidden sm:inline">実行 (Cmd/Ctrl+Enter)</span>
            <span className="sm:hidden">実行</span>
          </button>
        )}
      </div>
      <CodeMirror
        value={value}
        height={height}
        theme="dark"
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        basicSetup={{ closeBrackets: true, autocompletion: true }}
      />
    </div>
  );
};
