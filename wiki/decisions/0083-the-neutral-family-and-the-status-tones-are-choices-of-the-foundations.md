---
type: decision
title: "Họ trung tính và tông trạng thái là lựa chọn của tầng nền; hai công thức có tên viết chúng cho đủ tương phản ngay từ lúc viết, và cặp chờ lời bị giữ ở tỉ lệ nó bắt đầu chờ"
links:
  - wiki/specs/0012-foundations-wide-enough.md
  - wiki/decisions/0082-the-table-of-colour-roles-and-contrast-on-every-pair.md
  - wiki/decisions/0080-the-typeface-is-a-choice-of-the-foundations.md
  - wiki/decisions/0064-the-owner-fixes-design-principles-and-every-recommendation-says-what-it-rests-on.md
  - wiki/decisions/0065-new-shows-whole-directions-before-any-single-value.md
  - wiki/decisions/0007-adopt-existing-values.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/color-formulas.mjs
  - plugins/design-assembly/templates/tools/design-assembly/theme.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/tailwind.mjs
  - plugins/design-assembly/references/status-tones.json
  - plugins/design-assembly/references/color-roles.json
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/scripts/color-roles.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/scripts/principles.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/tests/test-neutral-status.mjs
  - src/index.css
  - src/components/ui/button.tsx
  - src/components/ui/badge.tsx
  - src/components/ui/alert.tsx
  - "tailwindcss 4.3.5, node_modules/tailwindcss/theme.css: các bước red, green, amber, sky của bảng màu mặc định"
  - "chủ repo, 2026-11-21: «Duyệt cả sáu», đáp câu «Duyệt đề bài 0012 theo cả sáu khuyến nghị?»"
---

# 0083 Họ trung tính và tông trạng thái là lựa chọn của tầng nền

## Status

Đã nhận, 2026-11-22. Mục 9.2, lát 2 của đề bài [0012](../specs/0012-foundations-wide-enough.md): tiêu chí 8, phần còn
lại của tiêu chí 14, và lỗi lượt soát độc lập của lát 1 để lại. Tiêu chí 11 (kho này đáp, rồi cổng giữ mọi cặp) chờ
chủ repo: hai câu nằm trên hàng chờ, và tiêu chí được chứng trên một bản sao bỏ đi với lời đáp niêm phong. Plugin 0.32.0.

## Context

Sau lát 1, mỗi vai màu của sàn có một nguồn nói được, nhưng 19 vai trung tính và vai `--destructive` chỉ có một nguồn
là «giữ của sàn», kèm câu hỏi khuyến nghị chờ lát này. Ở kho này, giữ của sàn thì cặp `--muted-foreground` trên
`--muted` ở giao diện sáng (4,34:1, ngưỡng 4,5:1) thành phép kiểm và cổng đỏ. Chủ repo đã đáp trong đề bài: câu 2, vai
trung tính do công thức viết với hai lựa chọn, xám thuần hay xám ngả về màu gốc, để tương phản đúng ngay từ lúc viết, và
repo đã có giữ giá trị cho tới khi được đáp; câu 3, chủ repo chọn tông nào sản phẩm dùng (lỗi luôn có), sắc độ từ một danh
sách đóng và công thức, màu trạng thái riêng của thương hiệu vào qua dòng `brand-exceptions` và vẫn bị đo; câu 1, không
vai nào chưa ai nói và chủ repo không gõ giá trị nào.

Lượt soát độc lập của lát 1 để lại một lỗi: phép kiểm `contrast` trả «không lỗi» cho mọi cặp có `waits`, nên một cặp
chờ lời tệ đi bao nhiêu cổng vẫn xanh. Dòng ở `design/escapes.md`.

## Decision

1. **Hai lựa chọn mới của tầng nền, mỗi lựa chọn trả lời một câu của bảng vai.** `neutral_family` (`grey`, `tinted`)
   trả lời `color-roles-neutral`; `status_tones` (danh sách trong `error`, `success`, `warning`, `information`, luôn có
   `error`) trả lời `color-roles-status`. Khoá mới của `layers.json`: `asked_by` (câu của bảng mà lựa chọn trả lời),
   `many` và `always`. Lựa chọn chỉ được ghi khi lời chủ repo cho câu ấy là `formula`, và phải được ghi khi lời ấy là
   `formula`; `apply` từ chối cả hai chiều lệch, một danh sách tông thiếu `error`, và một tông ngoài danh sách. Hai câu
   nay nhận `formula` hay `floor`; «giữ của sàn» vẫn là một lời đáp. Tên và ngày của lời đáp nằm ở lời cho câu của bảng
   (`layers.foundations.roles.<câu>`), trang ghi quyết định của tầng nền đọc chúng từ đó.

