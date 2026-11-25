---
type: decision
title: "Thành viên báo cho lõi biết mình đã giải nhu cầu nào; nhu cầu gặp lần hai thành câu hỏi nâng hạng cho chủ của họ"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - wiki/decisions/0116-a-member-learns-the-core-moved-and-accepts-by-eye.md
  - wiki/decisions/0117-tier-three-reads-the-core-and-a-block-is-taken-like-an-outside-item.md
  - wiki/decisions/0118-a-repository-leaves-its-family.md
  - wiki/decisions/0119-the-owner-promotes-a-member-proposes-and-the-core-retires.md
  - wiki/decisions/0120-a-repository-with-no-makefile-and-a-package-with-no-src-folder.md
sources:
  - plugins/design-assembly/scripts/core-report.mjs
  - plugins/design-assembly/scripts/core-report-call.mjs
  - plugins/design-assembly/scripts/core-graduate.mjs
  - plugins/design-assembly/scripts/core-propose.mjs
  - plugins/design-assembly/scripts/core-owner-call.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/core-join-call.mjs
  - plugins/design-assembly/scripts/core-leave.mjs
  - plugins/design-assembly/scripts/core-leave-call.mjs
  - plugins/design-assembly/scripts/core-moved.mjs
  - plugins/design-assembly/scripts/core-moved-call.mjs
  - plugins/design-assembly/scripts/core-accept.mjs
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/skills/find/SKILL.md
  - plugins/design-assembly/skills/intake/SKILL.md
  - plugins/design-assembly/tests/test-core-report.mjs
  - plugins/design-assembly/tests/test-core-graduate.mjs
  - plugins/design-assembly/tests/helpers/family-needs.mjs
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Dựng lát cuối» cho câu «Mở phiên dựng lát cuối, 7.2 lát 2: báo cáo thành viên và đề xuất nâng hạng?»"
  - "repo kiểm chứng ở 1ea13196 và repo cùng họ thứ hai ở 4aebb767d, mỗi repo chép bằng git archive vào thư mục tạm, chỉ đọc repo thật; và một bản sao git archive của chính kho này"
---

# 0121 Thành viên báo cho lõi; nhu cầu gặp lần hai thành câu hỏi nâng hạng

## Status

Accepted, 2026-11-25, plugin 0.68.0. Lát 2 của mục 7.2, lát dựng cuối của giai đoạn 7 (tiêu chí 12 và 13 của đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md); lời đáp 6), dựng theo lời chủ repo («Dựng lát
cuối»). Lát này đổi hợp đồng sổ (báo cáo giữ gì và khi nào được ghi; bản chép đã ghim thêm gì; loại đề xuất mới;
`used_by` và `second_use` đi theo điều gì) nên cần người duyệt trước khi gộp. Một PR: phần mã ngoài bài kiểm khoảng
1 500 dòng.

## Context

Sau ba lát đã gộp, chủ của họ đưa được khối lên lõi và thành viên lấy được khối về, nhưng lõi không biết repo nào đã
giải nhu cầu nào. Hợp đồng đã ghi hình dạng của báo cáo thành viên từ quyết định
[0113](0113-the-core-shape-and-the-command-that-builds-it.md) (`members/<repo>.json`: `need`, `name`, `description`,
không gì khác) mà chưa lệnh nào ghi nó. Vì thế một repo cần một thứ repo khác trong họ đã có vẫn tự dựng lại, và mục của
kho không bao giờ nói «đã có lần dùng thứ hai» khi một thành viên lấy khối về dùng nguyên (giới hạn
`core-second-use-not-counted` và `core-block-store-filled-by-no-command`).

Đề bài giao hai việc. Tiêu chí 12: báo cáo chỉ ghi khoá nhu cầu, tên và mô tả, lệnh in trước nó sẽ ghi gì vào thư mục
lõi. Tiêu chí 13: đề xuất nâng hạng hiện ở hai chỗ, thành một câu hỏi, lúc `find` hay `intake` gặp nhu cầu repo khác đã
giải và ở nhịp định kỳ của `status`; khối chỉ vào kho sau lời chủ của họ; khối cần bộ chuyển repo không có thì không
được đưa ra. Lời đáp 6: đề xuất ngay khi một repo **cần**, trước khi nó tự dựng; hai repo giải cùng nhu cầu theo hai cách
thì đề xuất chọn một.

