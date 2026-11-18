---
type: decision
title: "Sổ nguồn ngoài vào hợp đồng, mỗi nguồn một tệp; sổ nhập kho thêm khoá tuỳ chọn cho kho dùng lại"
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/tests/test-sources-ledger.mjs
  - plugins/design-assembly/tests/test-intake-keys.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/vocabulary.json
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-19: «Làm 3.1»"
---

# 0057 Sổ nguồn ngoài vào hợp đồng, mỗi nguồn một tệp; sổ nhập kho thêm khoá tuỳ chọn cho kho dùng lại

## Status

Accepted, 2026-11-19. Mục 3.1 của kế hoạch, theo phần A của đề bài 0006 mà chủ repo đã duyệt. Máy chọn cách làm trong
khuôn đề bài; ba chỗ lệch với chữ của đề bài nằm cuối mục Decision.

## Context

Hợp đồng sổ có mười hai sổ. Tên `sources` nằm ở mục «Not settled yet» của `contract.md`: chưa có hình dạng. Một repo
đã giữ một nguồn như vậy bằng công cụ riêng: một tệp ghim (ngày lấy, rồi từng tệp với đường dẫn trên mạng, số byte,
`sha256`), bản chụp trong git, và một danh mục sinh từ bản chụp, xếp theo nhóm. Bốn lệnh của giai đoạn 3 cần đọc nguồn
ấy, và cần thêm vài điều trên sổ nhập kho mà quyết định 0052 chưa có: khối lấy từ nguồn nào, tệp lúc nhập ra sao, đã
cho nghỉ chưa, và những gì repo làm trước khi có sổ.

## Decision

1. **Sổ nguồn ngoài là sổ thứ mười ba của hợp đồng, hình dạng 1, chỉ có dạng thư mục.**
   - Mỗi nguồn một tệp, `design/sources/<id>.json`; tên tệp khác `id` thì cổng đỏ. Không có dạng một tệp, vì sổ này
     chưa từng có và không bên đọc cũ nào phải giữ.
   - Khoá bắt buộc: `version`, `id`, `catalog`. Tuỳ chọn: `title`, `order`, `install` (phải có `{name}`), `licence`,
     `snapshot`. Khoá riêng của repo được giữ.
   - Bản ghim ghi ở `pin` hoặc ở tệp mà `pin_file` nêu; thiếu cả hai thì đỏ. Một bản ghim có `files` (mỗi tệp `file` và
     `sha256`, có thể `url`, `bytes`; cạnh đó có thể `fetched_at`), hoặc có `version`. Các khoá ấy đúng từng chữ với tệp
     ghim mà repo kiểm chứng đang giữ, nên `pin_file` trỏ thẳng được vào tệp đó.
2. **Một bộ đọc, `sources-ledger.mjs`, không bao giờ dùng mạng.** `readPinnedSources(root)` trả các nguồn theo
   `order` rồi theo `id`. Mỗi nguồn kèm các mục của danh mục, hoặc `unreadable` kèm lý do: tệp không đọc được, hình
   dạng mới hơn, tệp ghim hay danh mục không có, hoặc một tệp của bản chụp khác `sha256` đã ghim. Điều không so được
   (nguồn ghim theo số bản, nguồn không nêu thư mục bản chụp) nằm ở `blind`. Danh mục đọc được cả dạng phẳng
   (`items`) lẫn dạng nhóm (`groups`, mục nhận `kind`, `group`, `category` và trang `base` của nhóm).
3. **Cổng giữ hình dạng qua dòng `ledger-shapes` đã có.** Phép kiểm `shapes` đọc mọi tệp `.json` của
   `design/sources/`, dù dữ liệu công cụ của repo không nêu thư mục ấy. Repo không có thư mục ấy thì không thấy gì đổi;
   repo có thì được giữ từ tệp đầu tiên. `audit` kê từng tệp nguồn như kê từng trang kiểu màn.
4. **Sổ nhập kho giữ hình dạng 1, thêm bảy khoá tuỳ chọn:**
   - trên khối: `from`, `taken` (`sha256` của tệp lúc nhập), `changed` (`{ on, why }`), `retired` (`{ on, by, why }`),
     `merged_into`;
   - cạnh danh sách: `before` (mỗi mục `name`, `why`, có thể `file`, `record`) và `values` (hôm nay chỉ
     `{ by-hand: <chữ của repo> }`).
   - Mọi khoá ấy, kể cả `why`, viết theo cách riêng được qua `keys`. `why` bên trong `changed` và `retired` cũng được đọc
     theo cách viết ấy.
   - `isByHand` nói một khối có phải tạo tay không, theo chữ `by-hand` của hợp đồng hoặc chữ repo khai ở `values`.
