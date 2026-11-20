---
type: spec
title: Lệnh brief — phiếu giao việc để tác tử dựng một màn mà không phải đoán
status: approved
tier: 1
links:
  - wiki/specs/0003-screens-join-the-domain-model.md
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0009-review-a-drawn-screen.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0070-the-rules-page-opens-with-what-the-owner-fixed.md
  - wiki/decisions/0072-an-eye-is-a-plug-the-harvest-belongs-to-the-socket.md
sources:
  - docs/plan/plan.json
  - docs/trials/results.tsv
  - docs/trials/stage-8-done-when.md
  - docs/trials/briefs/screen.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/review-pack.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - design/screens/reference.yaml
  - design/patterns/danh-sach.md
  - ontology/actions.yaml
  - "chủ repo, 2026-11-21: «Có, viết đề bài», đáp câu «Viết đề bài cho mục 5.1 (lệnh brief) để anh duyệt?»"
  - "chủ repo, 2026-11-21: «Duyệt cả năm», đáp câu «Duyệt đề bài 0010 theo cả năm khuyến nghị?»"
---

# 0010 Lệnh brief — phiếu giao việc để tác tử dựng một màn mà không phải đoán

Máy viết ngày 2026-11-21 theo lời chủ repo («Có, viết đề bài»). Chủ repo duyệt đề bài và đáp cả năm câu hỏi theo khuyến
nghị cùng ngày («Duyệt cả năm»). Đây là đề bài cho mục 5.1 của kế hoạch. Đề bài 0004 đã tả lệnh `brief`; đề bài 0008
xếp nó là dữ liệu của ổ cắm «đề bài dựng màn». Trang này nối hai điều ấy thành tiêu chí dựng được.

## Intent

Một tác tử sắp dựng một màn nhận một phiếu, đọc một lần là đủ. Mỗi lựa chọn của màn trên phiếu ở đúng một trong ba
trạng thái: **đã định** (kèm nguồn), **đang hỏi** (một câu trong hàng chờ, kèm khuyến nghị), hoặc **còn mở** (không
gì trong repo nói, và phiếu nói thẳng như vậy). Tác tử không còn chỗ nào phải tự tìm rồi tự quyết.

### Vì sao cần

- Dòng «xong khi» của giai đoạn 5: một tác tử độc lập dựng một màn chỉ từ brief, số chỗ phải đoán không tăng so với
  lượt thử gần nhất.
- Lần thử 11 còn 9 chỗ phải đoán; 6 vào hàng chờ, 3 tác tử tự quyết lặng lẽ (`docs/trials/stage-8-done-when.md`).
  Ba chỗ ấy là: hình dạng một khái niệm mới trong mô hình dữ liệu, một màn khác có nhận thao tác mới hay không, và chỗ
  của màn mới trong vùng điều hướng. Không sổ nào giữ ba điều ấy, nên không trang nào chỉ hướng.
- Hôm nay điều một màn cần nằm rải ở bảy nơi: sổ màn, trang kiểu màn, sổ linh kiện, bảng trạng thái, trang luật, bản
  thiết kế, mô hình nghiệp vụ. Tác tử phải biết đủ bảy nơi và tự ghép.
- Bảng năng lực ghi ổ cắm «đề bài dựng màn» chưa có phích nào: dòng giới hạn `capability-screen-brief-has-no-plug`.

### Mười hai ô của một phiếu

Danh mục đóng. Mỗi ô nói nó đọc câu trả lời từ đâu; ô không sổ nào giữ thì nói thẳng.

