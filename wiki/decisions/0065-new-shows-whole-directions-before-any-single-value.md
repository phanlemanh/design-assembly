---
type: decision
title: "new trình ba hướng đi trọn vẹn trên màn thật, sáng và tối, trước khi hỏi từng giá trị"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0064-the-owner-fixes-design-principles-and-every-recommendation-says-what-it-rests-on.md
  - wiki/decisions/0019-show-then-ask.md
sources:
  - plugins/design-assembly/references/directions.json
  - plugins/design-assembly/scripts/directions.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/skills/new/SKILL.md
  - plugins/design-assembly/references/layers/foundations.md
  - plugins/design-assembly/tests/test-directions.mjs
  - "chủ repo, 2026-11-19: «Làm 4.2»; nguồn hướng đi: «Danh mục hướng đi»; màu: «Giữ màu chủ repo»"
---

# 0065 new trình ba hướng đi trọn vẹn trên màn thật, sáng và tối, trước khi hỏi từng giá trị

## Status

Accepted, 2026-11-19. Mục 4.2 của kế hoạch, theo đề bài 0004 mà chủ repo đã duyệt (tiêu chí 15, và phần «Người nhận» của
`new`). Ngày 2026-11-19 chủ repo chọn hai chỗ đề bài để ngỏ: hướng đi lấy từ một danh mục, và màu của chủ repo được giữ
trong mọi hướng. Cả hai đều theo lối máy khuyên.

## Context

Đề bài 0004 nói `new` phải trình hai, ba hướng đi trọn vẹn, vẽ trên chính màn của repo, cả sáng lẫn tối. Mỗi hướng gồm màu,
chữ và hình khối đi cùng nhau, kèm lý lẽ trỏ về nguyên tắc. Chọn hướng xong mới tinh chỉnh từng thứ, và máy nhận khoá
`directions[]`.

Trước mục này, bảng mẫu (quyết định 0019) cho chọn từng thứ rời bằng một chữ cái: màu, rồi thang chữ, rồi bo góc. Người
xem chưa bao giờ thấy ba thứ ấy cùng nhau trước khi chọn. Sổ giới hạn có dòng `new-json-without-directions`. Mục 4.1 đã
cho chủ repo chốt nguyên tắc, mỗi nguyên tắc khai nó nghiêng về phương án nào.

## Decision

1. **Danh mục `references/directions.json` có sáu hướng đi:** workbench, precise instrument, familiar, friendly service,
   editorial, clear guide.
   - Mỗi hướng có một bộ giá trị trọn vẹn: màu gốc, thang chữ (kèm tỉ lệ khi là modular) và bo góc.
   - Mỗi hướng có một câu tả chữ và hình khối, một câu tả màu riêng của nó, và loại sản phẩm nó hợp.
   - Mỗi hướng nêu những nguyên tắc của danh mục nó theo (`follows`). Một bài kiểm giữ cho mọi phương án mà những nguyên
     tắc ấy nghiêng về đều là phương án hướng ấy có.
   - Màu của mỗi hướng là một màu khởi đầu của plugin, khác màu các hướng còn lại.
   - Hai hướng bất kỳ khác nhau ở chữ hoặc ở hình khối. Nhờ vậy, khi màu của chủ repo được giữ, các hướng vẫn khác nhau.
2. **`scripts/directions.mjs` chọn ba hướng để trình, tốt nhất trước.**
   - Điểm tính theo từng nguyên tắc chủ repo đã chốt. Hướng có mọi giá trị mà nguyên tắc ấy nghiêng về thì được một điểm.
     Hướng không có giá trị nào trong số ấy thì mất một điểm. Hướng chỉ theo một phần thì không được, không mất. Vì vậy
     nguyên tắc nghiêng về nhiều giá trị vẫn chỉ tính một lần.
   - Hoà điểm thì hướng hợp loại sản phẩm đứng trước, rồi theo thứ tự của danh mục.
   - Nguyên tắc chỉ được đề xuất thì không tính.
   - Mỗi hướng nói nó hợp, đi ngược và theo một phần nguyên tắc nào đã chốt (`fit`: `agrees`, `disagrees`, `mixed`).
3. **Mỗi giá trị của một hướng nói nó dựa vào đâu.**
   - Một nguyên tắc chủ repo đã chốt nghiêng về giá trị ấy: căn cứ loại `principle`.
   - Không thì: nguyên tắc của danh mục mà hướng ấy theo và chủ repo chưa chốt, hoặc tính cách của hướng; căn cứ loại
     `standard`.
   - Ở cả hai loại, nguyên tắc đã chốt nào nghiêng về phương án khác thì được nêu tên trong căn cứ.
4. **Màu của chủ repo được giữ trong mọi hướng.**
   - Màu của chủ repo là màu đầu tiên đọc được trong các `--color`, hoặc màu gốc trong bản thiết kế khi người đã chọn hay
     đã xác nhận nó. Một chữ không phải màu thì bị bỏ qua, và bảng nói điều ấy.
   - Khi ấy các hướng chỉ khác nhau ở chữ và hình khối, và câu tả không nói gì về màu.
   - Màu do máy đề xuất không phải của chủ repo: mỗi hướng mang màu riêng của nó.
