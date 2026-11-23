---
type: decision
title: "Lệnh plugs thấy phiên qua tên skill truyền vào, lùi về phích của plugin khi phích đã chọn vắng, và bày bảng toàn cảnh"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0089-plugs-command-asks-where-a-measured-plug-is-here.md
  - wiki/decisions/0072-an-eye-is-a-plug-the-harvest-belongs-to-the-socket.md
  - wiki/decisions/0073-the-review-socket-plugs-an-outside-eye.md
sources:
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/scripts/plugs-page.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/review-harvest.mjs
  - plugins/design-assembly/scripts/review.mjs
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/skills/review/SKILL.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-plugs.mjs
  - "chủ repo, 2026-11-23: «Dựng lát 2»"
  - "ảnh danh sách lệnh của một phiên Claude Code do chủ repo gửi ngày 2026-11-23: design, design-sync, design-revoke, design-consent, và các skill design:design-critique, design:ux-copy, design:accessibility-review, frontend-design:frontend-design"
  - "trang công khai đọc ngày 2026-11-23: claude.com/blog/claude-design-stays-on-brand-for-daily-work (lệnh /design-sync); các trang bên thứ ba và một báo lỗi nêu /design-consent, /design-revoke và tên máy chủ claude-design hay claude_design, chưa trang nào của Anthropic xác nhận tên máy chủ"
  - "chủ repo, 2026-11-23: «Add to PR #107»"
---

# 0090 Lệnh plugs thấy phiên, lùi khi phích vắng, và bày bảng toàn cảnh

## Status

Accepted, 2026-11-23, chờ chủ repo bác ở các lựa chọn dưới đây. Lát 2 của mục 10.1, dựng trên lát 1
([0089](0089-plugs-command-asks-where-a-measured-plug-is-here.md)). Giữ tiêu chí 3 và 8 của đề bài 0014, trang toàn
cảnh (nhịp 2), và lời gọi một lần từ `new` và `adopt`. Với lát 1, mục 10.1 xong. Plugin lên 0.38.0.

## Context

Lát 1 chỉ thấy repo: phích chỉ phiên có (skill, máy chủ MCP) luôn hiện `absent`, nên không câu nào được hỏi trên repo
thật. Luật của đề bài 0008 giữ nguyên: script không gọi mô hình, không dùng mạng, nên chỉ skill nhìn được phiên.

## Decision

1. **Skill liệt kê, script khớp.** Skill truyền tên skill (`--skill`), tên máy chủ (`--server`) và tên máy chủ đang chờ
   đăng nhập (`--needs-sign-in`) đúng như phiên liệt kê. Script khớp chúng với tên tệp phích khai, theo luật của skill
   `review`: cùng tên, hay tên dưới tiền tố của một plugin hay một máy chủ (`tiền-tố:tên`). Tên skill chỉ khớp với
   `skills`, tên máy chủ chỉ khớp với `mcp_servers`; tên không tệp nào khai bị bỏ. Khớp nằm ở script, nên có bài kiểm
   bằng mẫu dữ liệu.
2. **Năm trạng thái, theo thứ tự ưu tiên:** `in-repo`, `in-session`, `needs-sign-in`, `chosen-but-missing`, `absent`.
   Phích có mặt (hỏi được, dùng được) là `in-repo` hay `in-session`. Phích chờ đăng nhập được bày kèm một dòng chỉ cách
   cấp quyền, và không được hỏi.
3. **Lùi.** `fallbackOf` cho một dòng khi phích ngoài đã chọn không có mặt: «falling back at the … socket: X was chosen
   and is not here; the plugin's plug Y works it until it is» (ổ không có phích của plugin thì để trống). `plugs` in dòng
   ấy. Lộ trình `review` đọc lựa chọn của ổ soát thiết kế: chưa ai chọn thì mọi mắt bảng ổ cắm nêu, như cũ; chọn phích
   của plugin thì không mắt ngoài nào; chọn một mắt thì chỉ mắt ấy, và khi skill truyền `--skill` mà phiên không có mắt
   ấy, kết quả không có mắt nào và có khoá `falling_back` mang dòng lùi. Tệp phát hiện của một mắt không được chọn bị
   từ chối.
4. **Bảng toàn cảnh.** `plugs --out DIR [--format pdf]` ghi `plugs-board.html` trên khung tài liệu chung: hai mươi ổ theo
   sáu chặng, mỗi ổ một câu nó giao ra gì, ai đang làm, và mỗi phích ngoài với trạng thái, nhãn đo hay lời mời đo trên
   bản sao (nói trước số token), nhu cầu và điều nó gửi đi. Câu hỏi đang chờ là phần «điều phải quyết»; các dòng giới
   hạn `plugs-…` đang mở là phần «điều tài liệu không thấy».
