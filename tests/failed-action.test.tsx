// decision:failed-action
// An action done at once that fails says so where the person acted: a toast that stays, spoken as
// an alert, with what to do next and a button that tries again. A failed undo never reads as done.
// Shown on the example screen: adding an item, and taking it back.
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { Toaster } from "../src/components/ui/sonner.tsx";
import { LABELS } from "../src/lib/labels.ts";

const answer = () => act(() => vi.advanceTimersByTimeAsync(400));
const press = async (name: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
  await answer();
};

async function show(scenario: string) {
  window.history.replaceState(null, "", `/?scenario=${scenario}`);
  const { ReferenceScreen } = await import("../src/example/ReferenceScreen.tsx");
  render(
    <>
      <ReferenceScreen />
      <Toaster />
    </>,
  );
  await answer();
}

beforeEach(() => {
  vi.resetModules();
  // The toast library takes a toast away on the next frame, so frames are faked too.
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "Date", "requestAnimationFrame", "cancelAnimationFrame"],
  });
});
afterEach(async () => {
  act(() => {
    toast.dismiss();
  });
  await act(() => vi.advanceTimersByTimeAsync(1000));
  vi.useRealTimers();
});

it("a failed add says what was not done and what to do next, as an alert, and never as done", async () => {
  await show("fail-create");
  await press(LABELS.emptyAction);
  await answer(); // the list is read again
  expect(screen.getByRole("alert")).toHaveTextContent(LABELS.addFailed);
  expect(screen.getByText(LABELS.errorDetail)).toBeInTheDocument();
  expect(screen.queryByText(LABELS.added(LABELS.sampleNewName))).not.toBeInTheDocument();
  // The screen is still usable: the person can start again from where they were.
  expect(
    within(screen.getByRole("main")).getByRole("button", { name: LABELS.emptyAction }),
  ).toBeInTheDocument();
});

it("the failure stays until the person answers it, and its button tries again", async () => {
  await show("fail-create");
  await press(LABELS.emptyAction);
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(screen.getByRole("alert")).toHaveTextContent(LABELS.addFailed);
  // Trying again asks the server again: the list goes back to waiting, then the failure is told anew.
  fireEvent.click(screen.getByRole("button", { name: LABELS.retry }));
  expect(screen.getByRole("status")).toHaveTextContent(LABELS.loading);
  await answer();
  await answer();
  expect(screen.getByRole("alert")).toHaveTextContent(LABELS.addFailed);
});

it("the failure can be closed", async () => {
  await show("fail-create");
  await press(LABELS.emptyAction);
  fireEvent.click(screen.getByRole("button", { name: LABELS.close }));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("a failed undo says the item is still there, and offers to try again", async () => {
  await show("fail-undo");
  await press(LABELS.emptyAction);
  expect(screen.getByText(LABELS.added(LABELS.sampleNewName))).toBeInTheDocument();
  await press(LABELS.undo);
  expect(screen.getByRole("alert")).toHaveTextContent(LABELS.undoFailed(LABELS.sampleNewName));
  expect(screen.getByRole("button", { name: LABELS.retry })).toBeInTheDocument();
  // The toast that said "added" has gone: one toast shows at a time.
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(screen.queryByText(LABELS.added(LABELS.sampleNewName))).not.toBeInTheDocument();
});
