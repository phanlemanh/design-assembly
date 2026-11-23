---
type: decision
title: "Lệnh plugs: tệp phích khai số đo theo ổ, câu hỏi chỉ ở ổ có phích đã đo nằm trong repo, lời đáp thành dòng plug-<ổ>"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
  - wiki/decisions/0073-the-review-socket-plugs-an-outside-eye.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
sources:
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/references/plugs/
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/tests/test-plugs.mjs
  - plugins/design-assembly/tests/test-capabilities.mjs
  - plugins/design-assembly/tests/test-status.mjs
  - "chủ repo, 2026-11-23: «Dựng lát 1», đáp đề nghị chia mục 10.1 làm hai lát của phiên điều phối"
---

# 0089 Lệnh plugs: phần máy của bước thiết lập chọn phích

## Status

Accepted, 2026-11-23, chờ chủ repo bác ở các lựa chọn dưới đây. Lát 1 của mục 10.1, theo đề bài 0014 đã duyệt; máy tự
dựng mục này sau lời duyệt đề bài, gộp là lời chủ repo. Giữ tiêu chí 1, 2, 4, 5, 6 và 7. Tiêu chí 3 (khớp phiên), 8
(lùi về phích của plugin), trang toàn cảnh và lời gọi từ `new`, `adopt` là lát 2. Tiêu chí 16 không giữ ở lát này
(dòng giới hạn `plugs-remeasure-asks-nobody`). Plugin lên 0.37.0.

## Context

Đề bài 0014 đòi một bước thiết lập: mỗi ổ một bên làm, người dùng biết vì sao, câu hỏi đi qua hàng chờ và `decide`.
Trước thay đổi này, bảng ổ cắm chỉ liệt kê: tệp phích không nói phích đã đo chưa, đo ở bản quyết định nào, cũng không
tách tên skill với tên máy chủ MCP; không lệnh nào hỏi, không sổ nào ghi lựa chọn. Script không thấy phiên, nên lát 1
chỉ làm phần script thấy được: repo.

## Decision

1. **Tệp phích khai thêm, có phép kiểm.** Khoá mới: `skills` và `mcp_servers` (hai danh sách tên, tách nhau), `sends`
   (gửi gì đi đâu, bắt buộc khi cần mạng), `measured` (theo từng ổ: bản quyết định dạng `d0088` và `beats_plugin`, số đo
   có thắng phích của plugin ở thước «giữ được không» hay «đoán mấy chỗ» không), `recommended_by_owner` (ngoại lệ có tên:
   bản quyết định, lời chủ repo, ngày). Phép kiểm hình dạng đỏ ở khoá lạ, danh sách tên sai, phích loại skill không khai
   tên skill, nhu cầu lạ, cần mạng mà không nói gửi gì, `detect` không đúng một cách, số đo ở ổ phích không cắm, mã bản
   ghi sai dạng, thiếu lời hay ngày của chủ repo. Tên skill và tên máy chủ cũng vào phép «lõi sạch».
2. **Số đo trỏ bản ghi có thật, kiểm ở nơi làm plugin.** `recordProblems` đỏ khi một số đo hay lời chủ repo trỏ bản ghi
   không có trong `wiki/decisions/`. Repo cài plugin không có các bản ghi ấy bên cạnh, nên phép này chạy trong bài kiểm
   của plugin ở kho này (dòng giới hạn `plugs-measure-records-checked-here-only`).
3. **Số đo ghi vào tệp phích.** `claude-design` đã đo ở bốn ổ theo 0088, không thắng ở ổ nào; ngoại lệ của chủ repo ở ổ
   tài sản thương hiệu và ổ bàn giao, lời «Keep at handoff and brand», ngày 2026-11-23. `design-critique` đã đo ở ổ soát
   thiết kế theo 0073, không thắng phích của plugin: 0073 có mục «Số đo theo bốn thước» và kết luận nó là phích của phần
   nhìn, không phải mặc định của ổ. Đây là một lựa chọn chờ chủ repo (xem Consequences).
4. **Lệnh `plugs` (`scripts/plugs.mjs`).** Cho mỗi ổ, theo thứ tự của bảng năng lực (thứ tự lộ trình đi qua các ổ):
   phích của plugin, phích đã chọn, và mỗi phích ngoài với trạng thái phía repo (`in-repo`, `chosen-but-missing`,
   `absent`), nhãn đo (`dNNNN` hay `unmeasured`), nhu cầu và điều nó gửi đi. `--json`, `--dry-run`, `--on`; mã thoát
   theo hợp đồng chung: 0 không câu nào chờ, 1 có câu chờ chủ repo, 2 gọi sai hay không đọc được. Lệnh là một phích của
   ổ `decision` trong bảng năng lực (không mặc định), vì nó ghi sổ quyết định và chỉ ghi lời đáp của chủ repo.
