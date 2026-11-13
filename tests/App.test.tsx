import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { Toaster } from "../src/components/ui/sonner.tsx";
import { formatDate, formatMoney } from "../src/lib/format.ts";
import { LABELS } from "../src/lib/labels.ts";
import { notifyClear } from "../src/lib/notify.ts";
import { pick, SCREENS, type Step } from "../src/screens.ts";
import { ROUTES } from "./e2e/routes.ts";

// The fake data source answers according to `?scenario=` in the address, after a real wait that
// fake timers skip. Each test gets a fresh source, because deleting and adding change its store.
function setScenario(scenario?: string) {
  window.history.replaceState(null, "", scenario ? `/?scenario=${scenario}` : "/");
}

const answer = () => act(() => vi.advanceTimersByTimeAsync(200));

async function show(scenario?: string) {
  setScenario(scenario);
  const { ReferenceScreen } = await import("../src/example/ReferenceScreen.tsx");
  // The toaster is mounted beside the screen, as the app does: a delete tells its result there.
  const view = render(
    <>
      <ReferenceScreen />
      <Toaster />
    </>,
  );
  await answer();
  return view;
}

// Waits for the control, as the browser checks do: a toast's button appears a moment after the answer.
async function take(step: Step) {
  if ("press" in step) fireEvent.click(await screen.findByRole("button", { name: step.press }));
  else fireEvent.change(await screen.findByLabelText(step.fill), { target: { value: step.text } });
  await answer();
}

function setOnline(online: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(online);
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.resetModules();
});

afterEach(async () => {
  // A toast outlives the screen that raised it in this file's one toaster: clear it, so the next
  // test starts with none.
  notifyClear();
  await act(() => vi.advanceTimersByTimeAsync(1000));
  vi.useRealTimers();
  vi.restoreAllMocks();
  setScenario();
});

it("lists at least one screen", () => {
  expect(SCREENS.length).toBeGreaterThan(0);
});

it.each(SCREENS.flatMap((s) => s.states.map((state) => [s.path, state.name, s, state] as const)))(
  "reaches %s %s from the data source and the user, under one main and one h1",
  async (_path, _name, entry, state) => {
    setScenario(state.scenario);
    const Screen = await entry.load();
    // The toaster is mounted beside every screen, as the app does: some states show in a toast.
    render(
      <>
        <Screen />
        <Toaster />
      </>,
    );
    await answer();
    for (const step of state.steps ?? []) await take(step);
    // A dialog renders outside the screen's own element, so look at the whole page.
    expect(await screen.findAllByText(state.shows)).not.toHaveLength(0);
    // A dialog hides the page behind it from assistive tech; the structure must still be there.
    expect(screen.getAllByRole("main", { hidden: true })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1, hidden: true })).toHaveLength(1);
  },
);

it("shows loading while the request is pending, then the items", async () => {
  setScenario();
  const { ReferenceScreen } = await import("../src/example/ReferenceScreen.tsx");
  render(<ReferenceScreen />);
  expect(screen.getByRole("status")).toHaveTextContent(LABELS.loading);
  await answer();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText(LABELS.sampleFirstName)).toBeInTheDocument();
});

it("ignores an answer that arrives after the screen has gone", async () => {
  const error = vi.spyOn(console, "error");
  setScenario();
  const { ReferenceScreen } = await import("../src/example/ReferenceScreen.tsx");
  const { unmount } = render(<ReferenceScreen />);
  unmount();
  await answer();
  render(<ReferenceScreen />);
  expect(screen.getByRole("status")).toHaveTextContent(LABELS.loading);
  expect(screen.queryByText(LABELS.sampleFirstName)).not.toBeInTheDocument();
  expect(error).not.toHaveBeenCalled();
});

it("shows the error when the request fails, and retry runs it again", async () => {
  await show("fail");
  expect(screen.getByText(LABELS.errorTitle)).toBeInTheDocument();
  setScenario();
  fireEvent.click(screen.getByRole("button", { name: LABELS.retry }));
  expect(screen.getByRole("status")).toHaveTextContent(LABELS.loading);
  await answer();
  expect(screen.getByText(LABELS.sampleFirstName)).toBeInTheDocument();
});

it("fails for real when the browser is offline, with no scenario", async () => {
  setOnline(false);
  await show();
  expect(screen.getByText(LABELS.errorTitle)).toBeInTheDocument();
  setOnline(true);
  fireEvent.click(screen.getByRole("button", { name: LABELS.retry }));
  await answer();
  setOnline(false);
  await take({ press: LABELS.deleteItem(LABELS.sampleFirstName) });
  await take({ press: LABELS.deleteAction });
  expect(await screen.findByText(LABELS.deleteFailed(LABELS.sampleFirstName))).toBeInTheDocument();
});

