// The one way a screen tells a person what an action did (design/behaviors.md, notification
// channel): a toast. An error of one field is shown at the field, and a failure of the whole
// screen in its place: neither goes through here.
//
// A toast with no button goes away by itself: what it says is also on the screen. A toast that
// carries a button stays until the person presses it or closes it, so it also carries the word
// that closes it. One toast shows at a time: a new one takes the place of the one before.
import { createElement } from "react";
import { toast } from "sonner";

// The button a toast carries, and the word on the button that closes the toast.
export type Choice = { label: string; run: () => void; close: string };

// Where the person was before they reached for a toast. A toast goes away once its button is
// pressed, and would take focus with it: focus goes back there first, and the action may then move
// it on.
let before: HTMLElement | null = null;
if (typeof document !== "undefined") {
  document.addEventListener("focusin", (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && !target.closest("[data-sonner-toaster]")) before = target;
  });
}
const goBack = () => {
  if (before?.isConnected) before.focus();
};

const stays = (choice: Choice) => ({
  duration: Infinity,
  action: {
    label: choice.label,
    onClick: () => {
      goBack();
      choice.run();
    },
  },
  cancel: { label: choice.close, onClick: goBack },
});

// The action worked. Pass the undo when the action can be taken back.
export function notifyDone(message: string, undo?: Choice): void {
  toast.dismiss();
  if (undo) toast(message, stays(undo));
  else toast(message);
}

// The action did not work: nothing changed. `message` says what was not done, `detail` what to do
// next, and the button tries again. It is spoken at once, as an alert.
export function notifyFailed(message: string, detail: string, retry: Choice): void {
  toast.dismiss();
  toast.error(createElement("span", { role: "alert" }, message), {
    description: detail,
    ...stays(retry),
  });
}

// The person left the screen: its toasts go with it. Called by whatever moves between screens,
// so a toast never offers an undo for a screen that is no longer there.
export function notifyClear(): void {
  toast.dismiss();
}
