---
type: decision
title: "Tên của phiên đi mỗi tên một cờ; giá trị có khoảng trắng hay rỗng là lời gọi sai"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0090-plugs-sees-the-session-falls-back-and-shows-the-board.md
sources:
  - docs/trials/person-trial-stopped-at-the-plugs-step.md
  - plugins/design-assembly/scripts/command.mjs
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/scripts/review.mjs
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/skills/review/SKILL.md
  - plugins/design-assembly/tests/test-command-contract.mjs
  - plugins/design-assembly/tests/test-plugs.mjs
  - plugins/design-assembly/tests/test-review.mjs
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-25, qua phiên điều phối: «Sửa trước», đáp câu «Dừng lượt này để sửa lỗi rồi chạy lại từ đầu, hay chạy tiếp lượt đang dở?»"
---

# 0108 Tên của phiên đi mỗi tên một cờ; giá trị có khoảng trắng hay rỗng là lời gọi sai

## Status

Accepted, 2026-11-25, mục 10.4 của kế hoạch, plugin 0.58.0. Chủ repo dừng lượt thử có người và cho sửa trước
(«Sửa trước»). Lượt thử chạy lại từ đầu sau khi bản sửa này gộp.

## Context

Lượt thử có người đầu tiên ([bản ghi](../../docs/trials/person-trial-stopped-at-the-plugs-step.md)) dừng ở bước plugs của
`new`.

- **Tác tử truyền gì.** Nó gom tên skill và server của phiên vào biến, rồi truyền qua một vòng lặp. Shell của phiên không
  tách một biến không có dấu nháy, nên mỗi cờ `--skill`, `--server`, `--needs-sign-in` nhận một giá trị là mọi tên nối
  bằng dấu cách.
- **Lệnh đọc thế nào.** Cờ kiểu `list` của `readCall` nhận mọi giá trị như một tên. Lệnh `plugs` không khớp phích nào, nói
  không có phích ngoài đã đo trong repo hay phiên, thoát 0 và không hỏi gì.
- **Hậu quả.** Một phiên có cả `frontend-design` lẫn `design:design-critique` bị đọc thành một phiên không có gì. Lượt chọn
  phích của chủ repo, nửa đầu dòng «xong khi», không xảy ra.

Tên skill, tên lệnh và tên server mà phiên liệt kê không có khoảng trắng. Một giá trị có khoảng trắng vì vậy là nhiều tên
bị nối, còn một giá trị rỗng là không tên nào. Cả hai đều không phải điều người gọi muốn nói.

## Decision

1. **`readCall` có thêm kiểu cờ `names`:** một danh sách, mỗi giá trị đúng một tên. Một giá trị có khoảng trắng (dấu cách,
   tab, xuống dòng) hay rỗng là lời gọi sai:
   - lệnh thoát 2, không ghi gì, không in câu trả lời;
   - lời trên luồng lỗi nêu tên cờ và ba từ đầu của giá trị (thêm «…» khi còn nữa);
   - lời ấy bảo: «Give each name a flag of its own: `--skill <name> --skill <name>`».
2. **Cờ dùng kiểu ấy:** `--skill`, `--server`, `--needs-sign-in` của `plugs`, và `--skill` của `review`. Đó là những cờ
   nhận tên của phiên. Bất kỳ tên nào cũng hợp lệ ở đó, nên một tên lạ không bị từ chối, và chỉ hình dạng của giá trị mới
   bắt được lỗi này.
3. **Câu «No outside plug that was measured is in this repository or this session»** không còn được in cho một phiên mà
   lệnh không đọc được tên. Lời gọi ấy dừng trước, ở bước đọc cờ.
4. **Bốn trang skill truyền tên của phiên** (`plugs`, `new`, `adopt`, `review`) nói cùng một câu: mỗi tên một cờ, viết ra
   trong lời gọi, ví dụ `--skill one-skill --skill another-skill`, không bao giờ nhiều tên trong một giá trị. Câu ấy nói
   thêm rằng tên giữ chung trong một biến không thành các đối số riêng ở mọi shell. Trang không nêu tên shell nào, nên lời
   khuyên đúng với mọi shell.

**Các cờ khác nhận danh sách tên đã soát:**

- `--reask` của `plugs`, `--only` và `--replaces` của `decide`, `--record` và `--hold` của `adopt` đều từ chối một mã nó
  không biết, nên một giá trị nối không lọt qua lặng lẽ. Đây không cùng lỗi, nên không cần dòng giới hạn.
- `--file` của `conform` và `--files` của `font-source` nhận đường dẫn tệp, và đường dẫn có thể có dấu cách. Đây cũng
  không cùng lỗi.

## Consequences

- Một tác tử truyền tên của phiên sai cách nay thấy lời gọi sai cùng cách sửa, thay vì một bảng phích trống.
- Dòng giới hạn mới, đóng ngay trong thay đổi này: `session-names-joined-read-as-none`.
- Dòng `plugs-session-listed-by-the-skill` vẫn mở. Ở lượt đã dừng, tác tử chọn 35 trong khoảng 260 skill phiên liệt kê,
  không truyền cả danh sách, và chưa lượt nào có người cho thấy danh sách được truyền đủ.
- Lượt thử có người chạy lại từ đầu trên bản sao mới với tác tử mới, theo lời chủ repo. Chi phí của lượt đã dừng (284 299
  token) được đặt cạnh chi phí của lượt mới, không gộp vào.
