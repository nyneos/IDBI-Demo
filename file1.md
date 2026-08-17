// components/table/GroupedTable.tsx
import React from "react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { Draggable } from "../../components/table/Draggable";
import { Droppable } from "../../components/table/Droppable";
import { FileText, ChevronRight, ChevronDown } from "lucide-react";
import { flexRender, type Table, type ColumnDef } from "@tanstack/react-table";
import type { Section } from "./NyneOSTable2";
import { formatUTCtoIST } from "../../utils/dateUtils";
import LoadingSpinner from "../../components/layout/LoadingSpinner";

type GroupedTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
  aggregatableColumns?: string[];
  loading?: boolean;
  sections?: Section<T>[];
};

const collectLeafRows = (rows: any[]): any[] => {
  const leafRows: any[] = [];
  const seen = new Set<string>();

  const walk = (rs: any[]) => {
    rs.forEach((r) => {
      const id = typeof r?.id === "string" ? r.id : undefined;
      if (id && seen.has(id)) return;

      if (Array.isArray(r?.subRows) && r.subRows.length > 0) {
        walk(r.subRows);
        return;
      }

      if (id) seen.add(id);
      leafRows.push(r);
    });
  };

  walk(rows);
  return leafRows;
};

const calculateGroupTotals = (
  rows: any[],
  visibleCols: any[],
  aggregatableColumns?: string[]
): Record<string, number> => {
  const totals: Record<string, number> = {};
  const leaves = collectLeafRows(rows);

  visibleCols.forEach((col) => {
    if (aggregatableColumns && !aggregatableColumns.includes(col.id)) {
      return;
    }

    let sum = 0;
    let foundNumeric = false;

    leaves.forEach((r) => {
      const val =
        typeof r.getValue === "function"
          ? r.getValue(col.id)
          : r?.original?.[col.id] ?? r?.[col.id] ?? r?.[col.accessorKey];

      if (typeof val === "number" && Number.isFinite(val)) {
        sum += val;
        foundNumeric = true;
      } else if (
        aggregatableColumns?.includes(col.id) &&
        typeof val === "string" &&
        val.trim() !== "" &&
        !isNaN(Number(val))
      ) {
        sum += Number(val);
        foundNumeric = true;
      }
    });

    if (foundNumeric) {
      totals[col.id] = sum;
    }
  });

  return totals;
};

