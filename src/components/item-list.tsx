// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// A list of items with everything shown in its place: the filter, and the table or the one state
// that stands for it — loading, a failure to try again, nothing yet, nothing found. Every screen
// of the list kind draws it the same way (design/patterns/danh-sach.md); a screen gives its words
// for "nothing yet" and the actions on a row.
import type { ReactNode, Ref } from "react";

import { ItemTable } from "@/components/item-table";
import { Notice } from "@/components/notice";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Item } from "@/example/data";
import { LABELS } from "@/lib/labels";
import type { List } from "@/lib/list";

export function ItemList({
  list,
  label,
  empty,
  onOpen,
  actions,
  noResultsRef,
}: {
  list: List<Item>;
  // What a screen reader calls the table.
  label: string;
  // What stands for the table when there is nothing yet: the screen's own words, and a button
  // only where a person can fill the list from this screen.
  empty: ReactNode;
  onOpen: (item: Item, from: HTMLElement) => void;
  actions?: { header: string; cell: (item: Item) => ReactNode } | undefined;
  // Where focus is sent when the last matching row leaves and "nothing found" takes its place.
  noResultsRef?: Ref<HTMLButtonElement> | undefined;
}) {
  let body: ReactNode;
  if (list.failed) {
    body = (
      <Alert variant="destructive">
        <AlertTitle>{LABELS.errorTitle}</AlertTitle>
        <AlertDescription>{LABELS.errorDetail}</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" onClick={list.reload}>
            {LABELS.retry}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (list.items === null) {
    body = (
      <div role="status" className="flex flex-col gap-2">
        <span className="sr-only">{LABELS.loading}</span>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  } else if (list.items.length === 0) {
    body = empty;
  } else if (list.shown.length === 0) {
    body = (
      <Notice
        title={LABELS.noResultsTitle}
        detail={LABELS.noResultsDetail}
        action={LABELS.noResultsAction}
        onAction={() => list.setQuery("")}
        actionRef={noResultsRef}
      />
    );
  } else {
    body = <ItemTable label={label} items={list.shown} onOpen={onOpen} actions={actions} />;
  }
  return (
    <>
      {list.items && list.items.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="filter">{LABELS.filter}</Label>
          <Input
            id="filter"
            type="search"
            value={list.query}
            onChange={(e) => list.setQuery(e.target.value)}
          />
        </div>
      )}
      {body}
    </>
  );
}
