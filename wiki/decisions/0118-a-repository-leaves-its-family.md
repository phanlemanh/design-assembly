---
type: decision
title: "Repo rời họ: lời khai và bản chép được gỡ, lời đáp thừa hưởng thành của riêng repo kèm nơi nó từng đến"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0112-the-plugin-builds-the-family-core.md
  - wiki/decisions/0113-the-core-shape-and-the-command-that-builds-it.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - wiki/decisions/0115-the-family-owner-changes-an-answer-of-the-core.md
sources:
  - plugins/design-assembly/scripts/core-leave.mjs
  - plugins/design-assembly/scripts/core-leave-call.mjs
  - plugins/design-assembly/scripts/core.mjs
  - plugins/design-assembly/scripts/core-join.mjs
  - plugins/design-assembly/scripts/core-list.mjs
  - plugins/design-assembly/scripts/core-marks.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/core/SKILL.md
  - plugins/design-assembly/tests/test-core-leave.mjs
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở ba lát» cho câu «Mở ba phiên song song: 7.1 lát 3, 7.2 lát 1 và nửa «rời họ»?»"
  - "repo kiểm chứng ở 1ea13196, chép hai lần bằng git archive vào thư mục tạm, chỉ đọc repo thật"
---

# 0118 Repo rời họ

## Status

Accepted, 2026-11-25, plugin 0.63.0. Nửa sau lát 4 của mục 7.1 (tiêu chí 25 của đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md)), dựng theo lời chủ repo («Mở ba lát»), song song
với lát 3 của mục 7.1 và lát 1 của mục 7.2 trên hai nhánh khác. Lát này đổi hợp đồng sổ (dấu của một lời đáp từng thừa
hưởng ở sổ quyết định và ở bản thiết kế, điều sổ lõi trên máy ghi cho một repo đã rời họ, dòng thành viên bị gỡ khỏi
lõi) nên cần người duyệt trước khi gộp.

## Context

Tiêu chí 25 nói: lệnh gỡ dòng khai và bản chép của lõi; mỗi lời đáp thừa hưởng thành lời đáp của riêng repo, kèm ghi
chú nơi nó từng đến; sau lệnh, cổng xanh và repo hành xử như một repo đứng một mình; danh sách thành viên của lõi chỉ
được sửa khi thư mục lõi với tới được, và lệnh in trước nó sẽ ghi gì; không với tới được thì lệnh nói việc còn lại.

Lát 2 (quyết định [0114](0114-a-repository-joins-its-family-and-inherits.md)) ghi bảy thứ khi một repo vào họ: lời khai
`design/sources/core.json`; bản chép của lõi trong `design/core`; dấu ở đầu ghi chú của từng dòng sổ quyết định mà lõi
đáp, và dòng thêm cho lời đáp sổ còn thiếu; `inherited` và `changed` ở bản thiết kế; phép kiểm `family-core` của cổng;
câu hỏi `core-<id>-<pin>` trên hàng chờ; dòng thành viên trong `core.json` của lõi; và một dòng ở sổ lõi trên máy. Rời họ
gỡ lần lượt từng thứ ấy. Đề bài để ngỏ: tên cờ; chữ của dấu; ngoại lệ và câu mặc định đã đổi thành gì; lý do rời ghi ở
đâu; câu hỏi đã đáp thì sao; lõi nào là lõi của repo khi lời khai không ghi đường dẫn; sổ trên máy ghi gì; bản chép hỏng
thì sao. Mỗi điều được chốt dưới đây.

## Decision

1. **Một bước của lệnh `core`:** `core --leave --by <tên> --why <lý do> [--core <thư mục>] [--on <ngày>] [--dry-run]
[--json]`. Mã ở hai tệp mới (`scripts/core-leave.mjs` là bước, `scripts/core-leave-call.mjs` là lời gọi và chữ in);
   `scripts/core.mjs` chỉ thêm cờ và chỗ rẽ. `--by` và `--why` bắt buộc; địa chỉ thư trong một trong hai là lời gọi sai.
   Lệnh không so `--by` với người đã khai họ: ai được cho repo rời họ là việc của lối soát của chính repo.
2. **Không giá trị nào đổi.** Lệnh chỉ đổi dấu và gỡ tệp của lõi. Tệp kiểu dáng, sổ token, bề rộng và lựa chọn của bản
   thiết kế giữ nguyên từng byte; bài kiểm so repo sau khi rời với chính nó trước khi vào họ.
