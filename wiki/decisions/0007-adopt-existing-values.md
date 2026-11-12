---
type: decision
title: Nhận giá trị kho đã có thay vì sinh đè
links:
  - wiki/decisions/0006-one-ledger-one-layer-list.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/references/known-proofs.json
  - plugins/design-assembly/templates/tools/design-assembly/styles.mjs
  - plugins/design-assembly/tests/test-adopt.mjs
---

# 0007 Nhận giá trị kho đã có thay vì sinh đè

## Status

Accepted. Chủ kho duyệt hướng ngày 2026-11-12 («Làm tiếp» trước đề xuất dựng phần ghi dòng sổ và
thêm lệnh kiểm quanh giá trị có sẵn, không ghi đè). Các chi tiết bên dưới (ngưỡng nhận ra màu
riêng, hai cờ dành cho người) là máy chọn, chờ chủ kho bác.

## Context

Sau quyết định 0006 còn hai giới hạn chặn plugin ở kho đã có design system:

- Cuộc dẫn dắt sinh màu chính từ source color và ghi đè màu kho đang có. Kho đã có màu thương hiệu
  không dùng được.
- Bản audit báo «không có dòng» cho những điều kho đã giữ bằng lint và bộ rào của sàn, vì không ai
  ghi dòng sổ cho chúng. Kho này đáp 9/38 quyết định lõi dù sàn đã giữ nhiều hơn thế.

Ba tình huống chủ kho nêu (chưa có, có dở, có đủ design system) cần một đường đi không sinh gì cả.

## Decision

1. **Hai đường vào sổ, không bao giờ cả hai cho một giá trị.** Sinh: cuộc dẫn dắt tính giá trị từ
   lựa chọn của người. Nhận: giá trị đã ở trong kho, lệnh adopt để nguyên và đặt lệnh kiểm quanh
   nó. Dữ liệu công cụ ghi quyết định nào là nhận, và stylesheet nào được đọc.
2. **Adopt không sửa gì của kho.** Không đụng stylesheet, cấu hình lint, bài kiểm, hay dòng sổ đã
   có. Nó chỉ thêm dòng cho quyết định chưa có dòng, và cài công cụ kiểm khi có giá trị để giữ.
3. **Chỉ thêm lệnh kiểm đang xanh và đỏ được.** Mỗi lệnh kiểm ứng viên được chính công cụ chạy trên
   kho như đang có: qua bây giờ, và trượt trên một bản bị đổi. Giá trị đang trượt ngưỡng thì không
   có dòng, và được báo riêng. Máy không nhận một trạng thái hỏng.
4. **Bằng chứng sẵn có vào sổ ở trạng thái «tự khai».** Bảng `references/known-proofs.json` nối
   luật lint, bộ rào và bài kiểm đã biết với quyết định chuẩn mà chúng đáp. Dòng chỉ được thêm khi
   dấu hiệu của bằng chứng có trong tệp và con trỏ giải được. Không lệnh nào ở đây chạy chúng.
5. **Điều của người thì người nói.** Mức conformance và việc «màu này là màu thương hiệu đã chốt»
   chỉ vào sổ khi người nêu qua cờ. Máy đưa số đo trước (tỉ lệ tương phản hôm nay), không đoán.
6. **Điều không đọc được thì nói là không đọc được.** Bộ kiểm đọc stylesheet qua các tệp import
   tương đối và đi theo `var()` tới theme của framework. Màu viết dạng pha trộn không được suy
   đoán: không có lệnh kiểm, và dòng sổ ghi rõ phần nào được phủ.
7. **Cuộc dẫn dắt từ chối ghi đè.** Nó dừng khi stylesheet có màu chính mang sắc riêng, hoặc khi
   giá trị đã được nhận. Chỉ cờ `--replace`, do người quyết, mới gỡ.

## Consequences

- **Kho này, đo ngày 2026-11-12:** sổ từ 9 lên 21 dòng; đáp 17/38 quyết định lõi thay vì 9/38
  (2 máy giữ, 12 kho tự khai, 3 đã ghi). 12 dòng mới đều là «tự khai», trỏ tới lint và bộ rào của
  sàn. Không giá trị nào đổi.
- **Kho đối chứng, chỉ xem trước, không ghi gì:** bộ kiểm đọc được màu thương hiệu qua bốn tệp và
  hai lớp biến; tương phản chế độ sáng đo được 6,32:1. Adopt sẽ thêm 4 dòng máy giữ, hoặc 6 dòng
  khi người nêu mức AA. Chế độ tối không đọc được vì màu chính viết dạng pha trộn.
- **Bài kiểm:** 14 bài mới, gồm chiều đỏ cho từng giá trị được nhận (đổi màu, bo góc, đơn vị
  khoảng cách, cỡ chữ đều làm cổng đỏ), và ca màu thương hiệu nằm cách hai tệp import.
- **Ba bài kiểm trình duyệt của sàn vẫn chưa vào sổ.** Adopt nhìn thấy chúng và báo: tệp không mang
  thẻ `decision:<id>`. Tệp đó của Repo Standards, kho này không sửa. Đây vẫn là khớp nối cần họ.

Giới hạn và điều còn mở:

- Dòng tương phản được nhận chỉ phủ hai cặp của màu chính, ở những chế độ đọc được. Câu hỏi chuẩn
  hỏi «mọi cặp color role». Ghi chú của dòng nói rõ phạm vi, nhưng bản audit vẫn đếm nó là «máy
  giữ».
- Ngưỡng nhận ra «màu chính mang sắc riêng» (chroma trên 0,05) là máy chọn để tách khỏi màu xám mặc
  định của sàn. Một kho dùng xám ngả màu có thể lọt.
- Adopt chỉ cài công cụ khi cổng của kho gom được tệp `mk/*.mk`. Kho khác kiểu cổng nhận được dòng
  «tự khai» nhưng không có lệnh kiểm giá trị.
- Cỡ chữ và đơn vị khoảng cách khai trong khối `@theme` chưa đọc được; adopt báo và không thêm gì.
- Bảng bằng chứng sẵn có hiện chỉ biết sàn của Repo Standards. Kho dùng luật lint riêng phải tự ghi
  dòng.
- Chưa chạy adopt thật ở kho nào ngoài kho này.
