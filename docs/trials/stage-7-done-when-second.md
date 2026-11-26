# Dòng «done when» của giai đoạn 7: lượt thử thứ hai, sau mục 7.5

Chạy ngày 2026-11-26, cho mục 7.3 của kế hoạch và tiêu chí 16 của đề bài
[0016](../../wiki/specs/0016-the-family-core-is-born-through-the-plugin.md). Dòng «done when» của giai đoạn: «Repo thứ
hai không bị hỏi lại câu đã trả lời, và dùng lại ít nhất một khối». Lượt này chạy lại
[lượt thử đầu](stage-7-done-when.md) theo đúng cách của nó, trên plugin đã có mục 7.5 (quyết định
[0122](../../wiki/decisions/0122-the-family-question-first-and-the-core-question-on-the-first-adopt.md)). Câu hỏi chót
của phiên điều phối, nguyên văn: «Anh cho chạy lượt thử lại («Cho chạy»), hay chưa («Chưa chạy»)?». Chủ repo đáp: «Cho
chạy».

Kết luận: cả bốn vế đạt. Repo thứ hai không bị hỏi lại câu nào lõi đã đáp. Câu màu gốc nằm ở mục «held back until the
family question is answered» của bản xem trước đầu, không ở `needs a person`. Đóng giai đoạn là việc của chủ repo; trang
này không đóng gì và không đổi kế hoạch.

## Chạy trên gì

- **Plugin:** 0.69.0, từ thư mục làm việc của nhánh `claude/stage-7-second-trial-606031` ở `c9b0bbe` (nhánh chính sau PR
  154). Script gọi thẳng từ `plugins/design-assembly/scripts/`.
- **Sản phẩm đầu, Inventory** (`onehub-inventory`), nhánh chính ở `1ea13196`. Bản sao mới bằng `git archive HEAD` vào
  thư mục nháp của phiên, một `git init` riêng, một commit gốc (`18d73ef`). Thư mục bản sao giữ tên `onehub-inventory`.
- **Sản phẩm thứ hai, CRM** (`crm`), ở `4aebb767d`. Bản sao mới cùng cách (`3c9d748`). Gói giữ màn là `apps/app`.
  `node_modules` của CRM ở gốc, ở `apps/app` và ở `packages/ui` được nối vào bằng liên kết, ghi trong
  `.git/info/exclude` của bản sao. Không cài gì.
- **Lõi** nằm trong thư mục nháp của phiên. Mọi lệnh của lõi chạy với `DESIGN_ASSEMBLY_CORES` trỏ vào một tệp trong thư
  mục nháp. Không tạo repo GitHub, không gửi gì đi đâu.
- **Người:** lượt này không hỏi chủ câu mới nào. Mọi lời đáp là lời đáp của lượt đầu, dùng lại (mục «Các câu đã hỏi»).
- **Repo thứ hai do một tác tử mới đưa vào.** Tác tử ấy chưa thấy bản ghi lượt đầu, cũng chưa thấy các phát hiện của mục
  7.5. Nó chỉ nhận: đường dẫn của gói, của lõi, các skill của plugin, nhu cầu bằng lời thường («chữ dài bị cắt trong một
  ô của bảng, đọc được đủ khi rê chuột») và một luật. Luật là: không trả lời câu nào của người, chỉ ghi lại; riêng câu
  «cùng họ?» thì được chuyển lời đáp «có» của chủ rồi đi tiếp như skill nói. Nó chạy một lượt, không chết giữa chừng, tốn
  152 563 token, 28 lần gọi công cụ.

| Vế của tiêu chí 16                               | Kết quả                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------- |
| Repo thứ hai không bị hỏi lại câu nào lõi đã đáp | Đạt: 0 câu bị hỏi lại; màu gốc bị giữ lại tới khi câu «cùng họ?» được đáp |
| Dùng lại ít nhất một khối lấy từ lõi qua thang   | Đạt: `TruncatedText`, qua find → intake → take → dòng sổ, dùng ở một màn  |
| Cổng của repo thứ hai xanh                       | Đạt: `bun run design:check` thoát 0, không dòng đỏ                        |
| Số lần quyết thay người bằng 0                   | Đạt: 0; lần báo lõi (`core --report`) không chạy vì chủ chưa được hỏi nó  |

