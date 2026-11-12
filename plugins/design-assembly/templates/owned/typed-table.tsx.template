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
// `values` are what the column shows now. A text column uses them to be no wider than it needs.
export type TypedColumn = { field: ColumnField; header: string; values?: readonly unknown[] };
export type Density = "normal" | "dense";

type ColumnType = { base: string; align: string; sample: number };
const TYPES: Record<string, ColumnType> = columns.types;
const FIELDS: Record<string, string> = columns.fields;
const UNTYPED: ColumnType = { base: "text", align: "left", sample: 1 };

const ALIGN_CLASS = { left: "text-left", right: "text-right tabular-nums" } as const;
// When a table is wider than its place it scrolls sideways inside itself. The column that holds a
// row's actions always stays where it is, so a person can act on a row at any width. The first
// column, which says which item a row is, stays too once the screen is wide enough: on a phone,
// two pinned columns would leave no room to read the columns between them.
const PINNED_START = "sm:first:sticky sm:first:left-0 sm:first:z-10 sm:first:bg-background";
const PINNED_END = "sticky right-0 z-10 bg-background";
// A row is as tall as its tallest cell needs, so the dense row also tightens its cells: no
// padding above and below a cell (a cell that holds a control would otherwise push the row past
// the dense height), and a header cell no taller than the row.
const ROW_CLASS: Record<Density, string> = {
  normal: "h-12",
  dense: "h-8 [&>td]:py-0 [&>th]:h-8",
};

function columnType(field: ColumnField): ColumnType {
  return TYPES[FIELDS[field] ?? ""] ?? UNTYPED;
}

function alignOf(field: ColumnField): keyof typeof ALIGN_CLASS {
  return columnType(field).align === "right" ? "right" : "left";
}

// One more character on a column fitted to its values: letters are not all as wide as a digit,
// so an exact fit would cut the longest value.
const FIT_SLACK_CH = 1;

/**
 * The least width of a column, in characters: the longer of its header and of a typical value,
 * plus padding. A text column is fitted to the longest value it shows, up to the typical length of
 * its type, so a column of short codes does not take the room of a column of names.
 */
function columnWidthCh({ field, header, values }: TypedColumn): number {
  const type = columnType(field);
  const lengths = (values ?? [])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value).length);
  if (type.base !== "text" || lengths.length === 0) {
    return Math.max(header.length, type.sample) + columns.padding_ch;
  }
  const fitted = Math.min(type.sample, Math.max(...lengths));
  return Math.max(header.length, fitted) + columns.padding_ch + FIT_SLACK_CH;
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
  values,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<typeof TableHead>, "children"> & TypedColumn) {
  return (
    <TableHead
      className={cn(ALIGN_CLASS[alignOf(field)], PINNED_START, className)}
      style={{
        minWidth: `${columnWidthCh(values ? { field, header, values } : { field, header })}ch`,
        ...style,
      }}
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
  return (
    <TableCell className={cn(ALIGN_CLASS[alignOf(field)], PINNED_START, className)} {...props} />
  );
}

/** The header of the column that holds a row's actions and no data. It stays in view. */
function TypedActionsHead({ className, ...props }: React.ComponentProps<typeof TableHead>) {
  return <TableHead className={cn(PINNED_END, className)} {...props} />;
}

/** The cell that holds a row's actions. It stays in view when the table scrolls sideways. */
function TypedActions({ className, ...props }: React.ComponentProps<typeof TableCell>) {
  return <TableCell className={cn(PINNED_END, className)} {...props} />;
}

export {
  TypedTable,
  TypedRow,
  TypedHead,
  TypedCell,
  TypedActionsHead,
  TypedActions,
  columnWidthCh,
  densityFor,
};
