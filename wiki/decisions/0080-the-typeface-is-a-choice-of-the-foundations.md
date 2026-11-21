---
type: decision
title: "Kiểu chữ là một lựa chọn của tầng nền; khối máy sinh nêu nó sau khai báo của sàn, và cổng giữ rằng nó được nạp"
links:
  - wiki/specs/0012-foundations-wide-enough.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0064-the-owner-fixes-design-principles-and-every-recommendation-says-what-it-rests-on.md
sources:
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/standard-decisions.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/templates/tools/design-assembly/theme.mjs
  - plugins/design-assembly/templates/tools/design-assembly/fonts.mjs
  - plugins/design-assembly/templates/tools/design-assembly/tokens.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/tailwind.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/css-fonts.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/vite.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs-build.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/tests/test-typeface.mjs
  - "chủ repo, 2026-11-21: «Duyệt cả sáu», đáp câu «Duyệt đề bài 0012 theo cả sáu khuyến nghị?»"
---

# 0080 Kiểu chữ là một lựa chọn của tầng nền; khối máy sinh nêu nó sau khai báo của sàn, và cổng giữ rằng nó được nạp

## Status

Accepted, 2026-11-21. Mục 9.1, lát 1 của đề bài [0012](../specs/0012-foundations-wide-enough.md): tiêu chí 1, 3, 4, và
phần kiểu chữ của tiêu chí 10. Plugin lên 0.29.0. Lát 2 (font qua sổ nguồn, `adopt` giữ font của repo, cuốn hướng dẫn,
tiêu chí 2 và 5) chưa dựng.

## Context

Tầng nền chốt năm điều, không điều nào là họ chữ. Ứng dụng mẫu dùng font của sàn: phần của sàn trong `src/index.css`
nhập một gói font và khai `--font-sans`, `--font-heading` trong khối `@theme inline` của nó. Nền dựng thứ hai nạp font
bằng bộ nạp font riêng trong một tệp layout, bộ nạp ấy đặt một biến CSS. Không có lựa chọn, token hay lệnh kiểm nào cho
họ chữ, và một họ chữ được nêu mà không gì nạp thì trang lặng lẽ hiện họ dự phòng.

Chủ repo đã chốt trong đề bài: kiểu chữ của giai đoạn này là họ chữ văn bản và họ chữ tiêu đề; độ đậm và giãn chữ để
ngoài; máy không tải font; mã nạp chỉ viết ở nền dựng mà bộ chuyển biết cách; repo dựng trước bản này không bị đổi giá
trị hay đỏ cổng, lựa chọn mới là một câu chờ chủ repo.

## Decision

1. **Hai lựa chọn mới của tầng nền.** `text_font` (`floor`, `system`) và `heading_font` (`text`, `floor`, `system`).
   Giá trị thứ ba, `source` (font có dòng trong sổ nguồn), được nêu dưới khoá mới `not_yet` của `layers.json`: hỏi nó
   thì bị từ chối bằng một câu nói dòng nguồn đến ở bản sau. Hai lựa chọn đi cùng nhau; một nửa lời đáp bị từ chối.
2. **Lời đáp của chủ repo mang tên và ngày.** Ở bản thiết kế, khi lớp có nguồn `user` hoặc khoá nằm trong `confirmed`,
   `answered.<khoá>` phải có `by` và `on`; thiếu thì `apply` từ chối. Đề xuất của máy không có tên: dòng sổ nói chưa ai
   xác nhận, và phiếu quyết định hỏi nó. Khi chủ repo giữ dòng `typeface` trên phiếu, `decide` ghi cả hai khoá vào
   `confirmed` và `answered`, nên lần chạy lại của `new` giữ nó là của chủ repo. Trang ghi quyết định nêu lời đáp kèm
   tên và ngày.
3. **Khối máy sinh nêu hai họ chữ, sau khai báo của sàn.** Khung giao diện chép giá trị của biến chủ đề vào lớp dùng nó,
   nên khai `--font-sans` trong `:root` không đổi được lớp nào; chỉ khai trong khối `@theme inline` mới có hiệu lực, và
   khai báo cuối cùng thắng. Vì vậy khối máy sinh, nằm cuối stylesheet, viết một khối `@theme inline` riêng với hai biến.
   **Quan hệ với khai báo của sàn:** phần của sàn không bị sửa; khai báo của sàn là tầng dưới, khối của máy là tầng trên,
   đúng lối `--primary` và `--radius` đã có. Khi chủ repo giữ font của sàn, khối chép nguyên giá trị sàn khai, nên hai
   khai báo nói cùng một điều. Khi chọn khác, chỉ một giá trị có hiệu lực, giá trị của khối, và dòng `typeface` giữ điều
   ấy: một khai báo nào sau khối nêu họ khác thì cổng đỏ. Tên biến, tên khối và cách xem thử nằm ở bộ chuyển giá trị
   (`adapters/tailwind.mjs`), không ở lõi.
4. **Bản thiết kế chưa đáp thì khối không nêu gì.** `fontValues` trả null khi không có lời đáp: khối của repo dựng trước
   bản này giống từng byte, kiểm `generated` vẫn xanh.
