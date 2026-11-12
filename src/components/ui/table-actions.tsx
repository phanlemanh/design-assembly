// The column that holds a row's actions and no data. When a table is wider than its place it
// scrolls sideways inside itself; this column stays where it is, so a person can act on a row at
// any width. It works with the plain table parts and the typed ones alike.
import * as React from "react";
import { cn } from "cn";

import { TableCell, TableHead } from "@/components/ui/table";

const PINNED_END = "sticky right-0 z-10 bg-background";

/** The header of the column that holds a row's actions. It stays in view. */
function TableActionsHead({ className, ...props }: React.ComponentProps<typeof TableHead>) {
  return <TableHead className={cn(PINNED_END, className)} {...props} />;
}

/** The cell that holds a row's actions. It stays in view when the table scrolls sideways. */
function TableActions({ className, ...props }: React.ComponentProps<typeof TableCell>) {
  return <TableCell className={cn(PINNED_END, className)} {...props} />;
}

export { TableActionsHead, TableActions };
