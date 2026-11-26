---
type: decision
title: "Câu «cùng họ?» được hỏi trước, câu lõi đã đáp được giữ lại, và câu hỏi về lời đáp khác lõi lên tờ ngay lần adopt đầu"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - wiki/decisions/0120-a-repository-with-no-makefile-and-a-package-with-no-src-folder.md
  - wiki/decisions/0121-a-member-reports-and-a-need-met-twice-is-put-to-the-owner.md
sources:
  - docs/trials/stage-7-done-when.md
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/core-list.mjs
  - plugins/design-assembly/scripts/core-moved.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-family-first.mjs
  - plugins/design-assembly/tests/helpers/stand-alone.mjs
  - plugins/design-assembly/tests/helpers/stand-alone-on-0.68.0.json
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Sửa rồi thử lại» cho câu «Anh cho mở lát sửa rồi thử lại («Sửa rồi thử lại»), hay chưa sửa («Chưa sửa»)?»"
---

# 0122 Câu «cùng họ?» trước; câu lõi đã đáp được giữ lại; câu hỏi về lời đáp khác lõi lên tờ ngay lần adopt đầu

## Status

Accepted, 2026-11-26, plugin 0.69.0. Mục 7.5 của kế hoạch, chủ repo thêm bằng lời «Sửa rồi thử lại» sau lượt thử đầu
của mục 7.3 ([bản ghi](../../docs/trials/stage-7-done-when.md)). Một PR. Không đổi hình dạng sổ nào và không đổi
`ontology/`; lời của cổng và thứ tự câu của `adopt` có đổi, liệt kê ở dưới.

## Context

Lượt thử dòng «xong khi» của giai đoạn 7 (tiêu chí 16 của đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md)) đạt ba vế, trượt một: repo thứ hai bị hỏi lại câu
màu gốc mà lõi đã khoá. Phiên điều phối dựng lại được hai điều tìm thấy, trên plugin 0.68.0:

1. Trên một gói chưa có sổ, khi sổ lõi trên máy có một lõi khoá `source-color`, bản xem trước của `adopt` liệt kê dưới
   `needs a person` bốn câu: mức tuân thủ, màu gốc, loại sản phẩm, rồi «cùng họ?» ở cuối. Skill `adopt` bảo hỏi gộp mọi
   câu ấy một lượt, nên người được hỏi màu gốc trước khi nói gói có thuộc họ đã chốt màu ấy hay không.
2. Theo đúng thứ tự skill nói (đáp «cùng họ», `core --join`, xem lại): `core --join` trên một gói chưa có sổ ghi mọi lời
   đáp là «inherited» vì chưa thấy màu của gói, và không ghi câu hỏi nào. `adopt` rồi ghi `design/tokens.json` và in «The
   question waits on the decision sheet (core --join asked it)» trong khi `design/waiting/` trống. Chỉ lần `core --join`
   thứ hai, làm tay, mới ghi câu hỏi; ở giữa, cổng của gói đỏ ở `ledger-shapes: source-color` mà tờ quyết định không có
   gì để đáp.

## Decision

1. **Repo đứng một mình không đổi.** Máy không biết lõi nào, hay người đã đáp «không» (`core --decline`): `adopt` in
   đúng như 0.68.0, cả chữ lẫn `--json`. Một bản ghi lấy trên 0.68.0 trước khi sửa
   (`tests/helpers/stand-alone-on-0.68.0.json`) giữ điều ấy trên hai loại repo và hai loại máy.
2. **Câu «cùng họ?» đứng đầu, câu lõi đáp được giữ lại.** Khi câu ấy còn mở, `adopt` đặt nó đầu `needs a person` và
   chuyển mỗi câu mà một lõi trên máy đáp (khoá hay mặc định) sang một mục riêng, «held back until the family question
   is answered», kèm lõi nào đáp, khoá hay mặc định, và sau đó câu ấy ra sao: vào họ thì không hỏi, không vào họ nào thì
   hỏi như cũ. `--json` có khoá `held_back`. Câu lõi không đáp không bị giữ lại.
