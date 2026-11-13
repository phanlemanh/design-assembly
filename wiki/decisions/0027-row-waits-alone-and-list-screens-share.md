---
type: decision
title: Dòng tự chờ sau khi hỏi, và các màn danh sách dùng chung phần tải
links:
  - wiki/decisions/0017-after-an-action.md
  - wiki/decisions/0025-app-frame-and-a-second-screen.md
  - wiki/decisions/0026-one-button-per-row-and-model-review-after.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - src/App.tsx
  - src/lib/list.ts
  - src/components/item-list.tsx
  - src/example/ReferenceScreen.tsx
  - src/example/OverdueScreen.tsx
  - tests/app-frame.test.tsx
  - tests/e2e/frame.spec.ts
  - plugins/design-assembly/scripts/apply.mjs
  - "chủ repo, 2026-11-13: «Sửa tiếp», chọn «Đóng hộp thoại ngay» và «Rút thành một phần chung»"
---

# 0027 Dòng tự chờ sau khi hỏi, và các màn danh sách dùng chung phần tải

## Status

Accepted. Sau lần thử chín, chủ repo bảo sửa tiếp các chỗ đoán lớn nhất («Sửa tiếp») và chọn hai
điều ở mục 1 và 2. Ba điều ở mục 3 đến 5 là máy chọn, chờ chủ repo bác.

## Context

Lần thử chín để lại bốn chỗ mà tác tử dựng màn phải đoán hoặc tự sửa:

- hộp thoại hỏi trước giữ mọi dòng khác trong lúc chờ, ngược luật «mỗi dòng chờ phần của nó»;
- các màn danh sách chép nguyên phần tải, thử lại và lọc của nhau, vì hai trang nói ngược nhau;
- dữ liệu mẫu quên điều người dùng vừa làm khi đổi màn, vì khung tải lại cả trang;
- chưa luật nào nói tiêu điểm đi đâu khi hoàn tác làm một dòng quay lại.

## Decision

1. **Thao tác trên dòng có hỏi trước đóng hộp thoại ngay khi người xác nhận** (chủ repo chọn).
   Nút của dòng được giữ trong lúc chờ, các dòng khác vẫn dùng được. Từ đó nó là thao tác làm
   ngay: xong thì toast báo kết quả, thất bại thì toast báo kèm nút «Thử lại» làm lại mà không
   hỏi lại. Màn mẫu xoá theo cách này.
2. **Các màn danh sách dùng chung phần tải, thử lại và lọc** (chủ repo chọn): `useList` ở
   `src/lib/list.ts`, cùng phần vẽ `ItemList` ở `src/components/item-list.tsx`. Mỗi màn chỉ đưa
   nguồn dữ liệu, tiêu đề, lời của trạng thái trống và việc trên dòng. Trang luật nói thêm: luật
   «phần chung chuyển xuống» áp cả cho phần logic chép từ màn mẫu.
3. **Khung đổi màn mà không tải lại trang** (máy chọn). Liên kết điều hướng vẫn là liên kết; một cú
   bấm thường thì khung tự đổi địa chỉ và màn, còn bấm kèm phím mở thẻ mới thì để trình duyệt lo.
4. **Hoàn tác làm một dòng quay lại thì tiêu điểm vào đúng nút đó của dòng vừa quay lại** (máy
   chọn). Hai tác tử của lần chín, chạy độc lập, cùng chọn như vậy.
5. **Nút một thao tác trên dòng báo đang làm bằng vòng xoay thay cho chữ, giữ nguyên bề rộng** (máy
   chọn). Lần đầu tôi dùng chữ «Đang xoá» giữ bề rộng như các nút khác. Cổng kiểm của repo đỏ: ở
   320, cột thao tác thiếu 2px, đúng lỗi lần tám tìm ra với nút chữ. Vòng xoay thống nhất với nút
   «⋯». Tên đọc nói «Đang xoá» kèm tên mục, và chữ «Đang xoá» vẫn có trên trang cho trình đọc màn
   hình và cho phép kiểm.

## Consequences

- Màn mẫu và màn quá hạn ngắn lại: màn quá hạn còn khoảng 50 dòng, không còn chép phần nào của màn
  mẫu.
- Đo ở 320: cột thao tác của màn mẫu chừa 20,5px trước ngưỡng, kể cả lúc một dòng đang xoá.
- Cổng kiểm: 94 bài kiểm thường, 76 lượt kiểm trình duyệt, 218 bài kiểm của plugin. Bài kiểm đổi màn
  đỏ khi khung tải lại trang như trước.
- Sổ giới hạn đóng năm dòng: `sample-store-forgets-screens`, `dialog-wait-blocks-rows`,
  `list-screen-logic-copied`, `focus-when-row-returns`, `reference-delete-departs-from-rules`.
- Còn mở: không lệnh kiểm nào giữ luật tiêu điểm khi một dòng quay lại, vì màn mẫu không có thao
  tác nào làm một dòng quay lại. Một trạng thái chỉ nghe được vẫn không khai được cho bài kiểm
  trình duyệt; màn mẫu lách bằng chữ ẩn cho trình đọc màn hình.
- Các sửa đổi này chưa được tác tử độc lập thử.
