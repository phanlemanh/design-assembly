// Focus never falls on nothing (design/behaviors.md, focus), and one item changing never sends the
// whole list back to loading. Shown on the example screen. The browser test of every page checks
// the same thing on every state that follows an action.
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { Toaster } from "../src/components/ui/sonner.tsx";
import { LABELS } from "../src/lib/labels.ts";
import { SLOW_AFTER_MS } from "../src/lib/slow.ts";

const answer = () => act(() => vi.advanceTimersByTimeAsync(400));
const button = (name: string) => screen.getByRole("button", { name });
const press = async (name: string) => {
  const control = button(name);
  control.focus();
  fireEvent.click(control);
  await answer();
};

async function show(scenario?: string) {
  window.history.replaceState(null, "", scenario ? `/?scenario=${scenario}` : "/");
  const { ReferenceScreen } = await import("../src/example/ReferenceScreen.tsx");
  render(
    <>
      <ReferenceScreen />
      <Toaster />
    </>,
  );
  await answer();
}

async function deleteItem(name: string) {
  await press(LABELS.deleteItem(name));
  await press(LABELS.deleteAction);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    toFake: ["setTimeout", "clearTimeout", "Date", "requestAnimationFrame", "cancelAnimationFrame"],
  });
});
afterEach(async () => {
  act(() => {
    toast.dismiss();
  });
  await answer();
  await answer();
  vi.useRealTimers();
});

it("when a row leaves, focus goes to the same action on the row after it", async () => {
  await show();
  await deleteItem(LABELS.sampleFirstName);
  expect(screen.queryByText(LABELS.sampleFirstName)).not.toBeInTheDocument();
  expect(button(LABELS.deleteItem(LABELS.sampleSecondName))).toHaveFocus();
});

it("with no row after it, focus goes to the row before", async () => {
  await show();
  await deleteItem(LABELS.sampleThirdName);
  expect(button(LABELS.deleteItem(LABELS.sampleSecondName))).toHaveFocus();
});

it("when the last row leaves, focus goes to the button of the empty state", async () => {
  await show();
  for (const name of [LABELS.sampleFirstName, LABELS.sampleSecondName, LABELS.sampleThirdName]) {
    await deleteItem(name);
  }
  expect(screen.getByText(LABELS.emptyTitle)).toBeInTheDocument();
  expect(button(LABELS.emptyAction)).toHaveFocus();
});

it("cancelling a delete gives focus back to the button that asked", async () => {
  await show();
  await press(LABELS.deleteItem(LABELS.sampleSecondName));
  await press(LABELS.cancel);
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(button(LABELS.deleteItem(LABELS.sampleSecondName))).toHaveFocus();
});

it("adding keeps the screen in place, and focus goes to the item that was added", async () => {
  await show("empty");
  const add = button(LABELS.emptyAction);
  add.focus();
  fireEvent.click(add);
  // Waiting for the answer: no loading state, and the button keeps focus while it is held.
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(add).toHaveAttribute("aria-disabled", "true");
  expect(add).toHaveFocus();
  await answer();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(button(LABELS.deleteItem(LABELS.sampleNewName))).toHaveFocus();
});

it("an add that takes long says so on its button, and only from a second on", async () => {
  await show("slow-create");
  fireEvent.click(button(LABELS.emptyAction));
  await act(() => vi.advanceTimersByTimeAsync(SLOW_AFTER_MS - 100));
  expect(screen.queryByText(LABELS.adding)).not.toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(200));
  expect(button(LABELS.adding)).toHaveAttribute("aria-disabled", "true");
});

it("the undo puts things back in place, says nothing more, and leaves focus on the screen", async () => {
  await show("empty");
  await press(LABELS.emptyAction);
  await press(LABELS.undo);
  await answer();
  // Back to the empty state without loading, and no second toast: the screen shows the result.
  expect(screen.getByText(LABELS.emptyTitle)).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByText(LABELS.added(LABELS.sampleNewName))).not.toBeInTheDocument();
  expect(button(LABELS.emptyAction)).toHaveFocus();
});

it("closing a toast gives focus back to where the person was", async () => {
  await show("fail-create");
  await press(LABELS.emptyAction);
  const close = button(LABELS.close);
  close.focus();
  fireEvent.click(close);
  await answer();
  expect(button(LABELS.emptyAction)).toHaveFocus();
});

it("a failed undo leaves the item and the focus where they were", async () => {
  await show("fail-undo");
  await press(LABELS.emptyAction);
  const row = button(LABELS.deleteItem(LABELS.sampleNewName));
  expect(row).toHaveFocus();
  const undo = button(LABELS.undo);
  undo.focus();
  fireEvent.click(undo);
  await answer();
  expect(screen.getByRole("alert")).toHaveTextContent(LABELS.undoFailed(LABELS.sampleNewName));
  expect(row).toHaveFocus();
});