Đề bài để ngỏ: báo cáo được ghi lúc nào; nói gì về khối lấy từ lõi; `used_by` và `second_use` đi theo lời ai; báo cáo
của repo đã rời họ; repo đầu của họ, vốn chưa khai họ, báo bằng cách nào; thành viên biết báo cáo của repo khác bằng
đường nào khi `find` chỉ đọc repo; đề xuất nằm ở đâu, mang gì, và được thực hiện thế nào khi lệnh đưa khối lên phải gọi
ở repo đang giữ khối. Mỗi điều được chốt dưới đây.

## Decision

### Báo cáo thành viên (tiêu chí 12)

1. **Báo cáo giữ gì.** Một tệp `members/<repo>.json` trong thư mục lõi. `needs`: mỗi khối repo **tự giải** (tạo tay hay
   lấy từ một nguồn ngoài) một mục gồm `need`, `name`, `description` của dòng sổ nhập kho, không gì khác: không đường dẫn,
   không mã băm, không tên nguồn, không giá trị, không mã. `core --check` đỏ khi một mục có khoá thứ tư. Cùng một sổ luôn
   cho cùng một tệp: báo cáo không mang ngày và không mang tên người, nên ghi lại không làm tệp đổi.
2. **Dòng bị bỏ ra, mỗi dòng nói vì sao:** dòng không có `description` (họ được kể một nhu cầu bằng khoá, tên và câu
   ấy; sổ thật của repo kiểm chứng có câu ấy ở cả 23 dòng); dòng đã rút hay đã gộp; món của bộ khởi đầu (mọi repo đã có
   từ plugin, và bộ khởi đầu đứng trước kho của họ trên thang); nhu cầu không phải một khoá; khối lõi đã rút mà repo giữ
   làm đồ riêng (nhu cầu lõi đã rút không được đề xuất lại).
3. **Khối lấy từ lõi là một lần dùng, không phải một nhu cầu repo đã giải.** Báo cáo có thêm khoá tuỳ chọn `uses`: các
   nhu cầu của lõi mà repo đã lấy khối về (`from: core` ở dòng sổ), mỗi cái một khoá và không gì khác.
4. **`used_by` và `second_use` đi theo báo cáo, bằng lời của chính thành viên.** Bước ghi báo cáo ghi trước, trong
   `blocks/index.json`, tên repo vào `used_by` của từng khối `uses` nêu; `second_use` thành đúng khi `used_by` nêu hai
   repo, và đầu ra nói «a second use». Đó là lời của thành viên về việc mình dùng, như dòng thành viên của nó trong
   `core.json`: không tệp nào của khối đổi, và khối vẫn chỉ vào kho bằng lời chủ của họ. Thứ tự ghi (mục của kho trước,
   báo cáo sau) giữ hai bên khớp ở mọi lúc. Không lệnh nào gỡ tên khỏi `used_by`, và `second_use` không quay về sai: repo
   đã rời họ vẫn là repo từng dùng. `core --check` giữ một lần dùng phải nêu một nhu cầu kho đưa ra hay đã rút; việc mục
   của kho thiếu tên **không** là lỗi hình dạng, vì lần báo cáo kế của repo ấy tự ghi lại, mà một lõi «sai hình dạng»
   thì chính bước ấy lại bị từ chối (bài kiểm của lát 1 viết lại kho bằng tay đã chạm đúng vòng lặp ấy).
5. **Báo cáo được ghi lúc nào.**
   - `core --report [--core DIR] [--dry-run]`: bước riêng. In **nguyên tệp** trước khi ghi, chỉ ghi trong thư mục lõi,
     không ghi gì vào repo; nói từng dòng bị bỏ ra.
   - `core --join`, cả lần đầu lẫn ghim lại: ghi báo cáo cùng dòng thành viên, in nguyên tệp trước, `--dry-run` không ghi.
     Repo không có gì để báo thì không tệp nào được tạo.
   - `intake` (nhập một khối) và `core --take` **không ghi**: `intake` chỉ đọc và ghi repo, giống nhau trên mọi máy
     (quyết định 0117). Lúc ghi dòng sổ nó in một dòng nói lõi chưa được báo và chỉ `core --report`; `core --moved` và
     `status` nói báo cáo đang đứng sau sổ nhập kho ở nơi nhìn được thư mục lõi.
