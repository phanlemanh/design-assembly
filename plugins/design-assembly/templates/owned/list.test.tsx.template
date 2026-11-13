// What every list screen shares: loading, trying again after a failure, filtering by name, and one
// row changing in place without sending the list back to loading.
import { act, renderHook, waitFor } from "@testing-library/react";
import { expect, it } from "vitest";

import { useList } from "../src/lib/list.ts";

type Row = { id: number; name: string };
const ROWS: Row[] = [
  { id: 1, name: "Alpha" },
  { id: 2, name: "Beta" },
];

it("loads the items, and filters them by name", async () => {
  const load = () => Promise.resolve(ROWS);
  const { result } = renderHook(() => useList(load));
  expect(result.current.items).toBeNull();
  await waitFor(() => expect(result.current.items).toEqual(ROWS));
  act(() => result.current.setQuery("be"));
  expect(result.current.shown.map((row) => row.name)).toEqual(["Beta"]);
});

it("says when loading failed, and tries again", async () => {
  let fail = true;
  const load = () => (fail ? Promise.reject(new Error("down")) : Promise.resolve(ROWS));
  const { result } = renderHook(() => useList(load));
  await waitFor(() => expect(result.current.failed).toBe(true));
  fail = false;
  act(() => result.current.reload());
  expect(result.current.items).toBeNull();
  await waitFor(() => expect(result.current.items).toEqual(ROWS));
  expect(result.current.failed).toBe(false);
});

it("changes one row in place, without sending the list back to loading", async () => {
  const load = () => Promise.resolve(ROWS);
  const { result } = renderHook(() => useList(load));
  await waitFor(() => expect(result.current.items).toEqual(ROWS));
  act(() => result.current.change((rows) => rows.filter((row) => row.id !== 1)));
  expect(result.current.items).toEqual([ROWS[1]]);
});
