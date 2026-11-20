---
type: decision
title: "Cuốn hướng dẫn có một ví dụ nên và một ví dụ không nên cho mỗi luật có hình"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0066-next-js-is-the-second-build-the-plugin-draws-with.md
sources:
  - plugins/design-assembly/scripts/examples.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/skills/handoff/SKILL.md
  - plugins/design-assembly/tests/test-book-examples.mjs
  - design/book-words.json
  - "chủ repo, 2026-11-20: «tiếp tục 4.5»; cách làm: «Cả hai»"
---

# 0068 Cuốn hướng dẫn có một ví dụ nên và một ví dụ không nên cho mỗi luật có hình

## Status

Accepted, 2026-11-20. Mục 4.5 của kế hoạch, theo đề bài 0004 (phần «Người nhận» của `handoff`: «với mỗi luật có hình,
một ví dụ nên và một ví dụ không nên»). Ngày 2026-11-20 chủ repo chọn cách làm: «Cả hai».

- **Mẫu nhỏ** vẽ bằng giá trị của repo, ngay trong cuốn hướng dẫn.
- **Màn thật** của repo, bên cạnh cùng màn bị phá bằng một đoạn CSS.

Máy đã khuyên làm riêng mẫu nhỏ.

## Context

Cuốn hướng dẫn có sáu tờ có hình: màu, chữ, linh kiện, kiểu màn, lối đi, trạng thái. Nó cho thấy giá trị đã quyết, nhưng
không cho thấy giữ hay phá một luật trông thế nào. Người đọc cuốn sổ, nhất là người dựng màn, phải tự đoán chỗ ranh giới.

## Decision

1. **Tờ 07 «Nên và không nên»**, đặt trước tờ cuối. Tờ cuối nay là tờ 08.
2. **Bảy luật có ví dụ, theo thứ tự:**
   - tương phản màu;
   - thang chữ;
   - đơn vị khoảng cách;
   - bo góc;
   - cỡ bấm;
   - lời báo lỗi;
   - kênh báo kết quả.

   Một luật chỉ có ví dụ khi sổ quyết định của repo có dòng cho nó, và dữ kiện của cuốn sổ đủ để vẽ. Dữ kiện có thêm
   khoá `rules`.

3. **Mẫu nhỏ (`scripts/examples.mjs`) vẽ bằng chính giá trị của repo.** Ví dụ không nên phá đúng luật ấy, và phá được
   đo:
   - **Tương phản:** chữ được pha từ màu chữ trên nền chính vào chính nền ấy (`color-mix` của hai màu repo). Phép pha
     dừng ở phần trăm lớn nhất mà tỉ lệ vẫn dưới 3:1. Tỉ lệ ghi ngay bên cạnh.
   - **Thang chữ:** cỡ chữ nằm ngoài thang, làm nhoè thứ bậc.
   - **Khoảng cách:** khoảng cách không là bội của đơn vị.
   - **Bo góc:** ba hình mang ba bo góc, không cái nào là một bậc của thang.
   - **Cỡ bấm:** nút thấp hơn cỡ bấm của mức tuân thủ.
   - **Lời báo lỗi và kênh báo kết quả:** bằng lời của cuốn sổ.
     Mẫu nhỏ không cần trình duyệt, nên có trên mọi nền dựng.
4. **Màn thật bị phá.** Ở bốn luật mà CSS phá được (tương phản, thang chữ, khoảng cách, bo góc), cuốn sổ vẽ màn đầu tiên
   của repo hai lần.
   - Lần nào cũng ở trạng thái mở ra được ngay, ở độ rộng lớn nhất.
   - Một lần như đang có, một lần có đoạn CSS phá đúng luật ấy đặt lên trên. Đoạn CSS đặt các biến mà linh kiện của
     sàn đọc, và bo góc của nút, ô nhập, bảng, thẻ và hộp thoại.
   - Phần này chỉ thêm `addStyleTag`, nên chạy được trên cả Vite lẫn Next.js. Vẽ hỏng thì cuốn sổ ghi một dòng `note:`,
     và các phần khác vẫn giữ.
