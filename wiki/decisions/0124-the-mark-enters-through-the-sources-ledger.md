---
type: decision
title: "Dấu vào sổ nguồn: loại nguồn «logo» có ghim theo từng tệp và giấy phép, lệnh logo-source, adopt đề xuất từ biểu tượng trang, cổng giữ ghim, và lựa chọn dấu ở tầng nền"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0081-a-font-enters-through-the-sources-ledger.md
sources:
  - plugins/design-assembly/scripts/logo-source.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/vite.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/nextjs-build.mjs
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-logo-source.mjs
  - plugins/design-assembly/tests/test-no-mark.mjs
  - plugins/design-assembly/tests/helpers/no-mark-on-0.69.0.json
  - "phiên điều phối, 2026-11-26: chủ repo đáp «Mở hai lát» cho câu «Anh cho mở lát 1 của 12.1 («Dựng lát 1»), hay mở song song cả lát 1 của 12.1 và 12.2 («Mở hai lát»)?»"
---

# 0124 Dấu vào sổ nguồn, cổng giữ ghim, và lựa chọn dấu ở tầng nền

## Status

Proposed, 2026-11-26, plugin 0.71.0 (gộp sau lát 1 của mục 12.1, plugin 0.70.0). Lát 1 của mục 12.2 trong kế hoạch, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (chủ repo duyệt ngày 2026-11-25, «Duyệt cả mười hai»),
mở song song với lát 1 của mục 12.1 theo lời chủ repo «Mở hai lát». Đổi hợp đồng sổ và giá trị của bản thiết kế, nên
chờ chủ repo duyệt ở PR. `ontology/` không đổi.

## Context

Ổ tài sản thương hiệu chỉ có phích cho font ([0081](0081-a-font-enters-through-the-sources-ledger.md)): dấu của sản
phẩm không có chỗ ghi, và không phép kiểm nào giữ nó. Đề bài 0017 chia mục 12.2 làm hai lát. Lát 1 là: loại nguồn
`logo`; lệnh viết dòng từ tệp đã có trong repo; lối nhận đề xuất; cổng giữ ghim; lựa chọn giữa chữ của sàn và một
nguồn. Lát 2 giữ phần còn lại: mục `logo:<id>` của chủ repo trên hàng chờ, cổng giữ rằng biểu tượng trang và ảnh khung
ứng dụng là tệp của một dòng, điều còn thiếu ở `status` và `audit`, và trang của cuốn hướng dẫn.

Luật đầu tiên của đề bài: repo chưa có dòng nào của loại mới thì không đổi gì.

## Decision

1. **Loại nguồn `logo` trong hợp đồng.** Một dòng `design/sources/<id>.json` (id mặc định `logo`) có `pin.files`: mỗi
   tệp với `file`, `sha256`, `role` (`mark`, `wordmark`, `lockup-horizontal`, `lockup-vertical`, `favicon`, `app-icon`)
   và `variant` (`color`, `mono`, `inverse`); có thể có `title`, `own`, `proposed` và `made` (ai dựng, ngày nào). Không
   có `catalog`: bên đọc thư viện bỏ qua nó. Quyền dùng ghi ở `licence`, như font (câu hỏi 6 của đề bài). Dòng thiếu ghim,
   tệp thiếu vai hay biến thể, một tệp nêu hai lần, hay thiếu giấy phép mà không do lệnh nào đề xuất: `ledger-shapes` đỏ,
   câu đỏ nêu dòng. Số phiên bản của sổ vẫn là 1. Mã đọc dấu nằm trong `sources-ledger.mjs`, không ở một tệp công cụ
   mới, vì một tệp mới sẽ được chép vào mọi repo, kể cả repo chưa có dấu.
2. **Lệnh `logo-source`** viết dòng từ tệp đã trong repo: `--file PATH:ROLE:VARIANT`, mỗi tệp một lần, băm tại chỗ.
   Tệp không có, thiếu vai hay biến thể, vai lạ, tệp nêu hai lần, hay dòng đã có: từ chối, thoát 2, không ghi gì. Không
   vẽ, không tải, không đổi tệp nào. Dòng ghi `proposed`, thoát 1 vì giấy phép chờ người. Nơi cổng đã đặt, lệnh thêm
   phép kiểm `logo-pins` vào `ledger-shapes`. Gói có tờ kê (lát 1 của mục 12.3) bị từ chối bằng một câu: `--package`
   nói «a package of mark files with its manifest is not read yet».
3. **Dòng do lệnh viết chưa được giữ** cho tới khi người viết `licence`. `status` xếp câu `logo-licence-<id>` lên phần
   chờ: «Who holds the right to use the mark …, and where may it be used?», và không bao giờ điền thay.
4. **`adopt` đề xuất, không ghi đè.** Bộ chuyển của nền dựng nói biểu tượng trang ở đâu: một nền đọc các thẻ `link`
   có `rel` chứa `icon` hay `apple-touch-icon` trong `index.html` (đường dẫn từ gốc trang đi vào thư mục công khai); nền
   kia đọc các tệp `favicon.ico`, `icon.*`, `apple-icon.*` ở đầu thư mục ứng dụng. `adopt` đề xuất một dòng `logo`,
   `own: true`, mỗi tệp băm tại chỗ, biến thể `color` kèm một dòng nhờ người sửa. Biểu tượng ở địa chỉ ngoài repo hay tệp
   không có: báo cáo nói người viết dòng bằng `logo-source`. Dòng đã có: giữ nguyên. Repo không khai biểu tượng nào:
   không nghe gì về dấu.
