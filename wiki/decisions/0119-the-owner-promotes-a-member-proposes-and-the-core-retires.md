---
type: decision
title: "Chủ của họ đưa một khối lên lõi; thành viên đề xuất sửa ngược lên lõi; rút một lời đáp hay một khối khỏi lõi"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - wiki/decisions/0115-the-family-owner-changes-an-answer-of-the-core.md
  - wiki/decisions/0116-a-member-learns-the-core-moved-and-accepts-by-eye.md
  - wiki/decisions/0117-tier-three-reads-the-core-and-a-block-is-taken-like-an-outside-item.md
  - wiki/decisions/0118-a-repository-leaves-its-family.md
sources:
  - plugins/design-assembly/scripts/core-promote.mjs
  - plugins/design-assembly/scripts/core-propose.mjs
  - plugins/design-assembly/scripts/core-retire.mjs
  - plugins/design-assembly/scripts/core-records.mjs
  - plugins/design-assembly/scripts/core-owner-call.mjs
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/core-moved.mjs
  - plugins/design-assembly/scripts/core-moved-call.mjs
  - plugins/design-assembly/scripts/core-accept.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/core-join-call.mjs
  - plugins/design-assembly/scripts/core-leave.mjs
  - plugins/design-assembly/scripts/core-blocks.mjs
  - plugins/design-assembly/scripts/core-change.mjs
  - plugins/design-assembly/scripts/intake-write.mjs
  - plugins/design-assembly/scripts/session-line.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/tests/test-core-promote.mjs
  - plugins/design-assembly/tests/test-core-propose-retire.mjs
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở cả hai» cho câu «Mở hai phiên song song: 7.2 lát 3, và một mục mới sửa hai giới hạn chặn crm-onehub?»"
  - "repo kiểm chứng ở 1ea13196, chép bằng git archive vào thư mục tạm, chỉ đọc repo thật; và bản sao git archive của chính kho này"
---

# 0119 Chủ của họ đưa một khối lên lõi; thành viên đề xuất sửa ngược lên lõi; rút khỏi lõi

## Status

Accepted, 2026-11-25, plugin 0.67.0 (dựng ở 0.66.0; mục 7.4, quyết định [0120](0120-a-repository-with-no-makefile-and-a-package-with-no-src-folder.md), gộp trước nên nhánh này lấy main vào bằng một commit gộp và lên 0.67.0). Lát 3 của mục 7.2 (tiêu chí 21, 23 và 24 của đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md); lời đáp 13), dựng theo lời chủ repo («Mở cả
hai»), song song với mục 7.4 trên một nhánh khác. Lát này đổi hợp đồng sổ (mục của kho cho khối được đưa lên, hình
dạng của đề xuất, cách giữ một lời đáp và một khối đã rút, dấu của thành viên sau khi nhận việc rút) nên cần người
duyệt trước khi gộp. Một PR: phần mã ngoài bài kiểm dưới ngưỡng 2 500 dòng.

## Context

Sau lát 1 của mục 7.2 (quyết định [0117](0117-tier-three-reads-the-core-and-a-block-is-taken-like-an-outside-item.md)),
thành viên lấy được khối của lõi, nhưng chưa lệnh nào ghi vào kho khối của lõi (giới hạn
`core-block-store-filled-by-no-command`): mọi kho trong bài kiểm do tay viết. Thành viên cũng không có lối nói ngược
lên lõi, và một lời đáp bị gỡ khỏi lõi thì `core --moved` chỉ nói «đã rút» mà không nêu ai rút (giới hạn
`core-retired-answer-half-told`, quyết định [0116](0116-a-member-learns-the-core-moved-and-accepts-by-eye.md)).

