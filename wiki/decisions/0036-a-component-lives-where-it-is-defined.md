---
type: decision
title: Linh kiện ở tệp định nghĩa nó, không ở tệp gom
links:
  - wiki/decisions/0034-component-reader-equal-to-the-reference-tool.md
  - docs/trials/inventory-ladder.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/tests/test-components.mjs
  - "lượt chấm 1 của hồ sơ nghiệm thu adopt-design-assembly ở Inventory, phanlemanh/onehub-inventory#58"
  - "chủ repo, 2026-11-15: ký hồ sơ, chọn «mở hợp đồng mới» cho mục sổ linh kiện ghi trùng"
---

# 0036 Linh kiện ở tệp định nghĩa nó, không ở tệp gom

## Status

Accepted; ý thứ hai của Consequences được thay bởi [0038](0038-a-component-is-drawn-with-what-its-file-hands-on.md)
ngày 2026-11-15. Máy chọn quy tắc này ngày 2026-11-15, chờ chủ repo bác. Chỉ đổi plugin và kho này;
Inventory chưa bị đụng, chép công cụ sang đó là một bước riêng chủ repo duyệt.

## Context

Lượt chấm 1 của hồ sơ nghiệm thu ở Inventory thấy chín linh kiện bộ lọc có hai dòng trong sổ linh
kiện: một dòng đủ thuộc tính ở tệp định nghĩa, một dòng rỗng ở tệp gom
`src/components/reui/filters/filters.tsx`. Tệp gom ấy vừa định nghĩa hai linh kiện của nó, vừa xuất
lại các linh kiện của tệp khác bằng `export { … } from`. Bộ đọc coi mọi tên trong danh sách xuất là
linh kiện của tệp đang đọc, nên tác tử tra một tên nhận hai câu trả lời, một trong hai không có thuộc
tính.

Câu hỏi thật: một linh kiện được xuất ở hai nơi thì sổ ghi nó ở đâu. Hai cách:

- ở tệp định nghĩa: nơi chữ ký, biến thể và chiều cao đọc được, và nơi người sửa linh kiện;
- ở tệp gom: đường người gọi viết khi nhập.

## Decision

1. **Một linh kiện, một dòng, ở tệp định nghĩa nó.** Sổ trả lời «sửa ở đâu, nhận gì», đúng câu đầu
   tệp công cụ: linh kiện đổi ở tệp nguồn của nó. Đường nhập qua tệp gom đọc được từ mã, không cần
   sổ nhắc.
2. **Tệp chỉ chuyển tiếp thì không phải chỗ của linh kiện.** Không ghi dòng cho: danh sách xuất từ
   tệp khác (`export { X } from`, kể cả tên đổi bằng `as`), `export * from`, và tên tệp nhập vào rồi
   xuất lại (`import { X } …; export { X }`).
3. Tên tệp tự định nghĩa rồi xuất trong danh sách, kể cả khi đổi tên bằng `as`, vẫn như cũ.

## Consequences

- **Trên Inventory ở `20a13c2`**, đọc tại chỗ, không ghi gì: sổ từ 298 xuống 289 dòng, đúng chín
  dòng rỗng ở tệp gom. Không tên nào mất; mỗi tên còn một dòng.
- Hai linh kiện của chính tệp gom, `Filters` và `FiltersRow`, bớt mục «phần» trỏ sang linh kiện của
  tệp khác (`FiltersAdvanced`, `FilterChip`, `FiltersBuilder`). «Phần» là linh kiện cùng tệp; các tên
  ấy lọt vào chỉ vì cùng lỗi trên. (Thay bởi 0038: chúng là linh kiện tệp gom chuyển tiếp, và lại được
  ghi vào «phần».)
- **Kho này:** sổ linh kiện không đổi dòng nào, vì kho không có tệp gom.
- **Sổ giới hạn:** mở và đóng dòng `barrel-re-export-listed-twice` cùng lần sửa.
- Inventory vẫn chạy bản công cụ cũ cho tới khi được chép sang (dòng `adopt-does-not-refresh-tool`
  vẫn mở).
