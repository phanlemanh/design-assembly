import { useEffect, useRef, useState, type ReactNode } from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ItemRecord } from "@/components/item-record";
import { ItemTable } from "@/components/item-table";
import { Notice } from "@/components/notice";
import { WithRecord } from "@/components/record-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { listOverdueItems, type Item } from "@/example/data";
import { LABELS } from "@/lib/labels";
import { useOpenRecord } from "@/lib/open-record";

// The second screen of the list kind (design/patterns/danh-sach.md). It is built like the
// reference screen it follows, and draws the same table from the same shared part, so a person
// reads the two lists as one thing.
//
// A person cannot put an item here from this screen: an item arrives by passing its date. So the
// empty state has no button, and nothing on a row changes data.
export function OverdueScreen() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const record = useOpenRecord();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after the screen has moved on
    listOverdueItems().then(
      (found) => current && setItems(found),
      () => current && setFailed(true),
    );
    return () => {
      current = false;
    };
  }, [attempt]);

  function reload() {
    setItems(null);
    setFailed(false);
    setAttempt((n) => n + 1);
  }

  const shown = (items ?? []).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );
  const opened = (items ?? []).find((item) => String(item.id) === record.id) ?? null;

  let body: ReactNode;
  if (failed) {
    body = (
      <Alert variant="destructive">
        <AlertTitle>{LABELS.errorTitle}</AlertTitle>
        <AlertDescription>{LABELS.errorDetail}</AlertDescription>
        <AlertAction>
          <Button variant="outline" size="sm" onClick={reload}>
            {LABELS.retry}
          </Button>
        </AlertAction>
      </Alert>
    );
  } else if (items === null) {
    body = (
      <div role="status" className="flex flex-col gap-2">
        <span className="sr-only">{LABELS.loading}</span>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  } else if (items.length === 0) {
    body = <Notice title={LABELS.overdueEmptyTitle} detail={LABELS.overdueEmptyDetail} />;
  } else if (shown.length === 0) {
    body = (
      <Notice
        title={LABELS.noResultsTitle}
        detail={LABELS.noResultsDetail}
        action={LABELS.noResultsAction}
        onAction={() => setQuery("")}
      />
    );
  } else {
    body = (
      <ItemTable
        label={LABELS.overdueTableName}
        items={shown}
        onOpen={(item, from) => record.open(String(item.id), from)}
      />
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-6 text-sm">
      <h1
        ref={heading}
        tabIndex={-1}
        className="rounded-sm text-lg font-semibold outline-none focus:ring-3 focus:ring-ring/50"
      >
        {LABELS.overdueTitle}
      </h1>
      <WithRecord
        record={record}
        title={opened?.name ?? null}
        closeLabel={LABELS.close}
        content={opened && <ItemRecord item={opened} />}
      >
        {items && items.length > 0 && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="filter">{LABELS.filter}</Label>
            <Input
              id="filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        )}
        {body}
      </WithRecord>
    </main>
  );
}
