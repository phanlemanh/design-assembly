import { useEffect, useState, type ComponentType } from "react";

import { Toaster } from "@/components/ui/sonner";
import { LABELS } from "@/lib/labels";
import { notifyClear } from "@/lib/notify";
import { pick, SCREENS } from "@/screens";

const LINK = "rounded-md px-2 py-1";
const HERE = `${LINK} font-medium text-foreground underline underline-offset-4`;
const ELSEWHERE = `${LINK} text-muted-foreground hover:text-foreground`;

// The application's frame. Moving between screens belongs here and nowhere else: one region, the
// same place and the same order on every screen, with the open screen marked
// (design/behaviors.md, moving between screens). A screen never puts a link to another screen
// beside its own heading.
export function App() {
  const [Screen, setScreen] = useState<ComponentType | null>(null);
  // An address no screen claims shows the first screen, so the frame marks that one as open.
  const open = pick(window.location.pathname);
  useEffect(() => {
    void open?.load().then((loaded) => setScreen(() => loaded));
  }, [open]);
  return (
    <>
      <header className="sticky top-0 border-b bg-background">
        <nav
          aria-label={LABELS.navLabel}
          className="mx-auto flex max-w-5xl items-center gap-4 p-3 text-sm"
        >
          <span className="font-semibold">{LABELS.appName}</span>
          <ul className="flex items-center gap-1">
            {SCREENS.map((screen) => (
              <li key={screen.path}>
                <a
                  href={screen.path}
                  aria-current={screen.path === open?.path ? "page" : undefined}
                  // A toast belongs to the screen it was raised on and does not follow a person
                  // to the next one (design/behaviors.md, telling a person).
                  onClick={notifyClear}
                  className={screen.path === open?.path ? HERE : ELSEWHERE}
                >
                  {screen.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      {Screen ? <Screen /> : null}
      {/* The toaster is mounted once, beside whatever screen is shown. */}
      <Toaster />
    </>
  );
}
