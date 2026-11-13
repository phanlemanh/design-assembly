// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// One state shown in place of the table: nothing yet, nothing found, or an error a person can act
// on. Two screens draw it the same way, so it lives here rather than in either of them.
//
// A state has a button only where the person can act from this screen. The empty state of a list
// a person cannot add to has none, and focus then goes to the screen's heading
// (design/behaviors.md, after an action).
import type { ReactNode, Ref } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

export function Notice({
  title,
  detail,
  action,
  onAction,
  // Where focus is sent when a control elsewhere on the screen leaves the page.
  actionRef,
  // While the action waits, the button is held and keeps focus: a disabled button would drop it.
  pending = false,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
  onAction?: () => void;
  actionRef?: Ref<HTMLButtonElement>;
  pending?: boolean;
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{detail}</EmptyDescription>
      </EmptyHeader>
      {action !== undefined && (
        <EmptyContent>
          <Button ref={actionRef} disabled={pending} focusableWhenDisabled onClick={onAction}>
            {action}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