5. **Bảng mẫu có mục `direction`, đứng đầu.**
   - `specimen.mjs --section direction` vẽ ba hướng trên màn đầu của repo. Mỗi hướng vẽ màu đã giải theo mức tuân thủ, cùng
     thang chữ và bo góc của nó, ở trạng thái sẵn sàng (sáng và tối) và trạng thái rỗng.
   - Một chữ cái cho cả bộ: `choices.json` ghi `direction` cùng các khoá lựa chọn.
   - Lời gọi mặc định không vẽ mục này. Nó vẫn dành để tinh chỉnh từng giá trị, sau khi đã chọn hướng.
6. **`new` (`apply.mjs`) trả `directions` ở `--json`:** ba hướng nó sẽ trình, mỗi hướng với giá trị, nguyên tắc nó theo,
   chỗ hợp và chỗ đi ngược, và căn cứ của từng giá trị.
   - Bản xem trước in mỗi hướng một dòng.
   - Bản thiết kế ghi hướng đã chọn ở `layers.foundations.direction`. Mã ấy phải có trong danh mục, và trang ghi của tầng
     nền nêu nó.
7. **Skill `new` có bước «Directions first»:** hỏi một câu, hướng nào là của sản phẩm. Sau đó chỉ hỏi lại từng giá trị mà
   người muốn đổi.

Chỗ lệch và chỗ thêm so với đề bài:

- **Hướng đi không gồm mật độ, độ nổi, chuyển động hay biểu tượng,** vì các tầng ấy chưa dựng. Cách mở một bản ghi vẫn hỏi
  riêng.
- **Danh mục là chỗ thêm.** Không lệnh nào gọi mô hình, nên hướng đi không được dựng riêng cho từng repo.

Một người đọc lại độc lập nêu năm chỗ, và cả năm đã sửa, mỗi chỗ kèm một bài kiểm:

- **Lỗi nặng: căn cứ nói sai.** Một giá trị có nguyên tắc chủ repo đã chốt đỡ, nhưng cũng có một nguyên tắc đã chốt khác
  kéo đi. Khi ấy căn cứ nói nguyên tắc đỡ nó là «chủ repo chưa chốt». Nay căn cứ nêu cả hai, đúng như thật.
- **Một nguyên tắc có thể đứng ở cả hai danh sách hợp và đi ngược, và được tính nhiều lần.** Nay mỗi nguyên tắc tính một
  lần, ở đúng một trong ba danh sách.
- **Một `--color` không phải màu làm mục hướng đi rỗng,** và màu thứ hai đọc được thì bị lờ đi. Nay lệnh lấy màu đầu tiên
  đọc được, và nói chữ nào bị bỏ qua.
- **Lời gọi mặc định của bảng mẫu vẽ lại cả mục hướng đi** khi người chỉ muốn tinh chỉnh một giá trị. Nay mục ấy chỉ vẽ
  khi được gọi riêng.
- **Bài kiểm chỉ thấy có `--radius` và cỡ chữ,** mà không so giá trị. Nay giá trị vẽ ra được so với giá trị mà chữ cái
  ghi vào bản thiết kế.

Thử 17 cách làm hỏng mã. Một cách lọt vì chưa bài nào cho thấy điểm trừ đổi thứ tự; nay có một ca cho trang nội dung. Một
cách khác lọt vì đoạn mã ấy không bao giờ chạy tới, và đoạn ấy đã được bỏ. Nay mọi cách đều bị bắt.

## Consequences

- **Dòng «xong khi» thứ nhất của giai đoạn 4 có lệnh chứng:**
  `node --test plugins/design-assembly/tests/test-directions.mjs`, 8 bài, không bài nào bị bỏ qua.
  - Bài cuối vẽ ba hướng trên màn thật của kho này, mỗi hướng một ảnh sáng và một ảnh tối.
  - Kho này đã có màu `#0246ff`, nên cả ba hướng giữ màu ấy và khác nhau ở chữ và bo góc.
- **Các bài kiểm khác đổi:**
  - Bài kiểm hợp đồng lệnh nay đòi `directions`.
  - Bài kiểm bảng mẫu nay thấy mục `direction` đứng đầu.
- **Sổ giới hạn:**
  - Đóng `new-json-without-directions`.
  - Mở hai dòng mới: `directions-are-colour-type-and-shape` và `directions-from-a-closed-catalog`. Dòng sau ghi rằng khi giữ
    màu chủ repo, hai hướng có thể chỉ khác một tỉ lệ chữ hay một bậc bo góc, mà một màn ít chữ cho thấy mờ.
- **Bảng từ vựng** thêm «design direction».
- **Plugin lên 0.15.0.** Script và dữ liệu đổi; công cụ chép vào repo không đổi.
- **Chủ repo xem mẫu một lần.** Giai đoạn 4 đòi chủ repo xem từng mẫu tài liệu một lần; bảng hướng đi là một mẫu như vậy.
