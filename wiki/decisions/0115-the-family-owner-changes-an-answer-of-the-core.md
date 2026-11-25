---
type: decision
title: "Chủ của họ đổi một lời đáp của lõi, và lời đáp giữ lịch sử của nó"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
sources:
  - plugins/design-assembly/scripts/core-change.mjs
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/tests/test-core-change.mjs
  - plugins/design-assembly/references/limits.json
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở hai lát» cho câu «Mở hai phiên song song: lát 2 và lát «đổi lời đáp của lõi»?»"
---

# 0115 Chủ của họ đổi một lời đáp của lõi, và lời đáp giữ lịch sử của nó

## Status

Accepted, 2026-11-25, plugin 0.61.0. Nửa đầu lát 4 của mục 7.1 (tiêu chí 22 của đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md)), dựng theo lời chủ repo («Mở hai lát»), song
song với lát 2 trên một nhánh khác. Lát này đổi hợp đồng sổ (hình dạng của lõi lên 2) nên cần người duyệt trước khi
gộp. Nửa sau của lát 4, rời họ (tiêu chí 25), chờ lát 2 và chưa dựng.

## Context

Tiêu chí 22 nói chủ của họ đổi giá trị, đưa một câu mặc định lên khoá, hạ một câu khoá xuống mặc định, hay thêm một
câu mới, trong thư mục lõi; mỗi thay đổi ghi ai, ngày nào, vì sao; khi lên khoá, lệnh nhắc luật của quyết định 0023,
câu 8; lệnh không ghi gì vào repo thành viên. Lát 1 (quyết định
[0113](0113-the-core-shape-and-the-command-that-builds-it.md)) dựng lõi một lần và để giới hạn `core-built-once` chờ
lát này.

Đề bài để ngỏ: tên cờ; câu mới lấy từ đâu; lõi giữ lịch sử thế nào; một lõi lát 1 đã ghi thì sao; điều gì xảy ra với
một thay đổi không đổi gì, một ngày lùi, một lõi không giữ hình dạng. Mỗi điều được chốt dưới đây.

## Decision

1. **Một bước của lệnh `core`, một lời đáp mỗi lượt.** `core --change <id> --core <thư mục> --by <tên> --why <lý do>`
   kèm `--value <giá trị>`, `--hold locked|default`, hay cả hai; `--from <repo>` để thêm câu; `--on`, `--dry-run`,
   `--json` như lúc dựng. Mã nằm ở `scripts/core-change.mjs`; `scripts/core.mjs` chỉ thêm cờ và lối rẽ. Một lời đáp
   mỗi lượt để mỗi thay đổi có lý do của riêng nó.
2. **Câu mới chỉ đến từ một repo mà người đã chốt nó**, đọc đúng như lúc dựng đọc repo đầu (`readFirst`): câu máy đề
   xuất mà chưa ai xác nhận, câu còn chờ hay bị từ chối trên tờ quyết định, thì bị từ chối kèm lý do. Giá trị repo ấy
   không giữ thì người đưa bằng `--value`, kiểm dạng và ghi ở `origin.given`, như lúc dựng. Không nhận một giá trị chỉ
   bằng lời chủ của họ mà không có repo nào đứng sau: như vậy luật «chỉ lời đáp người đã chốt mới vào lõi» giữ một
   nghĩa, và `origin.repository` của mọi lời đáp luôn có tên. Muốn thêm một câu chưa repo nào đáp thì một repo chốt nó
   trước (`new`, `adopt`, `decide`). Thêm câu phải nói `--hold`.
3. **Lịch sử là một trường `history` của từng lời đáp.** Mỗi mục có `was` và `became` (mỗi cái gồm `value` và `hold`),
   `by`, `on`, `why`; lý do không được trống. `value` và `hold` ở trên cùng là hiện tại. `by`, `on`, `why` của chính
   lời đáp nói nó vào lõi thế nào và không bao giờ bị viết lại; lời đáp thêm sau có `why` là lý do của chủ của họ, và
   chưa có `history`.
4. **Hình dạng lõi lên 2.** Hình dạng 2 chỉ thêm `history`. Phần hình dạng 1 được đọc nguyên như lát 1 ghi; bước đổi
   ghi lại đúng `answers.json` ở hình dạng 2 và để `core.json`, `blocks/index.json` ở hình dạng của chúng. Vì sao lên
   số: một plugin chỉ biết hình dạng 1 sẽ nói lõi «giữ hình dạng» mà không kiểm lịch sử; lên số thì nó nói cần lên đời,
   đúng luật của câu 9 trong quyết định 0023. Một `history` trong phần ghi hình dạng 1 là sai hình dạng.
