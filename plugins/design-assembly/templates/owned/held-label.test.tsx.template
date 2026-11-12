// A control keeps its width while its action waits, and the page never reads as saying "working"
// before it is.
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { HeldLabel } from "../src/components/held-label.tsx";

it("shows one label, and keeps room for the other without saying it", () => {
  const { container, rerender } = render(<HeldLabel label="Add" busyLabel="Adding" busy={false} />);
  expect(screen.getByText("Add")).toBeVisible();
  // The other label is there for its width only: hidden from sight and from a reader, and not
  // found by a check that looks for its words.
  expect(container.textContent).not.toContain("Adding");
  expect(container.querySelector("[aria-hidden='true']")).toHaveClass("invisible");
  rerender(<HeldLabel label="Add" busyLabel="Adding" busy />);
  expect(screen.getByText("Adding")).toBeVisible();
  expect(container.textContent).not.toContain("Add‌");
  expect(container.textContent).toContain("Adding");
});
