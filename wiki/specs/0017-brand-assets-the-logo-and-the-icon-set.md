---
type: spec
title: Tài sản thương hiệu đủ mảng — logo và bộ biểu tượng vào sổ nguồn, cổng giữ chúng, và repo chưa có thì được dựng
status: approved
tier: 1
links:
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0012-foundations-wide-enough.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0081-a-font-enters-through-the-sources-ledger.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0091-bring-in-reads-an-outside-source-into-a-candidate-direction.md
  - wiki/decisions/0101-the-repository-declares-its-ladder.md
sources:
  - docs/plan/plan.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/standard-decisions.json
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/plugs/claude-design.json
  - plugins/design-assembly/scripts/font-source.mjs
  - plugins/design-assembly/skills/decide/SKILL.md
  - plugins/design-assembly/skills/bring-in/SKILL.md
  - plugins/design-assembly/templates/owned/sonner.tsx.template
  - plugins/design-assembly/templates/owned/row-actions.tsx.template
  - package.json
  - components.json
  - index.html
  - "kho skill riêng của chủ repo, skill logo-design ở 10b1ca9, đọc ngày 2026-11-25, chỉ đọc: SKILL.md, scripts/brand.py, ba tệp references, hai tệp examples"
  - "lượt chạy `bring-in --dry-run` ngày 2026-11-25 trên kho này ở 6ad19c6, với một thư mục thử gồm tokens.json và README.md: đọc màu từ color.primary, xếp một câu hỏi, không ghi gì (37 tệp hàng chờ trước và sau)"
  - "lượt chạy `decide --ask --dry-run` ngày 2026-11-25 trên kho này ở 6ad19c6, với một câu hỏi chọn phương án dấu: câu hỏi vào được hàng chờ, không ghi gì"
  - "chủ repo, 2026-11-25: «được thiết kế cho nhiều người dùng, nhiều thương hiệu và nhiều giai đoạn của dự án […] nên không cứng về màu thương hiệu hay các thành phần»"
  - "chủ repo, 2026-11-25: «Tôi muốn skill logo làm lại theo chuẩn của design assambly và bổ sung mảnh ghép thiếu đó bao gồm cả logo hay icon nếu người dùng không có»"
  - "chủ repo, 2026-11-25: «Soạn đề bài»"
  - "chủ repo, 2026-11-25: «gộp», lời cho gộp PR 145 mang đề bài khi còn chờ duyệt"
  - "chủ repo, 2026-11-25: «Duyệt cả mười hai», đáp câu «Duyệt đề bài 0017 theo khuyến nghị cả mười hai câu?»"
  - "chủ repo, 2026-11-28: «Đồng ý theo lời khuyên», đáp câu «việc vẽ biểu tượng còn thiếu nên làm bằng skill riêng (tôi khuyên) hay gộp vào `logo-design`?»; lời khuyên ấy có điểm: trong mục 12.3, khi `icon-source` ghi một bộ chủ repo chưa chọn thì xếp một câu hỏi lên hàng chờ"
  - "chủ repo, 2026-11-28, sau khi phiên đo giải thích «quyền dùng logo là gì»: «Đây là giai đoạn tạo ra logo, giống như code việc quyết định nó thuộc về người dùng, nếu trong truòng hợp nằm ở repo thì bản quyền thuộc về repo và người tạo.»"
  - "chủ repo, 2026-11-28: «Tôi nghĩ đơn giản hoá và ứng xử như code được tạo ra đi như một tài sản số tương tự dòng code», đáp câu hỏi đó là luật cho plugin hay lời đáp riêng cho một logo"
  - "chủ repo, 2026-11-28: «Lucide-react dùng đúng giấy phép của bộ ngoài»"
  - "chủ repo, 2026-11-28: «Mở lát 12.3», đáp câu «Anh cho mở lát 12.3 đưa ba lời của anh vào plugin chứ?»"
  - wiki/decisions/0134-three-owner-rules-for-brand-assets.md
---

# 0017 Tài sản thương hiệu đủ mảng — logo và bộ biểu tượng

Máy viết ngày 2026-11-25 theo lời chủ repo («Soạn đề bài»). Chủ repo duyệt đề bài và đáp cả mười hai câu hỏi theo
khuyến nghị cùng ngày («Duyệt cả mười hai»); lời đáp ghi dưới từng câu. Giai đoạn 12 vào kế hoạch cùng lời duyệt ấy và
chưa mở: giai đoạn 7 đang mở, và giai đoạn 12 mở sau khi mục 7.1 xong (câu hỏi 10). Chưa gì được dựng.

## Intent

Ổ tài sản thương hiệu của bảng năng lực có một phích của plugin, `font-source`, và chỉ cho font
([0081](../decisions/0081-a-font-enters-through-the-sources-ledger.md), điểm 8: «giới hạn của ổ thu hẹp còn logo và
bộ biểu tượng, không đóng»). Giới hạn `capability-brand-assets-has-no-plug` mở từ ngày 2026-11-20, mức vừa, kế hoạch
«fix», chưa có giai đoạn: logo và bộ biểu tượng không có chỗ ghi, và không phép kiểm nào giữ rằng màn chỉ dùng thứ đã
ghi.

Đề bài này lấp chỗ ấy theo đúng nếp của font, cho cả ba loại repo mà plugin phục vụ:

- **repo đã có** logo hay bộ biểu tượng: ghi lại và ghim, không vẽ lại, không ghi đè;
- **repo có một phần:** nói rõ còn thiếu gì, không tự điền;
- **repo chưa có gì:** để lại một bộ dùng được sau một lượt ngồi, và không lần nào máy quyết thay người.