Đề bài giao ba việc. Tiêu chí 21: chủ của họ đưa một khối có dòng sổ nhập kho lên lõi, mục của kho ghi ai, ngày nào và
«chưa có lần dùng thứ hai», kèm mã băm từng tệp và bộ chuyển cần có (lời đáp 13 nới luật «chỉ lên kho chung bằng nâng
hạng có bằng chứng dùng lần hai»). Tiêu chí 23: thành viên đề xuất sửa ngược, đề xuất thành câu hỏi cho chủ của họ, repo
giữ ngoại lệ và cổng xanh trong lúc chờ, được nhận thì các repo khác được báo. Tiêu chí 24: rút một khối hay một lời đáp,
kèm lý do và ngày, không xoá lịch sử, repo đang dùng được báo và giữ bản của mình như đồ riêng, không cổng nào đỏ.

Đề bài để ngỏ: tên lệnh và cờ; bộ chuyển đọc từ đâu; khối repo lấy từ chính lõi ấy, khối của bộ khởi đầu, khối từ nguồn
ngoài có giấy phép thì sao; đề xuất nằm ở đâu, chủ của họ thấy và đáp ở đâu, và đáp được thực hiện bằng lệnh nào; một đề
xuất làm hai lần thì sao; tệp của lõi trông thế nào sau khi rút; dấu của thành viên sau khi nhận việc rút. Mỗi điều
được chốt dưới đây.

## Decision

### Đưa một khối lên lõi (tiêu chí 21)

1. **Một bước của lệnh `core`:** `core --promote <nhu cầu> --core <thư mục> --by <tên> --why <lý do> [--replace]
[--adapter <loại>]... [--licence-allows] [--on] [--dry-run] [--json]`, gọi ở repo khối đang được dùng. `<nhu cầu>`
   là nhu cầu của dòng sổ nhập kho; một đường dẫn tệp mà một dòng nêu cũng được. `--by` và `--why` bắt buộc; địa chỉ thư
   ở một trong hai là lời gọi sai. Mã ở `scripts/core-promote.mjs`; cờ và chữ in của cả ba việc ở
   `scripts/core-owner-call.mjs`; `scripts/core.mjs` chỉ thêm cờ và chỗ rẽ.
2. **Chỉ khối có dòng sổ nhập kho.** Nhu cầu hay tệp không có dòng thì bị từ chối, và lời từ chối nói khối có dòng thế
   nào: `find`, lời giữ của chủ repo trên tờ quyết định, rồi `intake --need <nhu cầu> --file <đường dẫn>`. Dòng đã rút
   hay đã gộp vào nhu cầu khác cũng bị từ chối.
3. **Repo phải thuộc họ ấy**: là repo đầu mà `core.json` nêu, hoặc một thành viên. Repo đứng một mình hay của họ khác
   thì bị từ chối: khối của lõi đến từ các repo của họ.
4. **Bốn loại dòng.**
   - Khối của chính repo (`source` là chữ «tạo tay» mà sổ khai, hay không có `source`): được đưa lên.
   - Khối lấy từ lõi (`from: core`): bị từ chối, «nó đã là của lõi»; muốn đổi nó thì đề xuất (mục 14 của skill).
     Dòng mang `own` (lõi đã rút, repo đã nhận) là khối của riêng repo.
   - Khối của bộ khởi đầu (`from: starter`): bị từ chối, vì mọi repo đã có nó từ plugin.
   - Khối từ một nguồn ngoài: đọc dòng `licence` của nguồn ấy trong `design/sources/<id>.json`. Nguồn không có dòng ấy
     (hay repo không ghim nguồn ấy) thì bị từ chối, vì không biết mã của nó có được chuyển cho repo khác hay không. Có
     dòng thì lệnh in nguyên văn dòng ấy, hỏi người, thoát 1 và không ghi gì; chỉ khi người nói dòng ấy cho phép
     (`--licence-allows`) thì khối được đưa lên, mục của kho ghi `licence`: `source`, `words` và `allowed` (ai, ngày
     nào). Không bao giờ đưa lên lặng lẽ. Chọn hỏi thay vì từ chối thẳng: nhiều giấy phép mở cho phép chép, và chỉ người
     đọc được giấy phép; plugin không xét giấy phép.
   - Dòng không nêu nguồn mà repo không ghim nguồn nào, hay ghim hơn một: bị từ chối, lời từ chối nói cách phân biệt (lượt
     thử trên bản sao repo kiểm chứng gặp đúng ca này, điểm 18).
