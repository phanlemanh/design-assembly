---
type: decision
title: Sáu luật cho những gì tác tử dựng màn phải đoán ở lần thử năm
links:
  - wiki/decisions/0017-after-an-action.md
  - wiki/decisions/0018-import-direction-and-slips.md
  - wiki/specs/0001-design-system-for-claude-code.md
  - wiki/entities/item.md
sources:
  - src/components/ui/typed-table.tsx
  - src/components/held-label.tsx
  - src/example/ReferenceScreen.tsx
  - tests/e2e/templates.spec.ts
  - design/behaviors.md
  - design/patterns/danh-sach.md
  - design/parts.json
  - ontology/actions.yaml
  - ontology/roles.yaml
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/governance.mjs
  - plugins/design-assembly/references/checks.md
---

# 0021 Sáu luật cho những gì tác tử dựng màn phải đoán ở lần thử năm

## Status

Accepted. Lần thử năm để lại một danh sách điều tác tử dựng màn phải tự đoán. Máy đề xuất sáu luật,
chủ kho duyệt dựng ngày 2026-11-12 («Làm tiếp»). Phần mô hình dữ liệu (hai hành động và một vai)
chờ chủ kho duyệt riêng.

## Context

Ở lần thử năm, tác tử dựng màn làm đúng mọi luật đã có nhưng phải đoán ở sáu chỗ: một khái niệm mới
của dữ liệu khi không được sửa mô hình; phần vẽ hai màn dùng chung đặt ở đâu; một dòng có nhiều
thao tác, nhiều dòng cùng chờ; ở bề rộng 320 cột thao tác nằm ngoài khung; chữ «đang làm» làm nút
rộng ra; tiêu điểm đặt vào tiêu đề thì không thấy. Thêm nữa: khi nào một hành vi mới cần một dòng
sổ quyết định.

## Decision

1. **Khái niệm và hành động mới đi qua mô hình dữ liệu trước**, trong cùng thay đổi. Tác tử không
   được sửa mô hình thì dừng lại và hỏi. Màn mẫu đã làm hai việc mà mô hình chưa có tên, nên khai
   luôn `createItem` và `deleteItem` cho `Item`, với vai `user`; tên lấy đúng tên hàm đã có trong
   mã, không đặt tên mới.
2. **Phần vẽ hai màn dùng chung thành linh kiện của kho**, ở phần `shared` nằm giữa các màn và thư
   viện linh kiện. Danh sách phần cho phép một phần loại trừ tệp bằng `except`; hướng dẫn tự viết
   phần này khi thư viện linh kiện nằm trong một thư mục con.
3. **Thao tác trên dòng:** tối đa hai nút; từ ba thì gom vào trình đơn, thao tác đảo được trước,
   xoá cuối. Mỗi dòng chờ phần của nó. Nút đang chờ giữ nguyên bề rộng nhờ `HeldLabel`, một linh
   kiện của kho mà hướng dẫn cài cùng các phần của bảng.
4. **Bảng rộng hơn chỗ: cột thao tác luôn đứng yên** (`TypedActionsHead`, `TypedActions`); cột
   tên đứng yên từ bề rộng 640. Đề xuất ban đầu ghim cả hai ở mọi bề rộng; đo trên màn mẫu ở 320
   thì hai cột ghim chiếm 251 trên 272px, ba cột giữa không còn đọc được, nên trên điện thoại cột
   tên cuộn cùng dữ liệu. Phép kiểm `row-actions-in-view` của bài kiểm trình duyệt đỏ khi một nút
   của dòng đầu nằm ngoài khung, hoặc khi các cột đứng yên chừa không đủ chỗ cho cột rộng nhất
   cuộn qua. Đã thấy cả hai vế đỏ: bỏ ghim cột thao tác, và ghim cột tên ở 320.
5. **Tiêu điểm đi tới đâu thì thấy ở đó:** phần tử nhận tiêu điểm bằng `tabIndex={-1}` có viền như
   một nút.
6. **Sổ quyết định chỉ cho luật mà màn thứ hai cũng phải theo.** Lựa chọn của riêng một màn ở lại
   trong màn đó.

## Consequences

- Trang luật cho tác tử, trang hành vi và trang kiểu màn danh sách nói cả sáu luật; trang luật chỉ
  nhắc `TypedActions` và `HeldLabel` ở kho có cài chúng.
- Sổ có thêm dòng `row-actions-in-view` (máy viết, bậc patterns); danh mục chuẩn có 67 quyết định.
- Giới hạn: phép kiểm cột thao tác chỉ xem dòng đầu và bảng đầu; luật nhiều thao tác, mỗi dòng chờ riêng và
  sổ chỉ cho luật dùng chung không có lệnh kiểm, người xem lại. Phép kiểm viền tiêu điểm cũng chưa
  có: luật chỉ nằm trên trang.
- Còn mở: trạng thái chỉ tới được nhờ một thao tác ở màn khác; adopt vẫn im lặng về kiểu màn, cỡ
  màn, hướng nhập và sổ lỗi lọt.
