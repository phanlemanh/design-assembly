---
type: decision
title: Chỉ dòng sổ mới là lời đáp; bản audit tự nói bước kế
links:
  - wiki/decisions/0006-one-ledger-one-layer-list.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/proofs.mjs
  - plugins/design-assembly/tests/test-adopt.mjs
---

# 0010 Chỉ dòng sổ mới là lời đáp; bản audit tự nói bước kế

## Status

Accepted theo kết quả chạy thử ngày 2026-11-12 mà chủ kho yêu cầu («Chạy thử»). Hai luật dưới đây
là máy rút ra từ phát hiện của hai tác tử độc lập, chờ chủ kho bác.

## Context

Hai tác tử chưa thấy cuộc trao đổi nào, mỗi tác tử một bản sao kho, chỉ được đọc ba skill và đầu ra
của lệnh. Cả hai vấp cùng ba chỗ:

- Bản audit đếm một giá trị nó **suy ra** là «người đã ghi». Màu xám mặc định của sàn được tính là
  màu thương hiệu đã chốt; một mức conformance nhắc trong dòng khác được tính là mức đã chọn. Lệnh
  adopt thì vẫn hỏi người hai điều đó. Câu trả lời của người vì thế không làm số nào đổi.
- Bản audit và lệnh adopt nhìn cùng một kho ra hai kết quả: audit báo «không có dòng» cho chín
  quyết định mà adopt ghi được dòng ngay.
- Không skill nào nói rõ kho nào đi đường nào. Một kho có sàn khớp cả hai câu «dùng cuộc dẫn dắt»
  và «dùng adopt, không dùng cuộc dẫn dắt».

## Decision

1. **Một quyết định chỉ được tính là có lời đáp khi sổ có dòng cho nó.** Điều bản audit thấy mà sổ
   chưa ghi được in cạnh quyết định dưới chữ «seen», và không vào số đo: một bằng chứng kho đang
   chạy (adopt sẽ ghi dòng), hoặc một giá trị trông giống lời đáp (chờ người xác nhận).
2. **Audit và adopt dùng chung một bộ dò bằng chứng.** Điều audit thấy là điều adopt ghi.
3. **Bản audit in dòng «next»**: skill phải chạy kế tiếp, tính từ tệp chứ không từ cách đọc báo
   cáo. Kho có màu chính mang sắc riêng thì adopt; kho còn màu xám mặc định thì dẫn dắt rồi adopt;
   không còn gì để sinh hay nhận thì nói thẳng.
4. **Cuộc dẫn dắt chạy adopt ở cuối**, để những gì sàn đã chứng minh cũng vào sổ.

## Consequences

- **Số đo cũ giảm ở chỗ từng đếm điều suy ra.** Kho đối chứng, trước khi adopt: 24/38 thay vì
  26/38. Kho này trước khi có plugin: 0/38 thay vì 6/38. Kho này hiện tại không đổi: 18/38.
- Bản audit thêm một dòng cho các quyết định ngoài lõi mà sổ đã đáp, và in phạm vi mà một lệnh
  kiểm tương phản thật sự phủ.
- Các số ở bản ghi 0006 và 0007 là số đo theo luật cũ, giữ nguyên làm lịch sử.

Giới hạn và điều còn mở:

- Các sửa đổi sau chạy thử được kiểm bằng bài kiểm và bằng tay của máy, chưa được một tác tử độc
  lập thử lại.
- Màu thương hiệu của kho được nhận không bị ghim: đổi sang một màu khác vẫn đạt tương phản thì chỉ
  cần ghi lại tệp token là qua. Ghim hay không là việc chủ kho chưa quyết.
