// Moving between screens belongs to the application's frame: one region, the same place and the
// same order on every screen, with the open screen marked (design/behaviors.md, moving between
// screens). No check of the gate holds this yet, so it is held here.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";

import { App } from "../src/App.tsx";
import { LABELS } from "../src/lib/labels.ts";
import { notifyDone } from "../src/lib/notify.ts";
import { SCREENS } from "../src/screens.ts";

// jsdom cannot follow a link. Cancelling the click in the capture phase stops it from trying,
// while React's own handler on the link still runs.
const refuse = (event: Event) => event.preventDefault();

beforeEach(() => document.addEventListener("click", refuse, true));
afterEach(() => {
  document.removeEventListener("click", refuse, true);
  window.history.replaceState(null, "", "/");
});

const links = () => screen.getByRole("navigation").querySelectorAll("a");

it("reaches every screen from one region, in the order the register gives them", () => {
  render(<App />);
  expect(screen.getAllByRole("navigation")).toHaveLength(1);
  expect([...links()].map((link) => link.getAttribute("href"))).toEqual(
    SCREENS.map((entry) => entry.path),
  );
  expect([...links()].map((link) => link.textContent)).toEqual(SCREENS.map((entry) => entry.title));
});

it("marks the open screen, and only it", () => {
  window.history.replaceState(null, "", "/overdue");
  render(<App />);
  const marked = [...links()].filter((link) => link.getAttribute("aria-current") === "page");
  expect(marked.map((link) => link.getAttribute("href"))).toEqual(["/overdue"]);
});

it("marks the screen a person is looking at when the address names none", () => {
  window.history.replaceState(null, "", "/nowhere");
  render(<App />);
  const marked = [...links()].filter((link) => link.getAttribute("aria-current") === "page");
  expect(marked.map((link) => link.getAttribute("href"))).toEqual([SCREENS.at(0)?.path]);
});

it("leaves a screen's toasts behind when a person goes to another screen", async () => {
  render(<App />);
  notifyDone(LABELS.added(LABELS.sampleNewName));
  const message = await screen.findByText(LABELS.added(LABELS.sampleNewName));
  expect(message).toBeInTheDocument();
  fireEvent.click([...links()].at(-1)!);
  await waitFor(() =>
    expect(screen.queryByText(LABELS.added(LABELS.sampleNewName))).not.toBeInTheDocument(),
  );
});

it("moves between screens without loading the page again, so what a person did is still there", async () => {
  render(<App />);
  // On every item, delete the one overdue item.
  fireEvent.click(
    await screen.findByRole("button", { name: LABELS.deleteItem(LABELS.sampleThirdName) }),
  );
  fireEvent.click(await screen.findByRole("button", { name: LABELS.deleteAction }));
  await waitFor(() => expect(screen.queryByText(LABELS.sampleThirdName)).not.toBeInTheDocument());
  // Then go to the overdue screen through the frame: it no longer lists it.
  const overdue = [...links()].find((link) => link.getAttribute("href") === "/overdue")!;
  fireEvent.click(overdue);
  expect(await screen.findByText(LABELS.overdueEmptyTitle)).toBeInTheDocument();
  expect(window.location.pathname).toBe("/overdue");
  expect(overdue).toHaveAttribute("aria-current", "page");
});
