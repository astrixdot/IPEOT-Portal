import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, SearchX } from "lucide-react";
import { cx } from "../../lib/format";
import { EmptyState } from "./primitives";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  hideBelow?: "sm" | "md" | "lg" | "xl" | "2xl";
};

const hideClass = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell", xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" };

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  initialSort,
  empty,
  onRowClick,
  dense = false,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  caption: string;
  initialSort?: { key: string; dir: "asc" | "desc" };
  empty?: ReactNode;
  onRowClick?: (row: T) => void;
  dense?: boolean;
}) {
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((item) => item.key === sort.key);
    if (!column?.sortValue) return rows;
    const get = column.sortValue;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      const result = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return sort.dir === "asc" ? result : -result;
    });
  }, [rows, columns, sort]);

  if (rows.length === 0) {
    return <>{empty ?? <EmptyState icon={SearchX} title="Nothing matches these filters">Clear a filter to see more rows.</EmptyState>}</>;
  }

  return (
    <div className="-mx-5 overflow-x-auto scroll-thin">
      <table className="w-full border-separate md:min-w-[640px] border-spacing-0 text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sort?.key === column.key;
              const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}
                  className={cx(
                    "sticky top-0 border-y border-line bg-surface-2 px-3 py-2 text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-ink-3 uppercase first:pl-5 last:pr-5",
                    column.hideBelow && hideClass[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.sortValue ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded hover:text-ink"
                      onClick={() => setSort(active && sort.dir === "asc" ? { key: column.key, dir: "desc" } : { key: column.key, dir: "asc" })}
                    >
                      {column.header}
                      <Icon className={cx("size-3", active ? "text-cyan-ink" : "opacity-50")} aria-hidden />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={rowKey(row)}
              className={cx("group transition-colors hover:bg-surface-2", onRowClick && "cursor-pointer")}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cx(
                    "border-b border-line px-3 align-middle text-ink-2 first:pl-5 last:pr-5",
                    dense ? "py-2" : "py-2.5",
                    column.hideBelow && hideClass[column.hideBelow],
                    column.className,
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