5. **Bộ chuyển đọc từ đâu.** Từ lời người: `--adapter <loại>`, mỗi loại phải là loại plugin biết và là loại repo ấy có,
   vì khối đang chạy ở đó. Không nêu thì lấy những loại trong `components` và `source` mà repo ấy có: hai loại mọi khối
   mã của bộ khởi đầu cần. Lý do: plugin không đọc mã của khối để biết nó chạm tới đâu (giới hạn sẵn có
   `core-block-imports-not-read`), và đoán theo mã thì sai mà không ai thấy; đầu ra nói bộ chuyển lấy theo mặc định và
   chỉ `--adapter`. Giới hạn mới `core-promote-adapters-are-a-persons-word`.
6. **Tệp của khối**: các tệp mà bản chuẩn hoá của dòng giữ sau khi vá, nếu dòng có bản chuẩn hoá; không thì tệp dòng
   nêu. Một tệp giữ tên của nó; nhiều tệp giữ đường dẫn tính từ thư mục chung của chúng. Tệp phải ở trong repo, có đó, là
   chữ, không ẩn.
7. **Mục của kho.** `need`, `name` và `description` của dòng; `files` (tên và mã băm); `adapters`; `used_by` là repo
   ấy; `promoted` có `by`, `on` và thêm `why`; `second_use: false`, đầu ra nói «no second use yet». Tệp chép từng byte vào
   `blocks/<nhu cầu>/`.
8. **Nhu cầu lõi đã đáp** thì bị từ chối, kèm lối thay: `--replace`. Thay thì tệp mới vào chỗ tệp cũ, tệp khối không còn
   có thì rời thư mục, và mục của kho thêm `history`: mỗi lần thay có `was` và `became` (danh sách tệp kèm mã băm),
   `by`, `on`, `why`; `used_by` thêm repo đưa tệp; `second_use` thành đúng khi `used_by` nêu hai repo. Lịch sử giữ tên
   và mã băm của tệp cũ, không giữ byte (giới hạn `core-replace-keeps-hashes-not-bytes`); `core --check` giữ chuỗi lịch
   sử như với lời đáp. Hai khối khác nhu cầu mà cùng tên thì bị từ chối.
9. **Chỉ ghi trong thư mục lõi**, in trước từng tệp sẽ ghi; `--dry-run` in đúng những tệp ấy và không ghi gì. Repo được
   đọc, không bao giờ bị ghi. Thành viên biết như với mọi thay đổi của kho: `core --moved` nêu khối, `core --join` ghim
   kho mới.

### Thành viên đề xuất sửa ngược (tiêu chí 23)

10. **Đề xuất nằm trong thư mục lõi**, mỗi đề xuất một tệp `proposals/<id>.json`, không ở hàng chờ của repo thành viên.
    Vì sao: đề xuất là câu hỏi cho chủ của họ, không cho chủ repo; thư mục lõi là dữ liệu của họ; mỗi đề xuất một tệp
    để hai thành viên đề xuất cùng lúc không ghi chung một tệp (nếp của hàng chờ dạng thư mục). `id` là loại, chủ đề và
    một số thứ tự: `answer-source-color-1`, `block-many-rows-1`. Hình dạng ở điểm 1 của mục «Consequences».
