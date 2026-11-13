import { useRef } from "react";

import { ItemList } from "@/components/item-list";
import { ItemRecord } from "@/components/item-record";
import { Notice } from "@/components/notice";
import { WithRecord } from "@/components/record-panel";
import { listOverdueItems } from "@/example/data";
import { LABELS } from "@/lib/labels";
import { useList } from "@/lib/list";
import { useOpenRecord } from "@/lib/open-record";

// The second screen of the list kind (design/patterns/danh-sach.md). Loading, retrying, filtering
// and the table are the kind's, shared with the reference screen (`useList`, `ItemList`), so a
// person reads the two lists as one thing; this screen gives its source and its words.
//
// A person cannot put an item here from this screen: an item arrives by passing its date. So the
// empty state has no button, and nothing on a row changes data.
export function OverdueScreen() {
  const list = useList(listOverdueItems);
  const record = useOpenRecord();
  const heading = useRef<HTMLHeadingElement>(null);
  const opened = (list.items ?? []).find((item) => String(item.id) === record.id) ?? null;

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-4 p-6 text-sm">
      <h1
        ref={heading}
        tabIndex={-1}
        className="rounded-sm text-lg font-semibold outline-none focus:ring-3 focus:ring-ring/50"
      >
        {LABELS.overdueTitle}
      </h1>
      <WithRecord
        record={record}
        title={opened?.name ?? null}
        closeLabel={LABELS.close}
        content={opened && <ItemRecord item={opened} />}
      >
        <ItemList
          list={list}
          label={LABELS.overdueTableName}
          empty={<Notice title={LABELS.overdueEmptyTitle} detail={LABELS.overdueEmptyDetail} />}
          onOpen={(item, from) => record.open(String(item.id), from)}
        />
      </WithRecord>
    </main>
  );
}
