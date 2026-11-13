// A row's actions when there are two or more: one button on the row opens them as a list of
// buttons. Two text buttons do not fit beside the data at 320px, so the rule is the same at every
// width: one action shows as a button, two or more go behind this one (design/behaviors.md,
// actions on a row).
//
// The button shows "⋯" and nothing else, so it takes the same small room at every width and never
// squeezes the columns that scroll; a screen reader hears its name, which says which row it acts
// on. The list floats below the button, against its right edge, above the rows under it: it never
// widens the column that stays in place. One list is open at a time: pressing anywhere else closes
// it. Pressing one of its actions closes it and gives focus back to the row's button, so focus
// never falls on nothing; while that action waits, the row's button is held and keeps focus, and
// from one second on it turns into a turning circle and is named for what it is doing. Each row
// keeps its own clock, so a screen only says whether the row waits.
// It is a popover of buttons, not an ARIA menu, so every action stays a button the browser test
// can press.
import { Popover } from "@base-ui/react/popover";
import { EllipsisIcon, LoaderCircleIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";

// Under a second nothing is shown; from a second on, the button says it is working
// (design/behaviors.md, waiting).
const SLOW_AFTER_MS = 1000;

function RowActions({
  name,
  pending = false,
  busyName,
  children,
  ref,
}: {
  /** What a screen reader says for the button and its list: which row they act on. */
  name: string;
  /** While a row's action waits the button is held: it keeps focus and does not open. From one
   * second of waiting on it shows that it is working and is named `busyName`. */
  pending?: boolean | undefined;
  busyName?: string | undefined;
  /** The actions, as buttons: those that can be taken back first, a delete last. */
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement> | undefined;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setBusy(true), SLOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setBusy(false);
    };
  }, [pending]);
  const trigger = React.useRef<HTMLButtonElement | null>(null);
  const setTrigger = (button: HTMLButtonElement | null) => {
    trigger.current = button;
    if (typeof ref === "function") ref(button);
    else if (ref) ref.current = button;
  };
  // An action was pressed: the list closes and focus goes back to the row's button at once, so a
  // dialog the action opens can still take focus after it.
  const afterAction = (event: React.MouseEvent) => {
    if (!(event.target as HTMLElement).closest("button")) return;
    setOpen(false);
    trigger.current?.focus();
  };
  return (
    <Popover.Root open={open && !pending} onOpenChange={(next) => setOpen(next && !pending)}>
      <Popover.Trigger
        ref={setTrigger}
        aria-label={busy && busyName ? busyName : name}
        render={
          <Button variant="outline" size="icon-sm" disabled={pending} focusableWhenDisabled />
        }
      >
        {busy ? (
          <LoaderCircleIcon aria-hidden="true" className="motion-safe:animate-spin" />
        ) : (
          <EllipsisIcon aria-hidden="true" />
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={4} className="z-50">
          <Popover.Popup
            // The browser test knows a row's actions by this, wherever the list is drawn.
            data-row-actions=""
            aria-label={name}
            onClick={afterAction}
            className="flex flex-col gap-1 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md *:w-full *:justify-start"
          >
            {children}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

export { RowActions };
