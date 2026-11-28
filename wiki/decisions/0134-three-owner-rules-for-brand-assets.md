---
type: decision
title: "Ba lời của chủ repo về tài sản thương hiệu: chọn bộ biểu tượng là mục của chủ repo, logo dựng trong repo là tài sản của repo, gói ngoài dùng giấy phép của chính nó"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/decisions/0123-the-icon-set-enters-through-the-sources-ledger.md
  - wiki/decisions/0124-the-mark-enters-through-the-sources-ledger.md
  - wiki/decisions/0126-the-mark-is-held-asked-for-and-shown.md
  - wiki/decisions/0127-the-mark-plug-leaves-a-package-the-plugin-reads.md
  - wiki/decisions/0128-the-owner-chooses-a-mark-among-candidates.md
  - wiki/decisions/0131-logo-design-measured-at-the-brand-assets-socket.md
  - wiki/decisions/0132-logo-design-measured-again-short-of-the-row.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/scripts/icon-source.mjs
  - plugins/design-assembly/scripts/icon-choice.mjs
  - plugins/design-assembly/scripts/package-licence.mjs
  - plugins/design-assembly/scripts/logo-source.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/brand-assets.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/skills/decide/SKILL.md
  - plugins/design-assembly/tests/test-owner-rules.mjs
  - docs/plan/plan.json
  - "chủ repo, 2026-11-28: «Đồng ý theo lời khuyên», đáp câu «việc vẽ biểu tượng còn thiếu nên làm bằng skill riêng (tôi khuyên) hay gộp vào `logo-design`?»"
  - "chủ repo, 2026-11-28: «Đây là giai đoạn tạo ra logo, giống như code việc quyết định nó thuộc về người dùng, nếu trong truòng hợp nằm ở repo thì bản quyền thuộc về repo và người tạo.»"
  - "chủ repo, 2026-11-28: «Tôi nghĩ đơn giản hoá và ứng xử như code được tạo ra đi như một tài sản số tương tự dòng code»"
  - "chủ repo, 2026-11-28: «Lucide-react dùng đúng giấy phép của bộ ngoài»"
  - "chủ repo, 2026-11-28: «Mở lát 12.3», đáp câu «Anh cho mở lát 12.3 đưa ba lời của anh vào plugin chứ?»"
  - "chủ repo, 2026-11-28: «Gộp PR 170», đáp câu «Anh duyệt phần sửa đề bài 0017 và cho gộp PR 170 chứ?»"
  - docs/trials/item-12-3-two-copies-run-again-on-0-79-0.md
---

# 0134 Ba lời của chủ repo về tài sản thương hiệu

## Status

Proposed, 2026-11-28, plugin 0.79.0. Một lát của mục 12.3, mở theo lời chủ repo («Mở lát 12.3»). Nó **sửa đề bài đã
duyệt** [0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) ở ba chỗ (mục «Hai loại nguồn mới», tiêu chí
5, câu hỏi 6) và **đổi hợp đồng sổ**, nên cả hai chờ chủ repo duyệt. `ontology/` không đổi. Mục 12.3 chưa xong: dòng
«xong khi» thứ hai của giai đoạn 12 còn cần chạy lại trên hai bản sao của lượt đo, việc ấy không thuộc lát này.

**Gộp ngày 2026-11-28:** PR 170 được gộp theo lời chủ repo «Gộp PR 170», đáp câu «Anh duyệt phần sửa đề bài 0017 và cho gộp PR 170 chứ?». Lời ấy phủ phần sửa đề bài 0017. Mười tám điểm ở mục «Điểm máy tự chọn» không được xác nhận từng điểm: chúng vẫn chờ anh xác nhận. Việc chạy lại hai bản sao đã làm cùng ngày, ghi ở [bản ghi](../../docs/trials/item-12-3-two-copies-run-again-on-0-79-0.md); nó không đóng mục 12.3.

## Context