Chủ repo nêu ngày 2026-11-25 rằng plugin phục vụ nhiều người dùng, nhiều thương hiệu và nhiều giai đoạn của dự án,
nên không cứng về màu thương hiệu hay thành phần. Vì thế đề bài chia việc làm hai nửa:

- **plugin** lo phần ghi, giữ và nói điều còn thiếu: không gọi mô hình, không gọi mạng, không nêu thương hiệu nào;
- **một phích ngoài** lo phần cần gu và cần vẽ: dựng dấu khi repo chưa có, và vẽ biểu tượng mà bộ đã ghim không có.

### Hôm nay đứng ở đâu

- **Câu chuẩn về biểu tượng có, chưa ai đáp.** Danh mục có câu `icons` (tầng linh kiện, loại `standard`: «bộ biểu
  tượng nào, cỡ nào, nét nào»). Kho này không có dòng cho nó, danh mục bằng chứng đã biết không nêu gì cho nó, và không
  phép kiểm nào giữ.
- **Kho này là một ca «có một phần».** Ứng dụng mẫu nhập `lucide-react` (`package.json`, tệp khoá ghim; `components.json`
  khai `iconLibrary`), năm tệp dưới `src/` nhập từ nó, và sổ không có dòng nào. Nó không có logo và không có biểu tượng
  trang: `index.html` không khai gì, và tên sản phẩm chỉ là chữ.
- **Bộ khởi đầu đã nhập một bộ biểu tượng.** Hai mảnh của bộ khởi đầu (`sonner`, `row-actions`) nhập từ `lucide-react`,
  nên một repo ra đời qua lối dẫn dắt có bộ ấy ngay khi nhận hai mảnh này, mà sổ không biết.
- **Ổ này đã có một phích ngoài.** `claude-design` khai ổ tài sản thương hiệu, đã đo
  ([0088](../decisions/0088-claude-design-system-measured-on-four-measures.md)), và chủ repo giữ nó là khuyến nghị ở ổ
  này («Keep at handoff and brand», 2026-11-23). Nó trình bày và dùng hệ; nó không viết dòng nào cho logo hay bộ biểu
  tượng, nên giới hạn vẫn mở.
- **Nếp đưa một thứ vào sổ nguồn đã có hai lần.** Font vào bằng một loại nguồn mới, kèm ghim và giấy phép (0081); lõi
  của họ sản phẩm sẽ vào bằng một loại nữa ([0016](0016-the-family-core-is-born-through-the-plugin.md), câu hỏi 4). Cả
  hai giữ số phiên bản của sổ ở 1.
- **Câu hỏi của chủ repo đã có lối.** Một tác tử xếp câu hỏi lên hàng chờ bằng `decide --ask`; với màu thương hiệu và
  kiểu màn mới, lệnh bảo **dừng** và cổng đỏ trên nhánh cho tới khi chủ repo giữ đúng mục ấy (`owner-calls`).
- **Cầu nối vào đọc được một bảng màu từ ngoài.** `bring-in` đọc một thư mục gồm `tokens.json` và `README.md` thành một
  hướng ứng viên; giá trị ngược sổ thành câu hỏi, sổ thắng
  ([0091](../decisions/0091-bring-in-reads-an-outside-source-into-a-candidate-direction.md)). Lượt chạy thử ngày
  2026-11-25 cho thấy một bảng màu của một bộ dấu đi qua được lối này mà không sửa gì ở plugin.
- **Một skill dựng dấu đã có, ngoài kho này.** Skill `logo-design` trong kho skill riêng của chủ repo dựng dấu bằng
  phép dựng hình, rồi xuất một bộ tệp (SVG ba biến thể, PNG theo cỡ, biểu tượng trang, tấm xem trước). Bốn điều về nó
  cần nói thẳng:
  - nó chưa được đo theo bốn thước của [0008](0008-capabilities-sockets-and-plugs.md): hai lượt thử đã chạy không theo
    đề chuẩn;
  - nó đóng cứng họ chữ, tỷ lệ chữ so với dấu, và chữ tiếng Việt in vào tấm xem trước;
  - nó có một lỗi đã chứng: khi một hình vẽ đè lên vùng đã khoét, bản PNG giữ hình ấy còn bản SVG cắt mất;
  - nó dựa vào một bộ máy dựng hình đến từ một tệp nén, không có kho gốc; giấy phép chưa rõ.

### Năm luật không đổi

1. **Repo chưa có dòng nào của hai loại mới thì không đổi gì.** Không thêm câu hỏi bắt buộc, không thêm tệp, cổng không
   đổi. Một phép kiểm mới chỉ giữ một repo từ khi repo ấy có dòng.
2. **Plugin không vẽ và không chọn hộ.** Lệnh của plugin không gọi mô hình, không gọi mạng, không sinh hình nào. Thứ
   cần gu là việc của người, hoặc của một phích ngoài rồi người chọn.
3. **Không vẽ lại, không ghi đè thứ repo đang có.** Như lối nhận với font: tệp của repo ở nguyên chỗ, băm tại chỗ.
4. **Dấu mới chờ lời chủ repo,** như màu thương hiệu. Máy dừng, không dựng tiếp trên một dấu chưa ai chốt.
5. **Plugin không nêu tên thương hiệu nào.** Tên, dấu, bảng màu là dữ liệu của người dùng, nằm trong repo của họ.

### Sửa đổi ngày 2026-11-28, chờ chủ repo duyệt

