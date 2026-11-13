// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// The application's frame. Moving between screens belongs here and nowhere else: one region, the
// same place and the same order on every screen, with the open screen marked (design/behaviors.md,
// moving between screens). A screen never links to another screen itself.
//
// Draw it once, from the app (`src/App.tsx`), with the list of screens (`src/screens.ts`):
//
//   <AppFrame appName={LABELS.appName} navLabel={LABELS.navLabel} screens={SCREENS} />
//
// It moves between screens without loading the page again, so what a person did on one screen is
// still there on the next; a click that asks for a new tab is left to the browser. A toast belongs
// to the screen it was raised on, so moving clears it. The toaster is drawn here, once.
import { useEffect, useState, type ComponentType, type MouseEvent } from "react";

import { Toaster } from "@/components/ui/sonner";
import { notifyClear } from "@/lib/notify";

type FrameScreen = {
  path: string;
  // What the navigation calls the screen. Take it from the repository's one place for words.
  title?: string | undefined;
  load: () => Promise<ComponentType>;
};

// A name in the header never breaks inside itself: when the names do not fit on one line, the list
// of screens moves below the application's name, then wraps between names.
const LINK = "rounded-md px-2 py-1 whitespace-nowrap";
const HERE = `${LINK} font-medium text-foreground underline underline-offset-4`;
const ELSEWHERE = `${LINK} text-muted-foreground hover:text-foreground`;

export function AppFrame({
  appName,
  navLabel,
  screens,
}: {
  appName: string;
  // What a screen reader calls the navigation.
  navLabel: string;
  screens: readonly FrameScreen[];
}) {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const moved = () => setPath(window.location.pathname);
    window.addEventListener("popstate", moved);
    return () => window.removeEventListener("popstate", moved);
  }, []);
  // An address no screen claims shows the first screen, so the frame marks that one as open.
  const open = screens.find((screen) => screen.path === path) ?? screens[0];
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
    notifyClear();
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
          aria-label={navLabel}
          className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 p-3 text-sm"
        >
          <span className="font-semibold whitespace-nowrap">{appName}</span>
          <ul className="flex flex-wrap items-center gap-1">
            {screens.map((screen) => (
              <li key={screen.path}>
                <a
                  href={screen.path}
                  aria-current={screen.path === open?.path ? "page" : undefined}
                  onClick={(event) => go(event, screen.path)}
                  className={screen.path === open?.path ? HERE : ELSEWHERE}
                >
                  {screen.title ?? screen.path}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {shown && shown.path === open?.path ? <shown.Screen key={shown.path} /> : null}
      <Toaster />
    </>
  );
}