Hai lượt đo của mục 12.3 ([0131](0131-logo-design-measured-at-the-brand-assets-socket.md),
[0132](0132-logo-design-measured-again-short-of-the-row.md)) dừng trước dòng «xong khi» thứ hai của giai đoạn 12 («một
lượt ngồi để lại một bộ biểu tượng đã ghim và một dấu do chủ repo chọn, số lần máy quyết thay bằng 0») vì ba lý do:

1. một tác tử ghi một bộ biểu tượng chủ repo chưa chọn, và không gì hỏi anh (đếm là 1 lần quyết thay);
2. dòng logo không bao giờ được ghi, vì plugin chờ một câu quyền dùng riêng cho từng logo mà chủ repo không viết;
3. dòng bộ biểu tượng không có giấy phép, vì plugin chờ một câu của người.

Ngày 2026-11-28 chủ repo đưa ba lời, gõ ở một phiên khác. Nguyên văn:

- **Về biểu tượng,** đáp câu «việc vẽ biểu tượng còn thiếu nên làm bằng skill riêng (tôi khuyên) hay gộp vào
  `logo-design`?»: «Đồng ý theo lời khuyên». Lời khuyên anh đồng ý có điểm: trước hết, trong mục 12.3, khi
  `icon-source` ghi một bộ chủ repo chưa chọn thì xếp một câu hỏi lên hàng chờ.
- **Về quyền dùng logo:** «Đây là giai đoạn tạo ra logo, giống như code việc quyết định nó thuộc về người dùng, nếu
  trong truòng hợp nằm ở repo thì bản quyền thuộc về repo và người tạo.» Và, khi được hỏi đó là luật cho plugin hay lời
  đáp riêng cho một logo: «Tôi nghĩ đơn giản hoá và ứng xử như code được tạo ra đi như một tài sản số tương tự dòng
  code».
- **Về giấy phép của bộ biểu tượng:** «Lucide-react dùng đúng giấy phép của bộ ngoài».

Cách phiên điều phối hiểu (là cách hiểu, không phải lời chủ repo): luật thứ hai phủ logo dựng trong repo, không phủ
logo mang từ ngoài vào; luật thứ ba phủ bộ biểu tượng là một gói ngoài; font không bị chạm tới.

## Decision

### Điều dựng

1. **Chọn bộ biểu tượng là mục của chủ repo.**
   - Hàng chờ có mục mới `icon-set:<id>` (`<id>` là id của dòng `icon-set`), là mục của chủ repo như `logo:<id>`:
     `decide --ask` nhận nó và bảo dừng.
   - `icon-source` đọc hàng chờ trước khi viết dòng. Chủ repo đã giữ mục ấy: lệnh nêu ai chọn, ngày nào, không hỏi gì.
     Chưa ai hỏi: lệnh viết **đúng một câu hỏi** cạnh dòng, qua chính đoạn mã `decide --ask` dùng, và in «Stop».
     Đang có câu hỏi chờ: không hỏi lần hai. Chủ repo đã bác, hay đáp bằng chữ khác: không viết dòng nào.
   - Tường `owner-calls` giữ nhánh thêm một dòng `icon-set`, hay làm một dòng trỏ sang bộ khác, cho tới khi chủ repo
     giữ đúng mục ấy. Câu đỏ nêu mục, dòng và lệnh để hỏi.
2. **Logo dựng trong repo là tài sản của repo, như code.** `logo-source --package` ghi vào dòng một câu giấy phép cố
   định theo luật này, và khoá `licence_from: { "rule": "repository-asset" }` nói giấy phép đến từ luật, không từ một
   câu của người. Dòng được giữ ngay; `status` không hỏi câu quyền dùng; với lời chọn logo của chủ repo, cổng xanh.
   `logo-source --file` và dòng `adopt` đề xuất không đổi: vẫn chờ câu của người.
3. **Bộ biểu tượng là gói ngoài dùng giấy phép gói tự khai.** `icon-source` (và `adopt`, vì cùng một đoạn mã viết
   dòng) đọc `license` trong `package.json` của gói đã cài (`node_modules/<gói>/`), không mạng, chép nguyên văn vào
   `licence`, và ghi `licence_from: { package, version, file }`. Gói chưa cài, cài khác phiên bản tệp khoá ghim, không
   khai giấy phép, trỏ tới một tệp, hay khai khác điều tệp khoá nói: dòng ở lại `proposed` và chờ câu của người như
   trước. Bộ là tệp của repo: không đổi.
