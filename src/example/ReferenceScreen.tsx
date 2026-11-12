import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { TableBody, TableCell, TableHead, TableHeader } from "@/components/ui/table";
import {
  TypedCell,
  TypedHead,
  TypedRow,
  TypedTable,
  type TypedColumn,
} from "@/components/ui/typed-table";
import { createItem, deleteItem, listItems, type Item, type Status } from "@/example/data";
import { formatDate, formatMoney } from "@/lib/format";
import { LABELS } from "@/lib/labels";
import { notifyDone, notifyFailed } from "@/lib/notify";

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

function Notice(props: { title: string; detail: string; action: string; onAction: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{props.title}</EmptyTitle>
        <EmptyDescription>{props.detail}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={props.onAction}>{props.action}</Button>
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
}) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !props.saving) props.onCancel();
      }}
    >
      <DialogContent showCloseButton={false}>
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
          <DialogClose render={<Button variant="outline" disabled={props.saving} />}>
            {LABELS.cancel}
          </DialogClose>
          <Button variant="destructive" disabled={props.saving} onClick={props.onConfirm}>
            {props.saving ? LABELS.saving : LABELS.deleteAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  // cannot, so it asks first (design/behaviors.md, changing data).
  function addFirst() {
    setItems(null);
    // List again either way: the list shows what the server has.
    void createItem().then(
      (item) => {
        notifyDone(LABELS.added(item.name), {
          label: LABELS.undo,
          run: () => undoAdd(item),
          close: LABELS.close,
        });
        reload();
      },
      () => {
        // Nothing was added: say so, and offer to try again (design/behaviors.md, a failed action).
        notifyFailed(LABELS.addFailed, LABELS.errorDetail, {
          label: LABELS.retry,
          run: addFirst,
          close: LABELS.close,
        });
        reload();
      },
    );
  }

  // A failed undo never reads as done: the item is still there, and the toast says so.
  function undoAdd(item: Item) {
    void deleteItem(item.id).then(reload, () =>
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
      setItems((current) => current?.filter((item) => item.id !== target.id) ?? null);
      setAsking(false);
    } else {
      setDeleteFailed(true);
    }
  }

  const shown = (items ?? []).filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase()),
  );

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
        action={LABELS.emptyAction}
        onAction={addFirst}
      />
    );
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
      <TypedTable aria-label={LABELS.tableName} columns={columns}>
        <TableHeader>
          <TypedRow>
            {columns.map((column) => (
              <TypedHead key={column.field} {...column} />
            ))}
            <TableHead>{LABELS.columnActions}</TableHead>
          </TypedRow>
        </TableHeader>
        <TableBody>
          {shown.map((item) => (
            <TypedRow key={item.id}>
              <TypedCell field="Item.name">{item.name}</TypedCell>
              <TypedCell field="Item.status">
                <Badge variant={STATUS[item.status].variant}>{STATUS[item.status].label}</Badge>
              </TypedCell>
              <TypedCell field="Item.date">{formatDate(item.date)}</TypedCell>
              <TypedCell field="Item.total">{formatMoney(item.total)}</TypedCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label={LABELS.deleteItem(item.name)}
                  onClick={() => askDelete(item)}
                >
                  {LABELS.deleteAction}
                </Button>
              </TableCell>
            </TypedRow>
          ))}
        </TableBody>
      </TypedTable>
    );
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-6 text-sm">
      <h1 className="text-lg font-semibold">{LABELS.screenTitle}</h1>
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
      <ConfirmDelete
        open={asking}
        item={target}
        saving={saving}
        failed={deleteFailed}
        onConfirm={confirmDelete}
        onCancel={() => setAsking(false)}
      />
    </main>
  );
}
