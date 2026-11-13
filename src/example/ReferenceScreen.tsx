import { LoaderCircleIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { HeldLabel } from "@/components/held-label";
import { ItemList } from "@/components/item-list";
import { ItemRecord } from "@/components/item-record";
import { Notice } from "@/components/notice";
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
import { createItem, deleteItem, listItems, type Item } from "@/example/data";
import { LABELS } from "@/lib/labels";
import { useList } from "@/lib/list";
import { useOpenRecord } from "@/lib/open-record";
import { notifyDone, notifyFailed } from "@/lib/notify";
import { useSlow } from "@/lib/slow";

// Asking before a delete. The dialog closes as soon as the person confirms: the row's own button
// waits for the answer, so every other row can still be used (design/behaviors.md, actions on a
// row).
function ConfirmDelete(props: {
  open: boolean;
  item: Item | null;
  onConfirm: () => void;
  onCancel: () => void;
  // Where focus goes when the dialog closes: the row's button, which now waits for the answer.
  finalFocus: () => HTMLElement | boolean;
}) {
  return (
    <Dialog open={props.open} onOpenChange={(open) => !open && props.onCancel()}>
      <DialogContent showCloseButton={false} finalFocus={props.finalFocus}>
        <DialogHeader>
          <DialogTitle>{props.item ? LABELS.deleteItem(props.item.name) : ""}</DialogTitle>
          <DialogDescription>{LABELS.deleteDetail}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>{LABELS.cancel}</DialogClose>
          <Button variant="destructive" onClick={props.onConfirm}>
            {LABELS.deleteAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// A row's one action. While its delete waits, the button is held and keeps focus; from one second
// on it says it is working the way the row's "⋯" button does: a turning circle in place of its
// word, at the same width, so the column never widens at 320px, and a name that says what it is
// doing. The words stay on the page for a screen reader and the checks. Each row keeps its own
// clock, so one row waiting never holds another.
function DeleteButton({
  item,
  pending,
  onPress,
  ref,
}: {
  item: Item;
  pending: boolean;
  onPress: () => void;
  ref: (button: HTMLButtonElement | null) => void;
}) {
  const slow = useSlow(pending);
  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      aria-label={slow ? LABELS.deletingItem(item.name) : LABELS.deleteItem(item.name)}
      disabled={pending}
      focusableWhenDisabled
      onClick={onPress}
    >
      <span className="grid">
        <span className={slow ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}>
          {LABELS.deleteAction}
        </span>
        {slow && (
          <LoaderCircleIcon
            aria-hidden="true"
            className="col-start-1 row-start-1 place-self-center motion-safe:animate-spin"
          />
        )}
      </span>
      {slow && <span className="sr-only">{LABELS.saving}</span>}
    </Button>
  );
}

// Every state follows from a request or from the user, never from a switch. Loading, retrying and
// filtering are the list kind's, shared with every screen of it (`useList`, `ItemList`).
export function ReferenceScreen() {
  const list = useList(listItems);
  // The item a person is asked about. The dialog keeps showing it while it closes.
  const [asking, setAsking] = useState(false);
  const [target, setTarget] = useState<Item | null>(null);
  // The rows whose delete waits for its answer: each row waits on its own.
  const [deleting, setDeleting] = useState<ReadonlySet<number>>(new Set());
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
    const place = focusTarget();
    if (!place) return;
    focusNext.current = null;
    place.focus();
  });
  // The row after the one that leaves, else the one before it, else none.
  function neighbour(id: number): { row?: number } {
    const at = list.shown.findIndex((item) => item.id === id);
    const next = list.shown[at + 1] ?? list.shown[at - 1];
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

  // Adding can be taken back, so it happens at once and the toast offers the undo. Deleting
  // cannot, so it asks first (design/behaviors.md, changing data). One item changing never sends
  // the whole list back to loading: the list changes in place.
  function addFirst() {
    setAdding(true);
    void createItem().then(
      (item) => {
        if (!mounted.current) return;
        setAdding(false);
        list.change((current) => [...current, item]);
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
        list.change((current) => current.filter((other) => other.id !== item.id));
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
    setAsking(true);
  }

  // Confirmed: the dialog has closed and the row's button waits. Done, the row leaves and the
  // toast says so; failed, the row stays and the toast offers to try again, which asks nothing
  // more: the person already said yes.
  function runDelete(item: Item) {
    setDeleting((current) => new Set(current).add(item.id));
    void deleteItem(item.id).then(
      () => {
        if (!mounted.current) return;
        focusNext.current = neighbour(item.id);
        setDeleting((current) => without(current, item.id));
        list.change((current) => current.filter((other) => other.id !== item.id));
        notifyDone(LABELS.deleted(item.name));
      },
      () => {
        if (!mounted.current) return;
        setDeleting((current) => without(current, item.id));
        notifyFailed(LABELS.deleteFailed(item.name), LABELS.errorDetail, {
          label: LABELS.retry,
          run: () => runDelete(item),
          close: LABELS.close,
        });
      },
    );
  }

  const opened = (list.items ?? []).find((item) => String(item.id) === record.id) ?? null;

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
        <ItemList
          list={list}
          label={LABELS.tableName}
          noResultsRef={noticeAction}
          empty={
            <Notice
              title={LABELS.emptyTitle}
              detail={LABELS.emptyDetail}
              action={
                <HeldLabel
                  label={LABELS.emptyAction}
                  busyLabel={LABELS.adding}
                  busy={addingSlowly}
                />
              }
              onAction={addFirst}
              actionRef={noticeAction}
              pending={adding}
            />
          }
          onOpen={(item, from) => record.open(String(item.id), from)}
          actions={{
            header: LABELS.columnActions,
            cell: (item) => (
              <DeleteButton
                item={item}
                pending={deleting.has(item.id)}
                onPress={() => askDelete(item)}
                ref={(button) => {
                  if (button) rowActions.current.set(item.id, button);
                  else rowActions.current.delete(item.id);
                }}
              />
            ),
          }}
        />
      </WithRecord>
      <ConfirmDelete
        open={asking}
        item={target}
        onConfirm={() => {
          setAsking(false);
          if (target) runDelete(target);
        }}
        onCancel={() => setAsking(false)}
        finalFocus={() => {
          // The row's button, which waits now; a row gone meanwhile hands focus on.
          const row = target ? rowActions.current.get(target.id) : undefined;
          return row ?? focusTarget() ?? true;
        }}
      />
    </main>
  );
}

function without(set: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const next = new Set(set);
  next.delete(id);
  return next;
}
