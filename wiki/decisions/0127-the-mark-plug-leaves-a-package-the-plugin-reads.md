---
type: decision
title: "Phích dựng dấu để lại một gói, plugin đọc gói ấy: tờ kê trong hợp đồng, logo-source --package, tệp phích logo-design, biểu tượng vẽ thêm đi thang"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0124-the-mark-enters-through-the-sources-ledger.md
  - wiki/decisions/0126-the-mark-is-held-asked-for-and-shown.md
  - wiki/decisions/0123-the-icon-set-enters-through-the-sources-ledger.md
  - wiki/decisions/0125-the-gate-holds-which-icons-the-code-uses.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/scripts/logo-source.mjs
  - plugins/design-assembly/scripts/logo-package.mjs
  - plugins/design-assembly/scripts/icon-source.mjs
  - plugins/design-assembly/scripts/icon-drawn.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/scripts/plugs-page.mjs
  - plugins/design-assembly/references/plugs/logo-design.json
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-mark-plug.mjs
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Dựng lát 1» cho câu «Anh cho mở lát 1 của mục 12.3 («Dựng lát 1»), hay chưa mở («Chưa mở»)?»"
---

# 0127 Phích dựng dấu để lại một gói, plugin đọc gói ấy

## Status

Proposed, 2026-11-26, plugin 0.74.0, PR 162. Lát 1 của mục 12.3, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (chủ repo duyệt ngày 2026-11-25, «Duyệt cả mười hai»),
mở theo lời chủ repo «Dựng lát 1». Đổi hợp đồng (hình dạng tờ kê của gói dấu, khoá `drawn` của dòng `icon-set`) và
khoá của tệp phích (giá trị `machine` của `needs`, khoá `machine`), nên chờ chủ repo duyệt ở PR. `ontology/` không đổi.
Mục 12.3 chưa xong: lát 2 (lượt đo, tiêu chí 19 và 22) chưa mở.

## Context

Hai mục 12.1 và 12.2 cho bộ biểu tượng và dấu một chỗ ghi, ghim và cổng giữ. Một repo chưa có dấu dừng ở chữ của sàn:
plugin không vẽ (luật 2 của đề bài). Phần cần gu là việc của một phích ngoài, skill `logo-design`; đề bài không sửa
skill ấy mà nói ổ đòi gì ở nó. Lát 1 của 12.2 để lối gói lại: `logo-source --package` từ chối bằng một câu (giới hạn
`logo-package-manifest-not-read`). Tệp phích hôm nay chỉ nói được tài khoản và mạng (khoá `needs`), không nói được
phích cần gì trên máy (câu hỏi 8). Biểu tượng vẽ thêm chưa có chỗ ghi nhu cầu và lý do.

## Decision

1. **Tờ kê của gói dấu nằm trong hợp đồng** (tiêu chí 4 và 17). Gói là một thư mục của repo, giữ tệp của dấu đã chọn
   và, bên cạnh, `manifest.json`. Tờ kê không phải sổ; nó là đầu vào của lệnh, hình dạng `LOGO_PACKAGE` trong
   `contract.mjs`, phiên bản 1, **đóng** (khoá lạ bị từ chối): `version`, `kind` (`logo-package`), `made` (`by`, id
   của phích, một từ có gạch nối; `on`, ngày), `title` (không bắt buộc), `idea` (câu ý tưởng), `palette` (mỗi màu một
   `name` và `value`), `build` (các con số gốc của phép dựng, một đối tượng) và `files` (ít nhất một; mỗi tệp đường dẫn
   từ thư mục gói, không đi ra ngoài nó, kèm `sha256`, `role`, `variant`, mỗi tệp một lần). Tờ kê **không nêu người
   nào**: vì đóng, một khoá như `chosen` bị từ chối, và `made.by` chỉ nhận một id nên không chứa được địa chỉ thư.
2. **`logo-source --package DIR`** viết dòng `logo` từ gói, thay cho `--file`. Lệnh so mọi tệp với mã băm tờ kê nêu,
   và từ chối bằng một câu nêu tệp: thư mục không phải của repo, gói thiếu tờ kê, tờ kê không trọn, tệp tờ kê nêu mà gói
   không có, tệp lệch mã băm, tệp trong gói mà tờ kê không nêu. Không gì được viết khi ấy. Dòng ghim từng tệp theo
   đường dẫn từ gốc repo, ghi `made` như tờ kê nói (phích nào, ngày nào) và `proposed` như mọi dòng lệnh viết; chờ giấy
   phép của người như trước. Lệnh không vẽ, không dựng lại, không tải, không gọi phích.
3. **Người chọn đến từ tờ quyết định** (tiêu chí 17). Lệnh đọc hàng chờ: lời chủ repo giữ mục `logo:<id>` cho tên và
   ngày, in thành dòng `chosen: by … on …, in … of the waiting list` và trường `chosen` của `--json`. Không có lời ấy
   thì lệnh nêu bước kế là hỏi chủ repo. Tên người không được chép vào dòng sổ: hàng chờ là nơi ghi, tường
   `owner-calls` giữ nhánh như lát 2 của 12.2 ([0126](0126-the-mark-is-held-asked-for-and-shown.md)).