2. **Công thức `neutral-family`** (`templates/tools/design-assembly/color-formulas.mjs`). Thang độ sáng của 19 vai là
   thang của chính sàn, đọc từ stylesheet của nó, ở cả hai giao diện. Xám thuần giữ độ đậm màu 0; xám ngả lấy sắc độ
   của màu gốc với một phần độ đậm màu của nó: nền và viền 6%, tối đa 0,012; chữ 20%, tối đa 0,04, để mặt lớn thì lặng;
   một màu gốc xám cho họ xám. Mỗi vai đọc như chữ được giải: giữ độ sáng của thang khi mọi nền nó nằm trên đạt ngưỡng,
   không thì đi xa khỏi nền từng bước 0,002 tới độ sáng gần nhất đạt. Ba viền ở giao diện tối sàn vẽ bằng màu trắng
   trong suốt (10%, 15%), nên công thức viết y như vậy và chúng lấy sắc của nền bên dưới. Màu chính và tông trạng thái
   được giải trên nền do họ trung tính viết. Không vai nào giải được thì công thức nói một câu và không viết gì; với
   thang này, ở mọi màu gốc khởi đầu, cả hai mức và cả hai giao diện, không trường hợp nào như thế (bài kiểm chạy hết),
   và câu ấy được chứng bằng một ngưỡng không thể đạt.

3. **Công thức `status-tone` và danh sách đóng** (`references/status-tones.json`). Mỗi tông một vai, một màu cho giao
   diện sáng và một cho giao diện tối. Tông lỗi viết vai của sàn `--destructive`; ba tông kia viết `--success`,
   `--warning`, `--info`, vai sàn không có (bảng ghi `floor: false`, nên không bao giờ nói chúng «giữ của sàn»), và khối
   máy sinh viết thêm `--color-<tên>: var(--<tên>)` trong khối `@theme inline` qua bộ chuyển giá trị, để khung giao diện
   có lớp cho chúng. Công thức giữ sắc độ và độ đậm màu của danh sách, đi xa khỏi nền tới khi tông đạt ngưỡng cho chữ
   trên nền và trên nền nhạt của chính nó: 10% ở giao diện sáng, 20% ở giao diện tối, đúng như linh kiện của sàn vẽ
   (`bg-destructive/10`, `dark:bg-destructive/20` trong nút, nhãn). Độ sáng chỉ được đi trong một dải (không dưới 0,35 ở
   giao diện sáng, không quá 0,9 ở giao diện tối) để tông còn là sắc của nó; ra khỏi dải thì công thức nói một câu và
   không viết gì cho tông ấy. Trên nền của sàn, ở cả hai mức, không tông nào ra khỏi dải; bài kiểm chứng câu ấy trên một
   nền xám giữa. Tông không chọn không viết vai nào.

4. **Dòng `status-tone` của bảng quyết định chuẩn được nối.** Khi chủ repo cho công thức viết tông, `apply` thêm dòng
   `status-tone` (loại `closed`, nguồn là các tông đã chọn và danh sách đóng, ghi chú nêu tên và ngày) với phép kiểm mới
   `tones`: mỗi tông đã chọn là một màu ở mọi giao diện, và không vai nào của tông không chọn được khai; bản sao bị đổi
   khai thêm vai của một tông không chọn. Dòng `color-contrast` đo cặp của mỗi tông đã chọn trên `--background`.

5. **Màu trạng thái riêng của thương hiệu, qua `brand-exceptions`.** Bản thiết kế có
   `layers.foundations.brand_exceptions`, khoá là vai của một tông đã chọn: màu sáng, màu tối, lý do, tên và ngày của
   chủ repo. Khối máy sinh viết đúng màu ấy thay giá trị của công thức. Nó bị đo như mọi vai: `buildTheme` từ chối khi
   màu ấy dưới ngưỡng trên nền, nêu tỉ lệ, nên không bao giờ được viết; dòng `color-contrast` giữ cặp của nó như mọi cặp
   khác, không chờ. `apply` thêm dòng `brand-exceptions` (ghi chú nêu từng vai, lý do, tên và ngày) với một phép kiểm
   `value` cho từng vai ở từng giao diện: sửa tay màu ấy thì cổng đỏ. Thiếu tên hay ngày, hay một vai của tông không
   chọn, thì `apply` từ chối. Nền nhạt của màu riêng không được đo (giới hạn `contrast-two-pairs-only`).

