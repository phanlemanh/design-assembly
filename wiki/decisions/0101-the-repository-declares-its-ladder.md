---
type: decision
title: "Thang do repo khai: nguồn ngoài đứng trước hay sau bộ khởi đầu, danh mục ghim theo dạng của repo, nguồn nêu phích của nó"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0098-choose-before-make-at-the-components-socket.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - docs/trials/declared-ladder-on-a-copy.md
sources:
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/scripts/plugs-page.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/conform.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/find/SKILL.md
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/tests/test-declared-ladder.mjs
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Dựng lát 4»"
---

# 0101 Thang do repo khai: nguồn ngoài đứng trước hay sau bộ khởi đầu, danh mục ghim theo dạng của repo, nguồn nêu phích của nó

## Status

Accepted, 2026-11-24. Lát 4 của đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md), mục 11.4 của
kế hoạch, dựng theo lời chủ repo («Dựng lát 4»). Plugin 0.53.0.

## Context

`find` và `intake` đi thang theo thứ tự plugin cố định: kho của repo, bộ khởi đầu, kho của họ, rồi các nguồn ghim ở
`design/sources/`. Repo kiểm chứng khai thang «kho, ReUI, tạo tay» và giữ danh mục ReUI theo dạng riêng: một tệp có ghim
nằm trong nó và các món xếp theo nhóm. Nên `find` không bao giờ tới ReUI ở đó (chỗ lệch 3 của đề bài). Quyết định
[0098](0098-choose-before-make-at-the-components-socket.md) để lại cho lát này hai điều chủ repo nhận tới đây: phích
ngoài chỉ được nhận ra là nguồn khi hai bên cùng mã, và lựa chọn cũ của một phích ngoài ở ổ có thang được giữ mà không
áp.

## Decision

1. **Vị trí trên thang là một khoá của tệp nguồn**, `ladder_place`: `before-starter` thì nguồn được đọc ngay sau kho của
   repo, trước bộ khởi đầu và kho của họ; `after-family` thì sau hai kho ấy. Không khai thì là `after-family`, đúng thứ
   tự hôm nay (tiêu chí 9). Luật «luật của repo thắng mặc định» của đề bài 0008, áp cho thang.
2. **`find` đi đúng thứ tự ấy, và `intake` theo nhờ `find`.** Kho nào đáp trước thì các kho sau không đọc, như trước.
   Ứng viên của `intake` lấy từ `find` sau kho của repo, nên một nguồn khai trước bộ khởi đầu là ứng viên đầu. Bảng phích
   ở ổ linh kiện in thang theo cùng thứ tự, lấy từ cùng một chỗ `find` lấy.
3. **Ghim nằm trong danh mục được đọc.** `pin_file` trỏ vào một tệp là chính ghim, hoặc một danh mục giữ ghim của nó ở
   khoá `pin`. Repo đã ghim danh mục theo dạng ấy chỉ cần một tệp nguồn trỏ cả `pin_file` và `catalog` vào danh mục
   (tiêu chí 10). Lệnh `conform` đọc ghim theo cùng luật.
4. **Nguồn nêu phích của nó**, khoá `plug`: phích ngoài đứng ở bậc 2 khi có một nguồn cùng mã với nó, hoặc một nguồn nêu
   nó ở `plug`. Đóng giới hạn «chỉ nhận ra khi cùng mã».
5. **Lựa chọn cũ được áp khi phích đã được ghim làm nguồn.** Trạng thái mới `on-the-ladder`: `intake` vẫn làm ổ, và
   phích chủ repo chọn đứng ở bậc 2 như nguồn đã ghim; bảng phích, trang toàn cảnh và `status` nêu tên nguồn. Chưa ghim
   thì vẫn `kept-not-applied`. Việc ghim vẫn do người làm: plugin không lấy gì về, nên không có ghim hay danh mục để tự
   viết tệp nguồn. Dòng giới hạn nói vậy, và đó là một câu hỏi cho chủ repo.

## Đổi gì trong hợp đồng

- **Sổ nguồn ngoài**, vẫn bản 1: thêm hai khoá không bắt buộc `ladder_place` (một trong `before-starter`,
  `after-family`; giá trị khác thì phép kiểm hình dạng đỏ) và `plug` (mã của một phích). `pin_file` nay có thể trỏ vào
  một danh mục giữ ghim ở `pin`. Tệp nguồn viết trước đọc như trước.
- Không sổ nào khác đổi.

## Consequences

- Lựa chọn ở ổ có thang có thêm trạng thái `on-the-ladder`, ở `plugs`, `status` và trang toàn cảnh.
- Câu của bảng phích nêu tên nguồn của phích («pinned as the source …»), và cách ghim nói thêm khoá `plug`.
- Sổ giới hạn: **đóng** `ladder-order-fixed-and-sources-in-one-shape` và `ladder-source-matched-by-id`; **thu hẹp**
  `ladder-choice-kept-not-applied` (lựa chọn được áp khi phích đã ghim; việc ghim vẫn do người làm, nay là `keep`);
  **mới** `catalog-read-in-two-shapes` (danh mục phải liệt kê món hay nhóm món; nguồn đứng trước hoặc sau cả hai kho,
  không đứng giữa).
- Lượt thử trên bản sao repo kiểm chứng: [declared-ladder-on-a-copy](../../docs/trials/declared-ladder-on-a-copy.md).
- Plugin lên 0.53.0. Kế hoạch: mục 11.4 xong.