5. **Lời của tờ ấy thuộc tệp lời của repo,** kể cả `examples`, dịch được từng luật. Lời nào tệp ấy bỏ qua thì dùng lời của
   cuốn sổ. Tệp lời của kho này (`design/book-words.json`) có thêm bản tiếng Việt.

Một người đọc lại độc lập nêu mười chỗ, không chỗ nào là đường tiêm mã. Các chỗ đã sửa, mỗi chỗ kèm một bài kiểm hoặc một
lần thử làm hỏng mã:

- **Ví dụ không nên của thang chữ có thể đảo thứ bậc.** Nay tiêu đề vẫn trên thân bài, ghi chú vẫn dưới, mà cả ba sát
  nhau.
- **Cỡ chữ hay bo góc không đổi được ra điểm ảnh** (như `clamp()` hay `calc()`) làm ví dụ có chữ 0 px, và làm màn bị phá
  có chữ 1 px. Nay những bậc ấy bị bỏ qua.
- **Cặp màu của repo vốn đã trượt** thì được trình như một ví dụ nên, và hai ô giống nhau. Nay luật ấy không có ví dụ.
- **Lớp CSS phá màn dùng bo góc cố định,** có thể trùng một bậc của thang. Nay nó dùng đúng ba bo góc của ví dụ nhỏ.
- **Tỉ lệ in ra được làm tròn lên,** nên có thể in «3.0:1» cho một tỉ lệ dưới 3. Nay nó được cắt.
- **Một luật vẽ hỏng làm mất mọi ảnh bị phá.** Nay chỉ luật ấy bị bỏ, kèm một dòng `note:`.
- **Ảnh bị phá được so với một ảnh chụp lúc khác.** Nay hai ảnh chụp liền nhau, cùng một cách. Ảnh bị phá mà trùng từng
  byte với ảnh như đang có thì bị bỏ, kèm một dòng nói vì sao.
- **Bài kiểm tỉ lệ tự xác nhận chính nó.** Nay bài kiểm tự pha lại màu từ chuỗi `color-mix` trên trang.

Thử 10 cách làm hỏng mã. Lúc đầu bốn cách lọt; ba cách nay đã có bài kiểm: làm tròn tỉ lệ lên, nhận một cỡ bấm quá nhỏ,
và lấy luật không có trong sổ. Cách thứ tư vẫn lọt: giữ một ảnh bị phá trùng với ảnh gốc. Cách ấy chỉ lộ trên một màn
không đọc các biến của sàn. Màn của kho này đọc đủ các biến ấy, còn ứng dụng mẫu Next.js không có dữ kiện màu, chữ hay
bo góc nào để vẽ ví dụ. Dòng giới hạn `broken-screen-reads-floor-variables` ghi phần này.

## Consequences

- **Lệnh chứng:** `node --test plugins/design-assembly/tests/test-book-examples.mjs`, 13 bài, không bài nào bị bỏ qua. Bài
  cuối vẽ màn của kho này bốn lần bị phá, mỗi ảnh khác ảnh màn như đang có.
- **Luật «mọi màu trên trang là màu của repo» vẫn đứng.** Chữ mờ của ví dụ không nên là phép pha của hai màu repo, không
  phải một màu gõ tay.
- **Sổ giới hạn** mở ba dòng mới:
  - `examples-for-seven-rules`;
  - `broken-screen-reads-floor-variables`: một màn chỉ đọc một phần các biến ấy thì thay đổi ít hơn luật cho phép, và
    chưa gì đo được thay đổi bao nhiêu;
  - `broken-screen-first-screen-only`.
- **Plugin lên 0.18.0.**
- **Chủ repo xem mẫu một lần:** tờ 07 là một mẫu tài liệu mà giai đoạn 4 đòi chủ repo xem.
