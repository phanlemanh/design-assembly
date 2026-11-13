import { useEffect, useState, type ComponentType, type MouseEvent } from "react";

import { Toaster } from "@/components/ui/sonner";
import { LABELS } from "@/lib/labels";
import { notifyClear } from "@/lib/notify";
import { pick, SCREENS } from "@/screens";

// A name in the header never breaks inside itself: when the names do not fit on one line, the list
// of screens moves below the application's name, then wraps between names.
const LINK = "rounded-md px-2 py-1 whitespace-nowrap";
const HERE = `${LINK} font-medium text-foreground underline underline-offset-4`;
const ELSEWHERE = `${LINK} text-muted-foreground hover:text-foreground`;

// The application's frame. Moving between screens belongs here and nowhere else: one region, the
// same place and the same order on every screen, with the open screen marked
// (design/behaviors.md, moving between screens). A screen never puts a link to another screen
// beside its own heading.
export function App() {
  // The frame moves between screens without loading the page again, so what a person did on one
  // screen is still there on the next: the data source keeps it until the page reloads.
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const moved = () => setPath(window.location.pathname);
    window.addEventListener("popstate", moved);
    return () => window.removeEventListener("popstate", moved);
  }, []);
  // An address no screen claims shows the first screen, so the frame marks that one as open.
  const open = pick(path);
  const [shown, setShown] = useState<{ path: string; Screen: ComponentType } | null>(null);
  useEffect(() => {
    if (!open) return;
    let current = true;
    void open.load().then((Screen) => current && setShown({ path: open.path, Screen }));
    return () => {
      current = false;
    };
  }, [open]);
  function go(event: MouseEvent<HTMLAnchorElement>, to: string) {
    // A toast belongs to the screen it was raised on and does not follow a person to the next one
    // (design/behaviors.md, telling a person).
    notifyClear();
    // A click that asks for a new tab or window is the browser's to handle.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    if (to !== window.location.pathname) window.history.pushState(null, "", to);
    setPath(to);
  }
  return (
    <>
      <header className="sticky top-0 border-b bg-background">
        <nav
          aria-label={LABELS.navLabel}
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm"
        >
          <span className="font-semibold whitespace-nowrap">{LABELS.appName}</span>
          <ul className="flex flex-wrap items-center gap-1">
            {SCREENS.map((screen) => (
              <li key={screen.path}>
                <a
                  href={screen.path}
                  aria-current={screen.path === open?.path ? "page" : undefined}
                  onClick={(event) => go(event, screen.path)}
                  className={screen.path === open?.path ? HERE : ELSEWHERE}
                >
                  {screen.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {shown && shown.path === open?.path ? <shown.Screen key={shown.path} /> : null}
      {/* The toaster is mounted once, beside whatever screen is shown. */}
      <Toaster />
    </>
  );
}