6. **Lõi không với tới được:** không ghi gì ở đâu, thoát 2, lệnh nói vậy và nói repo cứ đi tiếp. **Sổ nhập kho mất
   hay không đọc được** (kể cả `blocks` không phải một danh sách) thì không báo gì và không sửa gì: báo cáo lõi đang giữ
   ở nguyên, lệnh nói điều không đọc được. Một sổ hỏng không được phép xoá trắng điều họ đã biết.
7. **Rời họ thì báo cáo đi cùng dòng thành viên.** `core --leave` xoá `members/<repo>.json`, nói trước; lõi không với
   tới được thì việc còn lại (gỡ dòng, xoá báo cáo) được nêu. Vì sao xoá chứ không giữ làm bản ghi: báo cáo nói điều
   **một repo của họ** đang có, và khối chỉ được đưa lên từ một repo của họ; giữ lại thì máy đề xuất một khối không ai
   đưa lên được. Báo cáo sót lại của một repo mà tờ khai không nêu thì không được đếm ở đâu.
8. **Repo đầu của họ báo mà không khai họ.** `core --report --core DIR` ở repo mà `core.json` nêu là `first` ghi báo cáo
   của nó và không ghi gì vào repo ấy. Lời đáp 11 hỏi riêng việc repo đầu **khai họ**, vì khai họ ghi vào repo; báo cáo
   thì không, và bước đưa khối lên đã nhận repo đầu theo đúng cách ấy (quyết định 0119, điểm 3). Repo không phải repo đầu
   cũng không phải thành viên thì bị từ chối.

### Thành viên biết nhu cầu của repo khác bằng đường nào

9. **Báo cáo vào bản chép đã ghim.** `core --join` chép báo cáo của mọi repo trong họ vào
   `design/core/members/<repo>.json`, đúng từng byte, và `pin.files` liệt kê từng tệp kèm mã băm. `find` và `intake` đọc
   từ đó, nên một repo cho một lời đáp trên mọi máy và trên CI, lõi ngoài tầm với cũng vậy. Mã ghim (mười hai chữ số đầu
   của mã băm `answers.json`) không đổi theo báo cáo.
10. **Cái giá của lựa chọn ấy, nói thẳng:**
    - bản ghim thêm tệp (chỉ tên, không mã); một trình định dạng viết lại một tệp ấy làm bản chép không đọc được, như
      với tệp của khối (giới hạn sẵn có, nay nêu cả báo cáo);
    - thành viên biết nhu cầu của repo khác **tính đến lúc ghim**: nhu cầu báo sau đó chỉ hiện khi ghim lại, và
      `core --moved` nói báo cáo nào trong lõi không còn là bản đã chép;
    - bản chép không giữ điều lõi đã rút hay chủ của họ đã từ chối, nên `find` vẫn nêu một nhu cầu như thế; bước hỏi
      (`core --propose --graduate`) đọc thư mục lõi và từ chối kèm ai, ngày nào, vì sao (giới hạn
      `core-family-needs-known-as-of-the-pin`).

    Lối kia, đọc thư mục lõi khi với tới được, bị loại: `find` sẽ cho hai lời đáp trên hai máy.

### Đề xuất nâng hạng (tiêu chí 13, lời đáp 6)

11. **Lúc cần khối.** Ở một thành viên, khi thang đi tới kho của họ mà chưa kho nào gần hơn đáp, `find` in thêm mục
    «in the family, not in its store yet»: repo nào, tên khối, mô tả, đúng như báo cáo; dữ liệu có `family_needs`. Dòng
    `next` nêu bước kế: hỏi chủ của họ bằng `core --propose <nhu cầu> --graduate`, trước khi dựng hay lấy từ ngoài, kể cả
    khi một nguồn ngoài (tầng 4) có đáp, vì họ đứng gần hơn. `intake` in cùng điều ấy thành `note` trước khi hỏi chủ
    repo. Thứ tự các tầng không đổi; nhu cầu của họ không bao giờ là một ứng viên của câu hỏi nhập kho: không gì được
    lấy thẳng từ repo khác. Repo đứng một mình không có khoá `family_needs` và không in gì thêm.
12. **Ở nhịp định kỳ.** Dòng «periodically» của `status` ở một thành viên nói bao nhiêu nhu cầu của họ đang chờ nâng
    hạng, và nhu cầu nào: cái đã hỏi mà chưa đáp; cái đã nhận mà chưa đưa lên; cái hai repo đã giải theo hai cách mà
    chưa ai hỏi. Đọc từ thư mục lõi khi nhìn được; không thì đếm từ bản chép và nói rõ.
