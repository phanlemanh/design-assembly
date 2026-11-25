---
type: decision
title: "Repo khai họ và ghim lõi; sổ lõi trên máy; new và adopt thừa hưởng; cổng giữ câu đã khoá"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/core-questions.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/core-join-call.mjs
  - plugins/design-assembly/scripts/core-list.mjs
  - plugins/design-assembly/scripts/core-marks.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/tests/test-core-join.mjs
  - mk/plugin.mk
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở hai lát» cho câu «Mở hai phiên song song: lát 2 và lát «đổi lời đáp của lõi»?»"
  - "repo kiểm chứng ở 1ea13196, chép bằng git archive vào thư mục tạm, chỉ đọc repo thật"
---

# 0114 Repo khai họ và ghim lõi; sổ lõi trên máy; new và adopt thừa hưởng; cổng giữ câu đã khoá

## Status

Accepted, 2026-11-25, plugin 0.62.0 (gộp cùng nửa đầu lát 4, quyết định [0115](0115-the-family-owner-changes-an-answer-of-the-core.md), plugin 0.61.0). Lát 2 của mục 7.1, dựng theo lời chủ repo («Mở hai lát»), theo
đề bài [0016](../specs/0016-the-family-core-is-born-through-the-plugin.md) đã duyệt và quyết định
[0113](0113-the-core-shape-and-the-command-that-builds-it.md). Lát này đổi hợp đồng sổ (sổ nguồn
ngoài có loại `core`, dấu của lõi ở sổ quyết định và ở bản thiết kế, nghĩa của `pin` trong danh sách
thành viên của lõi) nên cần người duyệt trước khi gộp.

## Context

Đề bài 0016 giao cho lát 2: repo khai họ và ghim (tiêu chí 5); sổ lõi trên máy và câu hỏi tự nhận
ra họ (17); `new` và `adopt` thừa hưởng và nói rõ câu đã bỏ qua (6); repo đã có lời đáp so từng câu
(7); cổng giữ câu đã khoá (8); phía thành viên của tiêu chí 26; lệnh chạy đúng từ thư mục làm việc
riêng (20); và tiêu chí 1, mà lát này là lát đầu có thể làm vỡ. Lời đáp 4 đã chốt: lời khai là một
tệp của sổ nguồn ngoài với loại mới là lõi, hợp đồng không thêm sổ. Đề bài để ngỏ tên lệnh và cờ,
tệp và khoá của lời khai, mã ghim là gì, sổ trên máy nằm đâu và ghi gì, câu hỏi về họ hiện ở đâu,
dấu «thừa hưởng» viết thế nào, «thành viên có phép kiểm ấy» nghĩa là gì, và cổng xử thế nào khi bản
chép hỏng. Mỗi điều ấy được chốt dưới đây.

## Decision

1. **Năm bước mới của lệnh `core`**, mỗi bước một cờ, mã ở tệp riêng (`core-join.mjs`,
   `core-join-call.mjs`, `core-list.mjs`, `core-marks.mjs`); `core.mjs` chỉ thêm cờ và chỗ rẽ:
   `--join` (khai họ và ghim), `--settle` (ghi lời đáp của chủ repo về câu khác lõi vào sổ),
   `--inherit` (đưa lời đáp của lõi vào bản thiết kế của lối dẫn dắt), `--ask` (câu hỏi về họ, nếu
   có) và `--decline` (repo này không thuộc họ nào trong sổ). Hai bước một lần là lời gọi sai.
   `--join` không có `--core` thì lấy lõi duy nhất đọc được trong sổ trên máy, và không đoán giữa
   hai lõi.