Phần này sửa một đề bài đã duyệt, nên **chưa có hiệu lực của một đề bài đã duyệt cho tới khi chủ repo duyệt nó**. Nó
đưa ba lời của chủ repo ngày 2026-11-28 vào đề bài; máy viết theo lời «Mở lát 12.3» (đáp câu «Anh cho mở lát 12.3 đưa
ba lời của anh vào plugin chứ?»). Cách dựng và từng điểm máy tự chọn ghi ở
[0134](../decisions/0134-three-owner-rules-for-brand-assets.md). Ba chỗ của đề bài bị sửa được đánh dấu «Sửa
2026-11-28» ngay tại chỗ: mục «Hai loại nguồn mới», tiêu chí 5 và câu hỏi 6.

1. **Chọn bộ biểu tượng là mục của chủ repo.** Lời chủ repo, nguyên văn: «Đồng ý theo lời khuyên», đáp câu «việc vẽ
   biểu tượng còn thiếu nên làm bằng skill riêng (tôi khuyên) hay gộp vào `logo-design`?». Lời khuyên anh đồng ý có
   điểm: trước hết, trong mục 12.3, khi `icon-source` ghi một bộ chủ repo chưa chọn thì xếp một câu hỏi lên hàng chờ.
   Đề bài nay nói: dòng `icon-set` mới chờ lời chủ repo giữ mục `icon-set:<id>`, như dòng `logo` chờ `logo:<id>`.
2. **Logo dựng trong repo là tài sản của repo, như code.** Lời chủ repo, nguyên văn, sau khi được giải thích «quyền
   dùng logo là gì»: «Đây là giai đoạn tạo ra logo, giống như code việc quyết định nó thuộc về người dùng, nếu trong
   truòng hợp nằm ở repo thì bản quyền thuộc về repo và người tạo.» Và khi được hỏi đó là luật cho plugin hay lời đáp
   riêng cho một logo: «Tôi nghĩ đơn giản hoá và ứng xử như code được tạo ra đi như một tài sản số tương tự dòng code».
   Đề bài nay nói: dòng `logo` viết từ một gói có tờ kê do phích để lại trong repo không chờ một câu quyền dùng riêng;
   lệnh ghi giấy phép theo luật này và dòng nói rõ giấy phép đến từ luật.
3. **Bộ biểu tượng là gói ngoài dùng đúng giấy phép của gói ấy.** Lời chủ repo, nguyên văn: «Lucide-react dùng đúng
   giấy phép của bộ ngoài». Ghi chú của phiên đo không chép câu hỏi đứng ngay trước lời này; câu còn chờ anh khi ấy là
   câu `icon-set-licence-lucide-react` của lượt đo thứ hai, hỏi bộ ấy được dùng theo giấy phép nào. Đề bài nay nói: dòng `icon-set` của một gói ngoài mang giấy phép chính
   gói đã cài tự khai, và dòng nói nó đọc từ đâu.

Cách phiên điều phối hiểu ba lời (là cách hiểu, không phải lời chủ repo, cần anh xác nhận): luật 2 chỉ phủ logo **dựng
trong repo**; logo mang từ ngoài vào (tệp đã có, hay dòng `adopt` đề xuất từ biểu tượng trang) vẫn chờ câu của người.
Luật 3 chỉ phủ bộ biểu tượng **là một gói ngoài**; bộ là tệp của repo, và gói không khai giấy phép hay chưa cài, vẫn
chờ câu của người. Font không bị ba lời này chạm tới.

Luật không đổi số 1 vẫn đứng: repo chưa có dòng nào của hai loại thì không thêm câu hỏi bắt buộc, cổng không đổi.

## Thiết kế

### Hai loại nguồn mới

Sổ nguồn nhận hai loại nữa, bên cạnh thư viện và font (và lõi, khi lát 2 của mục 7.1 dựng xong). Số phiên bản của sổ
vẫn là 1.

| Loại       | Dòng nói gì                                                                                                                                    | Ghim bằng gì                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `icon-set` | Bộ biểu tượng sản phẩm dùng: mô-đun mà mã nhập từ, các cỡ được dùng, độ dày nét nếu là bộ nét                                                  | Gói và phiên bản tệp khoá ghim; hoặc từng tệp của repo kèm mã băm |
| `logo`     | Dấu của sản phẩm: từng tệp, vai của nó (dấu, chữ, khoá ngang, khoá dọc, biểu tượng trang, biểu tượng ứng dụng) và biến thể (màu, một màu, đảo) | Từng tệp của repo kèm mã băm                                      |

Cả hai đòi hai điều như font: **ghim** nằm ngay trong dòng, và **giấy phép** bằng lời của một người (với logo: ai giữ
quyền dùng dấu này, và dùng được ở đâu). Dòng do một lệnh viết ghi `proposed` và chưa được giữ cho tới khi người viết
giấy phép. Một dòng `logo` có thể ghi thêm ai dựng nó (tay người, hay phích nào, ngày nào).

> **Sửa 2026-11-28, chờ chủ repo duyệt.** Giấy phép không còn luôn là câu của một người; hai trường hợp có luật:
>
> - **Logo dựng trong repo** (dòng viết từ gói có tờ kê do phích để lại): là tài sản số của repo như dòng code, theo
>   lời chủ repo «Tôi nghĩ đơn giản hoá và ứng xử như code được tạo ra đi như một tài sản số tương tự dòng code». Lệnh
>   ghi giấy phép theo luật, dòng nói giấy phép đến từ luật (khoá `licence_from`), và dòng được giữ ngay.
> - **Bộ biểu tượng là gói ngoài:** dùng đúng giấy phép chính gói ấy công bố, theo lời chủ repo «Lucide-react dùng
>   đúng giấy phép của bộ ngoài». Lệnh đọc giấy phép gói đã cài tự khai (không mạng), ghi vào dòng, và dòng nói nó
>   đọc từ đâu (`licence_from`).
>
> Mọi trường hợp khác vẫn như trên, chờ câu của một người: logo từ tệp đã có hay do `adopt` đề xuất, bộ biểu tượng là
> tệp của repo, gói không khai giấy phép hay chưa cài, và font.
>
> Thêm một điều: **dòng `icon-set` mới là mục của chủ repo** (`icon-set:<id>`), như dòng `logo`. Lệnh viết dòng xếp
> một câu hỏi lên hàng chờ khi chủ repo chưa chọn bộ ấy, và trên nhánh, cổng đỏ cho tới khi anh giữ mục ấy.

