# Dòng «done when» của giai đoạn 7: lượt thử có người trên bản sao

Chạy ngày 2026-11-26, cho mục 7.3 của kế hoạch và tiêu chí 16 của đề bài
[0016](../../wiki/specs/0016-the-family-core-is-born-through-the-plugin.md). Dòng «done when» của giai đoạn: «Repo thứ
hai không bị hỏi lại câu đã trả lời, và dùng lại ít nhất một khối». Chủ repo cho chạy lượt thử bằng lời «Cho chạy».

Kết luận: ba vế đạt, một vế **chưa đạt**. Repo thứ hai bị hỏi lại đúng một câu mà lõi đã đáp: câu màu gốc. Câu ấy nằm
trong bản xem trước đầu tiên của `adopt`, in ra cùng lượt với câu «cùng họ?», trước khi plugin biết gói thuộc họ.
Đóng giai đoạn hay sửa plugin trước là việc của chủ repo; trang này không đóng gì.

## Chạy trên gì

- **Plugin:** 0.68.0, từ thư mục làm việc của nhánh `claude/stage-7-done-when-trial-b57f53` ở `23866a8`. Script gọi
  thẳng từ `plugins/design-assembly/scripts/`.
- **Sản phẩm đầu, Inventory** (`onehub-inventory`), nhánh chính ở `1ea13196`. Bản sao bằng `git archive HEAD` vào thư
  mục nháp của phiên, một `git init` riêng, một commit gốc. Thư mục bản sao giữ tên `onehub-inventory`.
- **Sản phẩm thứ hai, CRM** (`crm`), ở `4aebb767d`. Bản sao cùng cách. Gói giữ màn là `apps/app`. Gói cài của CRM
  (`node_modules` ở gốc, ở `apps/app` và `packages/ui`) được nối vào bản sao bằng liên kết, ghi trong
  `.git/info/exclude` của bản sao. Không cài gì.
- **Lõi** nằm trong thư mục nháp của phiên. Mọi lệnh của lõi chạy với `DESIGN_ASSEMBLY_CORES` trỏ vào một tệp trong
  thư mục nháp. Không tạo repo GitHub, không gửi gì đi đâu.
- **Người:** chủ repo trả lời qua phiên điều phối. Hai tờ hỏi, mỗi tờ một lời đáp nguyên văn: «Duyệt cả tờ».
- **Repo thứ hai do một tác tử mới đưa vào.** Tác tử ấy chưa thấy gì của các phát hiện trước. Nó chỉ nhận đường dẫn
  của gói, của lõi, các skill của plugin và một luật: không trả lời câu nào của người, chỉ ghi lại. Nó chạy một lượt,
  không chết giữa chừng, tốn 165 330 token.

| Vế của tiêu chí 16                               | Kết quả                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------ |
| Repo thứ hai không bị hỏi lại câu nào lõi đã đáp | **Chưa đạt: 1 câu bị hỏi lại** (màu gốc, ở bản xem trước đầu của adopt)  |
| Dùng lại ít nhất một khối lấy từ lõi qua thang   | Đạt: `TruncatedText`, qua find → intake → take → dòng sổ, dùng ở một màn |
| Cổng của repo thứ hai xanh                       | Đạt: `bun run design:check` thoát 0, không dòng đỏ                       |
| Số lần quyết thay người bằng 0                   | Đạt: 0; một lần ghi không đưa người xem trước, nêu ở dưới                |

## Vế 1: hỏi lại

Đếm từng câu tác tử gặp, đối chiếu với `answers.json` của lõi (9 câu khoá, 3 câu mặc định):

- **(a) Lõi đã đáp, bị hỏi lại: 1.** Bản xem trước `adopt.mjs --target apps/app --dry-run`, mục `needs a person`,
  nguyên văn: «source-color: --primary is #006b4f in ../../packages/ui/src/styles/globals.css. If that is the decided
  brand colour, run again with --record source-color». Lõi đã khoá `source-color` là `#0246ff`. Skill
  [`adopt`](../../plugins/design-assembly/skills/adopt/SKILL.md) (mục 3) bảo hỏi gộp mọi câu trong `needs a person`
  thành một lượt, kể cả câu này, cạnh câu «cùng họ?».