5. **Câu hỏi.** Chỉ hỏi ở ổ có phích ngoài đã đo (hay được chủ repo nêu) và nằm trong repo; tối đa bốn câu chờ cùng
   lúc, câu dư ở lượt sau. Mỗi câu là một tệp `design/waiting/plug-<ổ>.json` với `question`, `recommendation`, `basis`,
   `where`, `if_refused`, `item: decision:plug-<ổ>` và danh sách ứng viên, khuyến nghị đứng đầu. Khuyến nghị: phích ngoài
   có số đo thắng; không có thì phích chủ repo nêu ở ổ ấy, căn cứ in mã bản ghi và lời chủ repo kèm ngày; không có nữa
   thì phích của plugin (hay «để trống» ở ổ plugin không có phích). Một câu trên hàng chờ khuyến nghị phích chưa đo,
   hay phích đã đo mà thua và không được chủ repo nêu, làm lệnh dừng với mã 2, nêu tên tệp.
6. **Lời đáp thành dòng.** Chạy lại sau khi chủ repo đáp trên tờ quyết định: mỗi câu đã đáp thành một dòng
   `plug-<ổ>` của `design/decisions.yaml` (`layer: governance`, `kind: judgment`, `source: "plug:<id>"`, ghi chú
   `confirmed|answered|refused by <tên> on <ngày>` như tờ quyết định đóng dấu), rồi câu ấy rời hàng chờ, vì hàng chờ
   không nhận một câu trùng mã với một dòng sổ. Từ chối thì ổ giữ phích của plugin. Chạy lại với cùng lời đáp không
   sinh câu nào, không ghi gì.
7. **`status`.** Mỗi ổ thêm khoá `chosen` (phích, ai, ngày, trạng thái), mỗi phích ngoài thêm `state`, `measured`,
   `needs`. Màn thêm dòng `chosen:` khi có ổ đã chọn và dòng `chosen-but-missing:` khi có phích ngoài đã chọn mà repo
   không cho thấy; tài liệu ghi lựa chọn trong ô của ổ. Mã thoát không đổi.

## Consequences

- Kho này hôm nay: không phích đã đo nào nằm trong repo (hai phích đã đo chỉ có ở phiên), nên lệnh không hỏi gì và in
  một dòng «mọi ổ giữ phích của plugin». Bước thật sự hỏi khi lát 2 cho skill báo phiên có gì.
- Một phích chỉ phiên có (như hệ của Claude) mà đã được chọn sẽ hiện `chosen-but-missing` ở mọi lần chạy `plugs` và
  `status`, vì cả hai không nhìn phiên (dòng giới hạn `plugs-chosen-session-plug-reads-missing`).
- Ngoại lệ thật ở ổ bàn giao và ổ tài sản thương hiệu chưa thể nổ trên repo nào: tệp `claude-design` không có cách
  nhận ra trong repo, và hai phích đã đo chỉ có ở phiên. Bài kiểm chứng luật bằng phích mẫu, và bằng tệp thật của hệ
  Claude với một tệp giả làm nó «có mặt». Lát 2 cho skill báo phiên có gì.
- Dòng sổ và câu đã đáp cùng mã `plug-<ổ>`. Lệnh ghi dòng trước, rồi mới bỏ câu; nếu lệnh dừng giữa hai bước, `status`,
  `decide` và cổng đọc hàng chờ là hỏng cho tới khi `plugs` chạy lại (chính `plugs` chịu được và chỉ bỏ câu). Bỏ câu
  trước thì mất lời đáp, tệ hơn.
- Một câu đang chờ mà phích nó khuyến nghị nay hết được khuyến nghị (đo lại thua) làm lệnh dừng với mã 2; thông điệp
  nêu tệp và cách ra: bỏ tệp câu ấy rồi chạy lại để được hỏi lại. Hàng chờ một tệp chung vẫn cho xem bảng; chỉ lượt
  sẽ ghi câu hay dòng mới dừng.
- Tám dòng giới hạn mới, vùng `capabilities`: không thấy phiên, phích phiên đã chọn hiện là thiếu, chưa lùi, chưa có
  trang toàn cảnh, `new` và `adopt` chưa gọi, bản ghi số đo chỉ kiểm ở kho này, đo lại không hỏi ai, dòng sổ và câu
  đã đáp cùng mã.
- Lựa chọn chờ chủ repo: coi `design-critique` là đã đo theo 0073 (không thắng) thay vì chưa đo; ổ của dòng chọn là
  `governance`; câu trả lời đã đáp rời hàng chờ khi thành dòng.
