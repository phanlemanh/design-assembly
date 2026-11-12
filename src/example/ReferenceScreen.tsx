import { useEffect, useRef, useState, type ComponentProps, type ReactNode, type Ref } from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { HeldLabel } from "@/components/held-label";
import { WithRecord } from "@/components/record-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableHeader } from "@/components/ui/table";
import {
  TypedCell,
  TypedHead,
  TypedRow,
  TypedTable,
  type TypedColumn,
} from "@/components/ui/typed-table";
import { TableActions, TableActionsHead } from "@/components/ui/table-actions";
import { createItem, deleteItem, listItems, type Item, type Status } from "@/example/data";
import { formatDate, formatMoney } from "@/lib/format";
import { LABELS } from "@/lib/labels";
import { useOpenRecord } from "@/lib/open-record";
import { notifyDone, notifyFailed } from "@/lib/notify";
import { useSlow } from "@/lib/slow";

type Variant = ComponentProps<typeof Badge>["variant"];
// Each status keeps its own look. Never give two statuses the same variant to pass a check.
const STATUS: Record<Status, { label: string; variant: Variant }> = {
  active: { label: LABELS.statusActive, variant: "default" },
  pending: { label: LABELS.statusPending, variant: "outline" },
  overdue: { label: LABELS.statusOverdue, variant: "destructive" },
};

// The data columns: a field of the data model and its header. The column type of the field decides
// alignment and width, so a screen writes neither. The last column holds actions, not data.
const COLUMNS: readonly TypedColumn[] = [
  { field: "Item.name", header: LABELS.columnName },
  { field: "Item.status", header: LABELS.columnStatus },
  { field: "Item.date", header: LABELS.columnDate },
  { field: "Item.total", header: LABELS.columnTotal },
];