13. **Câu hỏi là một đề xuất loại mới, `graduation`,** trong `proposals/` mà quyết định 0119 dựng:
    `proposals/graduation-<nhu cầu>-<số>.json`, `subject` là nhu cầu, `graduation.candidates` là từng khối giải nhu cầu ấy
    trong họ (`repository`, `need`, `name`, `description`, không gì khác). Nó không mang giá trị, tệp hay mã. Chủ của họ
    thấy nó ở `core --proposals` và ở dòng lúc mở phiên, vốn đếm mọi đề xuất chưa đáp; dòng ấy vẫn một dòng.
14. **Ai hỏi, và khi nào bị từ chối.** `core --propose <nhu cầu> --graduate --by --why`, gọi ở một thành viên; lệnh in
    trước và chỉ ghi một tệp trong thư mục lõi. Một nhu cầu chỉ có một đề xuất chờ, bất kể ai hỏi: hỏi lại thì lệnh nói
    đã chờ từ bao giờ, không ghi. Bị từ chối, không ghi gì: kho đã giữ nhu cầu ấy (ghim lại là có); lõi đã rút nhu cầu
    ấy; không repo nào khác báo đã giải; chủ của họ đã từ chối đúng khối ấy; repo hỏi thiếu bộ chuyển.
15. **Bộ chuyển.** Báo cáo không mang bộ chuyển (chỉ ba khoá), nên khối chưa lên lõi được coi là cần điều mọi khối mã
    cần: `components` và `source`. Repo thiếu một trong hai thì `find` nói «not proposed here» kèm lý do và bước hỏi bị
    từ chối. Bộ chuyển thật của khối là lời người lúc đưa lên; sau đó tầng 3 giữ như quyết định 0117.
16. **Hai cách giải.** Đề xuất liệt kê cả hai và hỏi chủ của họ chọn một; lời nhận phải nêu `--choose <repo>`, thiếu thì
    bị từ chối. Repo không được chọn giữ khối của mình nguyên vẹn và nghe lời chọn ở lần nhìn kế (`core --moved`,
    `status`). «Cùng nhu cầu» là cùng khoá nhu cầu; hai repo cùng giữ một khối trùng tên (hai bản chép của một món ngoài)
    cũng được đếm, và lời in nói đúng như thế.
17. **Nhận rồi thực hiện thế nào.** `core --grant <id> --core DIR --by --why [--choose REPO]` ghi lời nhận, ai, ngày nào,
    vì sao và `decided.chose`, **không** tự đưa khối lên: nó in đúng lời gọi phải chạy ở repo đang giữ khối,
    `core --promote <nhu cầu> --core '<DIR>' --by '<chủ>' --why 'granted <id> of <repo hỏi>: <lý do>'`, mỗi chữ do người
    đưa nằm trong dấu nháy đơn, để tên một repo hay một lý do có dấu nháy, khoảng trắng hay `$(…)` vẫn là một chữ khi
    dán vào shell. Khi cả thư mục lõi và
    repo ấy ở trên máy, chủ của họ thêm `--from <thư mục repo ấy>` và lệnh đưa khối lên ngay, bằng tên và lý do của chủ
    của họ nêu trong chính lời gọi ấy; `--by` và `--why` luôn bắt buộc, nên không bao giờ có lần đưa lên nào thiếu hai
    thứ ấy. Lệnh không tự đoán thư mục: plugin không biết repo thành viên nằm đâu trên máy. Khối đến từ nguồn ngoài vẫn
    chờ người đọc dòng giấy phép (thoát 1, không ghi lời nhận, chạy lại với `--licence-allows`). Lời nhận chưa được thực
    hiện thì `--proposals` thoát 1 và nói «the promotion is owed».
18. **Từ chối.** `core --refuse` giữ lời từ chối kèm lý do; khối ấy (cùng repo, cùng tên) không được đề xuất lại cho
    nhu cầu ấy, và `status` không đếm nữa.
19. **Sau khi đưa lên:** thành viên hỏi nghe ở `core --moved`, ghim lại, thấy khối ở tầng 3, lấy về và nhập kho như lát
    1 dựng; `core --report` rồi ghi nó vào `used_by` và mục của kho nói lần dùng thứ hai.

### Chung