5. **Sổ token có nhóm `font`, kiểu `fontFamily`.** Mỗi biến `--font-*` của các khối `@theme` của repo thành một token
   (bỏ `--font-weight-*`; một biến trỏ tới biến do bộ nạp font đặt lúc trang chạy thì không có giá trị trong stylesheet,
   nên không thành token và không bị gọi là trỏ vào hư không). `$value` là họ đầu tiên của danh sách, dạng chuỗi mà định dạng cho phép: luật có sẵn của tệp
   token là không có mảng, vì trình định dạng sẽ xếp mảng theo lối của nó và tranh với bộ sinh. Cả danh sách như
   stylesheet viết nằm ở `$extensions`. Nhóm này đọc stylesheet, không đọc lời đáp: repo nào cũng có nó ở lần viết lại
   tệp token kế tiếp, và giá trị chỉ mô tả cái đã có.
6. **Lệnh kiểm «được nạp», dòng `font-loaded`.** Họ đầu tiên của mỗi biến văn bản và tiêu đề phải được nạp, hoặc là họ
   chung mọi máy có (`system-ui`, `sans-serif`...). Ai nạp là việc của bộ chuyển của nền dựng mà repo dùng
   (`buildOf`, nay ở `adapters/index.mjs`, `stage.mjs` dùng lại): nền dựng thứ nhất đọc quy tắc `@font-face` của
   stylesheet và gói font stylesheet nhập, đọc ở chỗ repo đã cài; nền dựng thứ hai đọc thêm bộ nạp font trong tệp layout,
   biến nó đặt và họ nó nạp theo tên. Không gì được tải. Câu đỏ nêu biến, tệp stylesheet và họ chữ. Bản sao bị đổi thêm
   một khai báo nêu một họ không ai nạp. `apply` chỉ thêm dòng này khi nó xanh hôm nay; khi không, nó in một `note:`.
7. **Repo dựng trước bản này.** `upgrade` không ghi `theme.json` nên không thêm dòng nào; tệp token có thêm nhóm `font`
   (thêm, không đổi). `status` nêu câu `typeface` cho repo do `new` viết khối mà sổ chưa có dòng ấy và hàng chờ chưa
   có câu nào mang `decision:typeface`, kèm khuyến nghị giữ font của sàn và lệnh `/design-assembly:new`. Repo đã
   `adopt` giá trị của chính nó không được hỏi ở lát này (`typeface-not-asked-of-adopted-repo`).
8. **`new` hỏi như các lựa chọn khác.** Bảng mẫu có hai phần, `--section typeface`: văn bản trước, rồi tiêu đề cạnh
   văn bản đã chọn. Mỗi phương án vẽ đúng điều khối sẽ đặt, qua cách xem thử của bộ chuyển. Khuyến nghị là font của sàn,
   tiêu đề cùng họ, kèm điều nó dựa vào.
9. **Trang luật và phiếu `brief`.** Trang luật có mục «Type» chỉ khi repo có dòng `typeface` hoặc `font-loaded`. Phiếu
   `brief` đọc các dòng ấy qua đúng bộ đọc của khe luật, không bộ đọc riêng.
10. **Tám bài kiểm cũ được chỉnh cho đúng nghĩa của chúng.** Kho dựng tạm của các bài `status`, `command-contract`,
    `document` nay đáp kiểu chữ có tên và ngày, như repo của bản này. Kho của `decide`, nơi mọi lời đều là đề xuất,
    có thêm một đề xuất `typeface` và các con số đếm tăng theo; bài ghim hàng chờ thật của kho này nhận thêm đúng một
    loại câu, `decision:typeface`. Bài so `audit` với bản trước khi đổi tên nay chép cả công cụ hiện tại sang bên cũ,
    như nó đã chép `references/`: chỉ script là khác. `tokens`, `principles`, `specimen` thêm điều mới (nhóm `font`, hai
    khuyến nghị, hai phần của bảng mẫu); không bài nào bị nới để che một lỗi.
11. **Lời đáp trên hàng chờ tới bản thiết kế qua `new`.** `decide` ghi lời chủ repo vào tệp câu hỏi, không vào bản
    thiết kế. Vì vậy `status` thôi nêu câu `typeface` chỉ khi câu trên hàng chờ còn chờ; khi nó đã có lời đáp mà sổ
    chưa có dòng `typeface`, `status` nêu lại, kèm tên và ngày của lời đáp, và chỉ `/design-assembly:new` để ghi nó.
12. **Cổng không dừng giữa chừng.** Khi sàn thôi khai font mà chủ repo đã chọn giữ, phép kiểm `generated` đỏ bằng một
    câu nói điều ấy, thay vì để lỗi văng ra khỏi `make check`.

## Consequences

- Hợp đồng đổi ba chỗ: tầng nền thêm `text_font` và `heading_font` (và khoá `not_yet`, `answered`); sổ token thêm nhóm
  `font`; bảng quyết định chuẩn thêm hai dòng, `typeface` và `font-loaded`.
- Kho này: chủ repo chưa đáp. Câu hỏi nằm trên hàng chờ (`design/waiting/typeface-of-text-and-headings.json`), khuyến
  nghị giữ font của sàn cho cả văn bản và tiêu đề. Khối máy sinh của kho không đổi; cổng giữ thêm dòng `font-loaded`.
- Sáu dòng giới hạn mới: `font-weight-and-letter-spacing-unheld`, `font-loading-code-not-written`,
  `typeface-not-asked-of-adopted-repo`, `font-loaded-reads-first-family-by-name`, `font-package-read-where-installed`,
  `font-loader-reader-unproven`. Dòng `no-tokens-beyond-color-radius-text` thu hẹp: tệp token nay có cả kiểu chữ.
- Không đổi `ontology/`, phần của sàn trong stylesheet, năm tệp của Repo Standards hay `.github/workflows/`; không thêm
  gói nào; không lệnh nào gọi mạng.
