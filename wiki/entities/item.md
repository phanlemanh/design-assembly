---
type: entity
title: Item
links:
  - ontology/entities/Item.yaml
  - ontology/actions.yaml
sources:
  - src/example/data.ts
  - design/column-types.json
---

# Item

## Definition

Bản ghi mẫu mà màn mẫu liệt kê: một dòng có tên, trạng thái, ngày và tổng tiền. Nó đứng thay một
bản ghi nghiệp vụ thật, để màn mẫu và tầng bảng dữ liệu có dữ liệu mà chạy. Nó không phải một khái
niệm nghiệp vụ của sản phẩm nào.

## Rules

Không có luật nghiệp vụ. Mỗi trường khai kiểu cột của nó bằng khoá `display` trong
`ontology/entities/Item.yaml`; kiểu cột quyết định canh lề và bề rộng tối thiểu của cột.

Ba hành động, khai trong `ontology/actions.yaml`, chỉ vai `user` được chạy, tác tử AI không được:

- `listItems`: xem các mục mẫu của danh sách; màn quá hạn hiện cùng các mục, đã lọc. Thêm ngày
  2026-11-15 vì sổ màn khai hai màn mẫu hiện `Item`, và phép kiểm nối sổ màn với mô hình đòi một
  hành động xem cho mỗi thứ một màn hiện (đề bài 0003).
- `createItem`: thêm một mục mẫu, làm ngay; đảo lại bằng `deleteItem` qua nút hoàn tác của toast.
- `deleteItem`: xoá một mục sau khi người xác nhận; không đảo lại được.

## Where in the code

- Kho dữ liệu mẫu: `src/example/data.ts`. Kiểu ở đó do sàn viết tay và giữ ngày ở dạng `Date`.
- Màn hiển thị: `src/example/ReferenceScreen.tsx` (mọi mục) và `src/example/OverdueScreen.tsx`
  (mục quá hạn). Hai màn dùng chung phần tải, thử lại và lọc ở `src/lib/list.ts`, và phần vẽ ở
  `src/components/item-list.tsx`, `src/components/item-table.tsx`, `src/components/item-record.tsx`
  và `src/components/notice.tsx`.
- Ba hành động: `listItems`, `createItem` và `deleteItem` trong `src/example/data.ts`; kiểu của chúng sinh
  vào `src/generated/ontology.ts`.
- Kiểu cột của từng trường, sinh từ mô hình: `design/columns.json`.

## History

- 2026-11-12 — Thêm vào mô hình để tầng bảng dữ liệu của plugin có trường mà gắn kiểu cột.
- 2026-11-12 — Chủ kho xem lại và giữ thực thể mẫu cùng khoá `display` («Giữ»).
- 2026-11-12 — Khai hai hành động `createItem`, `deleteItem` và vai `user`: màn mẫu đã làm hai
  việc này mà mô hình chưa có tên cho chúng (chạy thử lần năm).
- 2026-11-12 — Chủ kho xem riêng phần mô hình này và giữ hai hành động cùng vai `user` («Giữ»).
- 2026-11-15 — Khai hành động xem `listItems`: sổ màn nói hai màn mẫu hiện `Item`, và phép kiểm nối
  sổ màn với mô hình đòi một hành động xem cho mỗi thứ màn hiện (đề bài 0003).
- 2026-11-15 — Chủ kho xem riêng phần mô hình này và duyệt: «Duyệt, áp bản vá» ở phiên này, «Duyệt» ở phiên điều phối.