5. **Cổng giữ ghim.** Phép kiểm `logo-pins`, đặt dưới `ledger-shapes` chỉ khi repo có dòng `logo` (bởi `logo-source`,
   `adopt`, `upgrade` và lối dẫn dắt), đỏ khi một tệp của ghim đổi một byte, mất, hay dẫn ra ngoài repo; câu đỏ nêu dòng:
   «design/sources/logo.json: … is not the file it was pinned with: its sha256 differs from the pin».
6. **Lựa chọn dấu ở tầng nền**, khoá `mark`: `text` (dấu của sàn, tên sản phẩm bằng họ chữ tiêu đề, không tệp nào) hay
   `source:<id>`. Lựa chọn có khoá mới `unset: "text"` trong `layers.json`: bản thiết kế không nêu thì đọc như `text`,
   không hỏi, không ghi, không nói gì. Lối dẫn dắt chỉ hỏi một câu khi sổ có dòng `logo`. Chọn dòng chưa có, chưa có giấy
   phép, hay ghim không còn đúng: bị từ chối bằng một câu. Lời chủ repo ghi ở `answered.mark`. Chọn `text` không sinh tệp
   nào và không viết dòng sổ nào. Chọn một dòng thì lối dẫn dắt viết dòng sổ `mark`, giữ bằng phép kiểm `logo-row`, và
   phép kiểm của bản thiết kế so `mark` như mọi lời đáp.
7. **Repo không có dấu không đổi.** Bản ghi `no-mark-on-0.69.0.json` được ghi trên main trước khi dựng (commit đầu của
   nhánh): `status`, `audit`, `adopt --dry-run` (chữ và JSON), `apply --dry-run` và cổng, trên bốn loại repo đề bài nêu.
   Sau khi dựng, cả bốn in và thoát y như vậy.
8. **Công cụ đã cài cũ hơn loại `logo` thì không viết gì.** (Thêm sau lời duyệt «Gửi cả hai sửa» của chủ repo, từ một
   điều phiên điều phối tìm thấy: trên bản sao một repo cài công cụ 0.36.1, `adopt` viết dòng `logo` và đặt `logo-pins`,
   và cổng của chính repo ấy đỏ, vì hợp đồng cũ đọc mọi nguồn là thư viện phải có `catalog` và không biết phép kiểm.)
   `adopt` và `logo-source` hỏi **chính bản công cụ của repo** (`tools/design-assembly/`): `contract.mjs` có `isLogo`
   và `check.mjs` có `"logo-pins"` không — như `core --join` hỏi `FAMILY_CORE_CHECK` trước khi đặt phép kiểm của nó.
   Không dựa vào số phiên bản của tem (`design/tool-stamp.json`), vì cái cổng chạy là bản chép chứ không phải tem: bản
   chép có thể bị sửa sau khi đóng tem, và repo cũ có thể không có tem. Repo chưa có bản chép nào, hay lượt `adopt` đặt
   công cụ ngay trong lượt ấy, làm như cũ. Khi bản chép không biết loại: `adopt` không ghi dòng, không đặt phép kiểm, và
   dòng «needs a person» nói «… older than the kind logo: bring it up with upgrade first, then adopt again, which would
   propose design/sources/logo.json from N file(s) of the repository (…)»; `logo-source` từ chối, thoát 2, cùng lời. Hàm
   hỏi là `toolPredates` của `scripts/tool-knows.mjs`, do lát 1 của mục 12.1 (quyết định
   [0123](0123-the-icon-set-enters-through-the-sources-ledger.md)) đưa vào; hàm riêng tôi viết làm cùng việc nên bỏ khi
   gộp. Loại `logo` hỏi `sources-ledger.mjs` có `LOGO_KIND` không, như loại `icon-set` hỏi `ICON_SET_KIND`, nên bản
   công cụ 0.70.0 (biết bộ biểu tượng, chưa biết dấu) cũng được coi là cũ. Bài kiểm dựng bản công cụ đúng của
   bản phát hành 0.69.0 từ cây git mà `references/releases.json` ghi.

## Consequences

- Một repo có tệp dấu được ghi và ghim chúng mà không vẽ lại; một byte đổi làm cổng đỏ.
- Phích dựng dấu (mục 12.3) có sẵn chỗ để ghi gói của nó, trừ phần tờ kê.
- Một dòng giới hạn mở và đóng cùng ngày, `logo-row-turns-an-older-gate-red`, cho lời khẳng định ở điểm 8. Sáu dòng mới còn mở trong sổ giới hạn: `logo-package-manifest-not-read`, `logo-frame-images-not-proposed`,
  `logo-variant-of-a-page-icon-guessed`, `logo-metadata-icons-not-read`, `mark-owner-call-not-held`,
  `mark-gaps-unsaid`. Dòng `logo-metadata-icons-not-read` đến từ lượt chạy thử trên bản sao bỏ đi của một ứng dụng
  cùng họ: bố cục khai biểu tượng trang trong metadata, nên `adopt` chỉ đề xuất một trong bốn tệp. Giới hạn
  `capability-brand-assets-has-no-plug` vẫn mở, câu của nó thu hẹp: tiêu chí 22 đóng nó khi 7, 8 và 9 xanh.
- Lát 1 của mục 12.1 (PR #157, plugin 0.70.0) gộp trước; lát này kéo `main` vào bằng merge commit, giữ cả hai loại trong hợp đồng, sổ nguồn và cổng, và lên 0.71.0.