Hai loại này không phải kho khối: `find` và `intake` không tìm khối trong chúng.

### Bốn tình huống

| Repo đang có          | Plugin làm gì                                                                                        | Người làm gì                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Bộ biểu tượng         | Lối nhận đề xuất một dòng `icon-set` từ gói mà cài đặt của thư viện linh kiện nêu và tệp khoá ghim   | Viết giấy phép; đáp các cỡ và nét                    |
| Logo                  | Lối nhận đề xuất một dòng `logo` từ tệp biểu tượng trang và tệp ảnh khung ứng dụng nhập, băm tại chỗ | Viết quyền dùng; ghi vai của tệp máy không đoán được |
| Chưa có bộ biểu tượng | Lối dẫn dắt khuyến nghị bộ mà các mảnh của bộ khởi đầu đang nhập; viết dòng khi tệp khoá đã ghim gói | Nhận hay chọn bộ khác, rồi cài nó                    |
| Chưa có logo          | Ghi lựa chọn của sàn: tên sản phẩm bằng chữ, không tệp nào. Có phích dựng dấu thì nêu lối ấy         | Giữ chữ, trỏ tới tệp đã có, hay để phích dựng        |

**Sàn của dấu là chữ.** Như «font của sàn», một repo chưa có dấu vẫn có một lời đáp ghi được: tên sản phẩm đặt bằng
họ chữ tiêu đề, không tệp nào sinh ra. Plugin không tự sinh một ô chữ cái hay một hình nào: làm vậy là chốt một quyết
định thương hiệu mà không ai đưa.

### Cổng giữ gì

- **Ghim còn đúng.** Gói lệch phiên bản tệp khoá ghim, hay một tệp lệch mã băm, làm cổng đỏ và câu đỏ nêu dòng.
- **Biểu tượng đến từ bộ đã ghi.** Khi repo có một dòng `icon-set`: một gói biểu tượng khác mà mã nhập, hay một thẻ
  `svg` viết thẳng trong tệp của một màn, làm cổng đỏ. Gói nào là gói biểu tượng do một danh mục của plugin nói, là
  dữ liệu sửa được.
- **Dấu đến từ dòng đã ghi.** Khi repo có một dòng `logo`: tệp biểu tượng trang mà nền dựng khai, và tệp ảnh mà khung
  ứng dụng nhập, phải là tệp của một dòng `logo`.
- **Dấu là lời chủ repo.** Một dòng `logo` mới, hay một tệp của nó đổi, chờ chủ repo giữ đúng mục ấy trên tờ quyết
  định; trên nhánh, cổng đỏ cho tới lúc đó.

### Phích dựng dấu

Phần dựng dấu là một phích ngoài loại skill, tên `logo-design`, cắm vào ổ này. Đề bài không sửa skill ấy; nó nói ổ đòi
gì ở một phích dựng dấu, và skill được làm lại ở kho của nó cho khớp.

1. **Đọc lời đáp của repo trước khi vẽ.** Màu gốc, họ chữ tiêu đề và bo góc đã chốt là đầu vào mặc định. Phích không
   mang họ chữ, tỷ lệ hay ngôn ngữ của riêng nó vào repo của người khác.
2. **Đưa ra hai hay ba phương án khác nhau về cấu trúc,** mỗi phương án một câu ý tưởng, vẽ cả ở cỡ biểu tượng trang.
3. **Xếp đúng một câu hỏi lên hàng chờ** cho việc chọn phương án, là mục của chủ repo. Phích dừng ở đó.
4. **Sau lời đáp, để lại một gói** trong repo: tệp theo vai và biến thể, và một **tờ kê** nêu từng tệp với mã băm, bảng
   màu, câu ý tưởng, và các con số gốc của phép dựng. Dựng lại từ các con số ấy phải ra đúng mã băm đã kê.
5. **Một lệnh của plugin viết dòng từ gói ấy,** sau khi so mã băm. Phích không tự viết vào sổ.
6. **Bảng màu của gói đi lối cầu nối vào** khi nó khác màu gốc đã chốt: thành câu hỏi, sổ thắng.

Biểu tượng vẽ thêm đi thang của [0015](0015-choose-before-make-conform-before-intake.md): bộ đã ghim trước, vẽ là bậc
cuối, kèm nhu cầu và vì sao bộ đã ghim không đáp. Biểu tượng vẽ thêm theo lưới và nét mà dòng `icon-set` của repo ghi,
không theo lưới của riêng phích.

### Ngoài phạm vi

Để sau, mỗi việc cần một lời riêng của chủ repo:

- bộ dấu thành một lời đáp đã khoá của lõi của họ sản phẩm (0016 đã để «dựng lõi từ một bộ nhận diện thương hiệu» ra
  ngoài);
- kiểm rằng biểu tượng được dùng đúng cỡ và nét đã ghi;
- cầu nối ra mang tệp dấu sang hệ của Claude;
- mật độ, độ nổi và chuyển động, là ba phần còn lại của tầng nền.