| #   | Ô                      | Đọc từ đâu                                                                       |
| --- | ---------------------- | -------------------------------------------------------------------------------- |
| 1   | Kiểu màn và màn mẫu    | `family` của dòng sổ màn; trang kiểu màn và màn mẫu nó trỏ tới                   |
| 2   | Màn cho thấy gì        | `shows` của dòng sổ màn; trường của thực thể và kiểu cột của từng trường         |
| 3   | Thao tác và vai        | `entry`, `actions` của dòng sổ màn; vai của mỗi thao tác trong mô hình           |
| 4   | Trạng thái             | `states` của dòng sổ màn; bảng trạng thái; cách tới từng trạng thái              |
| 5   | Linh kiện              | sổ linh kiện; khuôn của kiểu màn và thứ kiểu màn cấm dùng ngoài khuôn            |
| 6   | Chữ                    | nơi repo giữ chữ; thuật ngữ                                                      |
| 7   | Luật áp vào màn        | các dòng trang luật áp vào màn, mỗi luật một dòng                                |
| 8   | Nguyên tắc và hướng đi | bản thiết kế, qua bộ đọc chung (quyết định 0070)                                 |
| 9   | Bề rộng và lệnh kiểm   | bề rộng đã khai; các lệnh sẽ chấm màn                                            |
| 10  | Đổi mô hình nghiệp vụ  | thao tác hay thực thể dòng sổ màn nêu mà mô hình chưa có                         |
| 11  | Chỗ trong điều hướng   | danh sách màn của ứng dụng với màn đã dựng; **chưa sổ nào giữ** với màn sắp dựng |
| 12  | Màn khác bị đụng       | **chưa sổ nào giữ**                                                              |

Ô 10, 11 và 12 là đúng ba chỗ tác tử của lần thử 11 tự quyết lặng lẽ.

### Ba trạng thái của một ô

- **Đã định:** phiếu ghi câu trả lời và nguồn của nó: tệp nào, dòng sổ hay dòng luật nào.
- **Đang hỏi:** một câu về đúng ô ấy của đúng màn ấy đang ở hàng chờ. Phiếu ghi câu hỏi và khuyến nghị; câu dễ đảo thì
  tác tử đi tiếp theo khuyến nghị, như trang luật vẫn dặn. Chủ repo đã đáp thì ô thành «đã định», nguồn là lời đáp.
- **Còn mở:** không gì nói. Phiếu in đúng lời gọi `decide --ask` cho ô ấy; thêm cờ `--queue` thì nó ghi câu hỏi vào
  hàng chờ, mỗi câu một tệp mới, qua chính mã của `decide`, như `review` làm (quyết định 0072).

`brief` không tự hỏi câu nào và không tự đáp câu nào: bảng năng lực đã ghi mặt người của ổ cắm này là «phiếu mang điều
chủ repo đã quyết; nó không hỏi gì mới». Mọi câu hỏi vẫn đi qua một cửa là `decide`.

### Hai mặt bàn giao

- **Mặt người (xem được, quyết được):** một phiếu theo khung sáu phần (quyết định 0046). Phần quyết định kê các ô còn
  mở và đang hỏi, mỗi ô một câu cho chủ repo. Mười hai ô có trạng thái và nguồn.
- **Mặt máy (đã định, không phải đoán):** `--json` có các khoá đề bài 0004 đã nêu (`screen`, `kind`, `reference`,
  `components[]`, `states[]`, `rules[]`, `actions[]`, `checks[]`), thêm `slots[]` (mười hai ô, mỗi ô có trạng thái và
  nguồn), `asked[]` và `open[]`. Mã thoát: 0 khi cả mười hai ô đã định; 1 khi còn ô đang hỏi hoặc còn mở; 2 khi gọi
  sai hoặc màn không có trong sổ màn.

### Điều `brief` không làm

- Không dựng màn: việc ấy thuộc ổ cắm «dựng màn».
- Không gọi mô hình, không đọc đồng hồ: cùng một repo cho cùng một phiếu, từng byte.
- Không ghi sổ nào. Chỉ `--queue` ghi, và chỉ ghi tệp mới của hàng chờ.
- Không soát màn đã dựng: việc ấy thuộc `review`.

### Chỗ lệch với đề bài 0004, nêu để chủ repo thấy

