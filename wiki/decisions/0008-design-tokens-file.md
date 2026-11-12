---
type: decision
title: Tệp design tokens là vật dẫn xuất từ stylesheet
links:
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/tokens.mjs
  - plugins/design-assembly/templates/tools/design-assembly/styles.mjs
  - plugins/design-assembly/tests/test-tokens.mjs
  - design/tokens.json
---

# 0008 Tệp design tokens là vật dẫn xuất từ stylesheet

## Status

Accepted. Chủ kho duyệt hướng ngày 2026-11-12 («Làm tiếp» trước đề xuất dựng tệp design tokens theo
định dạng kit nghiệm thu đang đọc). Cách đặt tên token, cách ghi chế độ tối và việc bỏ nhóm phông
chữ là máy chọn sau khi đọc bộ đọc của kit, chờ chủ kho bác.

## Context

Bậc foundations đòi một vật: tệp design tokens ở đường dẫn kit nghiệm thu đọc
(`design_floor.tokens`). Trước khi dựng, máy đọc hợp đồng nhập của kit và mã bộ đọc mà kit giao đi.
Ba điều rút ra:

- Tệp là JSON hai cấp `nhóm.tên`, mỗi lá có `$type` (một trong chín loại) và `$value`. Cấp trên
  cùng chỉ nhận nhóm, không nhận siêu dữ liệu.
- Bộ đọc đổi đường dẫn token thành tên biến CSS (`color.primary` thành `--color-primary`), rồi tính
  một khai báo là «dùng token» khi nó dùng biến đó. Tên token vì thế không tuỳ ý.
- Bộ đọc không có khái niệm chế độ sáng tối: mỗi token một giá trị.

Kho đã có một nguồn giá trị duy nhất là stylesheet. Một tệp thứ hai chép tay sẽ lệch.

## Decision

1. **Tệp token là vật dẫn xuất.** Giá trị đổi ở stylesheet; tệp được ghi lại từ đó bằng
   `make design-tokens`. Không ai sửa tay tệp.
2. **Token là biến theme của stylesheet.** Mỗi biến `--color-*`, `--radius-*`, `--text-*` trong khối
   theme thành một token cùng tên, nên tên biến mà kit suy ra luôn là biến có thật.
3. **Giá trị là chữ CSS đã đi hết chuỗi `var()`**, không đổi hệ màu. Phép nhân độ dài với một số
   được gộp; biểu thức khác giữ nguyên.
4. **Giá trị chế độ tối nằm cạnh giá trị gốc**, trong phần mở rộng của token, chỉ khi nó khác.
5. **Một lệnh kiểm giữ tệp khớp stylesheet theo cả hai chiều**: stylesheet đổi mà tệp chưa ghi lại
   thì đỏ, sửa tay tệp thì đỏ, mất tệp thì đỏ. Quyết định này là một dòng sổ (`design-tokens`).
6. **Cả hai đường đều ghi tệp**: cuộc dẫn dắt và adopt. Tệp token người đã tự giữ, nói khác
   stylesheet, thì không bao giờ bị ghi đè.
7. **Đường dẫn theo khai báo của kit** khi kho có khai, không thì `design/tokens.json`.

## Consequences

- **Kho này (2026-11-12):** `design/tokens.json` có 47 token (31 màu, 7 bo góc, 9 cỡ chữ). Bậc
  foundations chuyển từ «chưa đạt» sang «tự khai»: 9/9 quyết định lõi có lời đáp và vật có mặt,
  nhưng phần lớn dựa trên luật lint mà bản audit không chạy lại.
- **Bộ đọc thật của kit nhận tệp.** Một bài kiểm đưa tệp do plugin sinh cho lệnh đo độ phủ token
  của kit: ba khai báo dùng biến được tính là token, một màu thô được tính là thô. Bài này chạy khi
  kit có trên máy, và bị bỏ qua có báo khi không.
- **Kit có lệnh sinh lại để nối.** `make design-tokens` là lệnh mà kho khai ở `design_floor.sinh_lai`.
- Sổ thêm quyết định `color-palette`: ở sàn này nguồn không được dùng màu bảng nào, màu trung tính
  và màu trạng thái đều là color role của stylesheet, do cùng luật lint cấm màu thô giữ. Đây là cách
  máy đọc câu hỏi; ở kho đối chứng câu này được đáp bằng một luật riêng.
- Danh mục chuẩn có 65 quyết định (thêm `design-tokens`); số lõi vẫn là 38.

Giới hạn và điều còn mở:

- Màu viết theo OKLCH được giữ nguyên chữ. Bộ đọc của kit chỉ hiểu mã hex ở phép so «màu thô với
  token», nên phép so đó không nhận các màu này. Phép đo độ phủ theo biến thì không bị ảnh hưởng.
- Không có token cho phông chữ, đơn vị khoảng cách, đổ bóng và chuyển động. Phông chữ chưa là một
  lựa chọn của tầng foundations; đơn vị khoảng cách nằm ở một biến không có dạng `nhóm.tên`.
- Kit xếp một kho lên bậc M2 khi có cả tệp token lẫn sổ linh kiện. Sổ linh kiện chưa dựng, và kho
  này chưa khai gì với kit, nên bậc của kit chưa đổi.
- Cách ghi chế độ tối là quy ước riêng của plugin. Chuẩn của ngành chưa có cách thống nhất mà bộ đọc
  này hiểu.