## Vế 1: hỏi lại

Đếm từng câu tác tử gặp, đối chiếu với `answers.json` của lõi (9 câu khoá, 3 câu mặc định):

- **(a) Lõi đã đáp, bị hỏi lại: 0.**
- **(b) Lõi không đáp, hay là khác biệt riêng của gói: 3.**
  - Màu gốc khác màu lõi khoá: theo lõi hay giữ ngoại lệ. Câu `core-source-color-43ee899f6031`, hiện trong bản xem trước
    của `adopt` sau khi gói vào họ, nguyên văn: «--primary is #006b4f in ../../packages/ui/src/styles/globals.css, and
    the family core this repository pinned locks #0246ff: follow the core, or keep this colour as an exception with its
    reason». Lõi đáp màu là `#0246ff`, nhưng không đáp được việc CRM có giữ màu riêng hay không. Lượt đầu cũng đếm đúng
    câu này vào (b). Tác tử thì đọc nó là một lời hứa bị phá; xem điều tìm thấy mới số 1.
  - Có thêm `design/core` vào danh sách bỏ qua của lint và kiểm kiểu không. Lệnh `core --join` in: «Keep this
    repository's formatter, lint and type check off design/core … No ignore line was written».
  - Khối nào đáp nhu cầu `chu-dai-cat-gon`: câu `intake-chu-dai-cat-gon`, nguyên văn «Which block answers the need
    chu-dai-cat-gon?», khuyến nghị «TruncatedText, from the family's core».
- **(c) Câu riêng của lối nhận, không lõi nào đáp được: 8.**
  - Ba câu cắm: `plug-reference`, `plug-screen-build`, `plug-design-review`, mỗi câu một tệp trong `design/waiting/`.
  - «Is this repository of the same family as OneHub (…)? Say which, or that it is of none.» Đứng đầu `needs a person`.
  - Mức tuân thủ (`conformance-level`).
  - Loại sản phẩm (`product-type`).
  - Tên người ghi sổ (`--by`).
  - Đồng ý cho gói vào họ sau khi xem bản xem trước (skill
    [`core`](../../plugins/design-assembly/skills/core/SKILL.md), mục 7 bước 1 và 2). Lời đáp «có» cho câu «cùng họ?» đã
    gồm việc này, như lượt đầu ghi.

Trong 11 câu tác tử gặp: 0 câu (a), 3 câu (b), 8 câu (c). Lượt đầu là 1, 3, 7. Tác tử lần này đi xa hơn: nó vào họ, nên
gặp thêm câu đồng ý vào họ và câu danh sách bỏ qua.

**Dòng giữ lại: 1.** Bản xem trước đầu (`adopt.mjs --target apps/app --dry-run`, thoát 1) in, nguyên văn:

- «held back until the family question is answered (put that one question to the person first, alone, then run this
  again):»
- «source-color: the family core OneHub answers it (locked): not asked if this repository joins that family, asked as
  before if it joins none»

Dòng ấy nêu đúng một lời đáp: `source-color`, khoá. Mức tuân thủ và loại sản phẩm không bị giữ lại, vì lõi không đáp hai
câu ấy.

Lệnh chứng:

- Bản xem trước đầu, trước khi vào họ: `needs a person` có `family`, `conformance-level`, `product-type`, theo thứ tự ấy.
  Câu «If that is the decided brand colour…» của lượt đầu không còn.
- `core.mjs --target apps/app --join --core … --by …` thoát 0. Gói chưa có sổ nên 12 câu đều «inherited», không ghi câu
  hỏi nào.
- Bản xem trước sau khi vào họ: `needs a person` có `conformance-level`, câu (b) về màu gốc, `product-type`.
- Cuối lượt, `adopt.mjs --dry-run` thoát 0, mục `needs a person` rỗng. Câu thứ ba có điều kiện của tờ thành viên («nếu
  adopt vẫn hỏi `#006b4f` có phải màu đã chốt») không phải dùng.

## Vế 2: một khối qua thang