- Đề bài 0004 cho mã thoát 1 là «màn không thuộc kiểu nào đã khai». Ở đây đó là một trường hợp của ô 1 còn mở, và mã 1
  phủ mọi ô chưa định.
- Đề bài 0004 cho `brief` nhận «tên một màn sắp dựng kèm kiểu màn». Ở đây phiếu chỉ làm cho màn có trong sổ màn, ở
  trạng thái `built` hoặc `planned` (câu hỏi 2).

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh.

1. **Phiếu cho một màn.** `brief` với mã một màn của sổ màn, đã dựng hay mới khai `planned`, in phiếu. Repo không đổi:
   băm của cây trước và sau bằng nhau. Màn không có trong sổ thì thoát 2 và kê các màn sổ có.
2. **Mười hai ô, không sót.** Phiếu nào cũng có đủ mười hai ô của danh mục, mỗi ô ở đúng một trong ba trạng thái. Một
   bài kiểm đỏ khi danh mục có ô mà không bộ đọc nào đọc, và ô ấy cũng không được khai là «chưa sổ nào giữ».
3. **Ô đã định có nguồn.** Mỗi câu trả lời nêu tệp và dòng sổ hay dòng luật của nó. Bài kiểm sửa một dòng nguồn trên
   kho dựng tạm và thấy phiếu đổi theo.
4. **Ô còn mở không bị bỏ qua.** Trên một kho dựng tạm có màn `planned` nêu một thao tác mô hình chưa có, ô 10 còn mở
   và phiếu in lời gọi `decide --ask` cho nó. Ô 11 và 12 của một màn `planned` luôn còn mở cho tới khi được hỏi.
5. **Hỏi rồi thì thấy.** `--queue` chỉ tạo tệp mới của hàng chờ, mỗi ô còn mở một câu. Chạy lại thì ô ấy thành «đang
   hỏi». Sau khi chủ repo đáp qua `decide`, ô ấy thành «đã định», nguồn là lời đáp kèm tên và ngày.
6. **Một bộ đọc.** Các dòng luật, nguyên tắc và hướng đi trên phiếu trùng với gói soát của `review` cho cùng màn. Một
   bài kiểm so hai đầu ra.
7. **Cùng repo, cùng phiếu.** Hai lượt chạy, kể cả ở hai ngày khác nhau, cho cùng `--json` và cùng tài liệu, từng byte.
8. **Mã thoát:** 0, 1, 2 như mục «Hai mặt bàn giao»; mỗi mã có bài kiểm.
9. **Trang luật trỏ tới phiếu.** Trang luật plugin sinh dặn tác tử chạy `brief` trước khi dựng hay sửa một màn, khi
   repo có sổ màn. Có bài kiểm.
10. **Bảng năng lực.** Ổ cắm «đề bài dựng màn» có lệnh `brief` làm phích mặc định; dòng giới hạn
    `capability-screen-brief-has-no-plug` được đóng, hoặc thu hẹp thành đúng điều còn hở.
11. **Tài liệu.** Phiếu theo khung sáu phần; mục «không thấy gì» kê các giới hạn đang mở của vùng `brief`.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Hợp đồng sổ không thêm sổ nào: `brief` không ghi sổ.
Hàng chờ thêm một loại mục, `screen:<mã màn>:<ô>`, để một câu hỏi về một ô của một màn được tìm lại (câu hỏi 3). Đó
là thay đổi hợp đồng của hàng chờ, cần chủ repo nhận. Bảng năng lực đổi ở một ổ cắm (tiêu chí 10).

## Plan

Hai PR, mỗi PR chạy được riêng.

1. **Lát 1, phiếu từ điều đã định.** Danh mục mười hai ô, các bộ đọc, phiếu và `--json`, mã thoát, tài liệu. Ô không
   có câu trả lời hiện là «còn mở», chưa có lời gọi hỏi. Tiêu chí 1, 2, 3, 6, 7, 8, 11.