5. **Bảng từ vựng thêm mười tên:** `interface inventory` (nguồn đã đọc ngày 2026-11-19), `vendoring` (chỉ đọc được bản
   tóm tắt của mục ấy, nên ghi `summary`), `pin`, `catalog`, `starter kit`, `deprecation`, `drift` (thói quen của
   ngành), và `sources ledger`, `external source`, `reuse ladder` (`coined`). `component manifest` từng ghi «catalog» là
   chữ phải tránh, để không ai gọi sổ linh kiện là danh mục. Nay «catalog» là tên của danh mục một nguồn ngoài, đúng
   chữ repo kiểm chứng dùng, và nghĩa của nó nói rõ nó không phải sổ linh kiện. Vì vậy sổ linh kiện chỉ còn tránh
   «catalogue». Đổi lại, bài kiểm từ vựng không còn bắt được một trang gọi sổ linh kiện là «catalog».
6. **Một dòng giới hạn mới,** `sources-never-fetched`: plugin không ghim lại nguồn, nên bản ghim cũ chỉ được báo; và
   bản chụp chỉ được so khi nguồn nêu thư mục của nó.

Lệch với đề bài 0006:

- **Khoá `snapshot`.** Đề bài nói bộ đọc so bản chụp với `sha256`, nhưng không nói bản chụp nằm đâu. Tệp ghim chỉ nêu
  tên tệp, không nêu thư mục, nên nguồn nêu thư mục ấy ở `snapshot`. Không nêu thì không so, và `blind` nói vậy.
- **`references/starter.json` để sang mục 3.2.** Bảng kê của đề bài đặt nó ở bước 1. Chưa lệnh nào đọc nó trước `find`;
  dựng nó cùng bộ đọc và bài kiểm của `find` thì bảng được giữ bằng một phép kiểm ngay từ đầu.
- **Thư mục `design/sources/` cố định.** Sổ nhập kho và sổ màn đổi được đường dẫn qua `ledgers` của phép kiểm; sổ
  nguồn ngoài thì không, vì chưa repo nào có nó ở chỗ khác.

## Consequences

- Repo không có `design/sources/` và không dùng khoá mới thì không thấy gì đổi: mọi bài kiểm có trước vẫn xanh, trừ hai
  bài khẳng định điều cũ (sổ nguồn ngoài «chưa chốt», và trang hợp đồng kê sổ), đã sửa theo.
- Một sổ nhập kho có đủ khoá mới qua phép kiểm hình dạng của công cụ bản 0.7.3, lấy từ git ở `03e2a99`, vẫn xanh: công
  cụ cũ đọc chúng như khoá riêng của repo. Bài kiểm chạy đúng công cụ ấy.
- `adopt` và dẫn dắt không đếm sổ nguồn ngoài trong câu «N sổ đúng hình dạng» của chúng, vì chúng chỉ duyệt các sổ có
  một tệp; cổng vẫn giữ sổ ấy.
- Bài kiểm mới: 10 ở `test-sources-ledger.mjs`, 6 ở `test-intake-keys.mjs`. Cả hai tệp được thấy đỏ trước khi có mã. Năm
  chỗ chính được thấy đỏ bằng cách tạm làm hỏng mã rồi trả lại: so `sha256`, tên tệp bằng `id`, `before` theo cách
  viết riêng, cổng đọc thư mục nguồn, và `why` lồng trong `retired`. Chỗ cuối không bài nào bắt ở lần đầu; một câu kiểm
  được thêm, thấy đỏ, rồi xanh.
- **Chưa đo trên repo thật.** Lệnh đo trên bản sao của repo kiểm chứng (một tệp nguồn trỏ vào tệp ghim và danh mục của
  nó) bị từ chối lúc chạy, nên không chạy. Điều «`pin_file` trỏ thẳng được vào tệp ghim ấy» dựa trên việc đọc tệp ấy
  ngày 2026-11-19 và trên bài kiểm dùng đúng các khoá đó, chưa trên chính tệp.
- Số bản plugin lên `0.8.0`: thêm một sổ vào hợp đồng.
