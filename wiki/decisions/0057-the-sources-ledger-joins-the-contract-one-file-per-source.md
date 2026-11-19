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
   - Repo viết sổ trước các khoá này có thể đã dùng tên của một khoá mới làm cách viết cho khoá cũ, như
     `keys: { source: from }`. Khi ấy khoá mới không có cách viết nào ở repo đó, và sổ đọc y như trước, cho tới khi repo
     tự khai cách viết cho nó.
   - `isByHand` nói một khối có phải tạo tay không, theo chữ `by-hand` của hợp đồng hoặc chữ repo khai ở `values`.
5. **Bảng từ vựng thêm mười tên:** `interface inventory` (nguồn đã đọc ngày 2026-11-19), `vendoring` (chỉ đọc được bản
   tóm tắt của mục ấy, nên ghi `summary`), `pin`, `catalog`, `starter kit`, `deprecation`, `drift` (thói quen của
   ngành), và `sources ledger`, `external source`, `reuse ladder` (`coined`). `component manifest` từng ghi «catalog» là
   chữ phải tránh, để không ai gọi sổ linh kiện là danh mục. Nay «catalog» là tên của danh mục một nguồn ngoài, đúng
   chữ repo kiểm chứng dùng, và nghĩa của nó nói rõ nó không phải sổ linh kiện. Vì vậy sổ linh kiện chỉ còn tránh
   «catalogue». Đổi lại, bài kiểm từ vựng không còn bắt được một trang gọi sổ linh kiện là «catalog».
6. **Bộ đọc không bao giờ ném lỗi vì một tệp nguồn.** Đường dẫn dẫn ra ngoài repo (`catalog`, `pin_file`, `snapshot`,
   tệp của bản ghim), `snapshot` không phải chữ, tệp của bản ghim là một thư mục: nguồn ấy «không đọc được», kèm lý do.
   Thư mục con mang đuôi `.json` trong `design/sources/` bị bỏ qua, ở bộ đọc lẫn ở cổng.
7. **Hai dòng giới hạn mới.** `sources-never-fetched`: plugin không ghim lại nguồn, nên bản ghim cũ chỉ được báo; và bản
   chụp chỉ được so khi nguồn nêu thư mục của nó. `intake-new-keys-taken-by-own-keys`: xem mục Consequences.

Lệch với đề bài 0006:

- **Khoá `snapshot`.** Đề bài nói bộ đọc so bản chụp với `sha256`, nhưng không nói bản chụp nằm đâu. Tệp ghim chỉ nêu
  tên tệp, không nêu thư mục, nên nguồn nêu thư mục ấy ở `snapshot`. Không nêu thì không so, và `blind` nói vậy.
- **`references/starter.json` để sang mục 3.2.** Bảng kê của đề bài đặt nó ở bước 1. Chưa lệnh nào đọc nó trước `find`;
  dựng nó cùng bộ đọc và bài kiểm của `find` thì bảng được giữ bằng một phép kiểm ngay từ đầu.
- **Thư mục `design/sources/` cố định.** Sổ nhập kho và sổ màn đổi được đường dẫn qua `ledgers` của phép kiểm; sổ
  nguồn ngoài thì không, vì chưa repo nào có nó ở chỗ khác.

## Consequences

- Repo không có `design/sources/` và không có khoá nào mang tên của bảy khoá mới thì không thấy gì đổi: sổ nhập kho của
  nó đọc ra đúng như công cụ bản 0.7.3 đọc, có bài kiểm so hai bộ đọc. Mọi bài kiểm có trước vẫn xanh, trừ hai bài khẳng
  định điều cũ (sổ nguồn ngoài «chưa chốt», và trang hợp đồng kê sổ), đã sửa theo.
- **Repo đã có một khoá riêng mang đúng tên một khoá mới** (`from`, `taken`, `changed`, `retired`, `merged_into` trên
  khối; `before`, `values` cạnh danh sách) mà giá trị khác hình dạng mới thì cổng đỏ khi lên đời, và nêu khoá ấy.
  `upgrade` nói trước điều đó và dừng, như mọi lần lên đời làm cổng đỏ. Lối ra là đổi tên khoá riêng ấy. Không repo nào
  máy biết đang ở trường hợp này: repo kiểm chứng viết khoá bằng tiếng Việt. Dòng giới hạn
  `intake-new-keys-taken-by-own-keys` ghi điều đó.
- Một sổ nhập kho có đủ khoá mới qua phép kiểm hình dạng của công cụ bản 0.7.3, lấy từ git ở `03e2a99`, vẫn xanh: công
  cụ cũ đọc chúng như khoá riêng của repo. Bài kiểm chạy đúng công cụ ấy.
- `adopt` và dẫn dắt không đếm sổ nguồn ngoài trong câu «N sổ đúng hình dạng» của chúng, vì chúng chỉ duyệt các sổ có
  một tệp; cổng vẫn giữ sổ ấy.
- Bài kiểm mới: 12 ở `test-sources-ledger.mjs`, 9 ở `test-intake-keys.mjs`. Cả hai tệp được thấy đỏ trước khi có mã. Năm
  chỗ chính được thấy đỏ bằng cách tạm làm hỏng mã rồi trả lại: so `sha256`, tên tệp bằng `id`, `before` theo cách
  viết riêng, cổng đọc thư mục nguồn, và `why` lồng trong `retired`. Chỗ cuối không bài nào bắt ở lần đầu; một câu kiểm
  được thêm, thấy đỏ, rồi xanh.
- Một tác tử độc lập đọc lại thay đổi và tìm ra hai lỗi nặng, một lỗi vừa, hai điểm nhẹ; máy kiểm lại cả năm trên mã, cả
  năm đúng. Mỗi điều có bài kiểm, thấy đỏ trước khi sửa:
  - **Nặng:** cách viết `keys: { source: from }` của một sổ cũ làm `source` và `from` trùng tên, cổng đỏ trên sổ đúng.
    Nay đã sửa (mục 4).
  - **Nặng:** khoá riêng mang tên khoá mới làm cổng đỏ, trái với câu «không thấy gì đổi» của bản đầu quyết định này.
    Không sửa được mà không bỏ hình dạng của khoá mới; nay là một giới hạn đã nói rõ (ở trên).
  - **Vừa:** bộ đọc nguồn và cổng ném lỗi ở tệp ghim rỗng, `snapshot` không phải chữ, thư mục con đuôi `.json`. Đã sửa
    (mục 6).
  - **Nhẹ:** đường dẫn ra ngoài repo. Đã sửa (mục 6).
  - **Nhẹ:** chú thích của bộ đọc tả sai một khoá của nhóm trong danh mục. Đã sửa.
- **Chưa đo trên repo thật.** Lệnh đo trên bản sao của repo kiểm chứng (một tệp nguồn trỏ vào tệp ghim và danh mục của
  nó) bị từ chối lúc chạy, nên không chạy. Điều «`pin_file` trỏ thẳng được vào tệp ghim ấy» dựa trên việc đọc tệp ấy
  ngày 2026-11-19 và trên bài kiểm dùng đúng các khoá đó, chưa trên chính tệp.
- Số bản plugin lên `0.8.0`: thêm một sổ vào hợp đồng.