- **(b) Lõi không đáp, hay là khác biệt riêng của gói: 3.**
  - Khối nào đáp nhu cầu `chu-dai-cat-gon`: tác tử gặp câu này.
  - Màu gốc khác màu lõi khoá, theo lõi hay giữ ngoại lệ: câu `core-source-color-43ee899f6031` trong
    `design/waiting/`. Câu này chỉ hiện sau khi gói vào họ, nên tác tử không gặp.
  - Có thêm `design/core` vào danh sách bỏ qua của lint không: lệnh `core --join` in câu này khi chép khối, nên tác tử
    cũng không gặp.
- **(c) Câu riêng của lối nhận, không lõi nào đáp được: 7.**
  - Ba câu cắm (plug): `plug-reference`, `plug-screen-build`, `plug-design-review`, mỗi câu một tệp trong
    `design/waiting/`.
  - Mức tuân thủ.
  - Loại sản phẩm.
  - «Is this repository of the same family as OneHub (…)? Say which, or that it is of none.»
  - Tên người ghi sổ (`--by`).

Trong 9 câu tác tử gặp: 1 câu (a), 1 câu (b), 7 câu (c).

Lệnh chứng:

- `adopt.mjs --dry-run` trước khi vào họ: liệt kê `conformance-level`, `source-color`, `product-type`, `family`.
- Sau `core --join`, cùng bản xem trước in «answered by the family core OneHub at 43ee899f6031, not asked again», kèm
  11 câu của lõi. Dòng `source-color` của nó thành câu «follow the core, or keep this colour as an exception».
- Cuối lượt, `adopt.mjs --dry-run` thoát 0, mục `needs a person` rỗng. Câu thứ ba có điều kiện của tờ thành viên («nếu
  sau khi vào họ adopt vẫn hỏi») không phải dùng.

Muốn câu (a) không xảy ra thì phải hỏi «cùng họ?» trước, cho gói vào họ, rồi mới xem lại các câu còn lại. Skill hiện
bảo hỏi gộp.

## Vế 2: một khối qua thang

Chủ của họ chọn khối `TruncatedText` (nhu cầu `chu-dai-cat-gon`) và đưa nó lên lõi.

Gói CRM có nhu cầu này thật, đang làm tay:

- `apps/app/app/(app)/[slug]/companies/companies-table.tsx` dòng 100: `<span className="block truncate" title=…>`.
- `app/(app)/[slug]/settings/members/allowances-table.tsx` dòng 135.
- `<span className="truncate"` xuất hiện 40 lần trong 27 tệp `.tsx` của gói, kể cả thư mục test.

Các bước, mỗi bước một lệnh của plugin:

| Bước                                                               | Lệnh                                                                                   | Thoát |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ----- |
| Đưa khối lên lõi, «chưa có lần dùng thứ hai»                       | `core.mjs --target onehub-inventory --promote chu-dai-cat-gon --core … --by … --why …` | 0     |
| Gói vào họ, ghim `43ee899f6031`, bản chép giữ tệp của khối         | `core.mjs --target apps/app --join --core … --by …`                                    | 0     |
| Thang tìm thấy ở tầng 3, «1 match, in the family's store»          | `find.mjs chữ dài cắt gọn --target apps/app`                                           | 0     |
| Intake đề nghị khối của lõi, ghi câu hỏi; chủ giữ qua `decide`     | `intake.mjs --need chu-dai-cat-gon chữ dài cắt gọn`, rồi `decide.mjs --answers …`      | 1, 0  |
| Lấy khối xuống `components/truncated-text.tsx`, mở hồ sơ chuẩn hoá | `core.mjs --target apps/app --take chu-dai-cat-gon`                                    | 0     |
| Ghi dòng sổ nhập kho                                               | `intake.mjs --need chu-dai-cat-gon --file components/truncated-text.tsx`               | 0     |
| Báo lõi: kho ghi «a second use», `used_by` có `crm`                | `core.mjs --target apps/app --report`                                                  | 0     |

Dòng sổ ở `apps/app/design/intake.yaml` ghi:

- `from: core`, `pin: 43ee899f6031`;
- `approved_by: Phan Le Manh`, ngày 2026-11-26;
- mã băm `516f0c2b…`.

Mã băm của tệp ở ba chỗ trùng nhau: tệp trong gói, tệp trong kho của lõi, tệp trong bản chép `design/core`.

