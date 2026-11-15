---
type: decision
title: Linh kiện được ghi «dựng từ» cả linh kiện mà tệp của nó chuyển tiếp
links:
  - wiki/decisions/0036-a-component-lives-where-it-is-defined.md
  - wiki/decisions/0034-component-reader-equal-to-the-reference-tool.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/tests/test-components.mjs
  - plugins/design-assembly/references/contract.md
  - "lượt chấm 1 của hồ sơ nghiệm thu refresh-design-assembly-tool ở Inventory, mục Ngoài-3, phanlemanh/onehub-inventory#67"
  - "chủ repo, 2026-11-15: «Sửa lỗi mất quan hệ dựng từ ở plugin»"
---

# 0038 Linh kiện được ghi «dựng từ» cả linh kiện mà tệp của nó chuyển tiếp

## Status

Accepted. Chủ repo bảo sửa ngày 2026-11-15 («Sửa lỗi mất quan hệ dựng từ ở plugin»). Thay ý thứ hai
của phần Consequences ở [0036](0036-a-component-lives-where-it-is-defined.md); phần Decision của 0036
giữ nguyên. Cách đọc «tệp chuyển tiếp» dưới đây là máy chọn, chờ chủ repo bác.

## Context

Bản sửa ở 0036 cho mỗi linh kiện một dòng, ở tệp định nghĩa nó. Cùng lúc, nó bỏ khỏi trường `parts`
những linh kiện mà một tệp nhập vào rồi chuyển tiếp: 0036 coi `parts` chỉ là linh kiện định nghĩa
trong cùng tệp, đúng chữ của hợp đồng lúc đó.

Lượt chấm 1 của hồ sơ chép công cụ ở Inventory gọi đó là mất dữ liệu (mục Ngoài-3). Sổ của Inventory
thôi ghi `Filters` dựng từ `FiltersAdvanced`, và `FiltersRow` dựng từ `FilterChip` và
`FiltersBuilder`, dù mã nguồn vẫn dựng như vậy. Tệp gom của bộ lọc nhập các linh kiện ấy để dựng, và
chuyển tiếp chúng cho nơi khác dùng.

## Decision

1. **Ứng viên của «dựng từ» là linh kiện của tệp:** linh kiện tệp tự định nghĩa, cộng linh kiện tệp
   nhập vào rồi xuất lại, ở danh sách xuất của riêng nó (`export { X }`) hay ở danh sách đọc từ tệp
   định nghĩa (`export { X } from …`).
2. **Linh kiện chỉ nhập, không chuyển tiếp, vẫn không tính.** Một nút dựng từ thư viện nền vẫn không
   vào `parts`, như trước 0036.
3. **Mỗi linh kiện vẫn một dòng, ở tệp định nghĩa nó.** Ý 1 chỉ đổi ứng viên của `parts`, không đổi
   chỗ ghi dòng.
4. Hợp đồng sổ linh kiện đổi chữ của `parts` theo ý 1; hình dạng sổ không đổi.

## Consequences

- **Trên Inventory, đọc tại chỗ, không ghi gì** (cây của PR #67, `7620a6c`): 289 dòng, cùng tên và
  tệp như sổ đang có; 22 dòng có `parts`, đúng như trước bản sửa ghi trùng. Chỉ `Filters` và
  `FiltersRow` đổi, về lại giá trị cũ.
- **Kho này:** sổ linh kiện không đổi dòng nào, vì kho không có tệp gom.
- **Sổ giới hạn:** mở và đóng dòng `handed-on-parts-dropped` cùng lần sửa.
- Inventory vẫn chạy công cụ của PR #67 cho tới khi được chép sang lần nữa, kèm hồ sơ nghiệm thu.