Không làm, kèm lý do:

- plugin tự sinh một dấu: luật 2;
- tra trùng nhãn hiệu: cần dữ liệu pháp lý, không lệnh nào kiểm được;
- bản in có quản lý màu: không phép kiểm nào của plugin đọc được.

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh hay một bản ghi lượt thử.

1. **Repo chưa có dòng nào của hai loại mới không đổi.** `status`, `audit`, `new`, `adopt` và cổng không thêm câu hỏi
   bắt buộc, không thêm tệp, không đổi mã thoát. Có bài kiểm so trước và sau trên bốn loại repo: chưa có sổ, đã nhận,
   do lối dẫn dắt dựng, và không có Makefile.
2. **Hai loại nguồn nằm trong hợp đồng.** `icon-set` và `logo` có hình dạng viết ra; số phiên bản của sổ vẫn là 1.
   Dòng thiếu ghim, hay thiếu giấy phép mà không do lệnh nào đề xuất, làm `ledger-shapes` đỏ, câu đỏ nêu dòng và điều
   thiếu. Bên đọc thư viện không trả hai loại này. Có bài kiểm làm hỏng.
3. **Lệnh viết dòng bộ biểu tượng** từ gói tệp khoá ghim, hay từ một thư mục tệp của repo, băm tại chỗ. Gói tệp khoá
   không ghim thì không có dòng. Lệnh không ghi đè dòng đã có.
4. **Lệnh viết dòng dấu** từ tệp đã trong repo, mỗi tệp một vai và một biến thể; hay từ một gói có tờ kê. Gói thiếu tờ
   kê, hay có tệp lệch mã băm đã kê, bị từ chối bằng một câu nêu tệp. Lệnh không vẽ, không đổi tệp nào, không ghi đè.
5. **Dòng do lệnh viết chưa được giữ** cho tới khi người viết giấy phép. `status` nêu câu ấy là bước kế, và không bao
   giờ điền thay.
   **Sửa 2026-11-28, chờ chủ repo duyệt:** tiêu chí này nay chỉ áp cho thứ mang từ ngoài vào mà không có luật: font,
   logo từ tệp đã có hay do `adopt` đề xuất, bộ biểu tượng là tệp của repo, và gói không khai giấy phép hay chưa cài.
   Dòng `logo` viết từ gói của phích mang giấy phép của luật «tài sản của repo như code» và được giữ ngay; dòng
   `icon-set` của một gói ngoài mang giấy phép gói đã cài tự khai. Cả hai nói trong dòng giấy phép đến từ đâu
   (`licence_from`); máy vẫn không bao giờ viết thay một câu của người. Thêm: lệnh viết dòng `icon-set` cho một bộ chủ
   repo chưa chọn thì xếp đúng một câu hỏi `icon-set:<id>` lên hàng chờ, và nhánh thêm dòng ấy đỏ ở cổng cho tới khi
   chủ repo giữ mục ấy; bộ chủ repo đã bác thì không có dòng.
6. **Lối nhận đề xuất, không ghi đè.** Trên repo có bộ biểu tượng mà cài đặt của thư viện linh kiện nêu, và trên repo
   có tệp biểu tượng trang, `adopt` đề xuất dòng `own`. Thứ nó không đọc được, hay nền dựng bộ chuyển chưa đọc, báo cáo
   nói người viết dòng. Tệp của repo nguyên vẹn. Có bài kiểm.
7. **Cổng giữ ghim.** Đổi một byte của một tệp dấu, hay đổi phiên bản gói biểu tượng trong tệp khoá, làm cổng đỏ và câu
   đỏ nêu dòng. Có bài kiểm làm hỏng cho cả hai.
8. **Cổng giữ biểu tượng.** Trên repo có dòng `icon-set`: nhập từ một gói biểu tượng không có dòng, hay viết một thẻ
   `svg` trong tệp của một màn, làm cổng đỏ; tệp thuộc thư mục một dòng ghi thì không. Danh mục gói biểu tượng là một
   tệp tham chiếu. Có bài kiểm làm hỏng.
9. **Cổng giữ dấu.** Trên repo có dòng `logo`: tệp biểu tượng trang nền dựng khai, và tệp ảnh khung ứng dụng nhập, mà
   không thuộc dòng nào thì cổng đỏ. Có bài kiểm làm hỏng.
10. **Dấu là mục của chủ repo.** `decide --ask` nhận mục `logo:<id>` và bảo dừng. Trên một nhánh thêm một dòng `logo`
    hay đổi tệp của nó, cổng đỏ cho tới khi hàng chờ có lời chủ repo giữ đúng mục ấy. Có bài kiểm.
11. **Lựa chọn dấu ở tầng nền** có hai giá trị: chữ của sàn, hay `source:<id>`. Lối dẫn dắt hỏi một câu; chọn một dòng
    chưa có, chưa có giấy phép, hay ghim không còn đúng thì bị từ chối bằng một câu. Chọn chữ thì không tệp nào sinh ra.
12. **Repo chưa có bộ biểu tượng** được khuyến nghị bộ mà các mảnh của bộ khởi đầu nhập. Tên bộ ấy đọc từ dữ liệu của
    bộ khởi đầu, không viết trong mã lệnh. Dòng chỉ được viết khi tệp khoá đã ghim gói; lệnh không cài và không tải gì.
13. **Câu chuẩn `icons` được đáp.** Dòng sổ quyết định trỏ tới dòng nguồn; `audit` đếm nó là đã giữ khi phép kiểm của
    tiêu chí 8 chạy, và không đếm khi phép kiểm bị gỡ. Có bài kiểm làm hỏng.