3. **Chữ của dấu ở sổ quyết định.** Ghi chú của mỗi dòng từng mang dấu của lõi bắt đầu bằng

   `own since <ngày>, when the repository left its family: <lý do> (by <tên>), once <dấu dòng ấy từng mang>`

   trong đó phần sau `once` là dấu cũ, giữ nguyên từng chữ: `inherited from the family core at <pin>`, `changed from the
family core at <pin>: <vì sao> (by <tên> on <ngày>)` hay `kept against the family core at <pin>: <vì sao> (by <tên>
on <ngày>)`. Dấu nêu mã ghim, không bao giờ nêu tên họ. Phần còn lại của ghi chú theo sau `; ` như cũ; dấu `answered
by <người> on <ngày>` mà lúc vào họ thêm cho một dòng `judgment` ở lại, nên cổng vẫn đọc dòng ấy là lời đáp của người.

4. **Lý do rời nằm trong dấu của từng dòng** (và trong `own` của bản thiết kế), không ở tệp nào khác: lời khai bị gỡ,
   và một tệp mới trong `design/` sẽ làm repo khác một repo đứng một mình. Cái giá: cùng một lý do lặp lại ở mỗi dòng.
   Dấu ngoặc kép và dấu gạch chéo ngược trong lý do được thay, vì ghi chú của sổ không giữ được chúng.
5. **Ngoại lệ (`kept against`) và câu mặc định đã đổi (`changed from`) mất nghĩa**, vì repo không còn thuộc họ nào: lời
   đáp đơn giản là của riêng repo, như nó vốn thế. Dấu của chúng theo cùng một cách (`own since …, once kept against …`),
   và lý do người đã đưa ở lại nguyên chữ, vì đó vẫn là lý do dòng ấy mang giá trị ấy.
6. **Dòng lúc vào họ thêm vì sổ còn thiếu ở lại**, là của riêng repo, mang dấu trên. Dòng mà `source` là
   `design/sources/core.json` (giá trị chỉ bản chép giữ) được ghi giá trị ấy vào `source`, để giá trị không mất theo
   bản chép.
7. **Lệnh đi theo dấu, không theo bản chép.** Mọi dòng mang dấu của lõi, ở bất kỳ mã ghim nào, đều được đổi; bản chép
   chỉ cho lệnh biết giá trị của dòng ở điểm 6 và ai đã chốt một lựa chọn của bản thiết kế. Nhờ vậy **bản chép không đọc
   được (lệch mã băm) không chặn việc rời họ**: lệnh làm từ lời khai và các dấu, và nói vậy. Khi ấy giá trị ở điểm 6 không
   được lấy từ bản chép hỏng: `source` ghi rằng giá trị không giữ được, và lệnh nêu dòng ấy để người chốt lại. Lời khai
   không phải JSON thì họ không rõ: repo vẫn rời, và dòng thành viên chỉ gỡ được khi lời gọi nêu `--core`.
8. **Bản thiết kế.** `inherited` và `changed` của mỗi tầng được gỡ, thay bằng `own`, theo khoá lựa chọn:
   `{ since, by, why, once }`, kèm `pin` và `hold` khi `once` là `inherited`, kèm `pin` và `changed` (lý do cũ: `why`,
   `by`, `on`) khi `once` là `changed`. Lựa chọn từng thừa hưởng vẫn là lời đáp của người: ở tầng không phải của chủ repo
   trọn tầng, khoá ấy vào `confirmed` và `answered` ghi người đã chốt (chủ của họ, như lõi ghi; bản chép hỏng thì người
   cho rời họ). Thiếu điều này, lần dựng kế của lối dẫn dắt sẽ ghi lại lựa chọn ấy thành đề xuất chưa ai xác nhận.
9. **Lối dẫn dắt giữ dấu.** `apply` viết lại nguyên dòng nó dựng từ bản thiết kế; nay nó đặt lại dấu «rời họ» cho dòng
   từng mang (`keepLeftMarks` ở `scripts/core-marks.mjs`, một dòng gọi trong `scripts/apply.mjs`). `adopt` không viết lại
   dòng đã có, và `decide` giữ phần còn lại của ghi chú, nên hai lệnh ấy không cần đổi.
10. **Cổng và hàng chờ.** Phép kiểm `family-core` được gỡ khỏi dòng `ledger-shapes` của `design/theme.json`; công cụ cũ
    hơn phép kiểm ấy thì không có gì để gỡ. Mọi câu hỏi về lõi **còn chờ** (`core-<id>-<pin>`, bất kỳ mã ghim nào) bị gỡ
    khỏi hàng chờ, từng câu được nêu tên: một tệp mỗi câu ở dạng thư mục, một dòng mỗi câu ở dạng tệp chung. Câu **đã
    đáp** ở lại, là bản ghi lời chủ repo đã nói. Hàng chờ không đọc được thì lệnh dừng với mã 2 và không ghi gì, như mọi
    lệnh chạm hàng chờ.