2. **Lời khai là `design/sources/core.json`**, id `core`, `kind: "core"`: một repo thuộc một họ. Nó
   có `family` (tên lõi ghi), `snapshot: "design/core"`, `pin.files` (mã băm của `core.json`,
   `answers.json`, `blocks/index.json` như đã chép), `pin.taken_on`, `joined` (ai nói repo thuộc họ,
   ngày nào), `title`, và `catalog` trỏ tới danh sách khối của bản chép: một công cụ cũ hơn kiểu
   `core` đọc dòng ấy như một thư viện không có món nào, và giữ được hình dạng (lượt thử trên bản
   sao repo kiểm chứng cho thấy thiếu `catalog` thì cổng 0.7.1 đỏ). Báo cáo thành viên không được
   chép. Khai một họ khác khi đã thuộc một họ thì từ chối: rời họ là lát 4.
3. **Mã ghim là 12 chữ số hex đầu của mã băm `answers.json`** như repo đã chép. Một thành viên vào
   họ làm đổi `core.json` mà không đổi mã ghim của ai, nên ngoại lệ ghi theo mã ghim không bị cũ
   vì người khác vào họ. `members` của lõi ghi `repository` (tên thư mục chính), `joined` và `pin`.
4. **Ghi vào thư mục lõi chỉ khi với tới được, và nói trước.** `--join --dry-run` in đúng dòng nó
   sẽ ghi vào `core.json` của lõi mà không ghi gì; lời gọi thật in cùng dòng ấy kèm đã ghi hay vì
   sao không. Không ghi được thì repo vẫn ghim xong, danh sách thành viên giữ nguyên và lệnh nói
   việc còn lại.
5. **Bản chép lệch mã băm thì không đọc được**: mọi bước nói vì sao và thoát 2; `status` nói repo
   không thừa hưởng gì và lời đáp của chính nó đứng; `adopt` ghi ở mục không đọc được; lối dẫn dắt
   hỏi mọi câu. Riêng **cổng thì đỏ**, nêu bản chép: nếu cổng xanh khi bản chép hỏng thì sửa tay
   bản chép là lối né một câu đã khoá. Đề bài không nói cổng xử thế nào; đây là lựa chọn của lát
   này.
6. **Sổ lõi trên máy** là một tệp JSON: tệp mà biến `DESIGN_ASSEMBLY_CORES` nêu, nếu có; không thì
   `$XDG_CONFIG_HOME/design-assembly/cores.json`; không thì `~/.config/design-assembly/cores.json`.
   Mỗi dòng `cores` là `{ family, path, on, how }` (`built` hay `pinned`), mỗi thư mục một dòng;
   mỗi dòng `declined` là `{ repository, on }`, repository là thư mục chính của repo. `core --build`
   và `core --join` ghi dòng; `--dry-run` không ghi. Sổ không đọc được thì không lệnh nào ghi đè
   nó. `mk/plugin.mk` đặt biến ấy cho cả lượt kiểm, và mọi bài kiểm của lõi đặt sổ riêng của nó,
   nên không bài kiểm nào đọc hay ghi sổ thật của người chạy.
7. **Câu hỏi về họ hiện ở ba chỗ**: `adopt` (mục «needs a person», id `family`, thoát 1 như mọi câu
   chờ người), bản xem trước của lối dẫn dắt (dòng `family:` cuối, và `family_question` trong
   `--json`, kể cả khi chưa có bản thiết kế), và `core --ask`. Câu ấy không lên hàng chờ: nó là câu
   về máy, không về repo (giới hạn `core-question-only-when-a-command-runs`).
8. **Dấu của lõi đứng đầu ghi chú của dòng sổ quyết định**: `inherited from the family core at
<pin>`, `changed from the family core at <pin>: <why> (by <name> on <day>)`, `kept against the
family core at <pin>: <why> (by <name> on <day>)`; phần còn lại của ghi chú theo sau `; `. Ghi
   chú không mang tên họ: tên họ chỉ ở lời khai và bản chép (tiêu chí 15). Một dòng `judgment` được
   lõi đáp, và mọi dòng lõi thêm vào, mang thêm dấu của tờ quyết định `answered by <người> on
<ngày>` (chủ của họ, hay người đưa lý do): nhờ vậy cổng của mọi bản, kể cả bản 0.7.1 của repo
   kiểm chứng, đọc nó là lời đáp của người chứ không phải điều nhánh tự quyết.
