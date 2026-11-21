// The one way a screen tells a person what an action did (design/behaviors.md, notification
// channel): a toast. An error of one field is shown at the field, and a failure of the whole
// screen in its place: neither goes through here.
//
// A toast with no button goes away by itself: what it says is also on the screen. A toast that
// carries a button stays until the person presses it or closes it, so it also carries the word
// that closes it. One toast shows at a time: a new one takes the place of the one before.
import { createElement } from "react";
import { toast } from "sonner";

// The button a toast carries, and the word on the button that closes the toast. `action` is the
// name of the action of the domain model the button runs, when it runs one: the button then
// carries it as its mark, data-action, as every control of an action does, so a browser test knows
// the button by its action and never by its words.
export type Choice = { label: string; run: () => void; close: string; action?: string };

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

// Each toast that carries a button is named, so its own button can take it away.
let made = 0;

// The toast library marks a button it draws itself with a mark of its own on the same attribute,
// which names no action: the button is drawn here instead, with the library's look, and carries
// the action's name or no mark at all. It is a plain button on purpose, a departure from the rule
// that a control comes from the component library: the library would draw it the same way, and a
// component's own classes would undo the toast's look.
const stays = (choice: Choice) => {
  made += 1;
  const id = `notify-${made}`;
  const button = createElement(
    "button",
    {
      type: "button",
      "data-button": "",
      ...(choice.action ? { "data-action": choice.action } : {}),
      onClick: () => {
        goBack();
        choice.run();
        toast.dismiss(id);
      },
    },
    choice.label,
  );
  return {
    id,
    duration: Infinity,
    action: button,
    cancel: { label: choice.close, onClick: goBack },
  };
};

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