function NyneOSGroupedTable<T>({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  aggregatableColumns,
  loading,
  sections,
}: GroupedTableProps<T>) {
  const [columnOrder, setColumnOrder] = React.useState<string[]>(
    table.getAllLeafColumns().map((col) => col.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (
      nonDraggableColumns.includes(active.id as string) ||
      nonDraggableColumns.includes(over.id as string)
    ) {
      return;
    }
    if (active.id !== over.id) {
      const oldIndex = columnOrder.indexOf(active.id as string);
      const newIndex = columnOrder.indexOf(over.id as string);
      const newOrder = [...columnOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      setColumnOrder(newOrder);
    }
  };

  React.useEffect(() => {
    table.setColumnOrder(columnOrder);
  }, [columnOrder, table]);

  // helper: returns true if sections provide fields for this row
  const hasExpandableSections = (row: any) =>
    Boolean(
      (Array.isArray((row as any).original) ? false : true) &&
      (typeof (row as any).original === "object") &&
      (Array.isArray((sections ?? []).filter(Boolean)) &&
        sections?.some((s) => {
          const f = typeof s.fields === "function" ? s.fields(row.original) : s.fields;
          return Array.isArray(f) && f.length > 0;
        }))
    );

  const formatValue = (key: string | number | symbol, value: any) => {
    if (value === undefined || value === null || value === "") return "—";
    const keyStr = String(key).toLowerCase();
    if (keyStr.includes("date") || keyStr.endsWith("at") || keyStr.includes("time")) {
      try {
        return formatUTCtoIST(String(value));
      } catch {
        return String(value);
      }
    }
    if (typeof value === "number") return value.toLocaleString("en-IN");
    return String(value);
  };

  const toggleRowExpansion = (row: any) => {
    try {
      if (typeof (table as any).toggleRowExpanded === "function") {
        (table as any).toggleRowExpanded(row.id);
        return;
      }
      if (typeof row.toggleExpanded === "function") {
        row.toggleExpanded(!row.getIsExpanded?.());
        return;
      }
      const handler = row.getToggleExpandedHandler?.();
      if (typeof handler === "function") handler();
    } catch {
      // noop
    }
  };

  const renderGroupedRow = (
    row: any,
    depth = 0,
    seen?: Set<string>,
    rowCounter?: { count: number }
  ) => {
    if (!row) return null;

    if (Array.isArray(row)) {
      return row.map((r, i) => (
        <React.Fragment key={i}>
          {renderGroupedRow(r, depth, seen, rowCounter)}
        </React.Fragment>
      ));
    }

    const hasGetIsGrouped = typeof row.getIsGrouped === "function";
    const hasGetIsAggregated = typeof row.getIsAggregated === "function";

    if (hasGetIsGrouped && row.getIsGrouped()) {
      if (seen && seen.has(row.id)) return null;
      seen?.add(row.id);

      const visibleCols = table.getVisibleLeafColumns();
      const totals = calculateGroupTotals(row.subRows ?? [], visibleCols, aggregatableColumns);
      return (
        <React.Fragment key={row.id}>
          <tr
            className="bg-gray-100 cursor-pointer hover:bg-gray-200"
            onClick={() => toggleRowExpansion(row)}
          >
            <td colSpan={table.getVisibleLeafColumns().length} className="px-6 py-2 font-medium text-primary">
              <div
                className="flex items-center"
                style={{ paddingLeft: `${depth * 20}px` }}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-2" />
                )}
                <span className="font-semibold">
                  {row.groupingColumnId?.replace(/_/g, " ")}: {" "}
                </span>
                <div className="ml-1 flex-1 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="truncate text-sm min-w-0">
                      {row.getValue(row.groupingColumnId)}
                    </span>
                    <span className="text-xs text-secondary-text whitespace-nowrap">
                      ({row.subRows.length}{" "}
                      {row.subRows.length === 1 ? "row" : "rows"})
                    </span>
                  </div>

                  {Object.keys(totals).length > 0 && (
                    <div className="flex gap-2 text-primary font-medium font-sm whitespace-nowrap">
                      {Object.entries(totals).map(([colId, val]) => (
                        <span key={colId} className="whitespace-nowrap">
                          {colId.replace(/_/g, " ")}: {" "}
                          <span className="font-semibold text-secondary-text font-md">
                            {val.toLocaleString()}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
          {row.getIsExpanded() &&
            (() => {
              const sub = row.subRows || [];
              const elements: any[] = [];

              sub.forEach((subRow: any) => {
                elements.push(
                  renderGroupedRow(subRow, depth + 1, seen, rowCounter)
                );
              });

              const isLeafGroup =
                sub.length > 0 &&
                typeof sub[0].getIsGrouped === "function" &&
                !sub[0].getIsGrouped();

              if (isLeafGroup) {
                const totals = calculateGroupTotals(
                  sub,
                  table.getVisibleLeafColumns(),
                  aggregatableColumns
                );

                if (Object.keys(totals).length > 0) {
                  elements.push(
                    <tr
                      key={`${row.id}-subtotal`}
                      className="bg-primary-lt text-white font-semibold"
                    >
                      {table
                        .getVisibleLeafColumns()
                        .map((col: any, idx: number) => {
                          if (idx === 0) {
                            return (
                              <td
                                key={col.id}
                                className="px-6 py-3 text-sm border-b border-border"
                              >
                                Total
                              </td>
                            );
                          }

                          const val = totals[col.id];
                          return (
                            <td
                              key={col.id}
                              className="px-6 py-3 text-sm border-b border-border text-left"
                            >
                              {val !== undefined ? val.toLocaleString() : ""}
                            </td>
                          );
                        })}
                    </tr>
                  );
                }
              }

              return elements;
            })()}
        </React.Fragment>
      );
    }

    if (hasGetIsAggregated && row.getIsAggregated()) {
      if (seen && seen.has(row.id)) return null;
      seen?.add(row.id);
      return (
        <tr key={row.id} className="bg-gray-50 font-semibold">
          {row.getVisibleCells().map((cell: any) => (
            <td
              key={cell.id}
              className="px-6 py-3 text-sm border-b border-border"
            >
              {flexRender(
                cell.column.columnDef.aggregatedCell ??
                  cell.column.columnDef.cell,
                cell.getContext()
              )}
            </td>
          ))}
        </tr>
      );
    }

    const visibleCellsFn =
      typeof row.getVisibleCells === "function" ? row.getVisibleCells : null;
    if (visibleCellsFn) {
      if (seen && seen.has(row.id)) return null;
      seen?.add(row.id);
      const isEven = rowCounter
        ? rowCounter.count % 2 === 0
        : row.index % 2 === 0;
      if (rowCounter) rowCounter.count++;

      const canExpand = Boolean(sections && hasExpandableSections(row));

      return (
        <React.Fragment key={row.id}>
          <tr
            key={row.id}
            onClick={(e) => {
              if (!canExpand) return;
              const tgt = e.target as HTMLElement;
              if (tgt.closest("input, button, a, select, textarea, label")) return;
              toggleRowExpansion(row);
            }}
            className={`${isEven ? "bg-primary-lg" : "bg-secondary-color-lt"} ${canExpand ? "cursor-pointer" : ""}`}
          >
            {row.getVisibleCells().map((cell: any) => (
              <td
                key={cell.id}
                className="px-6 py-4 text-secondary-text-dark font-normal whitespace-nowrap text-sm border-b border-border"
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>

          {row.getIsExpanded() && sections && (
            <tr key={`${row.id}-expanded`}>
              <td colSpan={table.getVisibleLeafColumns().length} className="p-6 bg-primary-lg">
                <div className="bg-secondary-color-lt rounded-lg p-4 border border-border">
                  {sections.map(({ title, fields }) => (
                    <div key={title} className="mb-6">
                      <div className="text-md font-medium text-primary mb-3 pb-2">
                        {title}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                        {(typeof fields === "function" ? fields(row.original) : fields).map((field: any) => {
                          const key = field.key;
                          const value = row.original[key as keyof T];
                          const display = typeof field.formatter === "function"
                            ? field.formatter(value, row.original)
                            : formatValue(key, value);
                          return (
                            <div className="flex flex-col space-y-1" key={String(key)}>
                              <label className="font-bold text-secondary-text capitalize">
                                {field.label || String(key).replace(/([A-Z])/g, " $1").trim()}
                              </label>
                              <span className="font-medium text-primary-lt">{display}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    }

    const plainObj = row;
    const visibleCols = table.getVisibleLeafColumns();

    const isEvenPlain = rowCounter ? rowCounter.count % 2 === 0 : true;
    if (rowCounter) rowCounter.count++;
    const canExpandPlain = Boolean(sections && hasExpandableSections(row));

    return (
      <React.Fragment key={JSON.stringify(plainObj).slice(0, 40)}>
        <tr
          key={JSON.stringify(plainObj).slice(0, 40)}
          onClick={(e) => {
            if (!canExpandPlain) return;
            const tgt = e.target as HTMLElement;
            if (tgt.closest("input, button, a, select, textarea, label")) return;
            toggleRowExpansion(row);
          }}
          className={`${isEvenPlain ? "bg-primary-md" : "bg-secondary-color-lt"} ${canExpandPlain ? "cursor-pointer" : ""}`}
        >
          {visibleCols.map((col: any) => (
            <td
              key={col.id}
              className="px-6 py-4 whitespace-nowrap text-sm border-b border-border"
            >
              {(plainObj && (plainObj[col.id] ?? plainObj[col.accessorKey])) ??
                ""}
            </td>
          ))}
        </tr>

        {row.getIsExpanded && row.getIsExpanded() && sections && (
          <tr key={`${row.id}-expanded`}>
            <td colSpan={table.getVisibleLeafColumns().length} className="p-6 bg-primary-lg">
              <div className="bg-secondary-color-lt rounded-lg p-4 border border-border">
                {sections.map(({ title, fields }) => (
                  <div key={title} className="mb-6">
                    <div className="text-md font-medium text-primary mb-3 pb-2">
                      {title}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      {(typeof fields === "function" ? fields(row.original) : fields).map((field: any) => {
                        const key = field.key;
                        const value = row.original[key as keyof T];
                        const display = typeof field.formatter === "function"
                          ? field.formatter(value, row.original)
                          : formatValue(key, value);
                        return (
                          <div className="flex flex-col space-y-1" key={String(key)}>
                            <label className="font-bold text-secondary-text capitalize">
                              {field.label || String(key).replace(/([A-Z])/g, " $1").trim()}
                            </label>
                            <span className="font-medium text-primary-lt">{display}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="border shadow-lg border-border overflow-x-auto">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <DndContext
          onDragEnd={handleDragEnd}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="min-w-full table-auto">
            <thead className="bg-secondary-color rounded-xl">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isDraggable = !nonDraggableColumns.includes(
                      header.column.id
                    );
                    const canSort = !nonSortingColumns.includes(
                      header.column.id
                    );
                    const isSorted = header.column.getIsSorted?.() as
                      | false
                      | "asc"
                      | "desc";

                    return (
                      <th
                        key={header.id}
                        className="px-6 py-4 text-left text-sm font-semibold text-header-color uppercase tracking-wider border-b border-border select-none group"
                        style={{ width: header.getSize() }}
                      >
                        <div className="flex items-center gap-1">
                          <span
                            className={canSort ? "cursor-pointer" : ""}
                            onClick={
                              canSort
                                ? (e) =>
                                    header.column.toggleSorting?.(
                                      undefined,
                                      (e as React.MouseEvent).shiftKey
                                    )
                                : undefined
                            }
                          >
                            {isDraggable ? (
                              <Droppable id={header.column.id}>
                                <Draggable id={header.column.id}>
                                  <div className="cursor-move rounded p-1 transition duration-150 ease-in-out hover:bg-primary-lg">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                  </div>
                                </Draggable>
                              </Droppable>
                            ) : (
                              <div className="px-1">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                              </div>
                            )}
                            {canSort && (
                              <span className="ml-1 text-xs">
                                {isSorted === "asc" ? (
                                  "▲"
                                ) : isSorted === "desc" ? (
                                  "▼"
                                ) : (
                                  <span className="opacity-30">▲▼</span>
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-primary"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <FileText />
                      </div>
                      <p className="text-lg font-medium text-primary">
                        No Data Available
                      </p>
                      <p className="text-sm font-medium text-primary">
                        There are no data to display at the moment.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const seen = new Set<string>();
                  const rowCounter = { count: 0 };
                  return table
                    .getRowModel()
                    .rows.map((row) =>
                      renderGroupedRow(row, 0, seen, rowCounter)
                    );
                })()
              )}
            </tbody>
          </table>
        </DndContext>
      )}
    </div>
  );
}

export default NyneOSGroupedTable;
