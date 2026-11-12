// decision:column-align decision:column-width decision:table-density
// The table parts take alignment, width and row height from the column type of a field. These
// tests read design/columns.json, so they hold for whatever fields the data model declares.
import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import columns from "../design/columns.json";
import { TableBody, TableHeader } from "../src/components/ui/table.tsx";
import {
  columnWidthCh,
  densityFor,
  TypedCell,
  TypedHead,
  TypedRow,
  TypedTable,
  type ColumnField,
  type TypedColumn,
} from "../src/components/ui/typed-table.tsx";

const FIELDS = Object.keys(columns.fields) as ColumnField[];
const TYPES: Record<string, { align: string; sample: number }> = columns.types;
const typeOf = (field: ColumnField) =>
  TYPES[(columns.fields as Record<string, string>)[field] ?? ""];

function show(list: TypedColumn[]) {
  return render(
    <TypedTable aria-label="Sample" columns={list}>
      <TableHeader>
        <TypedRow>
          {list.map((column) => (
            <TypedHead key={column.field} {...column} />
          ))}
        </TypedRow>
      </TableHeader>
      <TableBody>
        <TypedRow>
          {list.map((column) => (
            <TypedCell key={column.field} field={column.field}>
              value
            </TypedCell>
          ))}
        </TypedRow>
      </TableBody>
    </TypedTable>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("the data model declares at least one typed field", () => {
  expect(FIELDS.length).toBeGreaterThan(0);
});

it.each(FIELDS)("%s is aligned as its column type says, in the head and in the cell", (field) => {
  show([{ field, header: "Header" }]);
  const side = typeOf(field)?.align === "right" ? "text-right" : "text-left";
  const other = side === "text-right" ? "text-left" : "text-right";
  for (const part of [screen.getByRole("columnheader"), screen.getByRole("cell")]) {
    expect(part).toHaveClass(side);
    expect(part).not.toHaveClass(other);
  }
});

it("a column is at least as wide as the longer of its header and a typical value, plus padding", () => {
  for (const field of FIELDS) {
    const sample = typeOf(field)?.sample ?? 0;
    expect(columnWidthCh({ field, header: "" })).toBe(sample + columns.padding_ch);
    const long = "x".repeat(sample + 5);
    expect(columnWidthCh({ field, header: long })).toBe(long.length + columns.padding_ch);
  }
  const [field] = FIELDS;
  if (!field) return;
  show([{ field, header: "Header" }]);
  const expected = `${columnWidthCh({ field, header: "Header" })}ch`;
  expect(screen.getByRole("columnheader").style.minWidth).toBe(expected);
});

it("a table is dense only when its columns cannot all be shown at their least width", () => {
  expect(densityFor(80, 80)).toBe("normal");
  expect(densityFor(81, 80)).toBe("dense");
  expect(densityFor(10, 80)).toBe("normal");
});

// A browser that reports sizes: one character is 8 px wide, and the table has `width` px.
function measuredAt(width: number) {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      constructor(private readonly report: () => void) {}
      observe() {
        this.report();
      }
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    return { width: this.tagName === "SPAN" ? 8 : width } as DOMRect;
  });
}

it("rows take their height from the density of the table, not from the screen", () => {
  const list = FIELDS.map((field) => ({ field, header: "Header" }));
  const total = list.reduce((sum, column) => sum + columnWidthCh(column), 0);

  measuredAt(total * 8);
  const roomy = show(list);
  for (const row of screen.getAllByRole("row")) expect(row).toHaveClass("h-12");
  roomy.unmount();

  measuredAt(total * 8 - 8);
  show(list);
  for (const row of screen.getAllByRole("row")) expect(row).toHaveClass("h-10");
});
