// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// How a list of items is drawn: the same columns, the same status badge, the same name that opens
// the record. Two screens show the same table, so a person reads them as one thing
// (design/patterns/danh-sach.md). A screen that wants a different column changes it here.
import type { ReactNode } from "react";

import { ITEM_STATUS } from "@/components/item-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableBody, TableHeader } from "@/components/ui/table";
import { TableActions, TableActionsHead } from "@/components/ui/table-actions";
import {
  TypedCell,
  TypedHead,
  TypedRow,
  TypedTable,
  type TypedColumn,
} from "@/components/ui/typed-table";
import type { Item } from "@/example/data";
import { formatDate, formatMoney } from "@/lib/format";
import { LABELS } from "@/lib/labels";

// The data columns: a field of the data model and its header. The column type of the field decides
// alignment and width, so nothing here writes either. The last column holds actions, not data.
const COLUMNS: readonly TypedColumn[] = [
  { field: "Item.name", header: LABELS.columnName },
  { field: "Item.status", header: LABELS.columnStatus },
  { field: "Item.date", header: LABELS.columnDate },
  { field: "Item.total", header: LABELS.columnTotal },
];

export function ItemTable({
  label,
  items,
  onOpen,
  actions,
}: {
  label: string;
  items: readonly Item[];
  // The name of an item is the button that opens its record; `from` takes focus back on close.
  onOpen: (item: Item, from: HTMLElement) => void;
  // A screen that can act on a row passes the header of the column and what each row holds.
  actions?: { header: string; cell: (item: Item) => ReactNode };
}) {
  // The name column is text: it is fitted to the names being shown.
  const columns = COLUMNS.map((column) =>
    column.field === "Item.name" ? { ...column, values: items.map((item) => item.name) } : column,
  );
  return (
    <TypedTable aria-label={label} columns={columns}>
      <TableHeader>
        <TypedRow>
          {columns.map((column) => (
            <TypedHead key={column.field} {...column} />
          ))}
          {actions && <TableActionsHead>{actions.header}</TableActionsHead>}
        </TypedRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TypedRow key={item.id}>
            <TypedCell field="Item.name">
              <Button
                variant="link"
                size="sm"
                className="-ml-2"
                onClick={(event) => onOpen(item, event.currentTarget)}
              >
                {item.name}
              </Button>
            </TypedCell>
            <TypedCell field="Item.status">
              <Badge variant={ITEM_STATUS[item.status].variant}>
                {ITEM_STATUS[item.status].label}
              </Badge>
            </TypedCell>
            <TypedCell field="Item.date">{formatDate(item.date)}</TypedCell>
            <TypedCell field="Item.total">{formatMoney(item.total)}</TypedCell>
            {actions && <TableActions>{actions.cell(item)}</TableActions>}
          </TypedRow>
        ))}
      </TableBody>
    </TypedTable>
  );
}
