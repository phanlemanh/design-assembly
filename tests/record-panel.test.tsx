// decision:record-panel
// A record opens the way the person chose, keeps its place in the address, and hands focus back to
// what opened it however it closes.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it } from "vitest";

import { RECORD_LAYOUT, WithRecord } from "../src/components/record-panel.tsx";
import { Button } from "../src/components/ui/button.tsx";
import { useOpenRecord } from "../src/lib/open-record.ts";

const NAMES = { "1": "First", "2": "Second" } as Record<string, string>;

function List() {
  const record = useOpenRecord();
  const [query, setQuery] = useState("");
  return (
    <WithRecord
      record={record}
      title={record.id ? (NAMES[record.id] ?? null) : null}
      closeLabel="Close"
      content={<p>Fields</p>}
    >
      <input aria-label="Filter" value={query} onChange={(e) => setQuery(e.target.value)} />
      {Object.entries(NAMES).map(([id, name]) => (
        <Button key={id} onClick={(event) => record.open(id, event.currentTarget)}>
          {name}
        </Button>
      ))}
    </WithRecord>
  );
}

const open = (name: string) => {
  const control = screen.getByRole("button", { name });
  control.focus();
  fireEvent.click(control);
  return control;
};

afterEach(() => window.history.replaceState(null, "", "/"));

it("opens a record with focus on it, and names it in the address", () => {
  window.history.replaceState(null, "", "/");
  render(<List />);
  open("First");
  expect(window.location.search).toBe("?record=1");
  expect(screen.getByRole("heading", { name: "First" })).toBeInTheDocument();
  if (RECORD_LAYOUT !== "over") {
    expect(screen.getByRole("heading", { name: "First" })).toHaveFocus();
    expect(document.querySelector("[data-record-panel]")).toHaveAttribute(
      "data-record-panel",
      RECORD_LAYOUT,
    );
  }
});

it("gives focus back to what opened it when the record closes", async () => {
  window.history.replaceState(null, "", "/");
  render(<List />);
  const opener = open("Second");
  fireEvent.click(screen.getByRole("button", { name: "Close" }));
  // Closing what was opened here is a step back, as the browser's own Back would take.
  await act(() => new Promise((done) => setTimeout(done, 20)));
  expect(window.location.search).toBe("");
  expect(screen.queryByRole("heading", { name: "Second" })).not.toBeInTheDocument();
  expect(opener).toHaveFocus();
});

it("closes on Escape, keeps what was typed in the list, and opens from a link without taking focus", () => {
  window.history.replaceState(null, "", "/?record=2");
  render(<List />);
  expect(screen.getByRole("heading", { name: "Second" })).not.toHaveFocus();
  fireEvent.change(screen.getByLabelText("Filter"), { target: { value: "kept" } });
  fireEvent.keyDown(screen.getByRole("heading", { name: "Second" }), { key: "Escape" });
  expect(window.location.search).toBe("");
  expect(screen.queryByRole("heading", { name: "Second" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Filter")).toHaveValue("kept");
});

it("shows nothing for a record the list does not have", () => {
  window.history.replaceState(null, "", "/?record=9");
  render(<List />);
  expect(document.querySelector("[data-record-panel]")).toBeNull();
});
