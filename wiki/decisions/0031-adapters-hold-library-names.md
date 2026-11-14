---
type: decision
title: Hợp đồng, lát ba — tên thư viện về bộ chuyển, lõi không nêu tên nào
links:
  - wiki/decisions/0029-the-contract-one-shape-per-ledger.md
  - wiki/decisions/0030-one-ledger-of-screens.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/adapters/index.mjs
  - plugins/design-assembly/tests/test-adapters.mjs
  - plugins/design-assembly/scripts/stage.mjs
  - "chủ repo, 2026-11-14: «Làm lát cuối»"
---

# 0031 Hợp đồng, lát ba: tên thư viện về bộ chuyển, lõi không nêu tên nào

## Status

Accepted. Chủ repo cho làm lát cuối của chặng 2 ngày 2026-11-14 («Làm lát cuối»). Ranh giới giữa
lõi và bộ chuyển là máy chọn, chờ chủ repo bác.

## Context

Tiêu chí 7 của đề bài 0002: lõi không chứa tên thư viện hay nền dựng nào ngoài bộ chuyển, và có
bài kiểm cho điều đó. Trước lát này, mã lõi nêu tên thư viện ở khoảng 15 chỗ:

- máy chủ phát triển và trình duyệt của sân khấu vẽ;
- trang vẽ linh kiện của cuốn sổ;
- theme của framework, tệp thiết lập của thư viện linh kiện, hàm khai biến thể;
- danh sách thư viện toast, gói kiểm accessibility.

Tài liệu kiến trúc đã đặt bốn loại bộ chuyển.

## Decision

1. **Năm bộ chuyển**, mỗi bộ một tệp trong thư mục bộ chuyển của công cụ. Mỗi bộ nói nó thuộc loại
   nào và sở hữu những tên nào:
   - nền dựng (Vite): mở máy chủ của repo;
   - trình duyệt (Playwright): mở trình duyệt; gói accessibility;
   - giá trị (Tailwind 4): theme của framework; cách stylesheet khai dựa trên framework;
   - nguồn linh kiện (shadcn): tệp thiết lập, thư mục thư viện, hàm khai biến thể, linh kiện toast;
   - mã nguồn (React): thư viện toast; cách vẽ một linh kiện lên trang.

   Trình duyệt tách khỏi nền dựng thành loại thứ năm, vì hai việc này dùng hai thư viện khác nhau.

2. **Lõi gọi qua bộ chuyển.** Phần chung của sân khấu và của trang vẽ linh kiện ở lại lõi; phần
   gắn với từng thư viện chuyển vào bộ chuyển.
3. **Bộ chuyển đi theo công cụ** sang repo được cài: bộ chép công cụ chép cả thư mục con.
4. **Bài kiểm của plugin** đỏ khi mã lõi nêu bất kỳ tên nào mà một bộ chuyển sở hữu, kể cả trong
   chú thích. Mã lõi gồm các kịch bản, công cụ của repo và tệp make được cài. Bài kiểm đã được thử
   đỏ bằng cách cài một tên vào lõi.

## Consequences

- Mã lõi: không còn tên thư viện nào.
- Cuốn sổ vẽ được 61 hình qua bộ chuyển. Repo mới của sàn nhận đủ năm bộ chuyển, giữ 23 quyết
  định, bài kiểm thường và kiểm kiểu xanh.
- **Chưa tách hết**, ghi ở sổ giới hạn:
  - Ngoài tên, lõi còn đọc cách viết của một loại repo ở khoảng 20 chỗ: tệp nguồn một đuôi, khối
    theme, danh sách màn và stylesheet của sàn, tên linh kiện báo lỗi và biến thể nút. Repo viết
    khác sẽ bị những lệnh kiểm đó đọc sai hoặc bỏ qua. Tách tiếp khi có một repo thật cần, như
    tài liệu kiến trúc đã nói.
  - Trang tài liệu, skill và dữ liệu tham chiếu của plugin còn nêu tên thư viện; bài kiểm chỉ đọc
    mã.
  - Mã cài cho repo sở hữu (các tệp mẫu) viết cho một thư viện, nhưng còn nằm cạnh lõi chứ chưa
    nằm với bộ chuyển của nó.
- Chặng 2 xong ba lát:
  - mười một sổ có một hình dạng, cổng giữ chúng;
  - kit đọc được sổ token và sổ linh kiện;
  - mã lõi không nêu tên thư viện.

  Sổ nhập kho và sổ nguồn ngoài chưa có hình dạng chung; chúng chỉ có ở Inventory, và chặng 3 làm
  ở đó.