14. **`status` và `audit` nói điều còn thiếu** mà không làm cổng đỏ: dấu chưa có biến thể một màu, chưa có biểu tượng
    trang, bộ biểu tượng chưa ghi cỡ. Mỗi dòng nêu lệnh hay skill làm bước kế.
15. **Cuốn hướng dẫn có trang tài sản thương hiệu:** dấu theo vai và biến thể, vẽ từ chính tệp đã ghim; bộ biểu tượng,
    cỡ và nét; với mỗi thứ, dòng của sổ, điều dòng ghim, giấy phép hay «chưa viết giấy phép». Repo chọn chữ của sàn thì
    trang nói vậy.
16. **Phích dựng dấu có trên bảng phích.** Tệp phích khai loại skill, ổ tài sản thương hiệu, và điều nó cần trên máy.
    Bảng phích nêu nó vắng hay có trong phiên, đã đo hay chưa. `plugs` chỉ hỏi chủ repo chọn nó khi đã đo.
17. **Gói của phích qua được lệnh của tiêu chí 4** trên một repo mẫu: dòng `logo` được viết, kèm phích nào dựng và ngày
    nào; tên và ngày của người chọn đến từ tờ quyết định, không từ phích.
18. **Biểu tượng vẽ thêm đi thang.** Một biểu tượng chỉ được vẽ khi bộ đã ghim không có nó; dòng ghi nhu cầu và vì sao.
    Tệp vẽ thêm vào một thư mục mà một dòng `icon-set` của repo ghim, nên tiêu chí 8 không đỏ vì nó.
19. **Lượt đo bốn thước** của phích, trên bản sao bỏ đi, theo đề chuẩn, hai ca: một repo có bộ biểu tượng và chưa có
    dấu, và một repo chưa có gì. Số đo ghi thành một bản quyết định. Khuyến nghị của chủ repo ở ổ này không tự đổi: số
    đo thành một câu hỏi.
20. **Không mạng, không mô hình trong lệnh của plugin.** Bài kiểm không mạng sẵn có phủ hai lệnh mới.
21. **Tên thương hiệu là dữ liệu của người dùng.** Không tệp nào các lát này thêm dưới `plugins/` nêu tên một thương
    hiệu hay một sản phẩm. Mẫu dữ liệu của bài kiểm dùng một tên bịa, và tên ấy chỉ xuất hiện trong repo mẫu.
22. **Sổ giới hạn nói thật.** `capability-brand-assets-has-no-plug` đóng khi tiêu chí 7, 8 và 9 xanh. Mỗi điều các lát
    này không thấy được ghi một dòng: gói biểu tượng ngoài danh mục, cỡ và nét khi dùng, dấu dùng ngoài khung ứng dụng.
23. **Dòng «xong khi» của giai đoạn:**
    - ở ứng dụng mẫu của kho này, bộ biểu tượng có dòng được giữ, lựa chọn dấu có lời chủ repo, và cổng xanh;
    - trên bản sao một repo chưa có gì, một lượt ngồi để lại một bộ biểu tượng đã ghim và một dấu do chủ repo chọn, với
      số lần máy quyết thay bằng 0.

## Domain impact

- **`ontology/` không đổi.** Mô hình nghiệp vụ của ứng dụng mẫu không liên quan.
- **Hợp đồng sổ đổi, cần người duyệt từng lần:**
  - hai loại nguồn mới, `icon-set` và `logo`;
  - giá trị của lựa chọn dấu ở bản thiết kế;
  - hình dạng tờ kê của một gói dấu, là đầu vào của lệnh viết dòng;
  - mục `logo:<id>` của hàng chờ, là mục thứ ba của chủ repo sau kiểu màn và màu thương hiệu.
- **Bảng năng lực:** ổ tài sản thương hiệu có thêm hai phích của plugin và một tệp phích ngoài; câu «logo và bộ biểu
  tượng chưa có chỗ» của ổ được sửa. Không thêm ổ.
- **Tệp phích nói được điều phích cần trên máy.** Hôm nay khoá `needs` chỉ nhận tài khoản và mạng (câu hỏi 8).
- **Danh mục quyết định chuẩn** thêm một câu về dấu ở tầng nền; câu `icons` giữ nguyên chỗ.
- **Một tệp tham chiếu mới:** danh mục gói biểu tượng đã biết.
- **Bảng từ vựng** thêm tên hai lệnh, hai loại nguồn, vai và biến thể của một tệp dấu.
- **Kế hoạch** thêm một giai đoạn khi đề bài được duyệt (câu hỏi 10). Quyết định 0081 không bị sửa.

## Plan

Giai đoạn 12, «Tài sản thương hiệu đủ mảng», vào kế hoạch ngày 2026-11-25 cùng lời duyệt, như giai đoạn 11 đã vào. Nó
đứng sau giai đoạn 7 và chưa mở, nên mọi mục của nó giữ `todo`, kể cả mục 12.0, theo luật của kế hoạch về một giai
đoạn chưa mở. Mỗi lát một PR, gộp theo lời chủ repo.

1. **12.0 Đề bài** này, chủ repo duyệt.
2. **12.1 Bộ biểu tượng** (tiêu chí 1, 2, 3, 5 đến 8, 12, 13, 20 và 21), hai lát:
   - lát 1: loại nguồn `icon-set` trong hợp đồng; lệnh viết dòng; lối nhận đề xuất; cổng giữ ghim;
   - lát 2: danh mục gói biểu tượng; cổng giữ biểu tượng; câu chuẩn `icons` được đáp; khuyến nghị của lối dẫn dắt.