6. **Cặp chờ lời bị giữ ở tỉ lệ nó bắt đầu chờ.** Phép kiểm `contrast` của một cặp chờ mang `measured`, tỉ lệ lúc nó
   bắt đầu chờ, làm tròn tới phần trăm như câu của cổng: tệ hơn thì cổng đỏ dù chủ repo chưa đáp, câu đỏ nêu cả hai tỉ
   lệ. Chạy lại hướng dẫn giữ con số cũ của cặp chờ cùng câu (`pairChecks` đọc phép kiểm của lần trước), nên một con số
   tệ hơn không bao giờ thành điểm khởi đầu mới. Phép kiểm của bản trước, chưa có `measured`, vẫn chỉ được nêu, kèm câu
   nói chạy lại hướng dẫn để giữ nó. Bài kiểm viết trước mã.

7. **Hướng dẫn trình hai lựa chọn như các lựa chọn khác** (0064, 0065). `specimen.mjs --section neutral` vẽ xám thuần
   và xám ngả trên màn thật của repo, sáng và tối, với mọi vai công thức viết, kèm tỉ lệ của `--muted-foreground` trên
   `--muted` và của cặp thấp nhất; `--section status` vẽ từng tông của danh sách, sáng và tối, kèm tỉ lệ trên nền và trên
   nền nhạt, người chọn nhiều chữ cái, tông lỗi luôn được lấy. Khuyến nghị đứng đầu kèm điều nó dựa vào
   (`principles.mjs`): xám thuần, vì họ của sàn là xám thuần, không màn nào đổi sắc và chỉ chữ dưới ngưỡng di chuyển;
   chỉ tông lỗi, vì màn của sàn không dùng tông nào khác và một tông không màn nào dùng là một vai không ai đọc. Tông ngoài
   tông lỗi được vẽ thành mẫu màu cạnh màn, không trên màn (giới hạn mới).

8. **Repo dựng trước bản này.** `upgrade` không ghi `theme.json`, không giá trị nào đổi, cổng xanh. `status` hỏi hai câu
   với khuyến nghị mới: ở repo do hướng dẫn viết, để công thức viết và đáp trong hướng dẫn; ở repo đã `adopt`, công thức
   chỉ viết ở nơi hướng dẫn viết giá trị của repo, nên chờ hay giữ của sàn. Lời đáp «keep» trên hàng chờ đọc theo khuyến
   nghị của bảng vào ngày câu được hỏi (`recommended_since`): câu hỏi trước 2026-11-22 khuyến nghị chờ, nên «keep» khi ấy
   vẫn là chờ, không bị đọc thành công thức. Một lời đáp bằng giá trị của lựa chọn (`tinted`, `error, success`) là
   công thức.

9. **`decide --ask` thay được câu cùng mục.** Lệnh từ chối một câu hỏi về cùng mục với một câu đang chờ, kể cả khi câu
   mới nói nó thay câu ấy (`--replaces`), nên câu cũ của lát 1 không thay được. Nay một câu đang chờ mà câu mới nêu trong
   `--replaces` không chặn nó; câu đã có lời đáp thì vẫn không bao giờ bị thay. Có bài kiểm.

10. **Trang luật và phiếu brief.** Mục «Colour» nêu họ trung tính chỉ khi lời chủ repo cho câu trung tính là công thức,
    và tông trạng thái chỉ khi repo có dòng `status-tone`, màu riêng chỉ khi có dòng `brand-exceptions`. Phiếu `brief`
    đọc chúng qua cùng bộ đọc trang luật. Ổ «nền» của bảng năng lực: phích `color-roles` đọc thêm danh sách đóng và mô-đun
    công thức; ba phép kiểm của bảng vẫn xanh.

11. **Lượt soát độc lập tìm ra, sửa trong cùng thay đổi.** Ba lỗi chặn, mỗi lỗi tái hiện trên kho dựng tạm:
    - Danh sách tông theo thứ tự khác (`["success", "error"]`) hay có lặp làm cổng đỏ ngay sau một lần `apply` hợp lệ,
      vì phép kiểm `blueprint` so mảng theo vị trí. Nay tông là một tập ở cả hai phía, và một tông lặp bị từ chối.
    - Màu riêng của thương hiệu viết hex chữ hoa: trình định dạng của kho viết lại chữ thường và cổng đỏ, chạy lại
      hướng dẫn lại viết chữ hoa. Nay khối và phép kiểm `value` viết màu ấy đúng như trình định dạng để lại.
    - Cặp chờ hai câu, một câu được đáp, câu kia còn chờ: bản đầu tìm `measured` cũ theo đúng chuỗi `waits`, nên một
      con số tệ hơn thành điểm khởi đầu mới. Nay cặp còn chờ một câu nó đã chờ thì giữ con số cũ.
      Bốn điểm nên sửa, đã sửa: bản sao bị đổi của một cặp có `measured` nay đỏ ở chính nhánh «không được tệ đi», không ở
      nhánh «không đọc được»; chủ repo đã chọn chờ họ trung tính (lời «keep» trước bản này) thì được hỏi lại, kèm câu nói
      lựa chọn ấy đã đến; một câu trên hàng chờ có `candidates` thì «keep» lấy ứng viên đầu, nên hai câu của kho này mang
      ứng viên và «keep» ra đúng điều câu khuyên; câu ghi chú và trang luật nói cặp chờ bị giữ ở tỉ lệ nó bắt đầu chờ.