11. **`core --propose <id> [--block] --by --why [--core] [--dry-run]`**, gọi ở repo thành viên. Không có `--block` thì
    `<id>` là lời đáp; có thì là khối (nhu cầu của lõi hay nhu cầu của repo). Lời đáp: giá trị repo đang giữ (đọc như
    cổng đọc) và giá trị cùng mức khoá của lõi lúc ấy. Khối: các tệp như repo đang có, đọc theo bản chuẩn hoá, chép vào
    `proposals/<id>/`, kèm mã băm khối của lõi lúc ấy. Lệnh in trước đúng thứ nó ghi.
12. **Trong lúc chờ, ngoại lệ đứng và cổng xanh.** Lệnh không ghi gì vào repo. Một câu khoá mà repo giữ khác **không có
    ngoại lệ** thì bị từ chối: ghi ngoại lệ trước (`core --settle --why <id>=<lý do>`), để cổng xanh trong lúc chờ. Từ
    chối thêm: luật (lời của dòng, không có giá trị để đề xuất), repo không giữ giá trị, repo giữ đúng giá trị của lõi,
    khối repo không lấy từ lõi hay chưa sửa.
13. **Chủ của họ thấy ở đâu**: `core --proposals --core <thư mục>` (thoát 1 khi có đề xuất chờ), và dòng lúc mở phiên
    ở mọi repo thành viên nói «N proposal(s) to the family core wait on the family's owner» (tiêu chí 18 có nêu ca «một
    đề xuất chờ lời đáp»). Plugin không biết ai là chủ của họ (lời đáp 10), nên dòng ấy hiện ở mọi thành viên (giới hạn
    `core-proposal-seen-where-the-folder-is`).
14. **Đáp và thực hiện bằng lệnh có sẵn.** `core --grant <id>`: lời đáp đi qua `core --change` (lịch sử ghi người
    nhận, ngày, và lý do «granted the proposal <id> of <repo> (<lý do đề xuất>): <lý do nhận>»); khối đi qua phép thay
    của bước đưa lên (lịch sử của khối ghi như thế). `core --refuse <id>`: đề xuất giữ `decided` với `outcome:
refused`, người, ngày, lý do; lõi không đổi. Cả hai bắt buộc `--by` và `--why`. Một đề xuất đã đáp thì không đáp
    lại. Khối của lõi đã đổi kể từ lúc đề xuất thì không nhận được: chủ của họ từ chối với lý do ấy và thành viên đề xuất
    lại (giới hạn `core-proposal-against-a-moved-block-refused`).
15. **Thành viên được báo ở lần đọc lõi kế tiếp**: `core --moved` và `status` nêu từng đề xuất của repo này, chờ hay đã
    nhận hay bị từ chối, kèm người, ngày, lý do. Được nhận thì lõi đổi, và mọi thành viên thấy thay đổi ấy như mọi thay
    đổi khác.
16. **Đề xuất làm hai lần.** Cùng nội dung trong lúc chờ: nói đề xuất ấy đã chờ từ ngày nào, không ghi, thoát 0. Khác nội
    dung trong lúc một đề xuất cùng chủ đề của cùng repo đang chờ: từ chối, thoát 2, chủ của họ đáp trước. Đã đáp rồi
    thì đề xuất mới mang số kế tiếp.
17. **Lõi không với tới được**: không ghi gì, thoát 2, lệnh nói vì sao và chỉ `--core`.

### Rút khỏi lõi (tiêu chí 24)

18. **`core --retire <id> [--block] --core --by --why [--on] [--dry-run]`.** Lời đáp rời `answers.json`, khối rời
    `blocks/index.json`, đúng điều `core --moved` đã đọc là «đã rút» (quyết định 0116). Cả hai được giữ nguyên vẹn, kể cả
    `history`, trong một phần mới **`retired.json`**, kèm `retired`: `by`, `on`, `why`. Tệp của khối đã rút ở nguyên chỗ
    dưới `blocks/<nhu cầu>/`, và `core --check` giữ chúng theo mã băm. Không gì bị xoá khỏi bản ghi. Rút hai lần thì nói
    đã rút, ai, ngày nào, không ghi. Ngày lùi trước lần đổi cuối thì từ chối.
