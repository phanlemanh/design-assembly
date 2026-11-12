// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// How one record of a list opens: the arrangement a person chose for every screen
// (design/blueprint.json, patterns, record panel). The record is kept in the address, so a link
// opens it and Back closes it. Opening moves focus to the record's heading; closing gives focus
// back to what opened it (design/behaviors.md, a record beside a list). Which record is open, and
// the address, are kept by `useOpenRecord` in src/lib/open-record.ts.
import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { OpenRecord } from "@/lib/open-record";

export type RecordLayout = "beside" | "over" | "in-place";
// The guide writes this line from the blueprint, and the gate fails when the two differ. To change
// it, change the answer in the blueprint and run the guide again.
export const RECORD_LAYOUT: RecordLayout = "beside";

// The list, and the open record arranged as RECORD_LAYOUT says. `title` is null when no record
// is open, or when the address names one the list does not have.
export function WithRecord(props: {
  record: OpenRecord;
  title: string | null;
  closeLabel: string;
  content: ReactNode;
  children: ReactNode;
}) {
  const layout: RecordLayout = RECORD_LAYOUT;
  const open = props.title !== null;
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const { record } = props;
  // The dialog of `over` moves focus into itself; the other two move it to the heading.
  useEffect(() => {
    if (open && record.takeFocus() && layout !== "over") heading.current?.focus();
  });

  if (layout === "over") {
    return (
      <>
        {props.children}
        <Dialog
          open={open}
          onOpenChange={(next) => {
            if (!next) record.close();
          }}
        >
          <DialogContent
            data-record-panel={layout}
            showCloseButton={false}
            className="top-0 right-0 left-auto h-dvh max-h-dvh max-w-full translate-x-0 translate-y-0 content-start overflow-y-auto sm:max-w-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <DialogTitle>{props.title}</DialogTitle>
              <Button variant="outline" size="sm" onClick={record.close}>
                {props.closeLabel}
              </Button>
            </div>
            {props.content}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const panel = open ? (
    <section
      data-record-panel={layout}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") record.close();
      }}
      className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground lg:w-96 lg:shrink-0"
    >
      <div className="flex items-start justify-between gap-4">
        <h2
          ref={heading}
          id={titleId}
          tabIndex={-1}
          className="rounded-sm text-base font-medium outline-none focus:ring-3 focus:ring-ring/50"
        >
          {props.title}
        </h2>
        <Button variant="outline" size="sm" onClick={record.close}>
          {props.closeLabel}
        </Button>
      </div>
      {props.content}
    </section>
  ) : null;

  // Beside: both where there is room for both, from 1024px; below that, the record takes the
  // list's place. In place: the record takes the list's place at every width. The list stays
  // mounted while hidden, so what was typed into its filter is still there on the way back.
  const hidden = open && (layout === "in-place" ? "hidden" : "max-lg:hidden");
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className={cn("flex min-w-0 flex-col gap-4 lg:flex-1", hidden)}>{props.children}</div>
      {panel}
    </div>
  );
}
