---
type: decision
title: Hợp đồng, lát một — mỗi sổ một hình dạng, ba bên cùng đọc
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/decisions/0008-design-tokens-file.md
  - wiki/decisions/0009-component-manifest.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/templates/tools/design-assembly/tokens.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/tests/test-contract.mjs
  - "chủ repo, 2026-11-14: «Sang chặng 2»"
---

# 0029 Hợp đồng, lát một: mỗi sổ một hình dạng, ba bên cùng đọc

## Status

Accepted. Chủ repo cho sang chặng 2 «Hợp đồng» ngày 2026-11-14 («Sang chặng 2»). Phạm vi lát này
và cách làm từng phần là máy chọn, chờ chủ repo bác. Câu 1 và câu 9 của 0023 (hình dạng sổ linh
kiện, số phiên bản hình dạng) là lời chủ repo đã duyệt; lát này dựng chúng.

## Context

Tiêu chí đầu của đề bài 0002: mỗi sổ của hợp đồng có đúng một hình dạng, viết thành tài liệu, và cả
ba bên đọc được hình dạng đó. Ba bên là plugin này, kit nghiệm thu (delivery-loop) và tác tử dựng
màn. Trước lát này hình dạng chỉ nằm rải trong mã của từng bộ đọc. Đo thật ngày 2026-11-14:

- Cổng của kit **từ chối sổ token** của repo này. Nó chỉ đọc màu viết dạng hex, còn sổ ghi màu
  dạng oklch. Bộ đo độ phủ của kit thì lại đọc được, nên lỗi không lộ ở bài kiểm cũ.
- Bộ kiểm kế hoạch dùng lại của kit đọc được sổ linh kiện của repo này. Nó từ chối sổ của Inventory
  vì số phiên bản ghi dạng số.
- Trang kiểu màn của cả hai repo qua bộ đọc của kit, không lỗi, không cảnh báo.
- Sổ quyết định của Inventory cùng hình dạng với của repo này.
- Sổ linh kiện có ba hình dạng: của plugin, của kit, của Inventory. Sổ màn có hai.

## Decision

1. **Hình dạng viết một chỗ.** Mỗi sổ có hình dạng nêu bằng dữ liệu trong `contract.mjs` của
   plugin; `references/contract.md` nói lại bằng lời. Có bài kiểm giữ hai nơi khớp nhau. Mười sổ
   đã có hình dạng:
   - quyết định, bản thiết kế, token, linh kiện;
   - kiểu cột, cột, trạng thái, bề rộng kiểm, các phần của mã;
   - trang kiểu màn.

   Ba sổ ghi là chưa chốt: sổ màn, sổ nhập kho, sổ nguồn ngoài.

2. **Cổng giữ hình dạng.** Dòng sổ mới `ledger-shapes` (tầng governance, nguồn là plugin): cổng đỏ
   khi một sổ đang có, hay một trang kiểu màn, lệch hình dạng của nó.
3. **Số phiên bản hình dạng.** Đây là câu 9 của 0023. Plugin đọc mọi sổ có hình dạng bằng hoặc cũ
   hơn hình dạng nó biết. Gặp sổ do plugin mới hơn ghi, cuộc dẫn dắt, đường nhận và lệnh ghi sổ linh
   kiện dừng và không ghi gì.
4. **Sổ token ghi màu bằng hex.** Kit có hai bộ đọc mâu thuẫn nhau:
   - cổng đòi hex trong giá trị;
   - bộ đo độ phủ coi giá trị dạng đối tượng (dạng màu của chuẩn token hiện hành) là token ghép,
     và không nhận tên biến.

   Dạng duy nhất cả hai cùng nhận là hex viết thẳng, nên sổ ghi hex. Chữ oklch của stylesheet được
   giữ nguyên ở phần mở rộng của token.

5. **Sổ linh kiện, hình dạng 2.** Đây là câu 1 của 0023. Sổ thêm ba trường mà Inventory đang có:
   - **cấp**: atom, molecule, organism hay template. Máy tính ra từ độ sâu nhập giữa các linh kiện,
     như Inventory làm; linh kiện mà một trang kiểu màn gọi là khuôn thì là template.
   - **nguồn**: từ thư viện hay của riêng repo.
   - **các phần**: những linh kiện cùng tệp mà nó dựng từ đó.

   Sổ giờ đọc cả thư mục linh kiện riêng bên cạnh thư mục thư viện. Tên viết hoa toàn bộ là hằng
   số, không còn bị tính là linh kiện.

6. **Để lát sau.** Hai việc sau làm ở lát riêng của chặng 2, không trộn vào lát này:
   - gộp hai hình dạng sổ màn;
   - tách tên thư viện trong plugin vào bộ chuyển.

## Consequences

- Cổng của repo này giữ 26 quyết định bằng 32 lệnh kiểm. Bài kiểm: 99 của repo, 76 lượt kiểm
  trình duyệt, 227 của plugin.
- Sổ linh kiện của repo này có 65 mục: 58 của thư viện, 7 của riêng repo.
- Ba bộ đọc của kit đều nhận tệp mới:
  - kế hoạch dùng lại đọc đủ 65 tên;
  - cổng nạp sổ token;
  - bộ đo độ phủ nhận 2/2 biến.

  Bài kiểm của plugin gọi các bộ đọc đó khi kit có trên máy.

- Inventory đọc được qua bộ kiểm hình dạng:
  - sổ quyết định và trang kiểu màn đạt;
  - sổ linh kiện lệch đúng ba cách: phiên bản là số, thiếu loại, các phần là đối tượng chứ không
    phải tên.

  Chuyển sổ đó sang một hình dạng là việc ở Inventory, cần chủ repo cho phép riêng (chặng 3).

- Sổ giới hạn đóng hai dòng: cổng của kit từ chối sổ token; sổ linh kiện tính hằng số là linh kiện.
  Mở năm dòng:
  - sổ màn còn hai hình dạng;
  - tên thư viện còn nằm trong lõi;
  - sổ linh kiện của Inventory khác hình dạng;
  - hai bộ đọc của kit mâu thuẫn về màu dạng đối tượng (việc của delivery-loop);
  - cấp chỉ tính từ độ sâu nhập.