19. **Hình dạng lõi vẫn là 2.** `retired.json` và `proposals/` là hai phần tuỳ chọn mới; khoá mới của khối (`history`,
    `licence`, `promoted.why`) đều tuỳ chọn và khối vốn mở. Plugin cũ đọc lõi ấy như trước: lời đáp và khối vắng mặt vẫn
    là «đã rút, không ai được nêu», đề xuất bị bỏ qua. Lên số 3 sẽ buộc mọi thành viên lên đời vì những phần họ không
    đọc, như lý do giữ số 2 cho khoá `publish` ở quyết định 0116.
20. **Nhu cầu đã rút không được đưa lên lại**: tệp cũ còn giữ thư mục ấy. Bước đưa lên từ chối, và `core --check` nêu
    một kho đưa ra nhu cầu mà `retired.json` giữ (giới hạn `core-retired-need-not-promoted-again`). Một lời đáp đã rút
    thì có thể quay lại bằng `core --change --from`; bản ghi việc rút vẫn ở lại.
21. **Thành viên biết ở lần đọc kế tiếp**: `core --moved`, `status`, `inventory` nêu lời đáp và khối đã rút, kèm người,
    ngày, lý do lõi ghi. Không gì đổi trước khi người nhận.
22. **Nhận việc rút**: `core --accept <id>` (id của lời đáp, hay nhu cầu của khối đã rút), `--accept-all`, hay
    `core --join` ghim lại. Khối thêm hay khối đổi vẫn chỉ đến qua `--join` như trước.
    - **Lời đáp thừa hưởng thành của riêng repo**, theo đúng mẫu dấu của `core --leave`: ghi chú của dòng bắt đầu bằng
      `own since <ngày nhận>, when the family core retired it: <lý do> (by <người rút>), once <dấu cũ>`; giá trị không
      đổi; dòng mà chỉ bản chép giữ giá trị thì giữ giá trị ấy làm `source`. Lựa chọn của bản thiết kế chuyển từ
      `inherited`/`changed` sang `own`, thêm `how: "retired"`. Các dòng và lựa chọn khác giữ dấu của chúng. Hàm
      `turnLedger` và `turnBlueprint` của bước rời họ nay nhận danh sách dòng và cách nói, dùng chung một chỗ.
    - **Khối đã lấy vào ở lại nguyên chỗ**, dòng sổ nhập kho thêm `own`: `since`, `by`, `why` (người rút trong lõi và lý
      do). `from: core` và `pin` ở lại, nói nơi khối từng đến. `inventory` nói khối là của repo và không so với lõi nào.
    - **Khối chưa lấy vào** chỉ rời bản chép.
    - Bản chép bỏ khối ấy khỏi danh mục, tệp của nó rời bản chép và `pin.files`, thư mục rỗng được dọn; khi danh mục
      của bản chép giống của lõi, nó nhận đúng byte của lõi, để lần đọc sau không báo «khác». Mã ghim không đổi khi chỉ
      nhận việc rút một khối, và câu hỏi chờ của mã ghim ấy ở nguyên.
23. **Không cổng nào đỏ**: bản chép không còn giữ thứ đã rút, dấu «own since» được đọc là không có dấu của lõi, và
    cổng không so một lời đáp mà bản chép không có. Bài kiểm chạy cổng của một thành viên trước khi rút, sau khi rút mà
    chưa nhận, và sau khi nhận: cả ba thoát 0.
24. **Tầng 3 không còn đưa ra khối đã rút** sau khi người nhận (hay ghim lại). Trước đó tầng 3 vẫn đọc bản chép như
    quyết định 0117 chốt (không bao giờ đọc thư mục lõi), nên khối vẫn được đưa ra, trong khi `--moved` nói nó đã rút
    (giới hạn `core-retired-block-offered-until-accepted`). Repo thắng, bằng cách ghim.

### Chung

