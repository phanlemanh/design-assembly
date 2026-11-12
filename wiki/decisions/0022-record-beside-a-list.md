---
type: decision
title: Mở một hồ sơ cạnh danh sách — câu lõi cuối, chọn bằng mắt
links:
  - wiki/decisions/0019-show-then-ask.md
  - wiki/decisions/0021-rules-the-builder-guessed.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - src/components/record-panel.tsx
  - src/lib/open-record.ts
  - src/example/ReferenceScreen.tsx
  - src/screens.ts
  - tests/record-panel.test.tsx
  - tests/e2e/templates.spec.ts
  - design/blueprint.json
  - design/behaviors.md
  - design/patterns/danh-sach.md
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/layers/patterns.md
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
---

# 0022 Mở một hồ sơ cạnh danh sách: câu lõi cuối, chọn bằng mắt

## Status

Proposed. Chủ kho chọn dựng ngày 2026-11-13 («Dựng hồ sơ»). Máy đã dựng cả ba cách bày, bảng mẫu
và lệnh kiểm. Cách bày đang áp vào kho là đề xuất của máy («cạnh danh sách»), ghi rõ là chưa ai
xác nhận, chờ chủ kho chọn một chữ cái trên bảng mẫu.

## Context

Sau lần thử sáu, kho trả lời 37 trên 38 câu lõi; câu còn thiếu là `record-panel`: «một hồ sơ mở
ra cạnh danh sách như thế nào?». Đây là câu người phải nhìn mới trả lời được, nên đi theo hướng
của 0019: phương án do kịch bản dựng, vẽ trên màn thật, chọn bằng chữ cái, máy giữ.

## Decision

1. **Ba cách bày, một danh sách đóng** (tầng interaction patterns, tên ngành là list-detail
   layout): `beside` (cạnh danh sách khi đủ chỗ cho cả hai, từ 1024px; hẹp hơn thì thế chỗ danh
   sách), `over` (tấm phủ từ cạnh phải, là một hộp thoại), `in-place` (thế chỗ danh sách ở mọi bề
   rộng). Đề xuất theo loại sản phẩm: `beside` cho application, `in-place` cho content site.
2. **Một linh kiện của kho bày cả ba**, `WithRecord`, đọc đúng một dòng `RECORD_LAYOUT`. Hướng dẫn
   ghi câu trả lời của bản thiết kế vào dòng đó mỗi lần chạy; phần còn lại của tệp là của kho. Đổi
   cách bày là đổi một chữ trong bản thiết kế, không phải viết lại màn.
3. **Mọi cách bày giữ chung một luật:** hồ sơ đang mở có tên trên địa chỉ (liên kết mở được, Back
   đóng được); mở thì tiêu điểm vào tiêu đề hồ sơ; đóng bằng nút, Esc hay Back thì tiêu điểm về
   đúng nút đã mở; chữ trong ô lọc còn nguyên. Tên mục trên dòng là nút mở hồ sơ.
4. **Bảng mẫu vẽ trên màn thật mà không ghi gì vào kho:** máy chủ phát triển đổi dòng
   `RECORD_LAYOUT` lúc phục vụ trang, kịch bản tìm trạng thái đầu tiên của danh sách màn có mở hồ
   sơ, rồi chụp mỗi cách ở bề rộng lớn nhất và nhỏ nhất được kiểm.
5. **Hai lớp giữ:** lệnh kiểm `record-layout` của cổng đỏ khi dòng `RECORD_LAYOUT` khác câu trả
   lời; bài kiểm trình duyệt của mọi trang đo trang nào có hồ sơ đang mở: trong khung, cạnh hay
   thế chỗ danh sách đúng cách đã chọn, là hộp thoại khi phủ lên, và tiêu điểm nằm trong hồ sơ.

## Consequences

- Màn mẫu có trạng thái mới `record-open`; sổ có dòng `record-panel` (bậc patterns, kind closed,
  lệnh kiểm của cổng); audit đủ 38 trên 38 câu lõi, và nói riêng rằng câu này vẫn là đề xuất.
- Tầng interaction patterns giờ có một câu hỏi. Bản thiết kế viết trước đó còn để tầng này
  `planned` vẫn áp được: hướng dẫn dùng đề xuất theo loại sản phẩm và ghi là chưa ai xác nhận.
- Đã thấy đỏ: dòng `RECORD_LAYOUT` khác câu trả lời; danh sách còn hiện ở 320 khi bày cạnh; hồ
  sơ không nằm cạnh danh sách ở 1440.
- Tìm thêm một lỗi cũ trên đường làm: hướng dẫn cài cột thao tác nhưng sổ linh kiện ghi cùng lúc
  thiếu phần đó, nên cổng đỏ ngay sau lần cài đầu. Đã sửa và ghi vào sổ lỗi lọt.
- Giới hạn: màn tự dựng tấm hay trang hồ sơ riêng thì không gì bắt; bảng mẫu chỉ vẽ được khi đã
  có một màn mở hồ sơ, nên kho mới dựng từ trống thấy phương án bằng chữ trước; với `over`, tiêu
  điểm vào nút Đóng chứ không vào tiêu đề, vì trang luật của sàn không cho đổi dáng tiêu đề hộp
  thoại; hồ sơ mở trong lúc danh sách còn đang tải không giành tiêu điểm.