9. **Dòng lõi có mà sổ thiếu được thêm**, không phép kiểm: luật mang lời của nó, giá trị mang tệp
   repo giữ giá trị (hay `design/sources/core.json`); tầng và loại lấy từ `standard-decisions.json`,
   luật chuẩn không biết thì tầng `patterns`, loại `standard`. Dòng ấy là «thừa hưởng, chưa có gì
   giữ» cho tới khi một phép kiểm của repo giữ nó.
10. **Bản thiết kế** có thêm, ở mỗi tầng, `inherited` (theo khoá lựa chọn: `{ pin, hold }`) và
    `changed` (theo khoá: `{ why, by, on }`). `--inherit` ghi lựa chọn bản thiết kế chưa có từ
    lõi; tầng `patterns` mà lõi đáp trọn thì thành `decided`, `source: user` (lời đáp là của người,
    chủ của họ), lý do nêu mã ghim. Lối dẫn dắt từ chối một câu khoá bị đổi mà không có ngoại lệ, và
    một câu mặc định bị đổi mà không có lý do; câu thừa hưởng không bị ghi là đề xuất. Danh sách câu
    lối dẫn dắt hỏi là dữ liệu (`guide` trong `core-questions.json`, 12 câu); bài kiểm đếm: đứng
    một mình 12 câu hỏi, trên thành viên khoá màu gốc và cách mở hồ sơ, mặc định thang chữ thì 9.
11. **Repo đã có lời đáp vào họ**: câu khoá khác giá trị thành câu `core-<id>-<pin>` trên hàng chờ;
    không giá trị nào của repo bị ghi đè. Đáp `keep` là theo lõi: repo tự đổi giá trị, cổng đỏ tới
    lúc ấy (giới hạn `core-follow-not-carried-out`). Đáp `refuse` kèm lời là ngoại lệ có lý do;
    `--settle` ghi nó vào ghi chú, và `--settle --why <id>=<lý do>` nhận lý do người nói trong phiên.
    Câu mặc định mà repo giữ khác lúc vào họ được ghi «changed» với lý do «the repository's own
    answer from before it joined the family», người nói là người khai họ.
12. **Cổng**: phép kiểm `family-core` dưới dòng `ledger-shapes`, như `taken-down` và `choose-first`,
    nhưng chỉ đặt trên repo đã khai họ: `--join` đặt khi công cụ của repo biết nó (đọc ở
    `tools/design-assembly/contract.mjs`), `adopt` và lối dẫn dắt đặt khi dựng dòng ấy, `upgrade`
    thêm khi thiếu. Giá trị so được: màu gốc (bản thiết kế, hay `color.primary` của sổ token do
    plugin viết; so theo hex dù viết kiểu nào), cách mở hồ sơ và thang chữ (bản thiết kế), bề rộng
    (`design/screen-sizes.json`). Luật không so lời; repo không giữ giá trị thì không so.
13. **«Thành viên có phép kiểm ấy»** (tiêu chí 26): dòng của thành viên có cùng id với câu của lõi,
    nêu một phép kiểm cùng loại; `tool:` và luật lint phải cùng đích; `test:` và `e2e:` thì đường dẫn
    là của riêng mỗi repo, miễn tệp nêu `decision:<id>`; và con trỏ phải tới được. `status` đếm câu
    khoá: giữ bởi phép kiểm ở đây, thừa hưởng mà chưa giữ, giữ làm ngoại lệ, khác và chờ chủ repo;
    `audit` không đổi cách đếm, dòng không phép kiểm vẫn là «not held».
