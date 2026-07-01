import { useState } from 'react';
import { ChevronDown, ChevronRight, KeyRound, Link2, ListTree, Table2 } from 'lucide-react';
import type { SchemaInfo, TableInfo } from '../../types/engine';

const TableRow = ({ table, highlighted }: { table: TableInfo; highlighted: boolean }) => {
  const [open, setOpen] = useState(highlighted);

  return (
    <div
      className={`rounded-lg border ${
        highlighted ? 'border-sky-600 bg-sky-950/30' : 'border-slate-800 bg-slate-900/50'
      } overflow-hidden`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-200">
          <Table2 size={14} className="text-sky-400" />
          {table.name}
        </span>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <table className="w-full text-xs font-mono">
            <tbody>
              {table.columns.map((col) => (
                <tr key={col.name} className="border-t border-slate-800/60">
                  <td className="py-1 pr-2 text-slate-300 whitespace-nowrap">
                    {col.isPrimaryKey && <KeyRound size={11} className="inline mr-1 text-amber-400" />}
                    {col.name}
                  </td>
                  <td className="py-1 pr-2 text-slate-500">{col.dataType}</td>
                  <td className="py-1 text-slate-600">{col.nullable ? 'NULL可' : 'NOT NULL'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {table.indexes.length > 0 && (
            <div className="text-[11px] text-slate-400 space-y-1">
              {table.indexes.map((idx) => (
                <div key={idx.name} className="flex items-center gap-1.5">
                  <ListTree size={11} className="text-indigo-400" />
                  <span className="font-mono">
                    {idx.name} ({idx.columns.join(', ')}){idx.isUnique ? ' UNIQUE' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
          {table.constraints
            .filter((c) => c.type === 'foreign-key')
            .map((fk) => (
              <div key={fk.name} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Link2 size={11} className="text-emerald-400" />
                <span className="font-mono">
                  {fk.columns.join(', ')} → {fk.referencedTable}({(fk.referencedColumns ?? []).join(', ')})
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

interface SchemaViewerProps {
  schema: SchemaInfo | null;
  highlightedTableNames?: string[];
}

export const SchemaViewer = ({ schema, highlightedTableNames = [] }: SchemaViewerProps) => {
  if (!schema || schema.tables.length === 0) {
    return <p className="text-sm text-slate-500 italic">テーブルがまだありません。</p>;
  }

  return (
    <div className="space-y-2">
      {schema.tables.map((table) => (
        <TableRow key={table.name} table={table} highlighted={highlightedTableNames.includes(table.name)} />
      ))}
    </div>
  );
};
