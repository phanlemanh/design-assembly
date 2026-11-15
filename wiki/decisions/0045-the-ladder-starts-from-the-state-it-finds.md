---
type: decision
title: Lệnh đo thang làm từ trạng thái nó gặp, không diễn lại việc nhận
links:
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
  - wiki/decisions/0040-the-plan-of-record-and-how-it-is-kept.md
  - wiki/decisions/0034-component-reader-equal-to-the-reference-tool.md
sources:
  - docs/trials/ladder.mjs
  - plugins/design-assembly/tests/test-ladder.mjs
  - plugins/design-assembly/references/limits.json
  - docs/trials/inventory-ladder.md
  - "kế hoạch chính thức, mục 0.4: «Lệnh đo thang chạy được trên repo đã nhận»"
---

# 0045 Lệnh đo thang làm từ trạng thái nó gặp, không diễn lại việc nhận

## Status

Accepted. Mục 0.4 của kế hoạch chính thức ([0040](0040-the-plan-of-record-and-how-it-is-kept.md)).
Cách sửa và hai dòng giới hạn mới là máy chọn, chờ chủ repo bác.

## Context

`make design-ladder` đo thang trên một bản sao bỏ đi của repo đối chiếu: sao về, chạy ba bước nhận
nối nhau, đo sau mỗi bước. Từ khi Inventory nhận plugin, lệnh không chạy tới cuối
([0039](0039-plan-recut-by-rhythm-and-tier.md), dòng giới hạn `ladder-replays-adoption`).

Chạy lại ngày 2026-11-15 trên Inventory ở `c53b35d`: lệnh in đủ bốn dòng rồi sập ở phép so sổ linh
kiện, vì bản sao không còn sổ linh kiện. Dòng thứ tư cũng sai: sổ đúng hình dạng 6 trên 6 thay vì
7 trên 7, bậc của kit M1 thay vì M2.

Nguyên nhân nằm ở bước 3 của lệnh, không ở plugin:

- Bước 3 xoá sổ linh kiện rồi chạy «nhận», vì «nhận» giữ nguyên một tệp nó không viết ra. Với repo
  chưa nhận, đó là sổ của công cụ repo tự viết, và «nhận» ghi sổ mới thay vào.
- «Nhận» không bao giờ làm lại một quyết định đã có dòng kèm phép kiểm trong sổ quyết định. Ở repo
  đã nhận, sổ linh kiện đã có dòng ấy. Lệnh xoá sổ, và không ai ghi lại.

## Decision

1. **Mỗi bước làm từ trạng thái bản sao đang có.** Bước 3 chỉ xoá sổ linh kiện khi sổ quyết định
   chưa giữ nó, đúng điều kiện mà «nhận» dùng để quyết có ghi sổ hay không. Sổ đã được giữ thì để
   yên.
2. **Phép so hai sổ linh kiện chỉ chạy khi bước 3 thật sự thay sổ của một công cụ khác.** Không có
   bên kia để so thì lệnh nói một dòng, không sập.
3. **Bốn dòng bằng nhau thì lệnh nói rõ**: repo đã đi hết các bước, mỗi dòng là chỗ nó đang đứng.
4. **Không chọn hai lối khác:**
   - gỡ việc nhận khỏi bản sao rồi diễn lại: công cụ cũ của Inventory đã bị bỏ, không dựng lại được
     trạng thái trước khi nhận;
   - sao một commit cũ trước khi nhận: đo quá khứ, không đo repo hôm nay, và không dùng được cho
     repo khác.
5. Lệnh vẫn chỉ ghi vào bản sao. Dòng cuối của nó vẫn nói repo đối chiếu có bị đổi không.

## Consequences

- **Trên Inventory thật** (`c53b35d`, kèm kit): lệnh thoát 0, bốn dòng bằng nhau: sổ đúng hình dạng
  7 trên 7, câu lõi có lời đáp 29 trên 40, câu lõi máy giữ 10, quyết định máy giữ 16, kit M2.
  Trạng thái git của Inventory trước và sau giống hệt nhau.
- **Bài kiểm mới** dựng một repo thử nhỏ, chạy lệnh ở cả hai trạng thái: chưa nhận (các nấc nhúc
  nhích, có phép so hai sổ) và đã nhận (bốn dòng bằng nhau). Trên mã cũ, trường hợp đã nhận đỏ đúng
  như lỗi thật.
- **Sổ giới hạn:** đóng `ladder-replays-adoption`, mở hai dòng:
  - `ladder-shows-no-path-once-adopted`: ở repo đã nhận, lệnh không còn cho thấy mỗi bước thêm gì.
    Số của Inventory trước khi nhận chỉ còn trong [bản ghi thang](../../docs/trials/inventory-ladder.md).
  - `ladder-reads-with-the-newer-tool`: lệnh đo bằng bản plugin của repo này. Inventory đang giữ
    một bản công cụ cũ hơn một lần sửa (bộ đọc linh kiện của
    [0038](0038-a-component-is-drawn-with-what-its-file-hands-on.md)), nên dòng sổ linh kiện bị đọc
    là «đang lệch» dù cổng của Inventory giữ nó. Lệnh chưa tách được chuyện này khỏi một lần trượt
    thật.
- **Chưa truy hết:** quyết định máy giữ là 16, lần đo ở bước 3 trên bản sao trước khi nhận là 18.
  Một trong hai dòng chênh là sổ linh kiện nói trên. Needs confirmation: dòng còn lại chưa được truy;
  việc truy nằm ở mục để dành của kế hoạch, giai đoạn 1, phải xong trước khi lên đời Inventory.
- Trong một thư mục làm việc riêng (worktree), đường dẫn mặc định tới repo đối chiếu và kit không
  trỏ đúng chỗ; phải truyền `REFERENCE_LEDGER` và `ACCEPTANCE_KIT`. Không sửa ở lần này.