14. **Thư mục làm việc riêng**: repo được gọi bằng thư mục chính của nó (đọc qua thư mục git chung;
    hàm `homeOf` chuyển sang `core-list.mjs`), sổ trên máy ghi «không» theo thư mục chính, nên mọi
    bước in như nhau từ thư mục chính và từ worktree; bài kiểm dựng một worktree thật.
15. **Bảng năng lực không thêm ổ**: thêm một lối `core` (`scripts/core-join.mjs` qua ổ `decision`
    và `reference`), vì bước ấy ghi sổ quyết định, bản thiết kế và sổ nguồn ngoài.

16. **Lệnh ghi sổ nói khi bản xuất tụt lại** (sửa theo bài soát độc lập, điểm 1). Bản xuất của repo
    (`DESIGN.md` và `design/export/system`) được viết từ trạng thái của sổ token, bản thiết kế, sổ
    thành phần và sổ nguồn ngoài, nên `--join` (thêm `design/sources/core.json`) và `--inherit` (đánh
    dấu bản thiết kế) làm hàng `design-exports` của cổng đỏ. `--join`, `--settle` và `--inherit` nói
    điều ấy, bằng chữ và trong `--json` (`exports`: các tệp tụt lại và lệnh `make design-exports`);
    bản xem trước nói «would be». Lệnh không tự viết bản xuất: đó là bước của repo.
17. **`status` chia câu khoá thành bốn nhóm rời nhau** (sửa theo bài soát độc lập, điểm 2): giữ bởi
    phép kiểm ở đây, thừa hưởng mà chưa giữ, giữ làm ngoại lệ, khác và chờ chủ repo; bốn số cộng
    lại bằng số câu khoá. Chỉ câu thừa hưởng mới có thể «held»: phép kiểm của một câu giữ làm ngoại
    lệ giữ lời đáp của repo, không phải của lõi, nên `held` của nó là `false`.