4. **Nơi đọc nói giấy phép đến từ đâu:** trang tài sản thương hiệu của cuốn hướng dẫn in thêm «from …» sau giấy phép
   khi không người nào viết nó.

### Repo đã có dòng từ bản trước

- **Dòng `icon-set` đã nằm trên nhánh chính** (được giữ hay còn `proposed`, bản plugin nào viết cũng vậy): tường so
  nhánh với nhánh chính, nên dòng ấy không bao giờ bị hỏi. Đổi phiên bản, giấy phép, cỡ, hay thêm tệp vẽ vào thư mục
  của dòng cũng không hỏi. Cổng của repo ấy không đổi sau khi nâng công cụ.
- **Dòng `icon-set` một nhánh đang mở đã thêm trước khi nâng công cụ:** sau khi nâng, tường đỏ trên nhánh ấy, và câu
  đỏ nêu lý do: bộ biểu tượng mới là mục của chủ repo, hỏi bằng `decide --ask --item icon-set:<id>`.
- **Công cụ đã cài cũ hơn 0.79.0:** `icon-source` và `decide --ask --item icon-set:…` không viết gì và nêu `upgrade`
  trước, vì cổng cũ sẽ đọc câu hỏi là hỏng. Trước bản này `icon-source` vẫn viết dòng ở repo như vậy; nay nó chờ nâng
  công cụ. Dòng mang `licence_from` thì cổng cũ đọc là dòng đã giữ.
- **Dòng `logo` viết từ gói bằng bản 0.74.0 tới 0.78.0** không có giấy phép và vẫn bị `status` hỏi câu quyền dùng
  (dòng giới hạn `logo-package-row-written-before-the-rule-keeps-waiting`).
- **Dòng `icon-set` của một gói, viết khi chưa có luật hay khi gói chưa cài,** vẫn chờ câu của người dù gói có khai
  giấy phép: lệnh không bao giờ ghi đè một dòng. Muốn dòng mang giấy phép của gói thì gỡ dòng rồi chạy lại
  `icon-source`; lần chạy ấy cũng hỏi chủ repo chọn bộ (dòng giới hạn
  `icon-set-row-written-before-the-rule-keeps-waiting`). Hai bản sao của lượt đo đang ở đúng tình huống này.
- **Repo chưa có dòng nào của hai loại:** không thêm câu hỏi, không thêm tệp, cổng không đổi. Bài kiểm so với bản
  0.69.0 trên bốn loại repo vẫn xanh.

### Đổi hợp đồng sổ, cần chủ repo duyệt

Phiên bản sổ nguồn vẫn là 1: mọi thứ thêm vào đều không bắt buộc, dòng của sổ là hình dạng mở, và công cụ 0.78.0 đọc
dòng mới là dòng đã giữ (có bài kiểm).

1. **Khoá mới `licence_from`** của dòng `logo` (`{ rule: "repository-asset" }`) và dòng `icon-set`
   (`{ package, version, file }`). Dòng không có khoá này mang câu của người, như trước.
2. **Câu giấy phép cố định** của luật `repository-asset`, là dữ liệu của công cụ (`REPOSITORY_ASSET_LICENCE`).
3. **Bốn luật mới của cổng** ở `ledger-shapes`, chỉ chạm dòng có `licence_from`: dòng `logo` nêu luật mà không nêu ai
   dựng (`made`), hay có giấy phép khác chữ của luật, thì đỏ; dòng `icon-set` nêu gói khác gói nó ghim, hay giấy phép
   đọc ở một phiên bản khác phiên bản nó ghim, thì đỏ; dòng nêu nơi giấy phép đến mà không có giấy phép thì đỏ.
4. **Mục mới `icon-set:<id>`** của hàng chờ, là mục thứ tư của chủ repo sau kiểu màn, màu thương hiệu và logo. Hàng
   chờ không phải một sổ của hợp đồng, nhưng tường đọc nó.
