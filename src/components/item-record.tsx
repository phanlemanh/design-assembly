// A component of the repository's own, shared by its screens (design/parts.json, part `shared`).
//
// One item's fields, as the record opened from a list shows them. The headers are the table's
// headers, so a person reads the record as the row they pressed
// (.claude/rules/design-assembly.md, a record beside a list).
import { ITEM_STATUS } from "@/components/item-status";
import { Badge } from "@/components/ui/badge";
import type { Item } from "@/example/data";
import { formatDate, formatMoney } from "@/lib/format";
import { LABELS } from "@/lib/labels";

export function ItemRecord({ item }: { item: Item }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
      <dt className="text-muted-foreground">{LABELS.columnStatus}</dt>
      <dd>
        <Badge variant={ITEM_STATUS[item.status].variant}>{ITEM_STATUS[item.status].label}</Badge>
      </dd>
      <dt className="text-muted-foreground">{LABELS.columnDate}</dt>
      <dd>{formatDate(item.date)}</dd>
      <dt className="text-muted-foreground">{LABELS.columnTotal}</dt>
      <dd>{formatMoney(item.total)}</dd>
    </dl>
  );
}
