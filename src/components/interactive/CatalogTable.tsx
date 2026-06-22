import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';

interface ColumnConfig {
  key: string;
  label: string;
  type: string;
}

export interface CatalogTableTranslations {
  search?: string;
  showing?: string;
  of?: string;
  rows?: string;
  download?: string;
  perPage?: string;
  first?: string;
  prev?: string;
  next?: string;
  last?: string;
  noResults?: string;
  emptyData?: string;
}

interface CatalogTableProps {
  data: Record<string, any>[];
  columns: ColumnConfig[];
  downloadUrl?: string;
  downloadFileName?: string;
  lang?: string;
}

const i18nDefaults: Record<string, Record<string, string>> = {
  en: {
    search: 'Search all columns…',
    showing: 'Showing',
    of: 'of',
    rows: 'rows',
    download: 'Download Data',
    perPage: 'per page',
    first: '«',
    prev: '‹',
    next: '›',
    last: '»',
    noResults: 'No matching results',
    emptyData: 'No data available',
  },
  zh: {
    search: '搜索所有列…',
    showing: '显示',
    of: '/',
    rows: '行',
    download: '下载数据',
    perPage: '每页',
    first: '«',
    prev: '‹',
    next: '›',
    last: '»',
    noResults: '无匹配结果',
    emptyData: '暂无数据',
  },
};

