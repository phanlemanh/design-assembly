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

Tên skill, tên lệnh và tên server mà phiên liệt kê chỉ có chữ, số, dấu hai chấm, gạch nối và gạch dưới: 261 skill và 34
server của phiên ở lượt đã dừng, cùng 35, 25 và 14 tên tác tử truyền. Một giá trị có khoảng trắng, dấu phẩy hay dấu chấm
phẩy vì vậy là nhiều tên bị nối, còn một giá trị rỗng là không tên nào. Cả hai đều không phải điều người gọi muốn nói.

Bản soát PR đầu tiên của thay đổi này cho thấy một chuỗi nối bằng dấu phẩy vẫn lọt. Như với dấu cách, kết quả tuỳ tên
cuối của chuỗi: `archify,frontend-design,design:design-critique` cho riêng câu ổ soát màn, còn
`design:design-critique,frontend-design,archify` cho câu «No outside plug…».

## Decision

1. **`readCall` có thêm kiểu cờ `names`:** một danh sách, mỗi giá trị đúng một tên. Một giá trị có khoảng trắng (dấu cách,
   tab, xuống dòng), dấu phẩy hay dấu chấm phẩy, hoặc một giá trị rỗng, là lời gọi sai:
   - lệnh thoát 2, không ghi gì, không in câu trả lời;
   - lời trên luồng lỗi nêu tên cờ và giá trị tới hết tên thứ ba (thêm «…» khi còn nữa);
   - lời ấy bảo: «Give each name a flag of its own: `--skill <name> --skill <name>`».
2. **Cờ dùng kiểu ấy:** `--skill`, `--server`, `--needs-sign-in` của `plugs`, và `--skill` của `review`. Đó là những cờ
   nhận tên của phiên. Bất kỳ tên nào cũng hợp lệ ở đó, nên một tên lạ không bị từ chối, và chỉ hình dạng của giá trị mới
   bắt được lỗi này.
3. **Câu «No outside plug that was measured is in this repository or this session»** không còn được in cho một phiên có
   tên nối bằng khoảng trắng, dấu phẩy hay dấu chấm phẩy. Lời gọi ấy dừng trước, ở bước đọc cờ.
4. **`plugs` nói nó đọc được bao nhiêu tên mỗi loại**, khi lời gọi nêu phiên: dòng `Read from the session: 35 skills, 25
servers, 14 servers waiting for a sign-in.`, in cả ở dạng ngắn (`--short`, dạng `new` và `adopt` chạy) lẫn dạng đầy đủ,
   và khoá `session_read` trong câu trả lời `--json` (`null` khi lời gọi không nêu phiên). Dòng ấy chỉ nói điều đã đọc,
   không quyết gì. Lượt đã dừng sẽ đọc thành «1 skill, 1 server, 1 server waiting for a sign-in». Vì vậy một danh sách đọc
   sai hiện ra ngay, dù nó nối bằng ký tự nào.
5. **Bốn trang skill truyền tên của phiên** (`plugs`, `new`, `adopt`, `review`) nói cùng một câu: mỗi tên một cờ, viết ra
   trong lời gọi, ví dụ `--skill one-skill --skill another-skill`, không bao giờ nhiều tên trong một giá trị, dù nối bằng
   dấu cách, dấu phẩy hay dấu chấm phẩy. Câu ấy nói thêm rằng tên giữ chung trong một biến không thành các đối số riêng ở
   mọi shell. Trang không nêu tên shell nào, nên lời khuyên đúng với mọi shell. Ba trang chạy `plugs` bảo đối chiếu dòng
   `Read from the session:` với số tên đã truyền.

**Ký tự bị từ chối, và vì sao chỉ những ký tự ấy.** Khoảng trắng, dấu phẩy và dấu chấm phẩy là các ký tự người ta, và
một shell, dùng để nối một danh sách. Không tên nào phiên liệt kê có chúng. Các ký tự khác (gạch đứng, gạch chéo, dấu
cộng) chưa thấy ai dùng để nối tên, nên chúng không bị từ chối. Nếu một danh sách nối bằng một ký tự như vậy, dòng đếm ở
điểm 4 sẽ cho thấy.

**Các cờ khác nhận danh sách tên đã soát:**

- `--reask` của `plugs`, `--only` và `--replaces` của `decide`, `--record` và `--hold` của `adopt` đều từ chối một mã nó
  không biết, nên một giá trị nối không lọt qua lặng lẽ. Đây không cùng lỗi, nên không cần dòng giới hạn.
- `--file` của `conform` và `--files` của `font-source` nhận đường dẫn tệp, và đường dẫn có thể có dấu cách. Đây cũng
  không cùng lỗi.

## Consequences

- Một tác tử truyền tên của phiên sai cách nay thấy lời gọi sai cùng cách sửa, thay vì một bảng phích trống.
- Dòng giới hạn mới, đóng ngay trong thay đổi này: `session-names-joined-read-as-none`.
- Dòng `plugs-session-listed-by-the-skill` vẫn mở. Ở lượt đã dừng, tác tử chọn 35 trong 261 skill phiên liệt kê,
  không truyền cả danh sách, và chưa lượt nào có người cho thấy danh sách được truyền đủ.
- Lượt thử có người chạy lại từ đầu trên bản sao mới với tác tử mới, theo lời chủ repo. Chi phí của lượt đã dừng (284 299
  token) được đặt cạnh chi phí của lượt mới, không gộp vào.