3. **Nhiều lõi: giữ lại câu bất kỳ lõi nào đáp.** Đây là cách đọc thận trọng: người không bao giờ bị hỏi hai lần một câu
   có thể không phải hỏi. Cái giá: một repo vào một lõi không đáp câu ấy sẽ bị hỏi câu ấy sau khi vào họ, một lần, ở bản
   xem trước kế tiếp. Lời của dòng nói «or another» khi có lõi khác không đáp câu ấy.
4. **Skill nói hỏi câu «cùng họ?» một mình, trước.** Skill `adopt` tách bước 3 thành hai: câu «cùng họ?» một mình, chờ
   lời đáp, chạy lại bản xem trước; rồi mới hỏi gộp phần còn lại. Không bao giờ hỏi một câu bị giữ lại, cũng không đáp nó
   bằng cờ. Bước thành viên của skill `core` nói: gói chưa có sổ vào họ thì không có gì để so, chạy lại bản xem trước của
   `adopt`, và không ghim lại lần hai để lấy câu hỏi.
5. **Lối dẫn dắt (`new`) không mắc lỗi cùng dạng.** Bản xem trước của `apply.mjs` trên repo chưa có bản thiết kế chỉ in
   một dòng `family:`, không hỏi câu nào khác; trên thành viên, bản thiết kế giữ màu khác màu lõi khoá thì nó từ chối và
   chỉ tới `core --settle`, còn `core --inherit` điền lời đáp của lõi. Skill `new` thêm một câu: hỏi câu «cùng họ?» một
   mình, trước bước cắm và mọi câu của tầng.
6. **`adopt` so lời đáp bằng chính mã của `core --join`.** Trên thành viên, `adopt` gọi `holdAnswers` của
   `core-join.mjs` trên các tệp chính lượt ấy sắp ghi. Một câu khoá mà gói giữ khác đi thì câu hỏi
   `core-<id>-<pin>` được ghi trong cùng lượt, cùng mã, cùng chữ với câu `core --join` ghi; không có lần ghim thứ hai.
   Câu đã có trên tờ thì không ghi lại; `core --join` và `core --settle` sau đó cũng không ghi lại. Dòng `adopt` in về
   câu ấy chỉ nói điều đúng lúc in: «put on the decision sheet with the files below (<tệp>)» khi chính lượt ấy ghi, «waits
   on the decision sheet (<mã>)» khi nó đã chờ, và hai dòng riêng khi chủ đã đáp «keep» hay đã từ chối mà không có lý do.
7. **Mặc định gói giữ khác đi, trước khi vào họ.** Cùng mã ấy ghi lý do «the repository's own answer from before it joined
   the family», tên người đã vào họ, như `core --join` ghi cho một repo đã có sổ. Chỉ cho một dòng sổ chính lượt này viết
   ra: dòng có sẵn thì chỉ người mới cho lý do.
8. **Dòng đỏ của cổng nêu câu hỏi đang chờ.** Khi `core-<id>-<pin>` chờ trên tờ, dòng đỏ của `ledger-shapes` kết thúc
   bằng «the question <mã> waits on the decision sheet (decide): …, then core --settle». Không có câu chờ thì dòng như cũ.
   Mã của câu hỏi chuyển vào `contract.mjs` (`coreQuestionId`), `core-moved.mjs` xuất lại nó, nên chỉ một chỗ đặt tên câu.
9. **`status` và tờ quyết định không hỏi lại câu lõi đáp.** Trên thành viên, một câu chỉ người đáp được mà sổ chưa có
   dòng (ở đây màu gốc, khi gói giữ màu khác) không còn nằm dưới «waiting too, answered with another command» với lời
   «adopt --record source-color»: câu của lõi về chỗ khác nhau đứng thay.

## Consequences

- **Bài kiểm.** Một tệp mới, `tests/test-family-first.mjs`, 14 bài, mỗi bài một sổ lõi riêng, không mạng. Năm điểm của
  mục đều có bài thấy đỏ trên 0.68.0 rồi xanh; riêng bốn bài «đứng một mình» là phép so trước và sau, nên xanh cả hai
  phía. Không bài cũ nào phải đổi.