3. **12.2 Dấu** (tiêu chí 4, 9, 10, 11, 14 và 15), hai lát:
   - lát 1: loại nguồn `logo`; lệnh viết dòng từ tệp; lối nhận đề xuất; cổng giữ ghim; lựa chọn chữ của sàn hay nguồn;
   - lát 2: mục `logo:<id>` của chủ repo; cổng giữ dấu; điều còn thiếu ở `status` và `audit`; trang của cuốn hướng dẫn.
4. **12.3 Phích dựng dấu** (tiêu chí 16 đến 19 và 22), hai lát:
   - lát 1: tờ kê trong hợp đồng; lệnh viết dòng từ gói; tệp phích; biểu tượng vẽ thêm đi thang;
   - lát 2: lượt đo, bản quyết định, và sổ giới hạn.
5. **Dòng «xong khi»** là tiêu chí 23.

Việc làm lại skill `logo-design` cho khớp mục «Phích dựng dấu» nằm ở kho của skill ấy, không ở kho này. Nó không chặn
mục 12.1 và 12.2, và phải xong trước lát 2 của mục 12.3.

## Test plan

- Mỗi tiêu chí có bài kiểm của plugin, chạy bằng mẫu dữ liệu, không mạng, không mô hình.
- Phép kiểm làm hỏng cho tiêu chí 2, 4, 7, 8, 9 và 13: dòng thiếu ghim, gói lệch tờ kê, tệp đổi một byte, gói biểu
  tượng không có dòng, biểu tượng trang ngoài sổ, phép kiểm bị gỡ; mỗi lần phải đỏ, hay phải đếm lại, với câu nêu đúng
  chỗ.
- Tiêu chí 1 chạy trên bốn loại repo, để chứng luật «repo chưa có dòng thì không đổi gì».
- Tiêu chí 17 dùng một gói dấu mẫu nằm trong thư mục bài kiểm, không gọi skill nào: bài kiểm của plugin không phụ
  thuộc vào phích.
- Lượt đo của tiêu chí 19 chạy trên bản sao bỏ đi. Không ghi, commit hay đẩy gì ở repo thật nào, và không ghi gì vào
  kho của skill.

## Autonomy tier

Máy tự dựng từng lát sau lời duyệt đề bài, mỗi lát một PR; gộp là lời chủ repo. Luôn là lời chủ repo:

- mỗi thay đổi hợp đồng sổ;
- giấy phép của một bộ biểu tượng và quyền dùng một dấu;
- chọn dấu nào;
- mỗi lượt đo tốn token, kèm ước lượng và trần;
- phát hành phích cho người dùng khác (câu hỏi 9).

Không sửa kho của skill từ kho này. Không sửa Repo Standards, delivery-loop hay repo kiểm chứng.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo nhận cả mười hai ngày 2026-11-25 («Duyệt cả mười hai»).

1. **Hai loại mới vào sổ nguồn, hay một sổ riêng cho tài sản thương hiệu?** Khuyến nghị: sổ nguồn. Căn cứ: font (0081)
   và lõi (0016, câu hỏi 4) đã đi lối ấy; sổ đã có ghim theo mã băm và giấy phép; hợp đồng không thêm sổ. Từ chối thì
   thêm một sổ mới với một bên viết mới, và hai chỗ cùng nói về giấy phép.
   Đã nhận: hai loại mới vào sổ nguồn; hợp đồng không thêm sổ. Thay đổi hình dạng vẫn cần người duyệt ở lát dựng nó.

2. **Sàn của dấu là chữ, plugin không tự sinh hình?** Khuyến nghị: có. Căn cứ: luật 2; và một ô chữ cái sinh từ tên là
   một quyết định thương hiệu không ai đưa. Từ chối thì plugin sinh một ô chữ cái từ tên sản phẩm, màu gốc và bo góc,
   việc ấy cần đọc đường nét của chữ, tức thêm một phụ thuộc cho mọi người cài plugin.
   Đã nhận: sàn của dấu là chữ; plugin không tự sinh hình nào.

3. **Repo chưa có bộ biểu tượng được khuyến nghị bộ mà bộ khởi đầu đang nhập?** Khuyến nghị: có. Căn cứ: hai mảnh của bộ
   khởi đầu đã nhập bộ ấy, nên khuyến nghị bộ khác là để hai bộ trong một repo. Từ chối thì lối dẫn dắt hỏi mà không
   khuyến nghị, và người dùng mới phải tự biết nên chọn gì.
   Đã nhận: repo chưa có bộ biểu tượng được khuyến nghị bộ mà các mảnh của bộ khởi đầu đang nhập.

4. **Danh mục gói biểu tượng đã biết là dữ liệu của plugin?** Khuyến nghị: có, một tệp tham chiếu sửa được, như danh
   mục bằng chứng đã biết. Nêu tên một thư viện mã nguồn mở không phải nêu tên thương hiệu của người dùng. Từ chối thì
   cổng chỉ thấy thẻ `svg` viết thẳng, và một bộ biểu tượng thứ hai vào repo mà không gì báo.
   Đã nhận: danh mục gói biểu tượng đã biết là một tệp tham chiếu của plugin, sửa được.

5. **Dấu là mục của chủ repo, máy dừng?** Khuyến nghị: có, như màu thương hiệu. Căn cứ: dấu khó đảo hơn màu, vì nó ra
   ngoài sản phẩm. Từ chối thì tác tử xếp câu hỏi rồi đi tiếp với phương án nó khuyến nghị, và một dấu chưa ai chốt có
   thể lên tới nhánh chính.
   Đã nhận: dấu là mục của chủ repo; máy dừng, như với màu thương hiệu.