11. **Tệp bị gỡ.** Lời khai, và trong `design/core` chỉ những tệp bản ghim liệt kê cùng ba phần của một bản chép; tệp
    nào khác ai đó đặt ở đó thì ở lại và được nêu. Thư mục rỗng sau khi gỡ (`design/core`, `design/sources`,
    `design/waiting`, cả `design` nếu repo chưa có sổ) được dọn. `--dry-run` in từng tệp sẽ đổi hay bị gỡ và không ghi gì.
12. **Lõi nào là lõi của repo.** Lời khai không ghi đường dẫn của lõi. Lệnh lấy thư mục `--core` nêu; không thì lấy lõi
    duy nhất của họ ấy trong sổ lõi trên máy có nêu repo trong `members`. Hai lõi cùng nêu repo thì lệnh từ chối và bảo
    nêu `--core`: không đoán giữa hai. `--core` trỏ tới lõi của họ khác là lời gọi sai. Lõi không nêu repo thì không có
    gì để gỡ, và lệnh nói vậy.
13. **Danh sách thành viên của lõi chỉ đổi khi với tới được.** Lệnh in đúng dòng nó sẽ gỡ khỏi `core.json` của lõi
    (bản xem trước in mà không ghi; lời gọi thật in kèm đã ghi hay vì sao không). Thư mục không có, sổ trên máy vắng hay
    hỏng, lõi có hình dạng mới hơn, lõi không giữ hình dạng, hay không ghi được: **repo vẫn rời**, lõi để nguyên, lệnh
    nói việc còn lại ở lõi (gỡ dòng ấy bằng tay, rồi `core --check`) và thoát 1. Lệnh không commit gì ở lõi.
14. **Sổ lõi trên máy** ghi repo vào `declined` theo thư mục chính, kèm ngày và `how: "left"`: repo không bị hỏi ngay
    «cùng họ với X?» về chính họ nó vừa rời, và `core --ask` nói repo đã rời họ ngày nào. Dòng của lõi ở lại. Sổ chưa có
    thì được tạo, như `--decline`; sổ không đọc được thì không bao giờ bị ghi, repo vẫn rời và lệnh nói vậy.
15. **Mã thoát.** 0 khi repo đã rời (hay sẽ rời) và không còn gì phải làm, và khi repo không thuộc họ nào: nó được báo
    vậy, không gì được ghi, kể cả sổ trên máy (rời hai lần là ca này). 1 khi repo đã rời mà dòng của nó còn trong lõi. 2
    cho lời gọi sai hay repo không đọc được; khi ấy không gì được ghi. Một thư viện ai đó đặt tên `core` trong sổ nguồn
    ngoài không phải họ, và không bị gỡ.
16. **Vào họ lại.** Lời từ chối khi khai họ thứ hai nay chỉ sang bước này («leave the one it is of first, with core
    --leave»). Repo đã rời vào lại được, cùng họ hay họ khác: `withCoreMark` ghi dấu mới vào chỗ dấu «rời họ» (hợp đồng
    đọc dấu ấy là «không có dấu của lõi»); dòng lõi mới không đáp, hay đáp khác, giữ dấu «rời họ»; `--inherit` gỡ mục
    `own` của lựa chọn được thừa hưởng lại. Ngoại lệ cũ không tự sống lại.
17. **Bản xuất.** Lệnh nói khi `DESIGN.md` và `design/export/system` tụt lại sau sổ, bằng `exportsBehind` của lát 2
    (tệp bị gỡ được đọc là vắng), và không viết bản xuất nào.
18. **Thư mục làm việc riêng.** Tên repo và dòng ở sổ trên máy lấy theo thư mục chính (`homeOf`); tệp được đổi là tệp
    của thư mục đang đứng. Bản xem trước in như nhau từ hai nơi.
19. **Bảng năng lực không thêm ổ**: thêm một lối `core-leave` (`scripts/core-leave.mjs` qua ổ `decision` và
    `reference`), vì bước ấy ghi sổ quyết định, bản thiết kế và sổ nguồn ngoài.

### «Như một repo đứng một mình» nghĩa là gì ở bài kiểm