Chủ của họ chọn khối `TruncatedText` (nhu cầu `chu-dai-cat-gon`) và đưa nó lên lõi, như ở lượt đầu. Gói CRM có nhu cầu
này thật, đang làm tay ở `app/(app)/[slug]/companies/companies-table.tsx` dòng 100 và nhiều chỗ khác.

| Bước                                                                | Lệnh                                                                                   | Thoát |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----- |
| Dựng lõi OneHub từ bản sao Inventory, 9 khoá, 3 mặc định            | `core.mjs --build --target onehub-inventory --family OneHub --core … --by …`           | 0     |
| Đưa khối lên lõi, «no second use yet»                               | `core.mjs --target onehub-inventory --promote chu-dai-cat-gon --core … --by … --why …` | 0     |
| Kiểm lõi: «its shape holds (shape 2)»                               | `core.mjs --check --core …`                                                            | 0     |
| Gói vào họ, ghim `43ee899f6031`, bản chép giữ tệp của khối (tác tử) | `core.mjs --target apps/app --join --core … --by …`                                    | 0     |
| Thang tìm thấy khối của lõi, nhưng chỉ bằng chữ tiếng Anh (tác tử)  | `find.mjs truncated text --target apps/app`                                            | 0     |
| Intake đề nghị khối của lõi, ghi câu hỏi (tác tử)                   | `intake.mjs --need chu-dai-cat-gon truncated text --target apps/app`                   | 1     |
| Chủ giữ khuyến nghị, lời đáp dùng lại                               | `decide.mjs --answers … --by …`                                                        | 0     |
| Lấy khối xuống `components/truncated-text.tsx`, mở hồ sơ chuẩn hoá  | `core.mjs --target apps/app --take chu-dai-cat-gon`                                    | 0     |
| Ghi dòng sổ nhập kho                                                | `intake.mjs --need chu-dai-cat-gon --file components/truncated-text.tsx`               | 0     |

Dòng sổ ở `apps/app/design/intake.yaml` ghi `from: core`, `pin: 43ee899f6031`, `approved_by: Phan Le Manh`, ngày
2026-11-26, và `taken: 516f0c2b…`.

Mã băm SHA-256 của tệp là `516f0c2b71f6a565…40064619` ở cả ba chỗ:

- tệp trong gói, `apps/app/components/truncated-text.tsx`;
- tệp trong kho của lõi, `blocks/chu-dai-cat-gon/truncated-text.tsx`;
- tệp trong bản chép `apps/app/design/core/blocks/chu-dai-cat-gon/`.

`design/sources/core.json` ghim tệp ấy với cùng mã băm.

Theo lời chủ (câu 8 của tờ thành viên), chỗ làm tay ở `companies-table.tsx` dòng 100 được thay bằng
`<TruncatedText text={nganh.ten} />`, chỉ một chỗ ấy, trên bản sao. Thay đổi giống hệt lượt đầu.

`core.mjs --check` thoát 0 sau khi đưa khối lên lõi, và thoát 0 lần nữa ở cuối lượt.

Lượt này không chạy `core --report`, nên kho của lõi vẫn ghi «no second use yet» cho khối và chưa có `members/crm.json`.
Bản xem trước (`core --report --dry-run`, thoát 0) nói lệnh sẽ ghi «a second use» và in cả tệp báo cáo. Lý do không
chạy: skill bảo đưa người xem trước khi ghi, và tờ của chủ không có câu này. Vế 2 không cần báo lõi: khối đã được lấy qua
thang và dùng ở một màn.

## Vế 3: cổng

Trong `apps/app` của bản sao, `bun run design:check` thoát 0:

- «9 decisions held by 13 checks, each seen failing on a changed copy»;
- hai dòng `debt` cho `decision-sheet` và `owner-calls`: nhánh chính chưa có sổ quyết định;
- không dòng đỏ nào.

Ngay sau lần `adopt` đầu, trước khi ghi ngoại lệ màu, cùng lệnh thoát 1 với đúng một dòng đỏ. Dòng ấy nêu câu hỏi đang
chờ: «ledger-shapes: source-color: design/tokens.json holds #006b4f, and the family core this repository pinned locks
#0246ff (pin 43ee899f6031) with no exception recorded: the question core-source-color-43ee899f6031 waits on the decision
sheet (decide): follow the core, or keep it as an exception with its reason, then core --settle». Lần này tờ quyết định
có câu ấy ngay lúc dòng đỏ hiện.

