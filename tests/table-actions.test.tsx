// decision:row-actions-in-view
// The column of a row's actions stays in place when the table scrolls sideways, on the header and
// on every row. The browser test checks that it is in view; this one checks how it is drawn.
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { Button } from "../src/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../src/components/ui/table.tsx";
import { TableActions, TableActionsHead } from "../src/components/ui/table-actions.tsx";

it("the column of actions stays in place, on the header and on every row", () => {
  render(
    <Table aria-label="items">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableActionsHead>Actions</TableActionsHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>first</TableCell>
          <TableActions>act</TableActions>
        </TableRow>
      </TableBody>
    </Table>,
  );
  for (const cell of [screen.getByText("Actions"), screen.getByText("act")]) {
    expect(cell).toHaveClass("sticky", "right-0", "bg-background");
  }
  expect(screen.getByText("first")).not.toHaveClass("sticky");
});

it("a button in the column of actions keeps its action's mark", () => {
  render(
    <Table aria-label="items">
      <TableBody>
        <TableRow>
          <TableCell>first</TableCell>
          <TableActions>
            <Button data-model-action="putAside">Put aside</Button>
          </TableActions>
        </TableRow>
      </TableBody>
    </Table>,
  );
  expect(screen.getByRole("button", { name: "Put aside" })).toHaveAttribute(
    "data-model-action",
    "putAside",
  );
});