25. **Mọi bước ghi sổ của repo nói khi bản xuất tụt lại**: nhận việc rút (qua `--accept` hay `--join`) dùng
    `exportsBehind` sẵn có. Ba bước mới của chủ của họ và bước đề xuất không ghi gì vào repo.
26. **Tiêu chí 1**: repo đứng một mình không thấy gì mới: `status`, `inventory` và dòng lúc mở phiên chỉ đọc đề xuất và
    việc rút trên repo đã khai họ; `--propose` trên repo không thuộc họ nào nói vậy và không ghi gì. **Tiêu chí 20**: đưa
    lên và đề xuất từ một worktree nêu đúng repo theo thư mục chính. **Tiêu chí 15**: tên họ chỉ nằm ở thư mục lõi, bản
    chép và lời khai của thành viên; đề xuất và mục của kho không mang tên họ.
27. **Bảng năng lực không thêm ổ; thêm một lối `core-retire`** (`scripts/core-retire.mjs` qua ổ `decision`), vì hàm
    nhận việc rút trong tệp ấy dựng dòng sổ quyết định và bản thiết kế mà `--accept` và `--join` ghi, như lối
    `core-leave`. Bước đưa lên và bước đề xuất chỉ ghi vào thư mục lõi; chúng đọc sổ nguồn ngoài và bản chuẩn hoá, và
    gọi đường dẫn của hai sổ ấy bằng hằng của hợp đồng (`SOURCES_FOLDER`, `CONFORM_FOLDER`), nên phép kiểm tĩnh của bảng
    không đọc chúng là bên ghi.

## Consequences

- **Hợp đồng sổ đổi, cần người duyệt**, ở `plugins/design-assembly/references/contract.md` và `contract.mjs`:
  1. Mục lõi, đoạn «Since slice 3 of item 7.2, `core --promote` fills it…»: mục của kho cho khối được đưa lên
     (`promoted.why`, `second_use: false`, `licence`, `history` của khối và luật của nó).
  2. Mục lõi, đoạn «`proposals`: one file per proposal…»: hình dạng của một đề xuất (`id`, `kind`, `subject`,
     `repository`, `pin`, `by`, `on`, `why`, `answer` hay `block`, `decided`).
  3. Mục lõi, đoạn «`retired`: `retired.json`…»: cách giữ một lời đáp và một khối đã rút; hai dòng mới của bảng phần.
  4. Mục sổ quyết định, đoạn «Once the family core retired an answer…», và mục bản thiết kế, câu về `how: "retired"`:
     dấu của thành viên sau khi nhận việc rút một lời đáp.
  5. Mục sổ nhập kho, đoạn «Once the family core retired such a block…»: khoá `own` của dòng (thêm vào `INTAKE_KEYS`,
     sổ vẫn hình dạng 1).
- **Lượt thử trên bản sao** (DESIGN_ASSEMBLY_CORES là tệp riêng của lượt thử; hai repo thật chỉ được đọc): lõi dựng từ
  bản sao repo kiểm chứng (1ea13196), khoá màu gốc và một luật hành vi, mặc định mật độ bảng.
  - Đưa khối `chu-dai-cat-gon` (TruncatedText, tạo tay) lên bị từ chối lần đầu: sổ nhập kho của repo ấy viết «tạo tay» là
    `nguon: tao-tay` mà không khai `values: { by-hand: tao-tay }`, nên mọi bên đọc của plugin (cả `inventory`) đọc dòng
    ấy là món của một nguồn ngoài tên `tao-tay`. Lời từ chối lúc đầu nói sai («ghim hơn một nguồn»); nay nói đúng ca và
    cách sửa. Sau khi thêm dòng ấy vào bản sao, khối lên lõi, `core --check` giữ.
  - Một bản sao của chính kho này (sàn chuẩn) vào họ, `find TruncatedText` đưa khối ở tầng 3, `intake` hỏi, tờ quyết định
    giữ, `core --take` chép tệp, `intake --file` ghi dòng với `from: core` và mã ghim. Cổng của bản sao khác bản sao chưa
    đụng tới đúng một dòng, bản xuất (bước của repo, lệnh vào họ đã nói); sau khi viết lại bản xuất thì giống từng dòng
    (11 lỗi sẵn có của một bản sao không cài gói).
  - Thành viên sửa tệp và đề xuất: tệp đề xuất vào `proposals/block-chu-dai-cat-gon-1/`, `--proposals` liệt kê, dòng lúc
    mở phiên nói một đề xuất chờ; chủ của họ từ chối, `core --moved` của thành viên nêu lời từ chối và lý do.
  - Chủ của họ rút khối; thành viên nhận: dòng sổ nhập kho có `own`, `inventory` nói khối là của repo, cổng (sau khi viết
    lại bản xuất) giống bản sao chưa đụng tới. Lượt này tìm ra hai dòng in sai, đã sửa kèm bài kiểm: «the pin moved from X
    to X» khi chỉ nhận việc rút một khối, và câu «danh mục khối khác» còn in sau khi đã nhận.