4. **Tệp phích nói được điều phích cần trên máy** (câu hỏi 8, tiêu chí 16). `needs` nhận giá trị thứ ba, `machine`, và
   tệp phích có khoá mới `machine`: một câu nói thứ phải cài trên máy, như `sends` nói nơi gửi khi phích cần mạng. Thiếu
   câu khi có `machine` trong `needs`, có câu mà `needs` không nêu `machine`, hay câu rỗng, đều là lỗi của tệp phích. Bảng
   phích in câu ấy dưới dòng của phích (`on the machine: …`), trang tổng quan cũng vậy, và kết quả `--json` có trường
   `machine` cho mỗi ứng viên (`null` khi phích không nói).
5. **Tệp phích `logo-design`**: loại skill, ổ tài sản thương hiệu, tên skill `logo-design`, `needs: ["machine"]`, câu
   `machine` nói Python 3 và thư viện vẽ mà kịch bản của skill nhập, không gọi dịch vụ nào. Chưa đo, nên bảng phích
   ghi `unmeasured`, và `plugs` liệt kê mà không bao giờ hỏi chủ repo chọn nó; bài kiểm cho thấy khi có số đo thì câu
   hỏi ở ổ ấy được xếp, nên điều giữ nó lại là số đo. Câu `machine` nói thư viện vẽ bằng lời chung, vì kho của skill
   chưa nói tên nó; khi skill làm lại nói tên, tệp phích sửa theo.
6. **Biểu tượng vẽ thêm đi thang** (tiêu chí 18). `icon-source --draw FILE --need NAME --why TEXT` ghi một tệp đã vẽ
   (bởi người hay phích, đã nằm trong repo). Nó từ chối khi sổ nguồn chưa ghim bộ biểu tượng nào (bộ đã ghim là bậc
   trước), khi một bộ đã ghim có biểu tượng cùng tên (gói đọc theo tên tệp của gói đã cài; thư mục theo tên tệp dòng
   ghim; `SealCheck`, `seal_check` và `seal-check` là một tên), và khi gói của một bộ chưa cài nên không đọc được. Tệp
   vào dòng `icon-set` của thư mục chứa nó (mọi ghim cũ giữ nguyên), hay một dòng mới cho thư mục ấy. Dòng có khoá mới
   `drawn`: mỗi mục `file` (một tệp của ghim), `need`, `why` và `on`. Cổng đỏ khi một mục `drawn` nêu tệp ghim không có,
   hay khi dòng của một gói ghi `drawn`. Vì tệp nằm trong thư mục của một dòng `icon-set`, phép kiểm `icon-set-use`
   không đọc nó, nên tiêu chí 8 không đỏ vì nó; cùng hình vẽ ấy trong một màn thì đỏ.
7. **Công cụ đã cài cũ hơn thì không viết gì nó không biết**, theo nếp của PR 157: `--draw` hỏi bản chép
   `sources-ledger.mjs` có `ICON_DRAWN` không, không có thì từ chối và nêu `upgrade` trước. Lối gói dùng chung câu hỏi
   `LOGO_KIND` của `logo-source`, vì khoá `made` có từ lát 1 của 12.2.

## Consequences

- Một repo chưa có dòng nào của hai loại mới không đổi (tiêu chí 1): bảng phích có thêm một dòng của `logo-design`,
  không câu hỏi, không tệp; `status`, `audit`, `new`, `adopt` và cổng như trước.
- Đổi đầu ra: bảng phích có thêm dòng `logo-design +absent, unmeasured, needs machine` và dòng `on the machine: …`;
  `--json` của `plugs` có trường `machine` ở mỗi ứng viên; `logo-source` có thêm dòng `chosen: …` khi hàng chờ có lời
  giữ `logo:<id>`, và khi ấy bỏ dòng `then:`; câu báo lỗi «needs …, which is none of account, network» nay kết thúc bằng
  «account, network, machine».
- Skill `logo-design` phải làm lại ở kho của nó trước lát 2 (dòng giới hạn `logo-design-plug-unmeasured`): đọc lời đáp
  của repo, hai hay ba phương án khác cấu trúc, đúng một câu hỏi `logo:<id>` rồi dừng, và gói có tờ kê theo
  `LOGO_PACKAGE`, không nêu người nào.
- Bảy dòng giới hạn mới: `logo-package-rebuild-unchecked`, `logo-package-palette-not-compared`,
  `logo-choice-of-another-candidate-reads-as-otherwise`, `logo-design-plug-unmeasured`, `plug-machine-needs-unchecked`,
  `icon-drawn-set-read-by-file-names`, `icon-drawn-grid-unheld`. Dòng `logo-package-manifest-not-read` đóng.
- Thấy khi dựng, không sửa ở lát này: khi chủ repo chọn phương án không đứng đầu, tờ quyết định ghi lời đáp là một giá
  trị, và tường `owner-calls` chỉ đọc lời «giữ», nên nói chủ repo đáp khác và vẫn đỏ
  (`logo-choice-of-another-candidate-reads-as-otherwise`). Lượt đo của lát 2 sẽ gặp nó nếu chủ repo chọn phương án thứ
  hai.
