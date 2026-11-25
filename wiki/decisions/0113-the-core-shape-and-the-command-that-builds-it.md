---
type: decision
title: "Hình dạng của lõi trong hợp đồng, và lệnh core dựng lõi từ repo đầu sau tờ khoá hay mặc định"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/core-questions.json
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/core-read.mjs
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/tests/test-core.mjs
  - plugins/design-assembly/references/limits.json
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Dựng lát 1» cho câu «Cho một phiên phụ dựng lát 1 của mục 7.1?»"
---

# 0113 Hình dạng của lõi trong hợp đồng, và lệnh core dựng lõi từ repo đầu

## Status

Accepted, 2026-11-25, plugin 0.60.0. Lát 1 của mục 7.1, dựng theo lời chủ repo («Dựng lát 1»), theo đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md) đã duyệt và quyết định
[0112](0112-the-plugin-builds-the-family-core.md). Lát này đổi hợp đồng sổ nên cần người duyệt trước khi gộp.

## Context

Đề bài 0016 chia mục 7.1 thành bốn lát. Lát 1 gồm: hình dạng của lõi trong hợp đồng, kể cả phép kiểm đi kèm lời đáp
(tiêu chí 2 và phần hình dạng của tiêu chí 26); lệnh dựng lõi từ repo đầu (tiêu chí 3); tờ khoá hay mặc định (tiêu chí
4); tên họ là dữ liệu của người dùng (tiêu chí 15); và phần không mạng của tiêu chí 14. Lời đáp 2 đặt tên lệnh là
`core`; lời đáp 5 cho bộ khoá và bộ mặc định lúc đầu; lời đáp 10 nói chủ của họ là người đáp tờ; lời đáp 11 nói repo đầu
chưa là thành viên khi chưa tự khai.

Đề bài để ngỏ tên tệp trong thư mục lõi, tên cờ, nơi ghi khi không ai nêu chỗ, và cách nhận ra một lời đáp «đã được người
chốt» trên repo được nhận (chỉ có sổ quyết định và sổ token). Mỗi điều ấy được chốt dưới đây theo cách các lệnh đã có
chốt điều tương tự.

## Decision

1. **Lõi không là một sổ của repo.** Hình dạng của nó nằm trong `contract.mjs` dưới tên `CORE`, cạnh `LEDGERS`, chứ không
   trong `LEDGERS`: cổng và `audit` đi qua `LEDGERS` trên mọi repo, nên đặt lõi vào đó sẽ làm repo đứng một mình bị đọc
   thêm. Trang hợp đồng có mục «Not a ledger: the core of a family», như mục của hàng chờ. Hình dạng 1. Mỗi phần là một
   tệp JSON mang `version`; gặp phần mới hơn thì lệnh không ghi gì và bảo lên đời plugin, như với sổ.
2. **Bốn phần, tên tệp:** `core.json` (tờ khai: `family`, `first`, `members`, `owner`), `answers.json` (hồ sơ lời đáp),
   `blocks/index.json` (kho khối, rỗng khi dựng; tệp của khối nằm ở `blocks/<need>/`), `members/<repository>.json` (báo
   cáo thành viên, có thể chưa có thư mục). Ba tệp đầu bắt buộc. Báo cáo thành viên chỉ nhận `need`, `name`,
   `description` cho từng nhu cầu: khoá nào khác là đỏ, nên chính hình dạng chặn việc chép mã vào lõi (tiêu chí 12).
3. **Mỗi lời đáp** có `id` (id của dòng sổ quyết định), `question`, `value`, `hold` (`locked` hay `default`), `check`
   (phép kiểm của dòng, hay `null` khi không gì giữ: tiêu chí 26), `why`, `by`, `on` (người đáp tờ và ngày), và `origin`
   (repo và tệp đọc ra, cùng người chốt và ngày khi sổ có ghi, `null` khi không).
4. **Repo đầu chưa là thành viên.** `core.json` ghi nó ở `first` (tên, ngày đọc, commit), còn `members` rỗng cho tới khi
   một repo tự khai, ở lát 2 (lời đáp 11). `owner` là người đáp tờ (lời đáp 10).
5. **Cái gì là «đã được người chốt».** Đọc như tờ quyết định và lối dẫn dắt đã ghi, một luật, một chỗ
   (`scripts/core-read.mjs`):
   - không là ứng viên: câu trên hàng chờ về dòng ấy còn chờ hay bị từ chối; dòng có ghi chú «a person has not
     confirmed it»; dòng có dấu «refused by»; lời đáp của bản thiết kế mà tầng chưa `decided`, hay do lối dẫn dắt đề xuất
     hoặc đọc từ repo mà người chưa xác nhận;
   - là ứng viên, có tên người: dấu «answered/confirmed by X on D» ở ghi chú, câu đã đáp trên hàng chờ, `answered` của
     bản thiết kế;
   - là ứng viên, không tên: dòng không mang dấu nào. Cổng cũng coi dòng ấy là quyết định của repo; giới hạn
     `core-unmarked-row-is-settled` ghi lại điều này.
6. **Giá trị đọc ở đâu.** Có bản thiết kế thì lấy lựa chọn của nó (màu gốc, cách mở hồ sơ, thang chữ, kèm tỉ lệ khi là
   thang modular). Repo được nhận: màu gốc đọc từ `design/tokens.json` bằng chính cách `bring-in` đọc một tệp token; bề
   rộng được kiểm đọc từ `design/screen-sizes.json`; mọi luật khác lấy lời của dòng (`source`). Không đọc được thì lời đáp
   bị để ngoài, kèm lý do.