Theo lời chủ (câu 8 của tờ thành viên), chỗ làm tay ở `companies-table.tsx` dòng 100 được thay bằng
`<TruncatedText text={nganh.ten} />`, chỉ một chỗ ấy, trên bản sao.

`core.mjs --check` thoát 0 sau khi đưa khối lên lõi, và thoát 0 lần nữa ở cuối lượt: «its shape holds (shape 2)».

## Vế 3: cổng

Trong `apps/app` của bản sao, `bun run design:check` thoát 0:

- «9 decisions held by 13 checks, each seen failing on a changed copy»;
- hai dòng `debt` cho `decision-sheet` và `owner-calls`: nhánh chính chưa có sổ quyết định;
- không dòng đỏ nào.

Trước khi ghi ngoại lệ màu, cùng lệnh thoát 1 với đúng một dòng đỏ: `ledger-shapes: source-color: design/tokens.json
holds #006b4f, and the family core this repository pinned locks #0246ff … with no exception recorded`.

Ngoài cổng, ba điều không đỏ nhưng cần biết:

- `status` thoát 1: «2 decisions are failing or bypassed (type-scale, spacing)». Thang chữ bị đi vòng 31 chỗ, khoảng
  cách 36 chỗ; đây là khác biệt có từ trước.
- Về câu khoá: «0 held by a check here, 8 inherited and not held, 1 kept against the core as exceptions».
- Lint của chính CRM (biome) đỏ trên tệp khối lấy về; xem mục điều tìm thấy.

## Vế 4: quyết thay người

Mọi lựa chọn của người đi qua hai tờ, mỗi tờ một lời đáp nguyên văn của chủ.

Hai câu lý do (`--why`) do máy soạn nháp. Chủ thấy đó là bản nháp có thể thay, và duyệt nguyên văn bằng «Duyệt cả tờ».
Tên người ghi sổ là `Phan Le Manh`, lấy từ `git config user.name` của kho này.

Những việc máy làm không hỏi, và vì sao không tính là quyết thay:

- **Bản lõi nháp «Probe»** dựng trong thư mục nháp, với sổ lõi riêng, để thử lệnh đưa khối lên lõi trước khi hỏi. Lượt
  thử không dùng nó.
- **Khoá nhu cầu `chu-dai-cat-gon`** do tác tử đặt, theo khoá của lõi. Câu 7 của tờ thành viên nêu khoá này, và chủ
  duyệt.
- **Lần ghim lại thứ hai (`core --join`)** để câu màu gốc lên tờ. Chủ đã đồng ý vào họ ở câu 1.
- **`core --report`** ghi `members/crm.json` vào lõi. Tệp chỉ ghi sự thật «gói dùng `chu-dai-cat-gon`», không có lựa
  chọn nào. Nhưng skill nói đưa người xem tệp trước khi ghi, và lượt này không đưa chủ xem trước. Ghi lại ở đây, không
  tính là một quyết định.

## Các câu đã hỏi, ai đáp

**Tờ của chủ của họ.** Câu hỏi chót của phiên điều phối, nguyên văn: «Anh duyệt cả tờ bảy câu theo khuyến nghị («Duyệt
cả tờ»), hay sửa câu nào («Sửa một câu», kèm số câu và lời đáp của anh)?». Chủ repo đáp: «Duyệt cả tờ».

| #   | Câu                                | Lời đáp được duyệt                                                                                                                                    |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tên họ                             | OneHub                                                                                                                                                |
| 2   | Câu khoá                           | source-color, record-panel, edit-in-cell, undo-or-confirm, feedback-by-delay, state-matrix, notification-channel, read-only-cell, empty-state-actions |
| 2b  | Giá trị của cách mở hồ sơ          | `over`, kèm lời nói rõ không giá trị nào khớp trọn                                                                                                    |
| 3   | Câu mặc định                       | table-density; type-scale-values = `standard`; test-screen-sizes = `360,414,1024,1440`; ba luật riêng của Inventory để ngoài                          |
| 4   | Lõi nằm ở đâu                      | thư mục trong thư mục nháp của phiên                                                                                                                  |
| 5   | Khối đưa lên lõi                   | `TruncatedText`; lý do: «Cả hai sản phẩm đều cắt chữ dài trong ô bảng; CRM đang làm tay ở hàng chục chỗ, nên dùng chung một khối.»                    |
| 6   | Ghi `values: { by-hand: tao-tay }` | có, chỉ vào bản sao Inventory                                                                                                                         |