Ngoài cổng, ba điều không đỏ nhưng cần biết, như lượt đầu:

- `status` thoát 1: «2 decisions are failing or bypassed (type-scale, spacing)».
- Về câu khoá: «0 held by a check here, 8 inherited and not held, 1 kept against the core as exceptions».
- Lint của chính CRM (biome) đỏ trên tệp khối lấy về: điều tìm thấy 9.

## Vế 4: quyết thay người

Mọi lựa chọn của người là lời đáp của chủ ở lượt đầu, dùng lại theo lời «Cho chạy». Không câu nào ngoài các tờ ấy được
đáp. Tên người ghi sổ là `Phan Le Manh`, lấy từ `git config user.name` của kho này.

Những việc máy làm không hỏi, và vì sao không tính là quyết thay:

- **Tác tử cho gói vào họ** (`core --join`) sau khi chuyển lời «có». Câu 1 của tờ thành viên là lời đồng ý vào họ.
- **Khoá nhu cầu `chu-dai-cat-gon`** do tác tử đặt theo khoá của lõi. Câu 7 của tờ thành viên nêu khoá này.
- **Hai phép dò** trên bản sao riêng (`probe/`), chỉ bằng `--dry-run`, để xem điều tìm thấy 3 và 4 còn không. Không ghi
  gì.
- **Tác tử chỉ đưa cho `plugs.mjs` một phần tên skill và máy chủ của phiên** (6 skill, 4 máy chủ), không phải tất cả như
  skill nói, để đỡ token. Ba câu cắm vẫn ra cùng khuyến nghị như lượt đầu, và chủ giữ khuyến nghị.

## Các câu đã hỏi, ai đáp

Lượt này không hỏi chủ câu mới. Mọi lời đáp dưới đây là **lời đáp của lượt đầu, dùng lại**. Chủ repo đáp «Duyệt cả tờ»
cho cả hai tờ, ngày 2026-11-26; lời câu hỏi chót của mỗi tờ nằm ở [bản ghi lượt đầu](stage-7-done-when.md).

**Tờ của chủ của họ** (dùng lại):

| #   | Câu                                | Lời đáp, dùng lại                                                                                                                                     |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tên họ                             | OneHub                                                                                                                                                |
| 2   | Câu khoá                           | source-color, record-panel, edit-in-cell, undo-or-confirm, feedback-by-delay, state-matrix, notification-channel, read-only-cell, empty-state-actions |
| 2b  | Giá trị của cách mở hồ sơ          | `over`                                                                                                                                                |
| 3   | Câu mặc định                       | table-density; type-scale-values = `standard`; test-screen-sizes = `360,414,1024,1440`; ba luật riêng của Inventory để ngoài                          |
| 4   | Lõi nằm ở đâu                      | thư mục trong thư mục nháp của phiên                                                                                                                  |
| 5   | Khối đưa lên lõi                   | `TruncatedText`; lý do: «Cả hai sản phẩm đều cắt chữ dài trong ô bảng; CRM đang làm tay ở hàng chục chỗ, nên dùng chung một khối.»                    |
| 6   | Ghi `values: { by-hand: tao-tay }` | có, chỉ vào `design/intake/_shared.yaml` của bản sao Inventory                                                                                        |

Bản đọc của `core.mjs --target onehub-inventory` trên 0.69.0 in đúng tờ của lượt đầu, chỉ khác mã commit của bản sao.

**Tờ của thành viên** (dùng lại):

