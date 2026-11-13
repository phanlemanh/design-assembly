// A part of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// How each status of an item looks, wherever it is shown. Never give two statuses the same
// variant to pass a check: a person tells them apart by sight, not by the word alone.
import type { ComponentProps } from "react";

import type { Badge } from "@/components/ui/badge";
import type { Status } from "@/example/data";
import { LABELS } from "@/lib/labels";

type Variant = ComponentProps<typeof Badge>["variant"];

export const ITEM_STATUS: Record<Status, { label: string; variant: Variant }> = {
  active: { label: LABELS.statusActive, variant: "default" },
  pending: { label: LABELS.statusPending, variant: "outline" },
  overdue: { label: LABELS.statusOverdue, variant: "destructive" },
};