// One state in place of the table. `pending` holds the button while its action waits for an
// answer: it keeps focus, so a person at the keyboard is still somewhere when the answer comes.
function Notice({
  title,
  detail,
  action,
  onAction,
  actionRef,
  pending = false,
}: {
  title: string;
  detail: string;
  action: ReactNode;
  onAction: () => void;
  actionRef: Ref<HTMLButtonElement>;
  pending?: boolean;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button ref={actionRef} disabled={pending} focusableWhenDisabled onClick={onAction}>
          {action}
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function ConfirmDelete(props: {
  open: boolean;
  item: Item | null;
  saving: boolean;
  failed: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  // Where focus goes when the dialog closes, when its trigger has gone with the deleted item.
  finalFocus: () => HTMLElement | boolean;
}) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.saving) props.onCancel();
      }}
    >
      <DialogContent showCloseButton={false} finalFocus={props.finalFocus}>
        <DialogHeader>
          <DialogTitle>{props.item ? LABELS.deleteItem(props.item.name) : ""}</DialogTitle>
          <DialogDescription>{LABELS.deleteDetail}</DialogDescription>
        </DialogHeader>
        {props.failed && props.item && (
          <Alert variant="destructive">
            <AlertTitle>{LABELS.deleteFailed(props.item.name)}</AlertTitle>
            <AlertDescription>{LABELS.errorDetail}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={props.saving} focusableWhenDisabled />}
          >
            {LABELS.cancel}
          </DialogClose>
          <Button
            variant="destructive"
            disabled={props.saving}
            focusableWhenDisabled
            onClick={props.onConfirm}
          >
            {props.saving ? LABELS.saving : LABELS.deleteAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// One item's fields, as the record that opens beside the list shows them.
function ItemRecord({ item }: { item: Item }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
      <dt className="text-muted-foreground">{LABELS.columnStatus}</dt>
      <dd>
        <Badge variant={STATUS[item.status].variant}>{STATUS[item.status].label}</Badge>
      </dd>
      <dt className="text-muted-foreground">{LABELS.columnDate}</dt>
      <dd>{formatDate(item.date)}</dd>
      <dt className="text-muted-foreground">{LABELS.columnTotal}</dt>
      <dd>{formatMoney(item.total)}</dd>
    </dl>
  );
}

// Every state follows from a request or from the user, never from a switch.
export function ReferenceScreen() {
  // The list request: pending while items is null, then the items or a failure.
  const [items, setItems] = useState<Item[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // What the user is doing: filtering, or deleting one item. The dialog keeps showing the last
  // target while it closes.
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [target, setTarget] = useState<Item | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  // Adding the first item: the empty state stays, with its button held, until the answer.
  const [adding, setAdding] = useState(false);
  const addingSlowly = useSlow(adding);
  // The record a person opened from the list, kept in the address.
  const record = useOpenRecord();
  // Focus never falls on nothing (design/behaviors.md, focus). When a control leaves, `focusNext`
  // names the row whose action takes focus; with no such row, the button of the state shown in
  // place of the table; with none, the heading.
  const rowActions = useRef(new Map<number, HTMLButtonElement>());
  const noticeAction = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusNext = useRef<{ row?: number } | null>(null);
  function focusTarget(): HTMLElement | null {
    const want = focusNext.current;
    if (!want) return null;
    const row = want.row === undefined ? undefined : rowActions.current.get(want.row);
    return row ?? noticeAction.current ?? heading.current;
  }
  // After every render: move focus where it was asked to go, once that place is on the page.
  useEffect(() => {
    if (asking) return; // the dialog hands focus on when it has closed
    const target = focusTarget();
    if (!target) return;
    focusNext.current = null;
    target.focus();
  });
  // The row after the one that leaves, else the one before it, else none.
  function neighbour(id: number): { row?: number } {
    const at = shown.findIndex((item) => item.id === id);
    const next = shown[at + 1] ?? shown[at - 1];
    return next ? { row: next.id } : {};
  }
  // Whether the screen is still there when an answer arrives.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let current = true; // ignore an answer that arrives after the screen has moved on
    listItems().then(
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

  // Adding can be taken back, so it happens at once and the toast offers the undo. Deleting
  // cannot, so it asks first (design/behaviors.md, changing data). One item changing never sends
  // the whole list back to loading: the list changes in place.
  function addFirst() {
    setAdding(true);
    void createItem().then(
      (item) => {
        if (!mounted.current) return;
        setAdding(false);
        setItems((current) => [...(current ?? []), item]);
        // The button that was pressed leaves with the empty state: focus goes to the new item.
        focusNext.current = { row: item.id };
        notifyDone(LABELS.added(item.name), {
          label: LABELS.undo,
          run: () => undoAdd(item),
          close: LABELS.close,
        });
      },
      () => {
        if (!mounted.current) return;
        setAdding(false);
        // Nothing was added: say so, and offer to try again (design/behaviors.md, a failed action).
        notifyFailed(LABELS.addFailed, LABELS.errorDetail, {
          label: LABELS.retry,
          run: addFirst,
          close: LABELS.close,
        });
      },
    );
  }

  // The undo puts things back where they were, and says nothing more: the screen shows it. A
  // failed undo never reads as done: the item is still there, and the toast says so.
  function undoAdd(item: Item) {
    void deleteItem(item.id).then(
      () => {
        if (!mounted.current) return;
        focusNext.current = neighbour(item.id);
        setItems((current) => current?.filter((other) => other.id !== item.id) ?? null);
      },
      () =>
        notifyFailed(LABELS.undoFailed(item.name), LABELS.errorDetail, {
          label: LABELS.retry,
          run: () => undoAdd(item),
          close: LABELS.close,
        }),
    );
  }

  function askDelete(item: Item) {
    setTarget(item);
    setDeleteFailed(false);
    setAsking(true);
  }

  async function confirmDelete() {
    if (!target) return;
    setSaving(true);
    setDeleteFailed(false);
    const deleted = await deleteItem(target.id).then(
      () => true,
      () => false,
    );
    if (!mounted.current) return; // ignore an answer that arrives after the screen has gone
    setSaving(false);
    if (deleted) {
      // The button that opened the dialog leaves with its row.
      focusNext.current = neighbour(target.id);
      setItems((current) => current?.filter((item) => item.id !== target.id) ?? null);
      setAsking(false);
    } else {
      setDeleteFailed(true);
    }
  }

  const shown = (items ?? []).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

  const opened = (items ?? []).find((item) => String(item.id) === record.id) ?? null;

  // The name column is text: it is fitted to the names being shown.
  const columns = COLUMNS.map((column) =>
    column.field === "Item.name" ? { ...column, values: shown.map((item) => item.name) } : column,
  );

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
    body = (
      <Notice
        title={LABELS.emptyTitle}
        detail={LABELS.emptyDetail}
        action={
          <HeldLabel label={LABELS.emptyAction} busyLabel={LABELS.adding} busy={addingSlowly} />
        }
        onAction={addFirst}
        actionRef={noticeAction}
        pending={adding}
      />
    );
  } else if (shown.length === 0) {
    body = (
      <Notice
        title={LABELS.noResultsTitle}
        detail={LABELS.noResultsDetail}
        action={LABELS.noResultsAction}
        onAction={() => setQuery("")}
        actionRef={noticeAction}
      />
    );
  } else {
    body = (
      <TypedTable aria-label={LABELS.tableName} columns={columns}>
        <TableHeader>
          <TypedRow>
            {columns.map((column) => (
              <TypedHead key={column.field} {...column} />
            ))}
            <TableActionsHead>{LABELS.columnActions}</TableActionsHead>
          </TypedRow>
        </TableHeader>
        <TableBody>
          {shown.map((item) => (
            <TypedRow key={item.id}>
              <TypedCell field="Item.name">
                <Button
                  variant="link"
                  size="sm"
                  className="-ml-2"
                  onClick={(event) => record.open(String(item.id), event.currentTarget)}
                >
                  {item.name}
                </Button>
              </TypedCell>
              <TypedCell field="Item.status">
                <Badge variant={STATUS[item.status].variant}>{STATUS[item.status].label}</Badge>
              </TypedCell>
              <TypedCell field="Item.date">{formatDate(item.date)}</TypedCell>
              <TypedCell field="Item.total">{formatMoney(item.total)}</TypedCell>
              <TableActions>
                <Button
                  ref={(button) => {
                    if (button) rowActions.current.set(item.id, button);
                    else rowActions.current.delete(item.id);
                  }}
                  variant="outline"
                  size="sm"
                  aria-label={LABELS.deleteItem(item.name)}
                  onClick={() => askDelete(item)}
                >
                  {LABELS.deleteAction}
                </Button>
              </TableActions>
            </TypedRow>
          ))}
        </TableBody>
      </TypedTable>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-6 text-sm">
      <h1
        ref={heading}
        tabIndex={-1}
        className="rounded-sm text-lg font-semibold outline-none focus:ring-3 focus:ring-ring/50"
      >
        {LABELS.screenTitle}
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
      <ConfirmDelete
        open={asking}
        item={target}
        saving={saving}
        failed={deleteFailed}
        onConfirm={confirmDelete}
        onCancel={() => setAsking(false)}
        finalFocus={() => {
          const target = focusTarget();
          focusNext.current = null;
          return target ?? true;
        }}
      />
    </main>
  );
}