6. **Quyền dùng một dấu ghi ở khoá `licence`, như font?** Khuyến nghị: có. Một khoá, một nghĩa: điều kiện được dùng,
   bằng lời người. Từ chối thì thêm một khoá riêng cho dấu, và hai loại dòng nói cùng một điều bằng hai tên.
   Đã nhận: quyền dùng một dấu ghi ở khoá `licence`, như font.
   **Sửa 2026-11-28, chờ chủ repo duyệt:** khoá `licence` vẫn là một khoá, một nghĩa. Điều đổi là ai viết nó: với logo
   dựng trong repo, lệnh viết theo luật của chủ repo («Đây là giai đoạn tạo ra logo, giống như code việc quyết định nó
   thuộc về người dùng, nếu trong truòng hợp nằm ở repo thì bản quyền thuộc về repo và người tạo.»), và khoá mới
   `licence_from` nói giấy phép đến từ luật chứ không từ một câu của người; với bộ biểu tượng là gói ngoài, lệnh chép
   giấy phép gói tự khai («Lucide-react dùng đúng giấy phép của bộ ngoài») và `licence_from` nêu gói, phiên bản và tệp
   đã khai. Dòng không có `licence_from` là dòng mang câu của người, như trước.

7. **Lựa chọn dấu ở tầng nền; câu `icons` ở lại tầng linh kiện?** Khuyến nghị: có. Căn cứ: dấu đứng cạnh họ chữ và màu
   gốc; bộ biểu tượng là thứ linh kiện nhập. Tầng linh kiện chưa có lối dẫn dắt, nên dòng `icons` do lối nhận và lệnh
   viết dòng đặt. Từ chối thì cả hai về tầng nền, và danh mục quyết định chuẩn phải dời một câu.
   Đã nhận: lựa chọn dấu ở tầng nền; câu `icons` ở lại tầng linh kiện, và dòng của nó do lối nhận và lệnh viết dòng đặt.

8. **Tệp phích nói điều phích cần trên máy bằng một giá trị mới của `needs`?** Khuyến nghị: có. Căn cứ: phích dựng dấu
   không cần tài khoản hay mạng, nhưng cần một bộ chạy và một thư viện vẽ trên máy; hôm nay bảng phích không nói được
   điều ấy, nên người dùng chỉ biết khi nó hỏng. Từ chối thì điều ấy chỉ nằm ở câu mô tả của phích, không lệnh nào đọc.
   Đã nhận: tệp phích nói điều phích cần trên máy bằng một giá trị mới của `needs`; tên giá trị ấy chốt ở lát dựng nó.

9. **Phích dựng dấu được phát hành cho người dùng khác thế nào?** Khuyến nghị: thành một plugin thứ hai của chính nơi
   phát hành này, sau lượt đo, và chỉ sau khi chủ repo xác nhận nguồn gốc và giấy phép của bộ máy dựng hình mà skill
   dựa vào. Cho tới đó phích chỉ có trên máy của chủ repo, và bảng phích ghi nó vắng ở mọi máy khác. Cần xác nhận: bộ
   máy ấy đến từ một tệp nén, không có kho gốc. Từ chối thì phần dựng dấu chỉ phục vụ một người, và với mọi người dùng
   khác «repo chưa có dấu» dừng ở chữ của sàn.
   Đã nhận: phích dựng dấu thành một plugin thứ hai của nơi phát hành này, sau lượt đo và sau khi chủ repo xác nhận nguồn gốc và giấy phép của bộ máy dựng hình. Lời xác nhận ấy chưa có: nó là một lời riêng, không nằm trong lời duyệt này.

10. **Dựng lúc nào so với giai đoạn 7?** Khuyến nghị: thêm giai đoạn 12 vào kế hoạch cùng lời duyệt, và mở nó sau khi
    mục 7.1 xong. Căn cứ: lát 2 của mục 7.1 thêm loại lõi vào đúng phần sổ nguồn của hợp đồng mà mục 12.1 cũng sửa. Từ
    chối thì giai đoạn 12 mở song song, như 10 và 11, và hai nhánh cùng sửa một phần của hợp đồng phải gộp bằng tay.
    Đã nhận: giai đoạn 12 vào kế hoạch cùng lời duyệt, đứng sau giai đoạn 7, và mở sau khi mục 7.1 xong.

11. **Lượt đo của tiêu chí 19 chạy thế nào?** Khuyến nghị: một lượt cho mỗi ca, trên bản sao bỏ đi; trước mỗi lượt máy
    nêu ước lượng token và trần, và chờ lời cho phép. Từ chối thì phích được cắm với chữ «chưa đo», và `plugs` không
    bao giờ hỏi chủ repo chọn nó.
    Đã nhận: một lượt đo cho mỗi ca, trên bản sao bỏ đi; trước mỗi lượt máy nêu ước lượng token và trần, và chờ lời cho phép.

12. **Cỡ và nét khi dùng biểu tượng có vào phép kiểm ở giai đoạn này?** Khuyến nghị: không. Dòng ghi cỡ và nét, cuốn
    hướng dẫn nêu chúng, và một dòng sổ giới hạn nói không gì giữ. Căn cứ: cỡ được viết bằng nhiều cách trong mã, và
    một phép kiểm đoán sai thì tệ hơn không có. Từ chối thì thêm một lát cho phép kiểm ấy, sau khi đo trên hai repo
    thật xem nó báo sai bao nhiêu lần.
    Đã nhận: cỡ và nét khi dùng biểu tượng không vào phép kiểm ở giai đoạn này; một dòng sổ giới hạn nói không gì giữ chúng.