18. **Với lõi hình dạng 2** (lời đáp mang `history`, PR #144): các bước của thành viên đọc lõi ấy như
    lõi hình dạng 1; mã ghim vẫn là mã băm `answers.json` như đã chép; bản chép giữ hình dạng trong
    cổng của thành viên. `core --change` sau khi thành viên đã vào họ chỉ ghi vào lõi: mã ghim và
    bản chép của thành viên giữ nguyên, việc báo cho thành viên là lát 3. Hai bước dùng chung cờ
    `--why`: một danh sách, mà `--settle` nhận mỗi câu một lý do (`<id>=<lý do>`) và `--change` nhận
    đúng một lần.

### Trên mọi loại repo

| Repo                                 | Lệnh làm gì                                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Chưa có sổ                           | `--join` ghi lời khai và bản chép, không đánh dấu dòng nào; câu khoá khác giá trị vẫn lên hàng chờ; cổng chưa có nên chưa đặt |
| Được nhận (sổ quyết định, token)     | So màu gốc với `color.primary`; đánh dấu từng dòng; thêm dòng lõi có mà sổ thiếu; đặt phép kiểm nếu công cụ biết nó           |
| Do lối dẫn dắt dựng                  | Đọc bản thiết kế; `--inherit` điền câu lõi đáp; lối dẫn dắt in cuối lượt câu đã bỏ qua, ai chốt, ngày nào                     |
| Kiểu khác (không có sổ token)        | Không giá trị nào đọc được thì không so; câu khoá là thừa hưởng, «chưa có gì giữ» nếu không phép kiểm nào giữ                 |
| Không Makefile                       | Lời khai và bản chép vẫn ghi; không có cổng để đặt phép kiểm, lệnh nói vậy                                                    |
| Công cụ cũ (bản sao repo kiểm chứng) | Cổng cũ giữ đúng mười lỗi sẵn có của bản sao chưa đụng tới; phép kiểm chưa đặt, lệnh bảo `upgrade`                            |
| Gọi từ một worktree                  | Cùng tên repo, cùng lõi, cùng chữ in ra                                                                                       |

Ca không biết (sổ quyết định không đọc được, lõi sai hình dạng hay mới hơn, bản chép hỏng) thoát 2,
không ghi gì và nói vì sao.

## Consequences

- Hợp đồng sổ đổi, cần người duyệt: đoạn về loại `core` ở mục sổ nguồn ngoài, đoạn dấu của lõi ở mục
  sổ quyết định, đoạn `inherited` và `changed` ở mục bản thiết kế, câu về `pin` của thành viên ở mục
  lõi, và mục mới «Not a ledger: the machine's list of cores» của `references/contract.md`; hình
  dạng `sources.core` trong `contract.mjs`. Sổ viết trước vẫn đọc như cũ: không khoá nào bắt buộc
  thêm cho sổ cũ.
- Tiêu chí 1 có hai bằng chứng. Bài kiểm chạy `status`, `audit`, `adopt`, lối dẫn dắt và cổng trên
  bốn loại repo, với sổ trên máy vắng và với sổ hỏng, và đòi cùng mã thoát, cùng chữ, không tệp
  mới, không câu về họ. Một lượt so trên bản sao (`git archive` của f6f2bef) chạy cùng lệnh bằng
  plugin của main và của nhánh này trên cùng bốn repo: mã thoát như nhau; chỗ khác chỉ là số giới
  hạn trong `audit`, và việc bản công cụ mới khác bản cũ (cùng một tập tệp).
- Lượt thử trên hai bản sao của repo kiểm chứng: một lõi dựng từ bản sao thứ nhất (khoá màu gốc,
  cách mở hồ sơ và bảy luật hành vi; giá trị cách mở hồ sơ, thang chữ, bề rộng do người đưa), bản
  sao thứ hai vào họ trên một nhánh: mọi câu thừa hưởng, tám câu khoá giữ bởi phép kiểm của nó; cổng
  0.7.1 của nó giữ đúng các lỗi sẵn có. Lượt ấy tìm ra hai điều đã sửa trong lát này: thiếu
  `catalog` làm cổng cũ đỏ, và dòng `judgment` được đánh dấu mà không có dấu «answered by» thì tờ
  quyết định của cổng đỏ. Một lõi khoá màu khác: câu lên hàng chờ, tệp kiểu dáng và sổ token
  không đổi.
- Đóng giới hạn `core-not-declared-by-members`. Mở bảy giới hạn: `core-member-not-told-core-moved`
  (lát 3), `core-rule-words-not-compared`, `core-value-read-from-plugin-places`,
  `core-exception-keyed-to-pin`, `core-follow-not-carried-out`, `core-list-names-no-repository-moved`,
  `core-question-only-when-a-command-runs`.
- Sổ lõi trên máy của bài kiểm: từ lát này `core --build` ghi một dòng, nên mọi bài kiểm gọi lệnh
  `core` đặt sổ riêng của nó (kể cả `tests/test-core-change.mjs` của lát 4a, sửa khi gộp), và
  `make plugin-test` bắt đầu với sổ chung rỗng. Hai lần trong lúc dựng, bài kiểm chạy thẳng bằng
  `node --test` (không qua `make`) đã ghi vào `~/.config/design-assembly/cores.json` của máy này,
  chỉ với dữ liệu mẫu; cả hai lần tệp và thư mục đã được xoá.
- Bài soát độc lập của head eedbaa3 tìm hai điểm, sửa cả hai theo lời chủ repo («Gộp 144, sửa 146»);
  mỗi bản sửa có một bài kiểm đỏ khi thiếu nó (điểm 16 và 17 ở trên).
- Chưa dựng: báo khi lõi đi trước bản ghim (9), móc lúc mở phiên (18), nhận bằng mắt (19), đẩy lõi
  lên đâu, rời họ (25), và cả mục 7.2.