20. **Hình dạng lõi vẫn là 2.** `uses` và `graduation` là khoá tuỳ chọn. Plugin trước 0.67.0 không đọc `proposals/`;
    riêng 0.67.0 đọc một lõi có đề xuất loại mới là «không giữ hình dạng» cho tới khi lên đời (giới hạn
    `core-graduation-kind-unknown-to-the-plugin-before`). Lên số 3 sẽ buộc mọi thành viên lên đời vì phần họ không đọc.
21. **`core --moved` nói thêm ba điều:** báo cáo của repo này đứng sau sổ nhập kho; báo cáo của repo khác không còn là
    bản đã chép; và «block used: … is used by … too» khi một repo khác báo đã dùng một khối. Kho chỉ khác ở `used_by` và
    `second_use` không còn bị nói là «danh mục khối khác, hãy ghim lại».
22. **Tiêu chí 1:** repo đứng một mình in như trước, không thêm khoá, không thêm câu hỏi, không ghi gì: bài kiểm chạy
    trên bốn loại repo, so `find`, `status`, `inventory` với bản ghi của plugin 0.65.0. **Tiêu chí 20:** từ một thư mục
    làm việc riêng, báo cáo, `find` và bước hỏi nêu đúng repo theo thư mục chính. **Tiêu chí 15:** tên họ chỉ nằm ở
    `core.json`, lời khai và bản chép; báo cáo và đề xuất không mang tên họ. **Bản xuất:** các bước mới không ghi sổ nào
    của repo; `core --join` vẫn nói khi bản xuất tụt lại.

## Consequences

- **Hợp đồng sổ đổi, cần người duyệt**, ở `plugins/design-assembly/references/contract.md` và `contract.mjs`:
  1. Mục lõi, đoạn «Since slice 2 of item 7.2 a report is written by `core --report`…»: báo cáo giữ gì, bỏ gì, `uses`, và
     ba lúc nó được ghi hay xoá.
  2. Mục lõi, đoạn «`used_by` and `second_use` of a block follow the reports…»: hai khoá ấy đi theo điều gì, bằng lời ai.
  3. Mục sổ nguồn ngoài, đoạn «Since slice 2 of item 7.2 the copy also holds the report of every repository…»: bản chép
     đã ghim thêm gì.
  4. Mục lõi, đoạn «Since slice 2 of item 7.2 a proposal may be of the kind `graduation`…»: loại đề xuất mới,
     `candidates`, `decided.chose`, và cách thực hiện.
- **Lượt thử trên bản sao** (`DESIGN_ASSEMBLY_CORES` là tệp riêng của lượt thử; hai repo thật chỉ được đọc bằng
  `git archive`, trạng thái git của chúng không đổi):
  - Lõi dựng từ bản sao repo kiểm chứng (1ea13196). Repo ấy báo mà không khai họ: 23 nhu cầu, mỗi mục đúng ba khoá,
    không đường dẫn hay mã băm nào trong tệp; bản sao không bị ghi gì.
  - Một bản sao của chính kho này (sàn chuẩn) vào họ, bản chép có báo cáo của repo đầu. `find TruncatedText` không khớp
    gì và in «in the family, not in its store yet … answered by first-product» kèm bước hỏi; `intake` in cùng điều ấy.
    Bước hỏi ghi đúng một tệp trong lõi; `--proposals` thoát 1, dòng lúc mở phiên nói một đề xuất chờ, dòng định kỳ của
    `status` nêu nhu cầu ấy.
  - Lời nhận kèm `--from` bị từ chối lần đầu, không ghi gì: sổ nhập kho của repo kiểm chứng viết «tạo tay» là
    `nguon: tao-tay` mà không khai `values: { by-hand: tao-tay }`, đúng điều lượt thử của quyết định 0119 đã gặp. Thêm
    dòng ấy vào bản sao thì lời nhận đưa khối lên ngay, lý do ghi «granted graduation-chu-dai-cat-gon-1 of
    floor-product: …»; bản sao repo đầu không bị ghi gì.
  - Thành viên nghe ở `core --moved`, ghim lại, `find` thấy khối ở tầng 3, `intake` hỏi, tờ quyết định giữ,
    `core --take` chép tệp (giống repo đầu từng byte), `intake --file` ghi dòng và nói lõi chưa được báo,
    `core --report` ghi `uses` và mục của kho thành `used_by: [first-product, floor-product]`, `second_use: true`. Cổng
    của bản sao khác lúc đầu đúng một dòng, bản xuất, điều lệnh vào họ đã nói; viết lại bản xuất thì giống từng dòng (11
    lỗi sẵn có của một bản sao không cài gói).
  - **Gói ứng dụng của sản phẩm thứ hai** (4aebb767d, không Makefile, không `src/`) làm thành viên hỏi một khối khác
    (PageHeader): nhận lối `adopt`, vào họ, hỏi, chủ của họ nhận kèm `--from`, ghim lại, `core --take` đặt tệp vào
    `components/` của gói, `intake --file`, `core --report`: mục của kho nói lần dùng thứ hai. Không Makefile và không
    `src/` nào được tạo; lệnh kiểm của gói thoát 0 trước và sau («9 decisions held by 13 checks»).
  - **Hai điều lượt thử tìm ra.** Một: ở gói ấy `find PageHeader` dừng ở kho của chính repo, vì một linh kiện riêng
    (`PageShellHeader`) chứa đủ các chữ; nhu cầu của họ chỉ hiện ở `intake`, lệnh hỏi các kho xa hơn kho riêng. Thang
    «gần nhất trước» giữ nguyên, điều này được ghi thành giới hạn. Hai: thành viên được gọi theo thư mục chính của repo,
    kể cả khi thứ vào họ là một gói bên trong, nên hai gói của một workspace chung một dòng thành viên và một báo cáo
    (giới hạn mới `core-member-is-a-repository-not-a-package`). Lượt thử cũng làm đổi thứ tự liệt kê: nhu cầu nêu đúng
    khoá đứng trước nhu cầu chỉ chứa các chữ.