5. **Tường `owner-calls`** đọc thêm dòng `icon-set`.

### Điểm máy tự chọn, chờ chủ repo xác nhận từng điểm

1. **«Dựng trong repo» nhận ra bằng gì:** dòng do `logo-source --package` viết, từ một thư mục của repo có tờ kê nêu
   phích nào dựng và mã băm khớp. `logo-source --file` và dòng `adopt` đề xuất là «mang từ ngoài vào». Một logo vẽ tay
   trong repo mà không có tờ kê đi lối `--file`, nên vẫn chờ câu của người.
2. **Tên và hình dạng khoá:** `licence_from`, một đối tượng; `rule` cho luật, `package` + `version` + `file` cho gói.
3. **Chữ của câu giấy phép cố định** (tiếng Anh, vì nằm trong `plugins/`): «A digital asset of this repository, held
   as its code is: made in the repository, the mark belongs to the repository and to whoever made it, and is used on
   the terms the repository's code is used on.» Vế cuối («dùng theo điều kiện mà code của repo được dùng») là máy suy
   từ lời «ứng xử như code», không phải nguyên văn của anh.
4. **Người sửa câu ấy bằng lời mình thì gỡ `licence_from`:** cổng đỏ khi dòng nêu luật mà chữ không còn là chữ của
   luật, để dòng không nói luật viết một câu người đã viết.
5. **Giấy phép của gói đọc từ `package.json` của gói đã cài,** không từ tệp khoá. Tệp khoá chỉ dùng để đối chiếu: nó
   nói khác thì không lấy.
6. **`licence` của dòng `icon-set` là nguyên văn điều gói khai** (ví dụ `ISC`), không thêm chữ nào.
7. **Trường hợp không lấy giấy phép:** gói chưa cài; cài khác phiên bản đã ghim; không khai; khai `UNLICENSED`; khai
   «SEE LICENSE IN …»; khai dưới dạng đối tượng hay danh sách; thư mục cài mang tên gói khác; khai khác tệp khoá.
8. **`adopt` cũng mang giấy phép của gói** khi đề xuất dòng bộ biểu tượng của chính repo: lời của anh nói về gói
   ngoài, không về lệnh nào viết dòng. Đề bài giao chỉ nêu `icon-source`.
9. **Bộ biểu tượng là tệp của repo không được coi là «tài sản của repo như code»:** lời ấy nói về logo; thư mục tệp
   có thể là tệp chép từ ngoài.
10. **Ghim sang phiên bản mới thì giấy phép phải được đọc lại:** cổng đỏ khi phiên bản ở `licence_from` khác phiên
    bản dòng ghim. Cách làm: gỡ dòng rồi chạy lại `icon-source` (lời giữ bộ của chủ repo vẫn đứng, không hỏi lại), hay
    viết giấy phép bằng lời người và gỡ `licence_from`. Điểm này thêm sau lượt soát mã độc lập.
11. **«Bộ khác» ở tường là gói khác hay thư mục khác** dưới cùng một dòng; phiên bản, giấy phép, cỡ và tệp của thư
    mục không tính là bộ khác.
12. **Dòng mới của thư mục biểu tượng vẽ thêm** (`icon-source --draw`, lần đầu) cũng hỏi chủ repo một câu; lần vẽ sau
    vào cùng dòng không hỏi nữa.
13. **Câu hỏi về bộ biểu tượng ghi «khó đảo»,** vì mọi màn vẽ biểu tượng đều nhập từ bộ ấy.
14. **Chữ của câu hỏi, khuyến nghị và căn cứ** do lệnh soạn từ dữ liệu của repo: khuyến nghị «giữ bộ của dòng», kèm
    lý do (mã đang nhập bộ ấy; các mảnh của bộ khởi đầu nhập bộ ấy; hay lệnh gọi nêu tên nó, và khi ấy nói plugin sẽ
    khuyến nghị bộ nào).
15. **Chủ repo bác, hay đáp bằng chữ khác, thì `icon-source` từ chối viết dòng** (thoát 2), thay vì viết rồi để tường
    đỏ.