**Tờ của thành viên.** Câu hỏi chót, nguyên văn: «Anh duyệt cả tờ chín câu theo khuyến nghị («Duyệt cả tờ»), hay sửa câu
nào («Sửa một câu», kèm số câu và lời đáp của anh)?». Chủ repo đáp: «Duyệt cả tờ».

| #   | Câu                                          | Lời đáp được duyệt                                                                                            |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | Gói `apps/app` cùng họ OneHub?               | có                                                                                                            |
| 2   | Màu gốc khác lõi                             | giữ ngoại lệ; lý do: «CRM giữ màu xanh lá #006b4f của thương hiệu CRM; hai sản phẩm phân biệt nhau bằng màu.» |
| 3   | Nếu vẫn bị hỏi: `#006b4f` là màu đã chốt?    | có (không phải dùng)                                                                                          |
| 4   | Mức tuân thủ                                 | AA                                                                                                            |
| 5   | Loại sản phẩm                                | `application`                                                                                                 |
| 6   | Ba câu cắm                                   | tham khảo `none`, dựng màn `rules-page`, duyệt thiết kế `review`                                              |
| 7   | Khối cho nhu cầu                             | `TruncatedText` của lõi, lấy qua `core --take`                                                                |
| 8   | Thay chỗ làm tay ở `companies-table.tsx:100` | có, một chỗ                                                                                                   |
| 9   | Thêm `design/core` vào danh sách bỏ qua lint | không, ghi là điều còn mở                                                                                     |

Phiên điều phối nói với chủ rằng nó không có gì cho thấy `#006b4f` là màu thương hiệu đã chốt, và duyệt tờ là chủ xác
nhận điều ấy.

## Điều tìm thấy, không như đề bài nói

1. **Chưa đạt: repo thứ hai bị hỏi lại màu gốc.** Bản xem trước đầu của
   [`adopt.mjs`](../../plugins/design-assembly/scripts/adopt.mjs) hỏi «If that is the decided brand colour…» cạnh câu
   «cùng họ?», dù lõi đã khoá màu gốc. Skill bảo hỏi gộp mọi câu trong một lượt.
2. **Chưa đạt: một câu của adopt nói sai lúc nó được in.** Khi gói vào họ trước lúc có sổ (đúng thứ tự skill nói), lệnh
   `core --join` ghi màu gốc là «inherited» và không ghi câu hỏi nào. Ngay sau đó `adopt` in «The question waits on the
   decision sheet (core --join asked it)», trong khi `design/waiting/` chưa có tệp ấy. Chỉ lần `core --join` thứ hai,
   sau khi adopt đã ghi `design/tokens.json`, mới ghi `core-source-color-43ee899f6031.json` (thoát 1). Ở giữa hai lần
   ấy, `design:check` đỏ ở `ledger-shapes: source-color`. Skill không nói phải ghim lại lần hai.
3. **Chưa đạt: lệnh đưa khối lên lõi từ chối mọi khối Inventory tự làm.** Sổ nhập kho của Inventory ghi nguồn là
   `tao-tay`, nhưng không khai `tao-tay` là chữ của nó cho «làm tay». Lệnh
   [`core-promote.mjs`](../../plugins/design-assembly/scripts/core-promote.mjs) thoát 2 và bảo ghi
   `values: { by-hand: tao-tay }`; không lệnh nào của plugin ghi được dòng ấy. Lượt thử ghi tay dòng ấy vào bản sao,
   theo lời chủ. Các khối Inventory lấy từ ReUI cũng bị từ chối, cho tới khi nguồn ấy được ghim kèm dòng giấy phép.
4. **Chưa đạt: lệnh đưa khối lên lõi nhận ra repo đầu bằng tên thư mục.** Trên một bản sao đặt tên thư mục khác, lệnh
   từ chối: «neither the first repository of the family … nor one of its members».
5. **Chưa đạt: xem trước việc vào họ đòi tên người.** `core --join --dry-run` thoát 2 khi thiếu `--by`, nên người chưa
   thấy được việc vào họ sẽ ghi gì trước khi đồng ý, trái mục 7 bước 1 của skill
   [`core`](../../plugins/design-assembly/skills/core/SKILL.md).