| #   | Câu                                          | Lời đáp, dùng lại                                                                                             | Dùng ở lượt này             |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Gói `apps/app` cùng họ OneHub?               | có                                                                                                            | tác tử chuyển lời           |
| 2   | Màu gốc khác lõi                             | giữ ngoại lệ; lý do: «CRM giữ màu xanh lá #006b4f của thương hiệu CRM; hai sản phẩm phân biệt nhau bằng màu.» | `core --settle --why`       |
| 3   | Nếu vẫn bị hỏi: `#006b4f` là màu đã chốt?    | có                                                                                                            | không phải dùng             |
| 4   | Mức tuân thủ                                 | AA                                                                                                            | `adopt --conformance-level` |
| 5   | Loại sản phẩm                                | `application`                                                                                                 | `adopt --product-type`      |
| 6   | Ba câu cắm                                   | tham khảo `none`, dựng màn `rules-page`, duyệt thiết kế `review`                                              | `decide --answers`          |
| 7   | Khối cho nhu cầu                             | `TruncatedText` của lõi, lấy qua `core --take`                                                                | `decide --answers`          |
| 8   | Thay chỗ làm tay ở `companies-table.tsx:100` | có, một chỗ                                                                                                   | sửa trên bản sao            |
| 9   | Thêm `design/core` vào danh sách bỏ qua lint | không                                                                                                         | không thêm gì               |

## Mười bốn điều tìm thấy của lượt đầu, lần này

1. **Đã sửa.** Bản xem trước đầu không hỏi màu gốc. Màu gốc nằm ở mục giữ lại, câu «cùng họ?» đứng đầu `needs a person`.
   Việc người được hỏi câu «cùng họ?» một mình, trước, vẫn chỉ do skill nói, không phép kiểm nào giữ (dòng
   `adopt-family-first-rests-on-the-skill` của [`limits.json`](../../plugins/design-assembly/references/limits.json),
   còn mở). Tác tử làm đúng thứ tự ấy.
2. **Đã sửa.** Chỉ một lần `core --join`. Lần `adopt` thật đầu tiên ghi `design/waiting/core-source-color-43ee899f6031.json`
   trong cùng lượt và in «The question is put on the decision sheet with the files below». Bản xem trước sau đó in «The
   question waits on the decision sheet (core-source-color-43ee899f6031)», đúng với tệp đang có. Dòng
   `adopt-asks-the-core-question-for-a-value-its-ledgers-hold` (lượt không đặt tệp token thì không hỏi) còn mở; lượt này
   không gặp nó.
3. **Còn mở** (`core-promote-needs-the-by-hand-word-declared`). Trên một bản sao Inventory mới chưa ghi dòng `values`,
   `core --promote --dry-run` thoát 2: «the intake ledger does not say tao-tay is its word for made by hand». Lượt thử lại
   ghi tay dòng ấy theo lời chủ.
4. **Còn mở** (`core-first-repository-known-by-its-folder-name`). Bản sao đặt trong thư mục `inventory-renamed` bị từ
   chối, thoát 2: «inventory-renamed is neither the first repository of the family OneHub nor one of its members».
5. **Còn mở** (`core-join-preview-needs-a-name`). `core --join --dry-run` không có `--by` thoát 2: «say who said so, with
   --by NAME».
6. **Còn mở** (`font-package-read-where-installed`). `font-loaded` vẫn nói `tw-animate-css`, `shadcn` «are not installed
   here», dù hai gói ấy có trong `packages/ui/node_modules` của bản sao.
7. **Còn mở** (`intake-preview-does-not-print-the-question`). `intake --dry-run` chỉ nêu tệp sẽ ghi và câu «next», không
   in lời câu «Which block answers the need chu-dai-cat-gon?».
8. **Còn mở, lần này rõ hơn** (`find-matches-words-not-meaning`, `intake-matches-words-not-meaning`). `find` với chính
   lời nhu cầu «chữ dài bị cắt trong ô bảng rê chuột» thoát 1, «no match», kể cả với `--limit 20`. Danh sách gần chỉ có
   20 linh kiện của gói, khớp bằng mảnh chữ đã bỏ dấu («Bang», «Dai», «Chu», «O»). Tác tử phải gõ «truncated text» mới
   thấy khối của lõi.
9. **Còn mở** (`lint-tool-the-adapter-does-not-know`). `biome check` của CRM trên `components/truncated-text.tsx` thoát 1,
   hai lỗi: định dạng và `lint/correctness/useExhaustiveDependencies`. `companies-table.tsx` đã sửa thì thoát 0. Sửa
   bằng bản vá của `conform` hay cho miễn vẫn là việc của chủ, chưa hỏi.
