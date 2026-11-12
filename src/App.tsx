import { useEffect, useState, type ComponentType } from "react";

import { Toaster } from "@/components/ui/sonner";
import { pick } from "@/screens";

// Shows the screen registered for this path. The screen loads its own data.
export function App() {
  const [Screen, setScreen] = useState<ComponentType | null>(null);
  useEffect(() => {
    void pick(window.location.pathname)
      ?.load()
      .then((loaded) => setScreen(() => loaded));
  }, []);
  // The toaster is mounted once, beside whatever screen is shown.
  return (
    <>
      {Screen ? <Screen /> : null}
      <Toaster />
    </>
  );
}