Repo đã rời giữ mọi lời đáp nó từng thừa hưởng, nên bản song sinh công bằng là một repo chưa từng vào họ **và tự giữ
cùng những lời đáp ấy**. Bài kiểm dựng hai cặp (repo được nhận; repo do lối dẫn dắt dựng, chủ của bản song sinh tự xác
nhận màu gốc và thang chữ), cho một bên vào họ rồi rời, và đòi `status`, `audit`, `find`, `inventory`, `adopt`, lối dẫn
dắt và cổng in giống hệt nhau, cùng mã thoát; sổ quyết định giống từng dòng trừ dấu, bản thiết kế giống trừ `own`. Hai
khác biệt có chủ đích, kiểm ở bài khác: dòng lúc vào họ thêm thì ở lại (nên repo không bị hỏi lại câu ấy), và dấu
`answered by` ở lại.

### Trên mọi loại repo

| Repo                                   | Lệnh làm gì                                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Chưa có sổ (có và không có Makefile)   | Gỡ lời khai, bản chép và câu hỏi chờ; repo trở lại đúng từng tệp như trước khi vào họ                |
| Được nhận                              | Đổi dấu từng dòng; gỡ phép kiểm; cổng xanh                                                           |
| Do lối dẫn dắt dựng                    | Thêm: `own` ở bản thiết kế, `confirmed` và `answered`; lần dựng kế giữ dấu và không hỏi thêm câu nào |
| Công cụ cũ hơn phép kiểm `family-core` | Không có phép kiểm để gỡ, lệnh nói vậy; cổng cũ ra đúng như trước khi vào họ                         |
| Không thuộc họ nào                     | Được báo vậy, thoát 0, không ghi gì                                                                  |
| Gọi từ một worktree                    | Cùng chữ in ra; sổ trên máy ghi theo thư mục chính                                                   |

## Consequences

- Hợp đồng sổ đổi, cần người duyệt, năm đoạn của `plugins/design-assembly/references/contract.md`: đoạn «Once the
  repository left its family» ở mục sổ quyết định (dấu của lời đáp từng thừa hưởng); đoạn `own` ở mục bản thiết kế; câu
  về `core --leave` ở đoạn loại `core` của sổ nguồn ngoài; câu «The command that leaves takes the repository's line out
  of `members`» ở mục lõi; đoạn `how: "left"` ở mục sổ lõi trên máy. `contract.mjs` thêm `leftMarkOf` và `leftMarkText`;
  `coreMarkOf` đọc dấu «rời họ» là không có dấu của lõi, và `withCoreMark` giữ dấu ấy khi không có dấu mới để ghi. Sổ
  viết trước vẫn đọc như cũ.
- Lượt thử trên hai bản sao của repo kiểm chứng (`git archive` của 1ea13196, chỉ đọc repo thật; sổ lõi riêng của lượt
  thử): lõi dựng từ bản sao thứ nhất với chín câu khoá và ba câu mặc định; bản sao thứ hai vào họ trên một nhánh rồi rời.
  Mười hai dòng được đổi dấu, không dòng nào thêm; công cụ 0.36.1 của bản sao cũ hơn phép kiểm nên không có gì để gỡ;
  `design/theme.json` giống từng byte trước khi vào họ; cổng của bản sao giữ đúng mười lỗi sẵn có (môi trường: không cài
  gói) trước khi vào, sau khi vào và sau khi rời; `status` in giống hệt trước khi vào họ; `core.json` của lõi trở lại
  `members` rỗng và `core --check` giữ; rời lần hai được báo «of no family» và không ghi gì. So với nhánh `main` của bản
  sao, chỉ `design/decisions.yaml` khác.
- Đóng giới hạn `core-leaving-not-built`. Mở năm giới hạn, đều giữ: `core-leave-core-line-by-hand` (lõi không với tới
  thì dòng thành viên ở lại và không lệnh nào gỡ sau đó), `core-leave-answered-questions-stay`,
  `core-leave-starts-anew-on-joining-again` (không lệnh nào hoàn tác việc rời; sang họ khác là hai bước; lời khai bị xoá
  tay thì lệnh không dọn), `core-leave-lone-value-of-a-broken-copy`, `core-family-not-dissolved`.
- Một điều thấy trong lúc dựng, không thuộc lát này và chưa sửa: `core --inherit` báo một câu mặc định bị đổi «say why
  under changed.<key>» và thoát 1 cả khi bản thiết kế đã ghi lý do ở đúng chỗ ấy.
- Chưa dựng: báo thành viên khi lõi đổi, móc lúc mở phiên, đẩy lõi lên đâu (lát 3); khối của lõi (mục 7.2); sang họ
  khác trong một bước, giải tán một họ (đề bài để ngoài phạm vi).
