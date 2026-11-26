---
type: decision
title: "Chủ repo chọn dấu giữa các phương án: câu hỏi nêu phương án, gói nói mình là phương án nào, tường đọc lựa chọn"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/decisions/0126-the-mark-is-held-asked-for-and-shown.md
  - wiki/decisions/0127-the-mark-plug-leaves-a-package-the-plugin-reads.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/logo-package.mjs
  - plugins/design-assembly/scripts/logo-source.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/decide/SKILL.md
  - plugins/design-assembly/tests/test-mark-choice.mjs
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Mở lát sửa» cho câu «Anh cho mở lát sửa «chọn phương án dấu không đứng đầu» trước lượt đo («Mở lát sửa»), hay chưa mở («Chưa mở»)?»"
---

# 0128 Chủ repo chọn dấu giữa các phương án

## Status

Proposed, 2026-11-26, plugin 0.75.0. Lát sửa ngoài các mục của kế hoạch, phục vụ mục 12.3 và không làm chậm mục nào
khác, mở theo lời chủ repo «Mở lát sửa». Đổi hợp đồng (khoá `candidate` của tờ kê gói dấu, khoá `made.candidate` của
dòng `logo`) và cách tường `owner-calls` đọc hàng chờ, nên chờ chủ repo duyệt ở PR. `ontology/` không đổi. Mục 12.3
chưa xong: lát 2 (lượt đo) chưa mở.

## Context

Tiêu chí 10 của đề bài [0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md): dấu là mục của chủ repo, và
nhánh thêm một dòng `logo` đỏ cho tới khi hàng chờ có lời chủ repo giữ đúng mục `logo:<id>`
([0126](0126-the-mark-is-held-asked-for-and-shown.md)). Phích dựng dấu đưa ra hai hay ba phương án và hỏi một câu
([0127](0127-the-mark-plug-leaves-a-package-the-plugin-reads.md)). Khi chủ repo chọn một phương án không đứng đầu, tờ
quyết định ghi lời đáp là một giá trị nêu tên phương án ấy, còn tường chỉ đọc lời «giữ»: nó nói chủ repo «đáp khác» và
vẫn đỏ, và `logo-source --package` không nêu ai đã chọn (dòng giới hạn
`logo-choice-of-another-candidate-reads-as-otherwise`). Lượt đo của lát 2 sẽ gặp lỗi này nếu chủ repo chọn phương án
thứ hai.

Hai điều phải biết để sửa: chủ repo chọn phương án nào, và dòng nhánh thêm có đúng là của phương án ấy không. Hàng chờ
đã có khoá `candidates` (danh sách tên, phương án khuyến nghị đứng đầu, «giữ» lấy phương án đầu, đáp bằng tên lấy
phương án ấy) cho câu hỏi về nhu cầu; câu hỏi về dấu chưa dùng được nó vì `decide --ask` không ghi phương án.

## Decision

1. **Câu hỏi về dấu nêu phương án.** `decide --ask --item logo:<id> --candidate TÊN …` (mỗi phương án một lần,
   phương án khuyến nghị đứng đầu) ghi khoá `candidates` sẵn có của hàng chờ. Cờ chỉ nhận với mục `logo:`: dấu là lựa
   chọn giữa những thứ có tên mà câu hỏi hỏi bằng cờ này; câu hỏi khác không đổi. Hình dạng hàng chờ không đổi, và
   phép kiểm sẵn có từ chối lời đáp nêu tên không có trong danh sách.
2. **Lựa chọn đọc từ lời đáp.** Hàm `chosenCandidate` trong `waiting.mjs` (một chỗ, cổng và các lệnh cùng đọc): «giữ»
   chọn phương án đầu; lời đáp là một tên trong danh sách chọn phương án ấy; mọi câu hỏi khác, câu hỏi không có phương
   án, và mọi lời đáp khác cho `null`. Chỉ mục `logo:` được đọc như vậy.
