---
type: decision
title: Kênh thông báo, hỏi trước hay hoàn tác, và bài kiểm của kho làm bằng chứng
links:
  - wiki/decisions/0013-states-words-error-messages.md
  - wiki/decisions/0012-column-types.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/patterns.mjs
  - plugins/design-assembly/scripts/proofs.mjs
  - plugins/design-assembly/tests/test-patterns.mjs
  - src/lib/notify.ts
  - tests/undo-or-confirm.test.tsx
---

# 0014 Kênh thông báo, hỏi trước hay hoàn tác, và bài kiểm của kho làm bằng chứng

## Status

Accepted. Lượt sau của bộ khuyến nghị chủ kho duyệt ngày 2026-11-12 («Dựng tiếp», kèm việc cài
một gói toast). Việc không cài gói thứ hai mà bản linh kiện của thư viện đòi, và việc cho bài kiểm
gắn thẻ của kho làm bằng chứng, là máy chọn, chờ chủ kho bác.

## Context

Còn ba câu của bậc «trạng thái của màn và lời văn». Hai câu là hành vi lúc chạy: báo kết quả qua
kênh nào, và khi nào hỏi trước khi làm. Máy không đọc được hành vi từ mã nguồn; nó chỉ đọc được
việc màn có đi vòng qua kênh của kho hay không. Kho này cũng chưa có toast.

## Decision

1. **Kênh theo phạm vi của tin**, luật của chủ kho: lỗi của một ô báo tại chỗ; kết quả một thao
   tác báo bằng toast, đảo được thì kèm hoàn tác; sự cố của cả màn hiện ở chỗ của nội dung.
2. **Màn không tự gọi thư viện toast, cũng không mở hộp thoại của trình duyệt.** Kết quả thao tác
   đi qua một mô-đun của kho. Máy giữ điều này.
3. **Đảo được thì làm ngay và cho hoàn tác; không đảo được thì hỏi trước**, câu hỏi gọi tên thứ sẽ
   mất. Hành vi này do bài kiểm của kho giữ, không phải do công cụ.
4. **Bài kiểm của kho có gắn thẻ tên quyết định là bằng chứng.** Adopt ghi dòng sổ trỏ tới nó, ở
   trạng thái «tự khai». Đây là quy ước sẵn có của sổ; trước đây adopt chỉ biết một danh sách bằng
   chứng cố định.
5. **Cột chữ co theo nội dung đang hiện**, chặn trên bởi độ dài mẫu của kiểu, cộng một ký tự dư.
   Theo luật hiện tại của chủ kho; các kiểu khác giữ độ dài mẫu.
6. **Mở hồ sơ cạnh danh sách chưa ghi gì**: chưa có màn nào cần.

## Consequences

- **Kho này (2026-11-12):** thêm mục xảy ra ngay và toast hiện kèm nút hoàn tác; xoá vẫn hỏi trước.
  Đã xem trên trình duyệt. Kho đáp 28/38 quyết định lõi (11 máy giữ, 14 tự khai, 3 đã ghi); bậc
  này lên 7/8.
- **Chỉ cài một gói** (toast). Bản linh kiện toast của thư viện đòi thêm một gói đổi chủ đề sáng
  tối; kho không cài, và linh kiện lấy màu từ biến màu của kho.
- **Cuộc dẫn dắt chỉ cài toast và mô-đun báo kết quả ở kho đã có gói toast**; không có thì nó nói
  cách thêm.
- **Hai lỗi được bắt khi áp vào kho này, đã sửa và có bài kiểm:** phép kiểm chữ nhận nhầm một biểu
  thức là chữ; và khi một luật đã có dòng sổ bị vi phạm, lần chạy lại của cuộc dẫn dắt gỡ mất lệnh
  kiểm, làm cổng đỏ với lý do sai. Giờ lệnh kiểm đã có thì không bị gỡ, và cổng nói đúng chỗ hỏng.

Giới hạn và điều còn mở:

- **Dòng «kênh thông báo» chỉ giữ việc màn không đi vòng.** Tin nào đi kênh nào vẫn là bài kiểm
  của kho và người soát.
- **Dòng «hỏi trước hay hoàn tác» là «tự khai»**: công cụ không chạy bài kiểm đó.
- **Toast không nằm trong danh sách trạng thái của màn**, nên bài kiểm trình duyệt của sàn (tương
  phản, cấu trúc) không đi qua nó. Nút hoàn tác trên toast cao đúng 24 px.
- Việc một hành động đảo được hay không hiện ghi ở màn, chưa ở mô hình dữ liệu như đã bàn: thêm
  hành động vào mô hình kéo theo nhiều mã sinh tự động, để khi kho có hành động thật.
- Chưa có băng báo sự cố riêng; kho chưa có tình huống nào cần nó.
- Bề rộng cột chữ giờ đổi theo dữ liệu đang hiện, trong giới hạn của độ dài mẫu.
