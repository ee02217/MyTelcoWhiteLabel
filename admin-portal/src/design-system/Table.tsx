import React from 'react';
import { Card } from './Card';

export interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  style?: React.CSSProperties;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectChange?: (selected: Set<string>) => void;
  children?: React.ReactNode;
}

const thStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 'var(--font-size-sm)',
  color: 'var(--color-text-secondary)',
};

const tdStyle: React.CSSProperties = {
  padding: '10px 8px',
  fontSize: 'var(--font-size-sm)',
};

export function Table<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selected,
  onSelectChange,
  children,
}: TableProps<T>) {
  const allSelected = data.length > 0 && selected?.size === data.length;

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (allSelected) {
      onSelectChange(new Set());
    } else {
      onSelectChange(new Set(data.map(rowKey)));
    }
  };

  const toggleRow = (key: string) => {
    if (!onSelectChange || !selected) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onSelectChange(next);
  };

  return (
    <Card padding="none" shadow="md">
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse' }}
          role="grid"
          aria-label="Data table"
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border-default, #ddd)' }}>
              {selectable && (
                <th style={{ ...thStyle, width: 40 }}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} style={{ ...thStyle, ...col.style }}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const key = rowKey(row);
              return (
                <tr
                  key={key}
                  style={{ borderBottom: '1px solid var(--color-border-default, #eee)' }}
                >
                  {selectable && (
                    <td style={tdStyle}>
                      <input
                        type="checkbox"
                        checked={selected?.has(key) ?? false}
                        onChange={() => toggleRow(key)}
                        aria-label={`Select row ${key}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} style={{ ...tdStyle, ...col.style }}>
                      {col.render
                        ? col.render(row, i)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {children}
    </Card>
  );
}
