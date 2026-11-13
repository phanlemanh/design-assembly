// The application's frame: one navigation, every screen in the order given, the open one marked,
// moving without loading the page again, and a screen's toasts left behind
// (design/behaviors.md, moving between screens).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { AppFrame } from "../src/components/app-frame.tsx";
import { notifyDone } from "../src/lib/notify.ts";

const SCREENS = [
  { path: "/", title: "First", load: async () => () => <main>first screen</main> },
  { path: "/second", title: "Second", load: async () => () => <main>second screen</main> },
];

afterEach(() => window.history.replaceState(null, "", "/"));

const frame = () => render(<AppFrame appName="App" navLabel="Screens" screens={SCREENS} />);
const link = (name: string) => screen.getByRole("link", { name });

it("names every screen in one navigation, in order, and marks the open one", async () => {
  frame();
  expect(await screen.findByText("first screen")).toBeInTheDocument();
  const links = screen.getByRole("navigation", { name: "Screens" }).querySelectorAll("a");
  expect([...links].map((a) => a.textContent)).toEqual(["First", "Second"]);
  expect(link("First")).toHaveAttribute("aria-current", "page");
  expect(link("Second")).not.toHaveAttribute("aria-current");
});

it("moves to another screen without loading the page again, and leaves its toasts behind", async () => {
  frame();
  await screen.findByText("first screen");
  notifyDone("Done here");
  expect(await screen.findByText("Done here")).toBeInTheDocument();
  const moved = fireEvent.click(link("Second"));
  // The click is the frame's: the browser does not load the page.
  expect(moved).toBe(false);
  expect(await screen.findByText("second screen")).toBeInTheDocument();
  expect(window.location.pathname).toBe("/second");
  expect(link("Second")).toHaveAttribute("aria-current", "page");
  await waitFor(() => expect(screen.queryByText("Done here")).not.toBeInTheDocument());
});
