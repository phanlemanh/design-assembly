// Two or more actions on a row go behind one button that opens them as a list of buttons
// (design/behaviors.md, actions on a row). This holds how that button behaves; the browser test
// holds that it stays in view and that focus never falls on nothing.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";

import { Button } from "../src/components/ui/button.tsx";
import { RowActions } from "../src/components/ui/row-actions.tsx";

function Row(props: { row: string; pending?: boolean; onDone?: () => void }) {
  return (
    <RowActions
      name={`Actions for ${props.row}`}
      pending={props.pending}
      busyName={`Working on ${props.row}`}
    >
      <Button onClick={props.onDone}>Put aside</Button>
      <Button variant="destructive">Delete</Button>
    </RowActions>
  );
}

const open = (row: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Actions for ${row}` }));

it("opens the row's actions as buttons, named for the row", async () => {
  render(<Row row="first" />);
  expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  open("first");
  const list = await screen.findByRole("dialog", { name: "Actions for first" });
  expect(list).toContainElement(screen.getByRole("button", { name: "Put aside" }));
  expect(list).toContainElement(screen.getByRole("button", { name: "Delete" }));
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
});

it("pressing an action closes the list and gives focus back to the row's button", async () => {
  let done = 0;
  render(<Row row="first" onDone={() => done++} />);
  open("first");
  fireEvent.click(await screen.findByRole("button", { name: "Put aside" }));
  expect(done).toBe(1);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Actions for first" })).toHaveFocus();
});

it("while the row's action waits, its button is held: it keeps focus and does not open", async () => {
  function Waiting() {
    const [pending, setPending] = useState(false);
    return <Row row="first" pending={pending} onDone={() => setPending(true)} />;
  }
  render(<Waiting />);
  open("first");
  fireEvent.click(await screen.findByRole("button", { name: "Put aside" }));
  const button = screen.getByRole("button", { name: "Actions for first" });
  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).toHaveFocus();
  fireEvent.click(button);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("one list is open at a time", async () => {
  render(
    <>
      <Row row="first" />
      <Row row="second" />
    </>,
  );
  open("first");
  await screen.findByRole("dialog", { name: "Actions for first" });
  fireEvent.pointerDown(screen.getByRole("button", { name: "Actions for second" }));
  open("second");
  await screen.findByRole("dialog", { name: "Actions for second" });
  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Actions for first" })).not.toBeInTheDocument(),
  );
});

it("shows no words of its own, so it takes the same small room at every width", () => {
  render(<Row row="first" />);
  expect(screen.getByRole("button", { name: "Actions for first" })).toHaveTextContent(/^$/);
});

it("from one second of waiting on, it shows it is working and a screen reader hears what", () => {
  vi.useFakeTimers();
  try {
    const { container } = render(<Row row="first" pending />);
    const spinning = () => container.querySelector(".motion-safe\\:animate-spin");
    expect(screen.getByRole("button", { name: "Actions for first" })).toBeInTheDocument();
    expect(spinning()).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1000));
    const button = screen.getByRole("button", { name: "Working on first" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(spinning()).toBeInTheDocument();
  } finally {
    vi.useRealTimers();
  }
});

it("a button the screen gives keeps its action's mark in the list, as a browser test reads it", async () => {
  render(
    <RowActions name="Actions for first">
      <Button data-model-action="putAside">Put aside</Button>
      <Button>Close</Button>
    </RowActions>,
  );
  open("first");
  const list = await screen.findByRole("dialog", { name: "Actions for first" });
  expect(screen.getByRole("button", { name: "Put aside" })).toHaveAttribute(
    "data-model-action",
    "putAside",
  );
  // The row's own button runs no action of the model: it carries no mark.
  expect(screen.getByRole("button", { name: "Actions for first" })).not.toHaveAttribute(
    "data-model-action",
  );
  expect(list.querySelectorAll("[data-model-action]")).toHaveLength(1);
});
