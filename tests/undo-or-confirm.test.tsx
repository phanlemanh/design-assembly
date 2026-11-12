// decision:undo-or-confirm decision:notification-channel
// A change that can be taken back happens at once and offers an undo in a toast; one that cannot
// asks first. Shown on the example screen: adding an item, and deleting one.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { Toaster } from "../src/components/ui/sonner.tsx";
import { LABELS } from "../src/lib/labels.ts";

const answer = () => act(() => vi.advanceTimersByTimeAsync(400));

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

beforeEach(() => {
  vi.resetModules();
  // The toast library takes a toast away on the next frame, so frames are faked too.
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "Date", "requestAnimationFrame", "cancelAnimationFrame"],
  });
});
afterEach(async () => {
  // Toasts outlive the screen that raised them: clear them, so one test does not see another's.
  act(() => {
    toast.dismiss();
  });
  await act(() => vi.advanceTimersByTimeAsync(1000));
  vi.useRealTimers();
});

it("adding happens at once, and the toast that says so offers the undo", async () => {
  await show("empty");
  fireEvent.click(screen.getByRole("button", { name: LABELS.emptyAction }));
  await answer();
  // No question was asked: the result is told, with a way back.
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByText(LABELS.added(LABELS.sampleNewName))).toBeInTheDocument();
  expect(screen.getByRole("button", { name: LABELS.undo })).toBeInTheDocument();
});

it("a toast that carries the undo stays until it is pressed or closed", async () => {
  await show("empty");
  fireEvent.click(screen.getByRole("button", { name: LABELS.emptyAction }));
  await answer();
  // Far longer than a toast with no button lasts.
  await act(() => vi.advanceTimersByTimeAsync(60_000));
  expect(screen.getByRole("button", { name: LABELS.undo })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: LABELS.close }));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  expect(screen.queryByRole("button", { name: LABELS.undo })).not.toBeInTheDocument();
});

it("a toast with no button goes away by itself, and a new toast takes the place of the old", async () => {
  await show();
  const { notifyDone } = await import("../src/lib/notify.ts");
  act(() => notifyDone("first", { label: LABELS.undo, run: () => undefined, close: LABELS.close }));
  await answer();
  act(() => notifyDone("second"));
  await answer(); // the old toast is marked as leaving on the next frame
  await answer(); // and is gone once it has left
  expect(screen.queryByText("first")).not.toBeInTheDocument();
  expect(screen.getByText("second")).toBeInTheDocument();
  await act(() => vi.advanceTimersByTimeAsync(10_000));
  expect(screen.queryByText("second")).not.toBeInTheDocument();
});

it("the undo takes the added item back", async () => {
  await show();
  const before = screen.getAllByRole("row").length;
  const { createItem, listItems } = await import("../src/example/data.ts");
  const { notifyDone } = await import("../src/lib/notify.ts");
  const { deleteItem } = await import("../src/example/data.ts");
  let added = 0;
  await act(async () => {
    const pending = createItem();
    await vi.advanceTimersByTimeAsync(400);
    const item = await pending;
    added = item.id;
    notifyDone(LABELS.added(item.name), {
      label: LABELS.undo,
      run: () => void deleteItem(item.id),
      close: LABELS.close,
    });
  });
  await answer();
  fireEvent.click(screen.getByRole("button", { name: LABELS.undo }));
  await answer();
  const pending = listItems();
  await answer();
  expect((await pending).some((item) => item.id === added)).toBe(false);
  expect(before).toBeGreaterThan(1);
});

it("deleting cannot be taken back, so it asks first and names what will go", async () => {
  await show();
  fireEvent.click(screen.getByRole("button", { name: LABELS.deleteItem(LABELS.sampleFirstName) }));
  await answer();
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent(LABELS.sampleFirstName);
  expect(dialog).toHaveTextContent(LABELS.deleteDetail);
  // Nothing was deleted yet, and no toast speaks of a result.
  expect(screen.queryByRole("button", { name: LABELS.undo })).not.toBeInTheDocument();
});