16. **Mã thoát đổi:** `icon-source` thoát 0 khi dòng có giấy phép của gói và chủ repo đã giữ bộ ấy; lệnh viết dòng
    logo từ gói (`logo-source --package`) thoát 0 khi chủ repo đã chọn logo. Trước đây cả hai luôn thoát 1 vì giấy
    phép chờ người.
17. **Dòng giới hạn `decide-ask-takes-a-licence-as-a-recommendation` được thu hẹp, không đóng:** hai giấy phép từng
    khiến tác tử soạn câu thay người nay không chờ người nữa, và skill `decide` cấm đưa chữ giấy phép vào khuyến nghị;
    nhưng lệnh vẫn nhận chữ ấy cho những giấy phép còn là câu của người, và không lệnh nào nhận ra một câu giấy phép.
18. **`adopt` không xếp câu hỏi chọn bộ:** nó ghi bộ repo đang dùng (`own: true`); trên nhánh repo đã có sổ quyết
    định thì tường giữ, trên nhánh repo gặp plugin lần đầu thì không gì hỏi (dòng giới hạn mới).

## Consequences

- **Đổi đầu ra:**
  - `icon-source` có dòng `owner:` hay `chosen:`, dòng `licence:` nói giấy phép lấy từ gói hay vì sao không lấy; chỉ
    in `next: write the licence …` khi còn chờ người; `--json` thêm `owner`, `licence_unread`.
  - `logo-source --package` có dòng `licence: by the rule …`, và bước kế chỉ còn lời chọn logo.
  - `adopt` không còn liệt `icon-set-licence` ở «needs a person» khi gói đã khai giấy phép.
  - Câu đỏ của tường khi không đọc được nhánh thêm chữ «or a new icon set».
- **Hai chỗ lượt đo từng vướng nay có luật,** nhưng dòng «xong khi» thứ hai chưa được chứng: phải chạy lại trên hai
  bản sao.
- **Tường không so gì trên nhánh repo gặp plugin lần đầu,** trên nhánh chính và ngoài git. Một repo ra đời qua lối dẫn
  dắt trong một lượt ngồi là đúng nhánh như vậy: ở đó chỉ có câu hỏi trên tờ quyết định và mã thoát 1 của `status`
  giữ việc hỏi, cổng thì xanh (dòng giới hạn `icon-set-choice-unheld-where-nothing-is-compared`, mức vừa).
- **Sổ giới hạn** (643 dòng, 511 mở):
  - đóng `icon-set-choice-not-asked-of-the-owner` và `logo-licence-sentence-stalls-the-row`;
  - thu hẹp `decide-ask-takes-a-licence-as-a-recommendation`, `logo-package-unrecorded-unseen`,
    `decide-ask-says-red-on-the-main-branch`;
  - mở mười ba dòng: `icon-set-choice-unheld-where-nothing-is-compared`,
    `icon-set-row-proposed-by-adopt-asks-no-owner`, `icon-set-choice-in-other-words-not-read`,
    `icon-set-owner-answer-stands-for-another-set`, `icon-set-question-recommends-the-set-the-call-named`,
    `icon-set-licence-words-not-read-again-by-the-gate`, `icon-set-licence-read-from-one-manifest-field`,
    `logo-built-in-repository-is-the-manifests-word`, `logo-rule-licence-covers-files-added-later`,
    `logo-package-row-written-before-the-rule-keeps-waiting`,
    `icon-set-row-written-before-the-rule-keeps-waiting`, `logo-from-files-licence-sentence-asked-in-the-row`,
    `repository-asset-licence-is-one-fixed-sentence`.
- **Không thuộc lát này:** skill vẽ biểu tượng; lượt đo nào; chạy lại hai bản sao; font; giai đoạn 13; mục `measured`
  của phích dựng logo. Dòng «needs the owner» của giai đoạn 12 trong sổ kế hoạch («Viết giấy phép của bộ biểu tượng và
  quyền dùng dấu») không được sửa: sổ kế hoạch là của chủ repo.