6. **Chưa đạt: dòng kiểm phông chữ nêu sai lý do.** `font-loaded` nói `tw-animate-css`, `shadcn` «not installed», dù hai
   gói ấy có trong `packages/ui/node_modules` của bản sao. Phông Geist được nạp bằng `next/font` ở `app/layout.tsx`.
   Dòng này rơi vào «would fail today», nên không có phép kiểm phông chữ.
7. **Chưa đạt: bản xem trước của intake không in lời câu hỏi.** `intake --dry-run`, cả dạng chữ lẫn `--json`, chỉ nêu
   tệp sẽ ghi.
8. **Chưa đạt: thang so chữ nên trượt.** `intake --need chu-dai-cat-gon chữ dài cắt gọn ô bảng rê chuột` chỉ đề nghị
   làm tay. Bỏ bớt mấy chữ cuối thì mới thấy khối của lõi. `find` bỏ dấu tiếng Việt, nên kéo theo các linh kiện không
   liên quan (`DaiDuAn`, `ChuConNgay`).
9. **Chưa đạt: khối lấy về làm lint của CRM đỏ.** Lệnh `biome check` của CRM trên tệp `components/truncated-text.tsx`
   báo hai lỗi: định dạng (CRM thụt bằng tab) và `useExhaustiveDependencies` («more dependencies than necessary:
   text»). Lệnh `take` chép tệp nguyên từng byte, và hồ sơ chuẩn hoá `design/conform/chu-dai-cat-gon.json` không có bản
   vá nào. Plugin không biết công cụ lint của CRM (giới hạn mở `lint-tool-the-adapter-does-not-know`), nên cổng xanh
   không thấy lỗi này. Sửa bằng bản vá của `conform` (kèm lý do) hay cho miễn là việc của chủ; lượt này chưa hỏi.
   `companies-table.tsx` đã sửa thì qua `biome check`.
10. **Còn mở: biome quét cả bản chép của lõi.** `biome.json` của CRM gồm `"**"`, nên quét cả
    `apps/app/design/core/blocks/`. Theo lời chủ (câu 9), lượt thử không thêm gì vào danh sách bỏ qua.
11. **Chưa đạt: `decide` gọi sai các câu thừa hưởng.** Sau khi ghi các lời đáp, `decide` liệt kê các câu thừa hưởng từ
    lõi (record-panel, table-density, test-screen-sizes, edit-in-cell, …) dưới «refused or given another answer».
12. **Chưa thấy: câu khoá được giữ ở repo thứ hai.** `status` nói 8 câu khoá «inherited and not held»: CRM không có bài
    kiểm hành vi nào giữ chúng. Cổng chỉ đỏ khi repo giữ một câu khoá khác đi; một câu chỉ được ghi «thừa hưởng» thì
    không phép kiểm nào giữ nó.
13. **Đạt, như phiên điều phối thấy: với mức AA, tương phản tối không làm cổng đỏ.** Màu chính trên nền tối là 3,22:1,
    nằm dưới «would fail today, so nothing was added». Không có phép kiểm tương phản nào được thêm.
14. **Chưa đạt: kit nghiệm thu chưa có dòng chạy cổng.** `adopt` nói cần thêm dòng chạy cổng dưới `executors.script`
    của `_acceptance/config.yaml`, và không tự ghi. Lượt thử cũng không ghi.

## Hai repo thật không đổi

- `git -C ~/dev/onehub-inventory status --short` rỗng trước và sau; đầu nhánh vẫn ở
  `1ea13196de8472efc81df66e896db9640fec4a91`.
- `git -C ~/dev/crm status --short` rỗng trước và sau; đầu nhánh vẫn ở `4aebb767d0b09239d56d556d6e0f184804cbe5fa`.
- `~/.config/design-assembly/` không có, trước và sau.
- Không có lệnh cài nào. Riêng `node_modules` của CRM thật được đọc qua liên kết: `biome check` chạy không sửa gì,
  `bun run design:check` chỉ chạy `node`. Lượt thử không đo thêm gì ngoài `git status` để chứng rằng chúng không đổi.

## Chưa đo

- Bộ bài kiểm của CRM, lint và kiểm kiểu của cả workspace: không chạy, theo đề.
- Màn công ty sau khi thay chưa được dựng hay mở trong trình duyệt. Chỉ `biome check` trên hai tệp chạm.
- Lượt dẫn dắt (`new`) trên một repo thành viên: lối thử ở đây là `adopt`.
