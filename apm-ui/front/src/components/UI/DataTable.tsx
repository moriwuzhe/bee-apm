export interface Column<T> {
  key: string;
  title: string;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns = [],
  data = [],
  rowKey = "id",
}: {
  columns?: Column<T>[];
  data?: T[];
  rowKey?: string;
}) {
  return (
    <div data-cmp="DataTable" className="w-full overflow-x-auto scrollbar-thin">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left px-3 py-2.5 text-xs font-medium"
                style={{ color: "var(--muted-foreground)", width: col.width, whiteSpace: "nowrap" }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={String(row[rowKey] || i)}
              className="table-row-hover transition-colors"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 text-xs" style={{ color: "var(--foreground)", whiteSpace: "nowrap" }}>
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-12 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          暂无数据
        </div>
      )}
    </div>
  );
}