10. **Còn mở** (`core-copy-holds-code-the-repository-tools-walk`). `tsconfig.json` (`**/*.tsx`) và `biome check .` quét cả
    `design/core`. Theo lời chủ, không thêm gì vào danh sách bỏ qua.
11. **Còn mở** (`decide-lists-inherited-answers-as-refused`). `decide` liệt kê 10 câu thừa hưởng dưới «refused or given
    another answer». Hai mục `source-color` và `core-source-color-43ee899f6031` trong cùng danh sách thì đúng là lời từ
    chối có lý do.
12. **Còn mở** (`core-rule-words-not-compared`). `status`: 8 câu khoá «inherited and not held».
13. **Như lượt đầu, không phải lỗi.** Màu chính trên nền tối là 3,22:1. Với mức AA không phép kiểm tương phản nào được
    thêm.
14. **Còn mở** (`kit-told-only-where-its-file-is-in-the-folder`). `adopt` nói thêm dòng chạy cổng dưới
    `executors.script` của `../../_acceptance/config.yaml`, và không tự ghi. Lượt thử cũng không ghi.

## Điều tìm thấy mới

1. **Dòng giữ lại hứa quá lời.** Dòng ấy nói màu gốc «not asked if this repository joins that family». Gói giữ màu khác
   thì sau khi vào họ vẫn bị hỏi câu (b) về khác biệt; skill `core`, mục 7 bước 3, có nói vậy. Không phải câu bị hỏi lại,
   nhưng tác tử đọc dòng ấy là một lời hứa bị phá. Chưa có dòng nào trong `limits.json`.
2. **Bản xem trước của việc vào họ không in báo cáo của gói.** Skill `core`, mục 7 bước 1, nói bản xem trước in «its
   report (section 16), printed whole». Cả `--dry-run` lẫn lần chạy thật đều không in. Chưa có dòng nào trong
   `limits.json`.
3. **`status` sau khi vào họ vẫn nói «source-color to confirm with a person»**, trong khi `adopt` hỏi «follow the core, or
   keep». Đã có dòng `audit-names-a-call-the-core-answers` (mở cùng ngày).
4. **Tên thành viên là tên repo, không phải tên gói.** `core --join` trên `apps/app` in «crm declares it is of this
   family». Đã có dòng `core-member-is-a-repository-not-a-package`.
5. **`core --take --dry-run` thoát 0 trước khi chủ đáp câu intake.** Lần chạy thật trước lời đáp thì chưa thử.
6. **Sổ lõi của máy đổi `"how": "built"` thành `"pinned"`** khi một thành viên trên cùng máy vào họ. Lượt đầu cũng thế,
   nhưng không ghi. Chưa biết nó làm gì sai.
7. **Lý do của ứng viên làm tay đọc khó:** «nothing in starter, family answers "truncated text"».
8. **Cổng không mở phần nổi của khối:** «the gate does not open its floating parts: tests/e2e/floating-parts.spec.ts is
   missing (upgrade writes it)». Nhu cầu này lại chính là hiện đủ chữ khi rê chuột.

## Hai repo thật và sổ lõi thật không đổi

- `git -C ~/dev/onehub-inventory status --short` rỗng trước và sau; đầu nhánh vẫn ở
  `1ea13196de8472efc81df66e896db9640fec4a91`.
- `git -C ~/dev/crm status --short` rỗng trước và sau; đầu nhánh vẫn ở `4aebb767d0b09239d56d556d6e0f184804cbe5fa`.
- `~/.config/design-assembly/` không có, trước và sau.
- Không có lệnh cài nào. `node_modules` của CRM thật chỉ được đọc qua liên kết: `biome check` chạy không sửa gì, `bun run
design:check` chỉ chạy `node`.

## Chưa đo

- Bộ bài kiểm của CRM, lint và kiểm kiểu của cả workspace: không chạy, theo đề.
- Màn công ty sau khi thay chưa được dựng hay mở trong trình duyệt. Chỉ `biome check` trên hai tệp chạm.
- `core --report` không chạy (vế 4).
- `core --take` chạy thật trước khi chủ đáp: chưa thử.
- Lượt dẫn dắt (`new`) trên một repo thành viên: lối thử ở đây là `adopt`.