- **Bài kiểm của lát trước đổi hai chỗ**: hai bài của lát 3 mục 7.1 đòi «không nêu khối nào» khi kho khác bản chép (điểm 5
  của quyết định 0116 để việc ấy cho mục 7.2); nay chúng đòi khối được nêu kèm người và ngày. `tests/test-core.mjs` đòi
  trang hợp đồng nêu mọi phần và mọi khoá, nên trang thêm hai phần.
- **Giới hạn.** Đóng `core-retired-answer-half-told`. Thu hẹp `core-block-store-filled-by-no-command` (còn lại: báo cáo
  thành viên và đề xuất nâng hạng của máy, lát 2), `core-built-once` (rút một lời đáp nay có lệnh), `core-copy-holds-every-block`
  (nhận việc rút một khối nay gỡ tệp của nó khỏi bản chép). Mở mười giới hạn, mức thấp:
  `core-promote-adapters-are-a-persons-word`, `core-promote-licence-is-the-sources-line`, `core-second-use-not-counted`
  (sửa ở lát 2), `core-replace-keeps-hashes-not-bytes`, `core-retired-need-not-promoted-again`,
  `core-retired-block-offered-until-accepted`, `core-proposal-carries-a-value-not-a-hold`,
  `core-proposal-against-a-moved-block-refused`, `core-proposal-seen-where-the-folder-is`,
  `core-retiring-unrecorded-names-no-one`. Giữ nguyên `core-block-kept-after-leaving-says-core`: bước rời họ không đổi.
- Plugin 0.67.0. Mục 7.4 (PR #151, quyết định 0120) gộp trước ở 0.66.0; nhánh này lấy main vào bằng một commit gộp,
  giữ dòng của cả hai bên ở kế hoạch, sổ giới hạn, chỉ mục, nhật ký và `releases.json`, rồi lên 0.67.0 và ghi lại cây.
- **Đứng chung với mục 7.4**: gói không giữ `src/` (thư mục nguồn đọc theo `source-folders.mjs`). `core --promote` đọc
  tệp của khối ở chỗ dòng sổ nêu, nên không cần đổi gì; `core --take` đặt khối vào thư mục linh kiện của chính gói, cạnh
  thư mục của thư viện mà gói khai (gói giữ nguồn ở đỉnh: `components/`, cạnh `components/ui`), và không tạo `src/`. Bài
  kiểm dựng hai gói như thế, đưa khối lên từ gói đầu và lấy vào gói thứ hai trọn lối. Không đổi mã.
- **Chưa dựng**: báo cáo thành viên và đề xuất nâng hạng lúc cần khối và ở nhịp định kỳ (lát 2 của mục 7.2); đề xuất đổi
  mức khoá; ghi lần dùng thứ hai khi một thành viên lấy khối vào.