5. **`--short`.** Một dòng đầu, các dòng lùi và chờ đăng nhập, các câu hỏi, hay một dòng «không phích đã đo nào ở repo
   hay phiên này; mọi ổ giữ phích của plugin». Đây là dạng `new` và `adopt` chạy.
6. **`new` và `adopt` gọi bước một lần**, sau bước rà soát: `new` sau bước kiểm repo và trước mọi tầng (nên trước tầng
   hướng đi), để repo chưa đủ nền không bị để lại câu hỏi; `adopt` trước bản xem trước. Không câu nào thì bước không
   dừng; có câu thì đi tiếp bằng phích của plugin ở mọi ổ trong lúc chờ: khuyến nghị không phải lời đáp, nên không gì
   được làm theo khuyến nghị trước khi người đáp.
7. **«Phiên đã liệt kê» tách khỏi «phiên không có».** `--session` nói các tên truyền vào là toàn bộ phiên, kể cả khi
   không có tên nào; truyền một tên cũng là đã liệt kê. Lời gọi không liệt kê phiên thì phích đã chọn mà repo không
   cho thấy không bị gọi là vắng: lệnh in rằng không biết, và trang không đếm nó là thiếu. Kết quả máy đọc có khoá
   `session_listed`. Lộ trình `review` giữ cùng luật: không `--skill` thì vẫn trao ảnh cho mắt đã chọn.
8. **Mỗi ổ một câu đời thường.** Bảng năng lực thêm trường `plain` cho mỗi ổ, một câu không quá 90 ký tự; phép kiểm
   hình dạng đỏ khi thiếu hay quá dài. Trang toàn cảnh in câu ấy.

## Consequences

- Bốn dòng giới hạn của lát 1 đóng: không thấy phiên, chưa lùi, chưa có trang toàn cảnh, `new` và `adopt` chưa gọi.
  Dòng «phích phiên đã chọn hiện là thiếu» thu về chỉ `status`, vì `status` vẫn không nhìn phiên.
- Ba dòng mới (thêm một dòng thứ tư sau soát độc lập, ở dưới): tệp phích của công cụ cần tài khoản (hệ của Claude) chưa khai tên skill hay máy chủ nào, nên phiên
  không bao giờ cho thấy nó, và ngoại lệ có tên ở ổ bàn giao, ổ tài sản thương hiệu vẫn chưa hỏi được tới khi có người
  thêm tên; lùi chỉ được lộ trình `review` đọc lúc chạy; danh sách phiên do skill liệt kê, chưa lượt thử có người nào
  chứng là đủ.
- Trên kho này, với skill `design-critique` trong phiên, bước hỏi một câu ở ổ soát thiết kế, khuyến nghị phích của
  plugin (0073: đo rồi, không thắng). Câu ấy chưa được ghi vào kho; ghi là lời chủ repo khi chạy bước.
- Soát độc lập trước khi mở PR: không điểm nghiêm trọng hay cao. Đã sửa: dòng lùi sai khi lời gọi không liệt kê phiên
  (mục 7), câu «việc ổ làm» dài và khó đọc (mục 8), lời trong `new` và `adopt` có thể đọc thành làm theo khuyến nghị
  (mục 6), bước chạy trước bước kiểm repo trong `new` (mục 6), câu về `--dry-run` của trang. Ghi giới hạn: lời mời đo
  chưa có ước tính token (`plugs-measure-invitation-gives-no-estimate`).
- Theo lời chủ repo («Add to PR #107»), tệp phích `claude-design` khai `skills: ["design-sync"]`: lệnh dựng sẵn của
  Claude Code mà danh sách lệnh của phiên chủ repo cho thấy. Skill truyền cả lệnh dựng sẵn của phiên, không chỉ skill.
  Không khai `design` (từ chung, đỏ phép «lõi sạch», và trùng một skill khác) và chưa khai tên máy chủ (chỉ nguồn bên
  thứ ba). Với phiên có `design-sync`, bước hỏi ở bốn ổ của hệ Claude: khuyến nghị hệ Claude ở ổ bàn giao và ổ tài sản
  thương hiệu, phích của plugin ở ổ hướng đi và ổ nền. Dòng `plugs-account-tool-declares-no-session-name` đóng; dòng
  `plugs-account-tool-server-name-unconfirmed` mở. Danh sách lệnh của phiên ấy cũng xác nhận luật `tiền-tố:tên`
  (`design:design-critique`, `frontend-design:frontend-design`).
- Lựa chọn chờ chủ repo: chọn phích của plugin ở ổ soát thiết kế nghĩa là không mắt ngoài nào nhìn ảnh.
