---
type: decision
title: Chặng 3, lát hai — plugin chạy lại lint của chính repo trên đoạn mã phạm quyết định
links:
  - wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md
  - wiki/decisions/0031-adapters-hold-library-names.md
  - docs/trials/inventory-ladder.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/probes.mjs
  - plugins/design-assembly/templates/tools/design-assembly/lint.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/eslint.mjs
  - plugins/design-assembly/tests/test-lint.mjs
  - "chủ repo, 2026-11-14: «Làm lát hai»"
---

# 0033 Chặng 3, lát hai: plugin chạy lại lint của chính repo trên đoạn mã phạm quyết định

## Status

Accepted; mục 5 được thay bởi [0035](0035-the-named-rule-holds-the-row.md) ngày 2026-11-15. Chủ repo
cho làm lát hai ngày 2026-11-14 («Làm lát hai»). Cách làm dưới đây là máy chọn,
chờ chủ repo bác. Lát này chỉ đổi plugin và kho này; Inventory không bị đụng thêm.

## Context

Ở Inventory, 21 câu lõi ghi «tự khai»: dòng sổ trỏ tới một luật lint, một bài kiểm hay một công cụ
của repo, và plugin không chạy lại chúng. Vì thế số câu lõi máy giữ ở đó là 2, dù repo được giữ
tốt. 12 trong 21 câu do luật lint giữ; 8 do bài kiểm; 1 do công cụ của repo.

Plugin chỉ gọi một quyết định là «máy giữ» khi phép kiểm chạy được mỗi lần qua cổng và đã thấy nó
đỏ trên một bản bị đổi. Tìm thấy tên luật trong tệp cấu hình thì không đạt mức đó: luật có thể bị
tắt, bị thu hẹp, hay chưa bao giờ bắt đúng điều dòng sổ nói.

## Decision

1. **Đoạn mã phạm.** Với mỗi quyết định một luật lint có thể giữ, plugin mang sẵn vài đoạn mã phạm
   nó, cùng một đoạn đối chứng không phạm gì. Mười hai quyết định có đoạn mã phạm: màu là vai trò,
   bảng màu, thang chữ, thang khoảng cách, bo góc, điều khiển thô, bảng thô, đổi diện mạo linh kiện,
   style viết thẳng, tên lớp viết nguyên, định dạng số và ngày, ngoại lệ lint phải có lý do. Mỗi
   đoạn do bộ chuyển của phần nó thuộc về viết: tên lớp ở bộ giá trị, thẻ và thuộc tính ở bộ mã
   nguồn, linh kiện ở bộ nguồn linh kiện, dòng ngoại lệ ở bộ lint.
2. **Lint của repo đọc các đoạn đó**, như thể chúng nằm trong một tệp màn thật của repo, nơi luật
   dòng sổ trỏ tới đang bật ở mức lỗi. Lỗi nào cũng báo trên đoạn đối chứng thì bị trừ ra. Quyết
   định được giữ khi lint chặn **mọi** đoạn mã phạm.
3. **Thấy đỏ trên bản bị đổi**: chạy lại với các luật đã chặn bị tắt. Lần đó phải để lọt, nếu không
   phép kiểm không chứng minh gì.
4. **Chạy mỗi lần qua cổng.** «Nhận» thêm phép kiểm vào dữ liệu của công cụ khi nó qua ngay lúc
   nhận; dòng sổ của repo giữ nguyên, vẫn trỏ tới luật của repo. Từ đó cổng của repo đỏ khi luật bị
   tắt hay thôi chặn một đoạn. Đường «dựng mới» giữ các phép kiểm này khi chạy lại.
5. **Không qua thì không giấu.** Luật để lọt một đoạn thì dòng sổ vẫn là «tự khai», và «nhận» nói
   rõ đoạn nào lọt. (Thay bởi 0035: luật chặn được nhưng không phải luật dòng sổ nêu tên thì không
   còn tính là giữ.)
6. **Bộ chuyển thứ sáu, loại lint**, giữ tên công cụ lint: nơi để tệp cấu hình, cách dòng sổ trỏ tới
   một luật, cách viết dòng ngoại lệ, cách chạy lint của repo. Lõi không còn nêu tên công cụ lint
   ở đâu. Plugin không mang lint theo: nó chạy bản repo đã cài, trong một tiến trình riêng.
7. **Chưa làm ở lát này:** hướng nhập giữa các phần (đoạn mã phạm phụ thuộc cách chia phần của từng
   repo), và bài kiểm hay công cụ của repo (không có cách chung để làm chúng đỏ).

## Consequences

- **Inventory, đo trên bản sao** ở `1226ec5`, bản sao đọc gói của Inventory qua một đường nối:
  - sau bước 1: câu lõi máy giữ 1 lên 10, quyết định máy giữ 6 lên 15;
  - sau bước 2 (ba lời đáp): 2 lên 11, và 7 lên 16;
  - nhánh riêng của Inventory chưa được chạy lại; làm vậy cần chủ repo cho phép.
- **Điều lint của Inventory để lọt**, tìm ra khi chạy lại; chưa sửa ở đó, việc của chủ repo:
  - tên lớp ghép bằng dấu cộng, trên thẻ thường và trên linh kiện;
  - ngoại lệ lint không lý do cho luật không thuộc bộ luật riêng của Inventory, và ngoại lệ tắt
    mọi luật cho cả tệp: dòng đó tắt luôn luật đòi lý do;
  - dòng sổ «thang khoảng cách» trỏ tới luật bắt bậc lệch thang; giá trị tuỳ ý do một luật khác
    chặn.
- **Kho này:** quyết định máy giữ 27 lên 37. Hai điều tìm ra:
  - luật «tên lớp viết nguyên» của sàn chỉ đọc tên lớp đặt trên linh kiện; trên thẻ thường, cả hai
    cách ghép đều lọt. Dòng sổ đó vẫn là «tự khai». Việc của Repo Standards;
  - dòng «màu là vai trò» trỏ tới luật chặn bảng màu; màu viết thẳng do luật chặn giá trị tuỳ ý
    chặn.
- **Giới hạn**, ghi ở sổ giới hạn:
  - plugin chỉ thử các dạng phạm nó biết; luật chặn hết chúng vẫn có thể để lọt dạng khác;
  - đoạn mã phạm được đọc như một tệp màn; luật bật hẹp hơn ở chỗ khác thì không ai thấy;
  - bài kiểm và công cụ của repo vẫn chưa được chạy lại; hướng nhập chưa có đoạn mã phạm.
- Cổng của repo chạy thêm lint trên vài chục đoạn mã: khoảng hai giây ở Inventory và ở kho này.
