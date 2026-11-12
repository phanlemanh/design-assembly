"use client";

// Table parts that take their look from the column type of a data field: the side the column is
// aligned to, how wide it is at least, and how tall the rows are. A screen names the field and the
// header and sets none of the three itself. The numbers are in design/columns.json, written by
// `make design-columns` from design/column-types.json and the data model.
import * as React from "react";
import { cn } from "cn";

import columns from "../../../design/columns.json";
import { Table, TableCell, TableHead, TableRow } from "@/components/ui/table";

export type ColumnField = keyof typeof columns.fields;
export type TypedColumn = { field: ColumnField; header: string };
export type Density = "normal" | "dense";

type ColumnType = { base: string; align: string; sample: number };
const TYPES: Record<string, ColumnType> = columns.types;
const FIELDS: Record<string, string> = columns.fields;
const UNTYPED: ColumnType = { base: "text", align: "left", sample: 1 };

const ALIGN_CLASS = { left: "text-left", right: "text-right tabular-nums" } as const;
// A row is as tall as its tallest cell needs, so the dense row also tightens the padding of its
// cells: otherwise a cell that holds a control keeps the row above the dense height.
const ROW_CLASS: Record<Density, string> = { normal: "h-12", dense: "h-10 [&>td]:py-1" };

function columnType(field: ColumnField): ColumnType {
  return TYPES[FIELDS[field] ?? ""] ?? UNTYPED;
}

function alignOf(field: ColumnField): keyof typeof ALIGN_CLASS {
  return columnType(field).align === "right" ? "right" : "left";
}

/** The least width of a column, in characters: the longer of its header and of a typical value, plus padding. */
function columnWidthCh({ field, header }: TypedColumn): number {
  return Math.max(header.length, columnType(field).sample) + columns.padding_ch;
}

/** Dense only when the columns cannot all be shown at their least width. */
function densityFor(totalCh: number, availableCh: number): Density {
  return totalCh > availableCh ? "dense" : "normal";
}

const DensityContext = React.createContext<Density>("normal");

function TypedTable({
  columns: list,
  ...props
}: React.ComponentProps<typeof Table> & { columns: readonly TypedColumn[] }) {
  const probe = React.useRef<HTMLSpanElement>(null);
  const [density, setDensity] = React.useState<Density>("normal");
  const total = list.reduce((sum, column) => sum + columnWidthCh(column), 0);

  React.useEffect(() => {
    const mark = probe.current;
    const box = mark?.parentElement;
    if (!mark || !box || typeof ResizeObserver === "undefined") return;
    // The observer reports once when it starts and again whenever the space changes.
    const observer = new ResizeObserver(() => {
      const ch = mark.getBoundingClientRect().width;
      if (ch > 0) setDensity(densityFor(total, box.getBoundingClientRect().width / ch));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, [total]);

  return (
    <div data-slot="typed-table" data-density={density} className="relative">
      <span ref={probe} aria-hidden="true" className="invisible absolute w-[1ch] text-sm" />
      <DensityContext.Provider value={density}>
        <Table {...props} />
      </DensityContext.Provider>
    </div>
  );
}

function TypedRow({ className, ...props }: React.ComponentProps<typeof TableRow>) {
  const density = React.useContext(DensityContext);
  return <TableRow className={cn(ROW_CLASS[density], className)} {...props} />;
}

function TypedHead({
  field,
  header,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<typeof TableHead>, "children"> & TypedColumn) {
  return (
    <TableHead
      className={cn(ALIGN_CLASS[alignOf(field)], className)}
      style={{ minWidth: `${columnWidthCh({ field, header })}ch`, ...style }}
      {...props}
    >
      {header}
    </TableHead>
  );
}

function TypedCell({
  field,
  className,
  ...props
}: React.ComponentProps<typeof TableCell> & { field: ColumnField }) {
  return <TableCell className={cn(ALIGN_CLASS[alignOf(field)], className)} {...props} />;
}

export { TypedTable, TypedRow, TypedHead, TypedCell, columnWidthCh, densityFor };