export default function CatalogTable({
  data,
  columns: columnConfigs,
  downloadUrl,
  downloadFileName,
  lang = 'en',
}: CatalogTableProps) {
  const t = i18nDefaults[lang] || i18nDefaults.en;

  // Empty data state
  if (!data || data.length === 0) {
    return (
      <div className="catalog-table-wrapper">
        <div className="catalog-empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          <p>{t.emptyData}</p>
        </div>
        <style>{`
          .catalog-table-wrapper { width: 100%; margin: 2rem 0; }
          .catalog-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 3rem 1rem;
            color: #4a6a8a;
            border: 1px dashed #b8c9dc;
            border-radius: 0.5rem;
          }
          .dark .catalog-empty-state {
            color: #6a8aaa;
            border-color: #3a7cb8;
          }
        `}</style>
      </div>
    );
  }

  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Record<string, any>>[]>(
    () =>
      columnConfigs.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        cell: (info) => {
          const value = info.getValue();
          if (col.type === 'number' && typeof value === 'number') {
            return value.toFixed(value % 1 === 0 ? 0 : 3);
          }
          return String(value ?? '');
        },
        sortingFn: col.type === 'number' ? 'basic' : 'alphanumeric',
      })),
    [columnConfigs],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const totalRows = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize } = table.getState().pagination;
  const start = pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="catalog-table-wrapper">
      {/* Toolbar */}
      <div className="catalog-toolbar">
        <div className="catalog-search-box">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="catalog-search-icon"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={t.search}
            className="catalog-search-input"
          />
        </div>


      </div>

      {/* Table */}
      <div className="catalog-table-scroll">
        <table className="catalog-table">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="catalog-th"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span className="catalog-th-content">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="catalog-sort-indicator">
                        {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? ' ⇅'}
                      </span>
                    </span>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="catalog-empty">
                  {t.noResults}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="catalog-row">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="catalog-td">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="catalog-pagination">
        <div className="catalog-page-info">
          {t.showing} {totalRows > 0 ? start : 0}–{end} {t.of} {totalRows} {t.rows}
        </div>

        <div className="catalog-page-controls">
          <select
            value={pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="catalog-page-select"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>
                {size} {t.perPage}
              </option>
            ))}
          </select>

          <div className="catalog-page-buttons">
            <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="catalog-page-btn">
              {t.first}
            </button>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="catalog-page-btn">
              {t.prev}
            </button>
            <span className="catalog-page-number">
              {pageIndex + 1} / {table.getPageCount()}
            </span>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="catalog-page-btn">
              {t.next}
            </button>
            <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="catalog-page-btn">
              {t.last}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .catalog-table-wrapper {
          width: 100%;
          margin: 2rem 0;
        }

        .catalog-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .catalog-search-box {
          position: relative;
          flex: 1;
          min-width: 200px;
          max-width: 400px;
        }

        .catalog-search-icon {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.4;
        }

        .catalog-search-input {
          width: 100%;
          padding: 0.5rem 0.75rem 0.5rem 2.25rem;
          border: 1px solid #b8c9dc;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          background: transparent;
          color: inherit;
          transition: border-color 0.2s;
        }
        .dark .catalog-search-input {
          border-color: #3a7cb8;
        }
        .catalog-search-input:focus {
          outline: none;
          border-color: #0E3F75;
        }
        .dark .catalog-search-input:focus {
          border-color: #5B9BD5;
        }

        .catalog-download-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #0E3F75;
          color: #fff;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: background 0.2s;
          white-space: nowrap;
        }
        .dark .catalog-download-btn {
          background: #5B9BD5;
          color: #1a5c94;
        }
        .catalog-download-btn:hover {
          background: #082f52;
        }
        .dark .catalog-download-btn:hover {
          background: #7CB8E8;
        }

        .catalog-table-scroll {
          overflow-x: auto;
          border: 1px solid #c8d8e8;
          border-radius: 0.5rem;
        }
        .dark .catalog-table-scroll {
          border-color: #1a5c94;
        }

        .catalog-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.8125rem;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          white-space: nowrap;
        }

        .catalog-th {
          padding: 0.625rem 0.75rem;
          text-align: left;
          font-weight: 600;
          font-family: 'Inter', 'Noto Sans SC', sans-serif;
          font-size: 0.8125rem;
          background: #e4edf5;
          border-bottom: 2px solid #c2d4e6;
          color: #1e3a5f;
        }
        .dark .catalog-th {
          background: #1a5c94;
          border-bottom-color: #3a7cb8;
          color: #c2d4e6;
        }

        .catalog-th-content {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .catalog-sort-indicator {
          font-size: 0.625rem;
          opacity: 0.5;
        }

        .catalog-row:nth-child(even) {
          background: #f0f5fa;
        }
        .dark .catalog-row:nth-child(even) {
          background: #0E3F75;
        }
        .catalog-row:hover {
          background: #dce8f3;
        }
        .dark .catalog-row:hover {
          background: #133555;
        }

        .catalog-td {
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid #e4edf5;
          color: #2a4a6b;
        }
        .dark .catalog-td {
          border-bottom-color: #1a5c94;
          color: #a8bdd4;
        }

        .catalog-empty {
          padding: 2rem;
          text-align: center;
          color: #6a8aaa;
        }

        .catalog-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
          flex-wrap: wrap;
          font-size: 0.8125rem;
        }

        .catalog-page-info {
          color: #4a6a8a;
        }
        .dark .catalog-page-info {
          color: #6a8aaa;
        }

        .catalog-page-controls {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .catalog-page-select {
          padding: 0.375rem 0.5rem;
          border: 1px solid #b8c9dc;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          background: transparent;
          color: inherit;
        }
        .dark .catalog-page-select {
          border-color: #3a7cb8;
        }

        .catalog-page-buttons {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .catalog-page-btn {
          padding: 0.375rem 0.625rem;
          border: 1px solid #b8c9dc;
          border-radius: 0.375rem;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font-size: 0.875rem;
          line-height: 1;
          transition: background 0.15s;
        }
        .dark .catalog-page-btn {
          border-color: #3a7cb8;
        }
        .catalog-page-btn:hover:not(:disabled) {
          background: #e4edf5;
        }
        .dark .catalog-page-btn:hover:not(:disabled) {
          background: #1a5c94;
        }
        .catalog-page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .catalog-page-number {
          padding: 0 0.5rem;
          color: #4a6a8a;
        }
        .dark .catalog-page-number {
          color: #6a8aaa;
        }
      `}</style>
    </div>
  );
}