2. **Lát 2, phần hỏi và chỗ cắm.** Loại mục mới của hàng chờ, lời gọi `decide --ask` cho ô còn mở, `--queue`, ô «đang
   hỏi» và «đã định bằng lời đáp», trang luật trỏ tới phiếu, bảng năng lực, trang skill. Tiêu chí 4, 5, 9, 10.

Phần đọc dùng lại mã đã có: `factsOf` của gói soát cho luật, nguyên tắc, hướng đi và dòng sổ; `askOf` của `decide` cho
câu hỏi. Không thêm thư viện nào.

## Test plan

- Mỗi tiêu chí có bài kiểm trên một repo bỏ đi dựng trong thư mục tạm, như các lệnh đang có.
- Bài kiểm «cây không đổi» cho `brief`; với `--queue`, chỉ tệp mới của hàng chờ xuất hiện.
- Mỗi ô có bài thử ba trạng thái trên kho dựng tạm: có nguồn thì «đã định», có câu đang chờ thì «đang hỏi», không có
  gì thì «còn mở».
- Bài kiểm chạy ở hai ngày khác nhau cho cùng phiếu (bài học từ lượt soát mục 5.2).
- Phiếu có giảm số chỗ đoán hay không thì đo ở mục 5.4: một tác tử độc lập dựng màn của đề chuẩn, lần này được trao
  phiếu, so với lần 11. Lượt thử tốn token nên hỏi chủ repo trước khi chạy; nó không thuộc mục này.
- Vẻ ngoài của phiếu không có bài kiểm: chủ repo xem mẫu một lần.

## Autonomy tier

Máy dựng sau khi chủ repo duyệt đề bài và đáp các câu hỏi; mỗi lát một PR, gộp là lời của chủ repo. Thêm loại mục vào
hàng chờ, thêm bớt một ô của danh mục, và chạy lượt thử tốn token: luôn là lời chủ repo. Không sửa Delivery Loop, Repo
Standards hay repo kiểm chứng.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả năm theo khuyến nghị ngày 2026-11-21 («Duyệt cả năm»).

1. **`brief` chỉ kê ô còn mở và in lời gọi hỏi, hay tự mở một lượt hỏi chủ repo?** Đề bài 0007 gợi ý mượn lối hỏi một
   lượt, tối đa bốn câu. Khuyến nghị: chỉ kê và in lời gọi, `--queue` mới ghi. Bảng năng lực đã ghi ổ cắm này không
   hỏi gì mới, và một cửa hỏi duy nhất là `decide` thì câu hỏi đọc như nhau dù ai hỏi. Đã nhận: chỉ kê và in lời gọi, `--queue` mới ghi.
2. **Màn chưa có trong sổ màn: nhận tên kèm kiểu màn như đề bài 0004, hay đòi một dòng `planned` trước?** Khuyến
   nghị: đòi dòng `planned`. Sổ màn đã có trạng thái ấy, và ý định về màn (cho thấy gì, thao tác nào) có một chỗ ghi
   thay vì nằm trong lời gọi. Đã nhận: đòi dòng `planned`.
3. **Thêm loại mục `screen:<mã màn>:<ô>` vào hàng chờ?** Khuyến nghị: có. Thiếu nó thì lời đáp của chủ repo không gắn
   được với ô nào, và lượt chạy sau lại coi ô ấy còn mở. Đã nhận: thêm loại mục ấy.
4. **Nhận danh mục mười hai ô là danh mục đóng?** Khuyến nghị: nhận. Chín ô đầu đều đã có nguồn trong repo; ba ô cuối
   là ba chỗ lần thử 11 cho thấy tác tử tự quyết. Thêm bớt một ô về sau là lời chủ repo. Đã nhận: danh mục đóng mười hai ô.
5. **Mục này có chạy qua bộ kit Delivery Loop không?** Khuyến nghị: không, như mục 5.2: đề bài được duyệt, bài kiểm
   viết trước, `make check`, một lượt soát mã độc lập, rồi PR. Đã nhận: không chạy qua kit ở mục này.
