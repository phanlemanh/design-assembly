---
type: decision
title: "Font vào qua sổ nguồn: một loại nguồn «font» có ghim và giấy phép, giá trị thứ ba của lựa chọn kiểu chữ, và adopt giữ font của repo"
links:
  - wiki/specs/0012-foundations-wide-enough.md
  - wiki/decisions/0080-the-typeface-is-a-choice-of-the-foundations.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
sources:
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/theme.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/lockfile.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/css-fonts.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/vite.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs-build.mjs
  - plugins/design-assembly/scripts/font-source.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/tests/test-font-source.mjs
  - plugins/design-assembly/tests/helpers/no-network.mjs
  - "tài liệu đi kèm trình quản lý gói: docs/content/configuring-npm/package-lock-json.md"
  - "tài liệu đi kèm nền dựng thứ hai, bản 16.4.6: dist/docs/01-app/03-api-reference/02-components/font.md"
  - "kiểu đi kèm nền dựng thứ nhất, bản 8.3.8: dist/node/index.d.ts, chú thích của publicDir"
  - "chủ repo, 2026-11-21: «Duyệt cả sáu», đáp câu «Duyệt đề bài 0012 theo cả sáu khuyến nghị?»"
---

# 0081 Font vào qua sổ nguồn: một loại nguồn «font» có ghim và giấy phép, giá trị thứ ba của lựa chọn kiểu chữ, và adopt giữ font của repo

## Status

Accepted, 2026-11-21. Mục 9.1, lát 2 của đề bài [0012](../specs/0012-foundations-wide-enough.md): tiêu chí 2, 5 và
phần font của tiêu chí 14. Plugin lên 0.30.0. Cùng lát 1 ([0080](0080-the-typeface-is-a-choice-of-the-foundations.md)),
mọi tiêu chí của mục 9.1 đã có bài kiểm.

## Context

Sau lát 1, kiểu chữ là một lựa chọn của tầng nền với hai giá trị, font của sàn và font hệ thống. Giá trị thứ ba, một font
có dòng trong sổ nguồn, bị từ chối bằng một câu dưới khoá `not_yet`. Sổ nguồn (0057) chỉ tả thư viện khối: mỗi dòng có
`catalog` và một ghim, không có loại, không lệnh nào của plugin ghi nó. Ổ cắm «tài sản thương hiệu» chưa có phích nào.
Cuốn hướng dẫn đọc `--font-sans` mà không nói font ấy đến từ đâu. `adopt` giữ màu chính của repo (0007) nhưng không đọc
font của repo.

Chủ repo đã chốt ở câu 5 của đề bài: `new` và `adopt` viết dòng nguồn khi font là một gói tệp khoá đã ghim, hoặc là tệp
đã nằm trong repo, băm tính tại chỗ; máy không tải font; mã nạp chỉ viết ở nền dựng bộ chuyển biết cách, nơi khác người
viết, và lệnh kiểm `font-loaded` giữ cả hai; giấy phép là trường bắt buộc, người điền. Logo và bộ biểu tượng để ngoài.

## Decision

1. **Một loại nguồn mới, `font`.** Dòng có `kind: "font"`, `family` (tên stylesheet gọi), không có `catalog`, có thể có
   `variable` (biến CSS bộ nạp font của nền dựng đặt cho nó) và `title`. Hai điều bắt buộc với loại này: **ghim**, nằm
   ngay trong dòng (không qua `pin_file`), là `package` với `version` tệp khoá ghim, hoặc `files`, mỗi tệp font có
   đường dẫn từ gốc repo và `sha256`, có thể kèm `weight`, `style`; và **giấy phép**, `licence`, bằng lời của một người.
   Dòng thiếu ghim, hay thiếu giấy phép mà không do lệnh nào đề xuất, làm dòng `ledger-shapes` đỏ, câu đỏ nêu dòng và
   điều thiếu. Dòng không có `kind`, hay có một chữ của riêng repo, vẫn là thư viện và được đọc y như trước; số phiên
   bản của sổ vẫn là 1. `readPinnedSources` chỉ trả thư viện; `readFontSources` đọc font, so ghim với cái repo đang có
   (phiên bản tệp khoá ghim, băm của từng tệp) và nói điều không so được.
2. **Dòng do lệnh viết thì chưa được giữ.** Lệnh viết dòng ghi `proposed: { by, on }` và không ghi giấy phép. Dòng như
   vậy hợp hình, cổng vẫn xanh, nhưng font chưa chọn được, và `status` nêu câu `font-licence-<id>` là bước kế, kèm điều
   tệp khoá nói gói nêu giấy phép gì để người đọc, không bao giờ điền thay. Khi người viết giấy phép, dòng được giữ từ
   đó. `own: true` nói font này repo đã tự nạp trước khi có dòng.