- **Bài kiểm không đọc sổ lõi của máy.** Từ bản này, lời của `adopt` phụ thuộc sổ lõi, nên mọi tệp bài kiểm nạp `tests/helpers/own-cores.mjs` trước mọi thứ: tiến trình kiểm và mọi tiến trình nó mở đọc một sổ riêng, rỗng, trong thư mục tạm của nó, dù môi trường có nêu sổ nào. Đặt ở từng tiến trình kiểm, không chỉ ở lệnh của `make plugin-test`, để một tệp chạy riêng cũng không đọc sổ khác và hai tệp chạy song song không chung sổ. `tests/test-own-cores.mjs` giữ điều ấy: mỗi tệp nạp nó đầu tiên, và bài kiểm của `adopt` xanh khi môi trường nêu một sổ có lõi khoá màu gốc và thư mục nhà giữ một sổ như thế ở chỗ sổ thật nằm. Phiên điều phối tìm ra điều này lúc soát PR, chủ repo đáp «Gửi sang sửa».
- **Thử trên một hình dạng thật, bằng tay, không phải lượt thử thứ hai.** Bản sao `git archive` của gói `apps/app` của
  sản phẩm thứ hai và một lõi dựng từ bản sao sản phẩm đầu, chỉ khoá màu gốc. Trước khi đáp: `needs a person` là
  `family`, `conformance-level`, `product-type`; `source-color` nằm ở mục giữ lại. Sau `core --join` (thoát 0,
  `design/waiting/` trống): `conformance-level`, câu của lõi về màu (nêu tệp sẽ ghi), `product-type`. Sau một lượt
  `adopt`: `design/waiting/core-source-color-<pin>.json` có mặt; `bun run design:check` thoát 1 với dòng đỏ nêu câu ấy.
  Ghim lại lần nữa không ghi thêm. Ghi lời từ chối kèm lý do vào bản sao rồi `core --settle`: lệnh kiểm thoát 0, bản xem
  trước không còn câu nào. Không cài gói, không chạy bộ kiểm của sản phẩm ấy; hai repo thật không đổi; sổ lõi thật vẫn
  không có.
- **Giới hạn.** Không dòng nào của sổ nói hai điều tìm thấy 1 và 2, nên không đóng dòng nào. Mở sáu dòng mới cho điều
  tìm thấy 3, 4, 5, 7, 11 (`core-promote-needs-the-by-hand-word-declared`, `core-first-repository-known-by-its-folder-name`,
  `core-join-preview-needs-a-name`, `intake-preview-does-not-print-the-question`,
  `decide-lists-inherited-answers-as-refused`); nối thêm lời vào dòng có sẵn cho 6
  (`font-package-read-where-installed`), 8 (`intake-matches-words-not-meaning`, `find-matches-words-not-meaning`), 9
  (`lint-tool-the-adapter-does-not-know`), 12 (`core-rule-words-not-compared`), 14
  (`kit-told-only-where-its-file-is-in-the-folder`). Điều tìm thấy 10 là lời đáp còn mở của chủ repo, để trong bản ghi.
  Mở ba dòng cho chính lát này: `adopt-family-first-rests-on-the-skill`,
  `adopt-asks-the-core-question-for-a-value-its-ledgers-hold`, `audit-names-a-call-the-core-answers`.
- **Kế hoạch.** Mục 7.5 xong ở nhánh này. Mục 7.3 vẫn `todo`, giai đoạn 7 vẫn mở: lượt thử thứ hai cần lời chủ repo, kèm
  ước lượng và mức trần.
- **Chưa làm:** `audit` vẫn nói màu gốc cần người xác nhận trên thành viên giữ màu khác (dòng ấy dẫn tới `adopt`, nơi
  câu của lõi đứng); không có bài kiểm nào giữ việc tác tử hỏi câu «cùng họ?» một mình, đó là lời của skill.