- **Bài kiểm.** Hai tệp mới, 35 bài, không mạng, không mô hình, mỗi bài một sổ lõi riêng. Không bài cũ nào phải đổi lời.
- **Bài soát độc lập trước khi commit** (một tác tử không biết kết luận của phiên dựng) tìm ra hai lỗi thật, đã sửa
  kèm bài kiểm: sổ nhập kho mất hay hỏng làm báo cáo trong lõi bị ghi rỗng mà không ai được báo (điểm 6); và lời gọi
  `core --promote` in ra đặt tên repo hỏi trong nháy kép, nên một thư mục tên `a$(…)b` sẽ chạy lệnh khi chủ của họ dán
  lời gọi ấy (điểm 17). Bốn điểm nhỏ cũng đã sửa: báo cáo không được ghi khi dòng thành viên không ghi được; lời «việc
  còn lại» của bước rời họ không còn bị ghi đè; thư mục lõi không có thì bị từ chối bằng lời rõ; dòng lấy từ lõi không
  nêu khối nào và dòng thứ hai cho một nhu cầu được nêu tên khi bị bỏ ra. Để nguyên, có nêu: gốc của tệp báo cáo vẫn mở
  như quyết định 0113 viết, chỉ từng mục của `needs` là đóng.
- **Giới hạn.** Đóng `core-block-store-filled-by-no-command` và `core-second-use-not-counted`. Sửa lời
  `core-leave-core-line-by-hand` (báo cáo cũng ở lại khi lõi ngoài tầm) và
  `core-copy-holds-code-the-repository-tools-walk` (bản chép nay giữ cả báo cáo). Mở mười giới hạn:
  `core-report-told-only-by-a-move`, `core-family-needs-known-as-of-the-pin`, `core-graduation-matches-keys-and-words`,
  `core-member-is-a-repository-not-a-package` (bốn dòng mức vừa), `core-graduation-adapters-unknown-before-promotion`,
  `core-report-row-needs-a-description`, `core-graduation-kind-unknown-to-the-plugin-before`,
  `core-first-repository-is-told-nothing`, `core-granted-graduation-is-owed-until-promoted`,
  `core-used-by-is-never-shortened` (sáu dòng mức thấp).
- **Kế hoạch.** Mục 7.2 xong: cả bảy tiêu chí của nó (10 đến 13, 21, 23, 24) đã dựng. Mục 7.4 xong, việc của nó đã ở
  main. Giai đoạn 7 vẫn mở: mục 7.3, lượt thử có người, là việc chủ repo bắt đầu.
- **Chưa dựng:** `intake` tự ghi báo cáo; báo cáo riêng cho từng gói của một workspace; repo đầu nghe tin của lõi khi
  chưa khai họ; đề xuất nâng hạng cho một nhu cầu hai repo đặt hai khoá khác nhau; gỡ một tên khỏi `used_by`; chuyển
  sang họ khác trong một bước, giải tán và đổi tên một họ (ngoài phạm vi đề bài).