3. **Giá trị thứ ba của lựa chọn kiểu chữ: `source:<id>`.** Khoá `not_yet` và câu «bản sau» bị bỏ; `layers.json` nay
   nói dưới `sourced` rằng lựa chọn nhận một dòng của sổ nguồn. Chọn một font không có dòng thì bị từ chối bằng một câu
   nêu tệp dòng còn thiếu; dòng chưa có giấy phép, hay ghim không còn đúng, cũng vậy. Khối máy sinh nêu họ chữ bằng tên,
   hoặc bằng biến bộ nạp đặt, rồi font hệ thống. Sổ token đi theo stylesheet như mọi giá trị khác, và `font-loaded` giữ
   font ấy như giữ mọi họ chữ khác. Kiểm `generated` viết lại khối từ dòng ở mỗi lần chạy, nên dòng bị xoá, mất giấy
   phép, hay ghim lệch khỏi repo thì cổng đỏ và câu đỏ nêu dòng.
4. **Ai viết dòng.** Một lệnh mới, `scripts/font-source.mjs`, viết dòng từ cái repo đang có: `--package` (phiên bản lấy
   từ `package-lock.json`; gói tệp khoá không ghim thì không có dòng) hoặc `--files` (tệp đã trong repo, băm tại chỗ).
   `new` chạy nó như một bước của trang skill, theo lời người; `adopt` tự đề xuất dòng cho font repo đang nạp. Lệnh không
   bao giờ ghi đè một dòng đã có và không chạm mạng.
5. **Mã nạp, nói thẳng theo từng nền dựng.** Ở lát này, **nền dựng thứ nhất** (bộ chuyển `vite`) là nền duy nhất mà
   máy viết mã nạp: với font giữ bằng tệp trong repo, khối máy sinh có một quy tắc `@font-face` cho mỗi tệp, địa chỉ đi
   từ thư mục của stylesheet, hay từ gốc trang khi tệp ở thư mục `public`. Với font là một gói, máy không viết gì vào
   khối (một dòng nhập ở cuối stylesheet không được đọc): nó in đúng dòng `@import "<gói>";` để người viết ở đầu
   stylesheet, rồi chạy lại. Ở **nền dựng thứ hai** (bộ chuyển `next.js`), máy không viết mã nạp nào: người gọi bộ nạp
   font của nền dựng trong một tệp layout, đặt biến mà dòng nêu, như câu máy in ra. Ở cả hai, `font-loaded` đỏ cho tới
   khi có gì nạp font.
6. **`adopt` giữ font của repo, trên cả hai nền dựng.** Nó đọc font repo đang nạp qua bộ chuyển của nền dựng: gói mà
   stylesheet nhập (ghim theo tệp khoá), quy tắc `@font-face` mà mọi địa chỉ là tệp trong repo, hay lời gọi bộ nạp font
   cục bộ của nền dựng thứ hai mà đường dẫn `src` là tệp trong repo. Mỗi font ấy được đề xuất thành một dòng `own: true`.
   Nó cũng giữ họ chữ như tìm thấy (dòng `typeface`, chỉ khi không có khối máy sinh) và rằng chúng được nạp
   (`font-loaded`). Nó không ghi đè gì: stylesheet, tệp layout, tệp khoá, dòng đã có đều nguyên. Font nạp từ địa chỉ ngoài
   repo, hay từ bộ nạp lấy font ở nơi khác, không có dòng: báo cáo nói người viết dòng, và không tải gì.
7. **Cuốn hướng dẫn nêu font và nơi nó đến.** Trang kiểu chữ nêu từng font của văn bản và tiêu đề: dòng của sổ nguồn,
   điều dòng ghim, giấy phép hay «chưa viết giấy phép», và ghim còn đúng không; font chưa có dòng thì nêu cái gì nạp nó
   và rằng sổ chưa có dòng. Câu «tệp font không nằm trong cuốn sổ» vẫn đứng.
8. **Bảng năng lực.** Ổ «tài sản thương hiệu» có phích `font-source`, mặc định, bước của `new`. Phích ghi dòng vào sổ
   của ổ «tham khảo» (`writes_through: "reference"`), nên sổ nguồn vẫn chỉ một ổ viết; luật «không chồng» được dạy điều
   ấy, và lộ trình `new`, `adopt` đi qua ổ này. Giới hạn của ổ thu hẹp còn logo và bộ biểu tượng, không đóng.