it("reaches the empty state by deleting every item, and Add item brings one back", async () => {
  await show();
  const rowButtons = screen.getAllByRole("button", {
    name: new RegExp(`^${LABELS.deleteItem("")}`),
  });
  for (const name of rowButtons.map((b) => b.getAttribute("aria-label") ?? "")) {
    await take({ press: name });
    await take({ press: LABELS.deleteAction });
  }
  expect(screen.getByText(LABELS.emptyTitle)).toBeInTheDocument();
  expect(screen.queryByLabelText(LABELS.filter)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: LABELS.emptyAction }));
  // One item changing does not send the list back to loading: the empty state waits in place.
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByText(LABELS.emptyTitle)).toBeInTheDocument();
  await answer(); // the item is created, and joins the list where it is
  expect(screen.getByText(LABELS.sampleNewName)).toBeInTheDocument();
});

it("shows no results when the filter matches nothing, and clearing it brings the items back", async () => {
  await show();
  fireEvent.change(screen.getByLabelText(LABELS.filter), { target: { value: "zzz" } });
  expect(screen.getByText(LABELS.noResultsTitle)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: LABELS.noResultsAction }));
  expect(screen.getByText(LABELS.sampleFirstName)).toBeInTheDocument();
  expect(screen.getByLabelText(LABELS.filter)).toHaveValue("");
});

it("asks before deleting, names the item, and can be cancelled", async () => {
  await show();
  const name = LABELS.deleteItem(LABELS.sampleSecondName);
  fireEvent.click(screen.getByRole("button", { name }));
  expect(screen.getByRole("dialog")).toHaveTextContent(name);
  fireEvent.click(screen.getByRole("button", { name: LABELS.cancel }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByText(LABELS.sampleSecondName)).toBeInTheDocument();
});

it("closes the dialog when the person confirms, and the row's button waits for the answer", async () => {
  await show();
  const row = LABELS.deleteItem(LABELS.sampleFirstName);
  fireEvent.click(screen.getByRole("button", { name: row }));
  fireEvent.click(screen.getByRole("button", { name: LABELS.deleteAction }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  // Held, not removed from the keyboard's reach: a disabled button would drop focus. The other
  // rows can still be used while this one waits.
  expect(screen.getByRole("button", { name: row })).toHaveAttribute("aria-disabled", "true");
  expect(
    screen.getByRole("button", { name: LABELS.deleteItem(LABELS.sampleSecondName) }),
  ).not.toHaveAttribute("aria-disabled", "true");
  await answer();
  await waitFor(() => expect(screen.queryByText(LABELS.sampleFirstName)).not.toBeInTheDocument());
  expect(await screen.findByText(LABELS.deleted(LABELS.sampleFirstName))).toBeInTheDocument();
});

it("from one second of waiting on, the row's button says it is deleting, in words and in its name", async () => {
  await show("slow-delete");
  fireEvent.click(screen.getByRole("button", { name: LABELS.deleteItem(LABELS.sampleFirstName) }));
  fireEvent.click(screen.getByRole("button", { name: LABELS.deleteAction }));
  await act(() => vi.advanceTimersByTimeAsync(1000));
  const button = screen.getByRole("button", {
    name: LABELS.deletingItem(LABELS.sampleFirstName),
  });
  expect(button).toHaveTextContent(LABELS.saving);
});

it("keeps the item when the delete request fails, says so in a toast, and tries again from it", async () => {
  await show("fail-delete");
  await take({ press: LABELS.deleteItem(LABELS.sampleFirstName) });
  await take({ press: LABELS.deleteAction });
  expect(await screen.findByText(LABELS.deleteFailed(LABELS.sampleFirstName))).toBeInTheDocument();
  expect(screen.getByText(LABELS.sampleFirstName)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: LABELS.deleteItem(LABELS.sampleFirstName) }),
  ).not.toHaveAttribute("aria-disabled", "true");
  // Trying again asks nothing more: the person already said yes.
  setScenario();
  fireEvent.click(screen.getByRole("button", { name: LABELS.retry }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await answer();
  await waitFor(() => expect(screen.queryByText(LABELS.sampleFirstName)).not.toBeInTheDocument());
});

it("gives every status its own badge, one of them destructive", async () => {
  await show();
  const look = new Map(
    [...document.querySelectorAll("[data-slot=badge]")].map((b) => [
      b.textContent,
      b.getAttribute("data-variant"),
    ]),
  );
  expect(look.size).toBeGreaterThan(1);
  expect(new Set(look.values()).size).toBe(look.size);
  expect([...look.values()]).toContain("destructive");
});

it("gives the browser checks a route for every state and scenario of every screen", () => {
  for (const { path, states } of SCREENS)
    for (const { name, scenario } of states)
      expect(ROUTES).toContainEqual(
        expect.objectContaining({
          title: `${path} ${name}`,
          url: scenario ? `${path}?scenario=${scenario}` : path,
        }),
      );
});

it("picks the screen by path, and the first screen for an unknown path", () => {
  expect(pick("/")).toBe(SCREENS[0]);
  expect(pick("/nowhere")).toBe(SCREENS[0]);
});

it("opens the screen for the address, which loads its own data", async () => {
  window.history.replaceState(null, "", "/nowhere?scenario=fail");
  const { App } = await import("../src/App.tsx");
  render(<App />);
  expect(await screen.findByText(LABELS.errorTitle)).toBeInTheDocument();
});

it("formats money and dates", () => {
  expect(formatMoney(1200)).not.toBe("");
  expect(formatDate(new Date(2026, 0, 2))).not.toBe("");
});