5. **`core --check` giữ lịch sử**, mỗi chỗ sai nêu tệp, lời đáp và lần đổi: `was` của mỗi lần là `became` của lần
   trước; `became` cuối là giá trị và hold hiện tại; mỗi lần đổi đổi một điều; luật (`rule`) không bao giờ được đổi
   giá trị, chỉ đổi hold; ngày đi tới từ ngày lời đáp vào lõi; `by` và `why` không có địa chỉ thư; trường ngoài hình
   dạng là sai. Lệnh từ chối `--on` lùi trước lần đổi cuối.
6. **Giá trị kiểm dạng đúng như `--value` của lúc dựng** (`givenProblem`, `givenValue` của `scripts/core-read.mjs`,
   một chỗ). Một `rule` không được đưa giá trị: lệnh từ chối và nói lời của luật là lời của dòng sổ.
7. **Lời nhắc khi lên khoá là dòng đầu**, ở chữ và ở `reminder` của `--json`, cả khi `--dry-run` và khi thêm một câu
   khoá: chỉ khoá khi một lần lệch giữa các repo đã gây hại thật. Lệnh không từ chối; người quyết. Câu lên khoá mà
   không phép kiểm nào giữ thì lệnh nói thêm không thành viên nào đếm nó là đã giữ.
8. **Ba cách kết thúc.** Ghi xong (hay sẽ ghi, với `--dry-run`): thoát 0. Thay đổi không đổi gì (cùng giá trị, cùng
   hold): nói thẳng, không ghi, thoát 0. Lời gọi sai: thoát 2, không ghi gì: thiếu `--why`, thiếu `--by`, địa chỉ thư
   trong `--by`, `--why` hay `--value`, giá trị sai dạng, câu lõi không có mà không nêu `--from`, ngày lùi, lõi hình
   dạng mới hơn (lõi để nguyên, bảo lên đời plugin), lõi không giữ hình dạng (bảo chạy `--check`), lõi nằm trong cây
   làm việc git không phải của nó.
9. **Chỉ ghi trong thư mục lõi.** Không tệp nào của repo thành viên bị ghi, không thành viên nào được báo; đầu ra nói
   thành viên biết khi họ đọc lõi lần tới, việc của một lát sau (tiêu chí 9). Lõi là gốc một repo git riêng thì được
   đổi như mọi lõi, và lệnh không commit gì ở đó: commit và soát là việc của chủ của họ (lời đáp 10).
10. **`--by` không được so với chủ ghi trong `core.json`.** Ai được đổi lõi là việc của lối soát của repo lõi (lời đáp
    10); plugin không xét quyền.
11. **Mẫu nhận ra địa chỉ thư nằm một chỗ**, `ADDRESS` của `contract.mjs`, dùng cho lúc dựng, bước đổi và phép kiểm
    lịch sử. Thông điệp của lúc dựng khi thư mục đã có lõi nay chỉ sang `--change`.
12. **Thư mục làm việc riêng.** `--from` một worktree đọc ra đúng repo như từ thư mục chính, qua `homeOf` của lát 1;
    gọi lệnh từ trong worktree đổi đúng lõi ấy.

## Consequences

- Hợp đồng sổ đổi, cần người duyệt: mục «Not a ledger: the core of a family» của
  `plugins/design-assembly/references/contract.md` nói hình dạng 2, thêm một đoạn về `history` và một câu về
  `core --change`; `CORE.version` là 2 trong `contract.mjs`.
- Lõi do lát 1 dựng vẫn đọc và kiểm được nguyên như cũ; plugin 0.60.0 gặp phần lát này ghi thì nói cần lên đời.
- Bài kiểm của lát 1 (`tests/test-core.mjs`) đổi bốn chỗ: ba câu so số hình dạng nay đọc `CORE.version`, và
  `core-change.mjs` vào danh sách tệp được đọc lõi.
- Giới hạn: `core-built-once` thu hẹp (còn lại: đổi tên họ, chủ, repo đầu; bỏ một lời đáp khỏi lõi chờ tiêu chí 24);
  `core-given-value-not-checked-against-the-repository` nay nói cả giá trị đưa bằng `--change`; mở năm giới hạn:
  `core-change-tells-no-member` (sửa ở lát 3), `core-leaving-not-built` (nửa sau lát 4), `core-change-owner-not-checked`,
  `core-history-not-signed`, `core-lock-harm-not-recorded` (ba cái sau giữ).
- Plugin 0.61.0. Lát 2 cũng lên 0.61.0 trên nhánh của nó; nhánh gộp sau lấy main vào bằng một commit gộp, lên 0.62.0,
  ghi lại cây và giữ dòng ghi của cả hai bên.
- Chưa dựng: báo thành viên khi lõi đổi, rời họ, đổi tên họ, khối của lõi (mục 7.2).