7. **Bộ lúc đầu là dữ liệu**, `references/core-questions.json`: khoá `source-color`, `record-panel` và mọi luật hành vi
   (mọi dòng thuộc tầng `patterns`, kể cả tên tầng cũ được đọc theo bảng tên cũ); mặc định `table-density`,
   `type-scale-values`, `test-screen-sizes`; kiểu màn, kiểu cột và lời văn ở ngoài (lời đáp 5). Câu hỏi của mỗi id lấy từ
   `standard-decisions.json`.
8. **Tờ khoá hay mặc định không lên hàng chờ.** Lệnh không được ghi gì vào repo đầu, và lõi chưa có trước lời đáp, nên
   tờ bốn câu được in (chữ và `--json`, mỗi câu có `question`, `recommendation`, `basis`, `where`, `if_refused`), skill
   hỏi trong phiên, và lời đáp đi vào lệnh bằng cờ. Giới hạn `core-sheet-not-on-waiting-list` ghi rằng tờ chưa đáp không
   để lại dấu.
9. **Cờ và lối.** Không cờ: đọc và bày tờ, thoát 1 khi tờ chờ người, 0 khi không lời đáp nào đã chốt. `--build --family
--core --by [--lock ID]... [--default ID]... [--on] [--dry-run]`: dựng, mỗi id một cờ như mọi cờ nhận tên (quyết định
   0108); thiếu `--by` thì từ chối vì không gì thành khoá khi chưa có lời người; một id không là ứng viên thì từ chối cả
   lượt và nói vì sao. `--check --core`: phép kiểm hình dạng, 0 khi giữ, 1 kèm từng chỗ sai, 2 khi có phần mới hơn.
10. **Chỗ của lõi khi không ai nêu:** một thư mục cạnh thư mục chính của repo đầu, tên `<tên họ>-core` (chữ thường, gạch
    nối), `family-core` khi chưa có tên. Thư mục chính đọc qua thư mục git chung, nên gọi từ một worktree cũng ra cùng
    chỗ và cùng tên repo. Lệnh từ chối một chỗ nằm trong repo đầu (cả thư mục chính lẫn worktree), một chỗ chứa repo
    đầu, một thư mục không rỗng, và một thư mục đã có lõi: lát này dựng lõi một lần; đổi lõi là lát 4.
11. **Tên repo** là tên thư mục chính của nó. Tên họ chỉ đến từ lời người (`--family`); khi chưa có, tờ đề xuất tên repo
    đầu và nói đó là tên duy nhất máy có.
12. **Không gì khác đổi.** Không lệnh nào khác đọc hay ghi lõi; bảng năng lực không thêm ổ (đề bài 0008 đã ghi giai đoạn 7
    không có năng lực đứng tên); lệnh không có dòng trong bảng hợp đồng lệnh vì nó ghi ra ngoài repo đích, như `bring-in`
    và `plugs` cũng không có dòng; bài kiểm riêng giữ hợp đồng chung của nó.

### Trên mọi loại repo

| Repo đầu                           | Lệnh làm gì                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Chưa có sổ                         | Không ứng viên, không tờ, thoát 0, nói người chốt lời đáp trước (`new`, `adopt`, `decide`) |
| Được nhận                          | Đọc sổ quyết định và sổ token; lời đáp không tên người thì ghi «names no one»              |
| Do lối dẫn dắt dựng                | Đọc bản thiết kế và sổ quyết định; lời đề xuất chưa xác nhận bị để ngoài, kèm lý do        |
| Kiểu khác (không React, không CSS) | Chỉ đọc tệp sổ; không có sổ token thì màu gốc bị để ngoài, nói vì sao                      |
| Không Makefile                     | Không cần Makefile; bài kiểm repo được nhận và repo kiểu khác đều không có                 |
| Gọi từ một worktree                | Cùng tên repo, cùng chỗ đề xuất, chỗ trong thư mục chính bị từ chối                        |

Ca không biết (sổ không đọc được, hàng chờ hỏng, sổ mới hơn) thoát 2, không ghi gì và nói vì sao.

## Consequences

- Hợp đồng sổ có thêm một đoạn, cần người duyệt: mục «Not a ledger: the core of a family» của
  `plugins/design-assembly/references/contract.md`. Repo đứng một mình không đổi: không lệnh nào hỏi thêm hay ghi thêm
  tệp; bản chép `contract.mjs` của công cụ đổi nội dung (thêm `CORE`), không thêm tệp, và cổng không đọc phần ấy.
- Bảng từ vựng thêm sáu thuật ngữ đặt mới: `product family`, `family core`, `locked answer`, `default answer`,
  `lock-or-default sheet`, và sổ giới hạn thêm vùng `core`.
- Năm giới hạn mở: `core-unmarked-row-is-settled` (giữ), `core-built-once` (sửa ở lát 4), `core-not-declared-by-members`
  (sửa ở lát 2), `core-value-is-row-words` (giữ), `core-sheet-not-on-waiting-list` (giữ).
- Chưa dựng: repo khai họ và ghim, sổ lõi trên máy, `new` và `adopt` thừa hưởng, cổng giữ câu đã khoá, worktree cho các
  lệnh của lát sau, báo khi lõi đi trước bản ghim, móc lúc mở phiên, đẩy lõi lên một repo riêng tư, và cả mục 7.2.
- Lát kế là lát 2 của mục 7.1, sau khi chủ repo gộp lát này.