### Điều đã đọc

- `color.mjs` của plugin (không đổi): độ chói tương đối và tỉ lệ tương phản theo WCAG, như đã ghi ở 0082; ngưỡng
  `THRESHOLDS` không đổi. Tôi không đọc lại văn bản WCAG ở lần này.
- Cách tông trạng thái được vẽ trên nền nhạt: `src/components/ui/button.tsx` và `badge.tsx` của sàn dùng
  `bg-destructive/10 text-destructive` và `dark:bg-destructive/20`; `alert.tsx` dùng `text-destructive` trên `bg-card`,
  phần mô tả `text-destructive/90`. Nền nhạt được tính như trình duyệt phủ một màu trong suốt: từng kênh sRGB đã mã hoá
  trộn theo tỉ lệ (`over` trong `color-formulas.mjs`). Tôi không đọc mã của khung giao diện để biết `/10` được viết ra
  thế nào; tôi giả định nó cho màu ấy với độ trong suốt 10%, phủ lên nền bên dưới.
- Danh sách đóng: màu sáng là bước 600 và màu tối là bước 400 của các dải red, green, amber, sky trong
  `node_modules/tailwindcss/theme.css` (bản 4.3.5), đúng cặp bước mà tông lỗi của sàn gốc dùng (red-600 cho sáng,
  red-400 cho tối). Tên thư viện không xuất hiện trong plugin, chỉ ở đây.
- Thang độ sáng của họ trung tính: `src/index.css` của ứng dụng mẫu, phần của sàn.

## Consequences

- Hợp đồng đổi: tầng nền có hai lựa chọn mới (`neutral_family`, `status_tones`) và khoá `asked_by`, `many`, `always`;
  tệp tham chiếu mới `status-tones.json`, danh sách đóng của sắc độ trạng thái; bảng vai màu nói 19 vai trung tính có
  nguồn là công thức `neutral-family`, `--destructive` và ba vai mới `--success`, `--warning`, `--info` có nguồn là
  công thức `status-tone`, mỗi vai chờ câu của nó cho tới khi chủ repo đáp, hai câu nhận `formula` hay `floor`; bản
  thiết kế có `brand_exceptions`; `theme.json` có `inputs.neutralFamily`, `inputs.statusTones`, `inputs.exceptions`;
  phép kiểm `contrast` có `measured`; phép kiểm mới `tones`; dòng `status-tone` và `brand-exceptions` của bảng quyết
  định chuẩn có lệnh kiểm.
- Kho này: không giá trị nào đổi. Hai câu `neutral-family` và `status-tones` nằm trên hàng chờ, thay hai câu cũ của lát
  1, mỗi câu một khuyến nghị và điều nó dựa vào, đo trên một bản sao bỏ đi: họ trung tính xám thuần (chỉ đổi
  `--muted-foreground` ở giao diện sáng, 0,556 thành 0,546, cặp lên 4,52:1); tông trạng thái giữ `--destructive` của
  sàn, vì kho này đã làm đậm nó (7,16:1 trên nền, 4,86:1 lúc rê chuột) và công thức viết một màu nhạt hơn (5,38:1 trên
  nền, 4,50:1 trên nền nhạt, 3,71:1 lúc rê chuột). Trên bản sao với lời đáp niêm phong (thanh bên đi theo, trung tính
  công thức xám thuần, trạng thái giữ của sàn, biểu đồ giữ của sàn), cổng giữ 30 cặp, không cặp nào chờ, và `make check`
  xanh.
- Giới hạn: `contrast-two-pairs-only` và `color-role-answer-written-by-hand` thu hẹp. Bốn dòng mới:
  `status-tone-hues-copied-into-tool-data`, `status-tone-beyond-error-drawn-on-no-screen`,
  `neutral-formula-needs-the-guide`, `color-role-keep-reads-the-table`. `hover-contrast-unchecked` giữ nguyên: đề bài để
  ngoài, và số đo trên kho này cho thấy công thức có thể làm nó tệ đi.
