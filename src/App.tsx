import { AppFrame } from "@/components/app-frame";
import { LABELS } from "@/lib/labels";
import { SCREENS } from "@/screens";

// The application: its frame with every screen of the register (design/behaviors.md, moving
// between screens). Moving between screens, the toaster and leaving a screen's toasts behind are
// the frame's.
export function App() {
  return <AppFrame appName={LABELS.appName} navLabel={LABELS.navLabel} screens={SCREENS} />;
}