3. **Gói nói mình là phương án nào, dòng giữ điều ấy.** Tờ kê `LOGO_PACKAGE` có khoá không bắt buộc `candidate`: tên
   phương án gói giữ, đúng tên câu hỏi đặt. `logo-source --package` chép nó vào `made.candidate` của dòng. Lý do chọn
   tờ kê và dòng chứ không phải mã băm trong câu hỏi: lúc hỏi, các phương án mới là bản nháp, còn gói được để lại sau
   lời đáp và chỉ gói có mã băm đã kê; phích là bên biết gói nó để lại là phương án nào, như nó nói phích nào dựng và
   ngày nào, còn người chọn thì vẫn chỉ đọc từ tờ quyết định. `made` của dòng `logo` đã mở trong hợp đồng, nên khoá mới
   không làm cổng cũ đỏ. `logo-source --package` từ chối, bằng một câu và không viết gì, gói của phương án câu hỏi không
   nêu, gói của phương án khác phương án chủ repo đã chọn, và gói không nêu phương án khi chủ repo chọn phương án không
   đứng đầu.
4. **Tường đọc lựa chọn.** Với mục `logo:<id>` có lời đáp chọn một phương án: tường mở khi `made.candidate` của dòng
   là đúng phương án ấy, hoặc khi dòng không nêu phương án và chủ repo giữ phương án đầu (như trước khi có phương án).
   Nó đỏ, và câu đỏ nêu cả hai, khi dòng giữ phương án khác, hoặc khi dòng không nêu phương án mà chủ repo chọn phương
   án không đứng đầu. Lời bác vẫn đỏ như trước. Lời đáp bằng chữ của chủ repo trên một câu hỏi về dấu không có phương án
   vẫn đỏ, câu đỏ nói thêm câu hỏi không nêu phương án nào nên không dấu nào được chọn. Mục kiểu màn, màu gốc và mọi câu
   hỏi khác đọc đúng như 0.74.0.
5. **Bốn nơi nói ai chọn phương án nào, ngày nào.** Cổng khi qua in dòng `owner-calls: logo:<id>: the owner chose …
in …, by … on …`; `status` có mục «marks chosen on the decision sheet» và khoá `marks_chosen` của `--json`; tờ quyết
   định in `chosen: logo:<id>, the owner chose …` dưới dòng «answered», không xếp lựa chọn ấy vào dòng «refused or given
   another answer», và `--json` có `item` và `chosen` ở lời đáp ấy; `logo-source --package` thêm `: candidate …` sau
   dòng `chosen:` và trường `candidate` trong `chosen` của `--json`, cho cả hai kiểu lời đáp. `decide --ask` hỏi lại
   một mục đã chọn thì nói chủ repo đã chọn phương án nào và dựng trên dấu ấy.
6. **Công cụ đã cài cũ hơn thì không bị đỏ**, theo nếp của PR 157: `decide --ask --candidate` hỏi bản chép
   `owner-calls.mjs` có `chosenCandidate` không, không có thì từ chối và nêu `upgrade` trước; không có câu hỏi nêu
   phương án thì cổng cũ không gặp lựa chọn nó không đọc được. Dòng có `made.candidate` vẫn xanh trên cổng 0.74.0.

## Consequences

- Đổi đầu ra (chỉ khi có câu hỏi về dấu nêu phương án và chủ repo đã chọn): dòng mới của cổng, mục và khoá mới của
  `status`, dòng `chosen:` của tờ quyết định, đuôi `: candidate …` của `logo-source`; câu đỏ mới của tường cho dòng
  khác phương án và dòng không nêu phương án; câu đỏ «answered otherwise» của mục `logo:` thêm lý do; câu trả lời của
  `decide --ask` khi mục đã được chọn bằng tên. Câu hỏi và mục khác: không đổi, có bài kiểm so với 0.74.0.
- Đổi hợp đồng: khoá `candidate` của tờ kê gói dấu; khoá `made.candidate` của dòng `logo` (phiên bản sổ vẫn 1). Cần
  người duyệt.
- Skill `logo-design` ở kho của nó phải hỏi bằng `--candidate` và ghi `candidate` vào tờ kê (dòng giới hạn mới
  `logo-design-skill-names-no-candidate`, việc của kho skill); tới lúc ấy, chọn phương án không đứng đầu vẫn đỏ, và câu
  đỏ nói vì sao. Dòng không nêu phương án vẫn qua khi chủ repo giữ phương án đầu (dòng giới hạn
  `logo-kept-row-names-no-candidate`).
- Đóng dòng giới hạn `logo-choice-of-another-candidate-reads-as-otherwise`.
