// The one way a screen tells a person what an action did (design/behaviors.md, notification
// channel): a toast that goes away by itself. When the action can be taken back, the toast offers
// the undo. An error of one field is shown at the field, and a failure of the whole screen in its
// place: neither goes through here.
import { toast } from "sonner";

export type Undo = { label: string; run: () => void };

export function notifyDone(message: string, undo?: Undo): void {
  if (undo) toast(message, { action: { label: undo.label, onClick: undo.run } });
  else toast(message);
}