9. **Không lệnh nào gọi mạng, và có bài kiểm.** `tests/helpers/no-network.mjs` nạp trước mỗi lệnh: kết nối TCP ra
   ngoài máy này (theo tên hay theo địa chỉ, qua socket hay qua trình khách web của node), tra tên bằng callback hay bằng
   promise, `fetch` và socket datagram đều ném lỗi và được ghi lại; tiến trình con chạy bằng node thừa hưởng lá chắn qua
   `NODE_OPTIONS`, trừ khi nó được chạy với một môi trường riêng bỏ biến ấy đi. Bài kiểm chạy `apply`, `specimen`,
   `adopt`, `font-source`, `status`, `decide`, `book --facts`, `upgrade` và cổng với lá chắn ấy; sáu lần thử (một
   `fetch`, một kết nối tới địa chỉ, một yêu cầu web tới địa chỉ, hai lần tra tên bằng promise, một `fetch` ở tiến trình
   con) đều bị bắt, nên lá chắn không xanh vì không thấy gì.
10. **Lần soát độc lập.** Người soát duyệt, không điểm chặn, bốn điểm nên sửa, cả bốn sửa trong cùng commit: lá chắn
    mạng bỏ sót kết nối tới địa chỉ và tra tên bằng promise; một dòng font sai hình ở `weight` hay `style` vẫn được coi
    là đủ và lọt vào khối (nay bộ đọc từ chối mọi trường sai mẫu trước khi chạm stylesheet, mẫu nằm một chỗ cho cả hợp
    đồng và bộ đọc); đường dẫn chỉ được xét theo chữ, nên một liên kết trong repo trỏ ra ngoài được nhận (nay xét theo nơi
    liên kết dẫn tới); và dòng giới hạn `typeface-not-asked-of-adopted-repo` bị đóng dù câu của nó vẫn đúng (nay mở lại,
    thu hẹp).

### Điều đã đọc của gói ngoài

- **Tệp khoá**: tài liệu đi kèm trình quản lý gói, `package-lock-json.md`. `packages` ánh xạ chỗ của từng gói, từ gốc
  repo (`node_modules/<tên>`), tới `version` tìm thấy trong gói và `license` gói nêu; bản cũ nhất giữ `dependencies` theo
  tên. Bộ đọc `adapters/lockfile.mjs` đọc đúng hai chỗ ấy và chỉ tệp ấy.
- **Bộ nạp font cục bộ của nền dựng thứ hai**, bản 16.4.6: `src` là đường dẫn «tương đối với thư mục nơi hàm nạp font
  được gọi», chuỗi hoặc mảng `{ path, weight, style }`; `variable` là biến CSS nó đặt. Bộ đọc đi từ thư mục của tệp layout.
- **Thư mục tĩnh của nền dựng thứ nhất**, bản 8.3.8: `publicDir` mặc định là `public`, phục vụ nguyên trạng từ gốc
  trang. Địa chỉ bắt đầu bằng `/` được tìm ở đó; thư mục khác do cấu hình đặt thì không đọc (ghi ở giới hạn).

## Consequences

- Hợp đồng đổi ba chỗ, chỉ thêm: sổ nguồn có loại `font` với ghim và giấy phép bắt buộc (`references/contract.md`); lựa
  chọn kiểu chữ nhận `source:<id>`; bảng năng lực có phích `font-source` và trường `writes_through`.
- Kho này: câu kiểu chữ chủ repo đáp («Giữ font của sàn») không đổi. Font của sàn có dòng đề xuất
  `design/sources/geist.json`, ghim `@fontsource-variable/geist` ở 5.3.0 như `package-lock.json` ghim, chưa có giấy
  phép; câu `font-licence-geist` chờ chủ repo trên hàng chờ, kèm khuyến nghị và điều nó dựa vào. Máy không điền giấy phép.
- Giới hạn: đóng `book-fonts-unnamed`; thu hẹp `capability-brand-assets-has-no-plug` (còn logo, bộ biểu tượng),
  `font-loading-code-not-written` và `typeface-not-asked-of-adopted-repo` (repo đã `adopt` giữ kiểu chữ như tìm thấy,
  nhưng không được hỏi có muốn kiểu chữ khác không); thêm
  `font-pin-reads-one-lockfile`, `font-pin-of-unchosen-font-unheld`, `font-licence-is-words`,
  `own-font-row-from-reading`, `font-row-written-from-guide-by-command`.
- Không đổi `ontology/`, phần của sàn trong stylesheet, năm tệp của Repo Standards hay `.github/workflows/`; không thêm
  gói nào.
