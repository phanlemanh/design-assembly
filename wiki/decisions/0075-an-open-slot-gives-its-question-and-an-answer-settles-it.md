---
type: decision
title: "Ô còn mở đưa đúng lời gọi hỏi nó, và lời đáp của chủ repo đóng ô"
links:
  - wiki/specs/0010-the-screen-brief.md
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0070-the-rules-page-opens-with-what-the-owner-fixed.md
  - wiki/decisions/0072-an-eye-is-a-plug-the-harvest-belongs-to-the-socket.md
  - wiki/decisions/0074-the-brief-is-twelve-slots-each-read-or-said-open.md
sources:
  - plugins/design-assembly/scripts/brief.mjs
  - plugins/design-assembly/scripts/brief-slots.mjs
  - plugins/design-assembly/scripts/brief-readers.mjs
  - plugins/design-assembly/scripts/brief-sheet.mjs
  - plugins/design-assembly/scripts/queue.mjs
  - plugins/design-assembly/scripts/review-harvest.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/screens.mjs
  - plugins/design-assembly/references/brief-slots.json
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/brief/SKILL.md
  - plugins/design-assembly/tests/test-brief-asks.mjs
  - plugins/design-assembly/tests/test-brief-plug.mjs
  - plugins/design-assembly/tests/test-brief.mjs
  - "chủ repo, 2026-11-21: «Duyệt cả năm», đáp câu «Duyệt đề bài 0010 theo cả năm khuyến nghị?»"
  - "chủ repo, 2026-11-21: «Giữ như vậy», đáp câu «Bảy ô không có nguồn nội dung: giữ khuyến nghị «ghi vào sổ trước khi dựng»?»"
---

# 0075 Ô còn mở đưa đúng lời gọi hỏi nó, và lời đáp của chủ repo đóng ô

## Status

Accepted, 2026-11-21. Lát 2, lát cuối của mục 5.1, đề bài 0010: tiêu chí 4, 5, 9 và 10, cùng ba điểm lượt soát lát 1
để lại. Plugin lên 0.24.0. **Hợp đồng của hàng chờ đổi:** thêm loại mục `screen:<mã màn>:<ô>` (chủ repo đã nhận ở câu
hỏi 3 của đề bài).

## Context

Lát 1 (quyết định 0074) in phiếu mười hai ô, mỗi ô «đã định» kèm nguồn hoặc «còn mở» kèm lý do. Nó chưa hỏi gì: ô mở
chỉ được nêu tên, không lời đáp nào của chủ repo đóng được một ô, và vì ô 12 chưa sổ nào giữ nên không phiếu nào kết
thúc bằng mã 0. Đề bài đã chốt: `brief` không tự hỏi và không tự đáp; mọi câu hỏi đi qua `decide`; chỉ `--queue` ghi.
Mẫu gần nhất là phần gặt của `review` (quyết định 0072).

## Decision

1. **Loại mục `screen:<mã màn>:<ô>` nằm ở `ITEMS` của `waiting.mjs`, và không phải «của riêng chủ repo».** Ô là một
   trong mười hai mã của danh mục. `waiting.mjs` là mã mẫu được chép vào từng repo, cổng của repo đọc hàng chờ khi
   không có plugin bên cạnh, nên mười hai mã đứng ở đó (`SCREEN_SLOTS`); `askProblems` của plugin đỏ khi danh sách ấy
   lệch danh mục. `owners: false`, vì ba lẽ: `owners` nghĩa là tác tử dừng **và** cổng đỏ tới khi chủ repo giữ đúng
   mục ấy; cổng đọc điều đó từ diff của nhánh (trang kiểu màn mới, dòng màu gốc), còn không gì trong diff nói «màn này
   dựng trên một ô còn mở», nên để `true` là hứa điều cổng không giữ được; và đề bài đã nói câu dễ đảo thì tác tử đi
   tiếp theo khuyến nghị. Câu khó đảo hay không là một chiều khác, do chính câu hỏi mang (`hard_to_undo`).
2. **Mỗi ô của danh mục mang sẵn điều một ô mở khuyến nghị.** `ask` trong `references/brief-slots.json`: `recommend`,
   `basis` (`kind` là `principle`, `standard` hoặc `measurement`, đúng ba loại căn cứ của khung tài liệu; `text`), và
   `hard_to_undo`. Phiếu ghép thêm vào căn cứ điều nó đọc được ở repo (các lý do ô còn mở), và với hai ô chưa sổ nào
   giữ thì thêm một số đo: danh sách màn của ứng dụng có bao nhiêu màn và màn cuối ở đâu (ô 11); bao nhiêu màn khác
   của sổ màn nêu cùng thao tác hay thực thể với màn này, kể tên (ô 12).
3. **Khuyến nghị không bịa ra câu trả lời mà phiếu không có nguồn.** Năm ô có căn cứ cho một lựa chọn cụ thể: trạng
   thái bảng bắt buộc (ô 4), hai bề rộng mọi sàn khởi đầu, 320 theo WCAG 2.2 (ô 9), thêm vào mô hình trước, cùng thay
   đổi, có người soát (ô 10), đứng cuối danh sách màn (ô 11), không đổi màn nào khác (ô 12). Bảy ô còn lại (kiểu màn,
   màn cho thấy gì, thao tác, linh kiện, chữ, luật, nguyên tắc) chỉ chủ repo có câu trả lời; khuyến nghị ở đó nói
   **câu trả lời được ghi vào đâu trước khi dựng**, dựa trên luật của sàn rằng sổ ấy giữ điều ấy. Chủ repo vẫn đáp
   được bằng lời của mình. Chủ repo nhận cách này ngày 2026-11-21 («Giữ như vậy»). Cả mười hai ô để `hard_to_undo: false`: trang luật của sàn đã dặn tác tử thêm khái niệm
   vào mô hình trong cùng thay đổi và báo người soát, nên phiếu không nói ngược lại.
4. **Ô còn mở đưa đúng lời gọi `decide --ask`.** `open[]` và từng ô mở mang `ask` (mục, mã câu hỏi
   `screen-<mã màn>-<ô>`, câu hỏi có tên màn và lý do, khuyến nghị, căn cứ, khó đảo hay không) và `call`. Lời gọi có
   `--item` và `--id`, nên chạy nó ra đúng tệp `--queue` ghi, từng byte; bài kiểm chạy cả hai và so.
5. **Mã dùng chung, không chép.** `scripts/queue.mjs` giữ ba thứ `review` và `brief` cùng cần: lời gọi (`callOf`),
   chỗ một câu hỏi đang đứng trong hàng chờ (`standing`), và ghi một loạt câu hỏi thành tệp mới qua `askOf` của
   `decide`, tất cả hoặc không gì, không ghi đè (`askAll`). Phần gặt của `review` nay gọi qua đó; bài kiểm của nó
   không đổi.
6. **`--queue` là cờ duy nhất ghi.** Câu hỏi được dựng trong bộ nhớ; phiếu «sau khi hỏi» tính từ hàng chờ trong bộ
   nhớ; tài liệu (nếu có `--out`) dựng xong rồi tệp hàng chờ mới được ghi, sau cùng. Bị từ chối trọn, không ghi gì,
   khi: một câu không hỏi được; hàng chờ là một tệp chung; tệp của câu hỏi đã có; mã câu hỏi đã thuộc về một câu về
   điều khác; hoặc bản công cụ repo đã chép cũ hơn 0.24.0, bản đầu tiên đọc được loại mục này (cùng lối `intake` và
   `change` đã làm).
7. **Ba trạng thái, đọc từ hàng chờ.** Ô mà repo không nói được tra theo mục `screen:<mã màn>:<ô>` (hoặc theo mã câu
   hỏi của phiếu khi dòng không nêu mục, như `decide` vẫn tìm): có câu đang chờ thì «đang hỏi», kèm câu hỏi, khuyến
   nghị, căn cứ, tệp; chủ repo đã đáp thì «đã định», dòng cuối của câu trả lời là lời đáp, nguồn là tệp câu hỏi kèm
   tên và ngày lời đáp mang; không có gì thì «còn mở». Câu do tác tử tự hỏi bằng lời của nó cũng tính, miễn nêu đúng
   mục. Ô mà repo đã nói thì do repo đóng: một câu hỏi về nó không đổi gì. Hàng chờ hỏng là repo không đọc được, mã 2.
   Lý do repo không nói vẫn ở lại trên ô đã được đáp («repo vẫn chưa nói»). Với ô đang hỏi, phiếu chỉ bảo «đi tiếp
   theo khuyến nghị» khi câu hỏi có khuyến nghị và nói rõ là dễ đảo; câu không có khuyến nghị, khó đảo, hoặc không nói
   dễ hay khó thì phiếu bảo đừng dựng trên nó. Ô mở mà `decide` sẽ từ chối hỏi (mã màn có dấu cách, dấu hai chấm,
   dấu phẩy hay dấu gạch chéo; hoặc mã câu hỏi đã thuộc về một câu về điều khác) không in lời gọi nào và nói vì sao
   trong `cannot_ask`; `--queue` bỏ qua nó và vẫn hỏi các ô còn lại.
8. **Lời đáp nào cũng đóng ô, và phiếu nói đúng lời ấy.** Giữ: «chủ repo giữ khuyến nghị: …». Lời riêng: «chủ repo
   đáp: …». Bác: «chủ repo bác khuyến nghị «…»: …», hoặc «và không nói gì thay vào». Đề bài viết «đã đáp thì đã định»,
   không lệnh nào hỏi lại một ô, nên một lời bác không lời vẫn đóng ô; điều ấy được ghi thành một dòng giới hạn.
9. **Tóm tắt nói số ô đã định còn chờ ô khác.** Giữ nguyên luật «một thứ thiếu chỉ mở một ô». `summary` trong
   `--json` có `slots`, `settled`, `asked`, `open`, `settled_by_answer`, `settled_waiting`; dòng tóm tắt cho người và
   câu kết luận của tài liệu nói «N trong số ô đã định mang một dòng còn chờ ô khác» khi N lớn hơn 0.
10. **Mã thoát 0 tới được qua lệnh thật.** Màn đã dựng của kho dựng tạm: ô 12 mở, `--queue`, chủ repo đáp qua
    `decide --answers`, `brief` kết thúc bằng 0, cả hai dạng in.
11. **Trang luật trỏ tới phiếu bằng một đoạn mở đầu, không bằng một dòng luật.** Khi repo có phép kiểm sổ màn, trang
    luật thêm một đoạn ngay sau lời mở: chạy `/design-assembly:brief <mã màn>` trước khi dựng hay sửa một màn, màn
    chưa dựng thì khai `status: planned` trước, và ba trạng thái nghĩa là gì. Nó không phải gạch đầu dòng dưới một
    mục: gói soát đọc mỗi gạch đầu dòng là một luật, và mục nào không phải mục «không phép kiểm nào giữ» thì coi là
    cổng giữ. Không phép kiểm nào thấy tác tử có chạy `brief` hay không, nên viết nó thành luật là nói quá. Repo không
    có sổ màn nhận đúng trang cũ.
12. **Bảng năng lực.** Ổ cắm «đề bài dựng màn» có `brief` là phích mặc định. Mặt người: cho thấy mười hai ô, hỏi mỗi
    ô mở qua tờ quyết định. Mặt máy: lệnh kết thúc bằng 1 khi còn ô đang hỏi hay còn mở, `held_by` là chính lệnh.
    `capability-screen-brief-has-no-plug` đóng; điều còn hở của ổ cắm là dòng mới `brief-run-before-building-unheld`.
13. **Một bảng khoá trang kiểu màn.** `KEY` xuất từ `screens.mjs` của sàn, thêm khoá khuôn, tên khuôn, đường nhập,
    khe bắt buộc và thứ cấm ngoài khuôn. Bộ đọc của `brief` và `components.mjs` dùng nó; một bài kiểm đỏ khi tệp của
    `brief` tự viết lại một khoá.

## Consequences

- Hai mươi bài kiểm, viết trước và thấy đỏ trước khi có mã: mười bốn bài trong `tests/test-brief-asks.mjs` (phần
  hỏi và đáp) và sáu bài trong `tests/test-brief-plug.mjs` (loại mục, danh mục, trang luật, bảng năng lực, trang
  skill, bảng khoá). Mỗi ô của danh mục được thử đủ ba trạng thái qua lệnh thật: mở, hỏi bằng `--queue`, đáp bằng
  `decide`. Bảng «bỏ nguồn của từng ô» chuyển sang tệp trợ giúp để các tệp bài kiểm dùng chung. Plugin có 881 bài
  kiểm, trước là 861.
- **Ngày xuất hiện ở đúng một chỗ:** `asked_on` trong tệp hàng chờ mà `--queue` ghi, do chính `decide` ghi, như mọi
  câu hỏi của hàng chờ và như `review --queue`. Phiếu không in ngày ấy. Bài kiểm chạy `--queue` dưới hai ngày: điều
  lệnh in giống nhau từng byte, phiếu và tài liệu sau đó giống nhau từng byte, hai tệp chỉ khác đúng dòng ngày. Ngày
  trên phiếu của một ô đã đáp là ngày lời đáp mang, đọc từ tệp, không từ đồng hồ.
- Trên màn `reference` của ứng dụng mẫu: mười ô đã định, hai ô mở (ô 8 vì bản thiết kế chưa có nguyên tắc nào chủ
  repo chốt, ô 12 vì chưa sổ nào giữ), nay mỗi ô kèm khuyến nghị và lời gọi hỏi. Kho này chưa hỏi câu nào: hỏi là
  lời chủ repo.
- Ba dòng giới hạn đóng: `capability-screen-brief-has-no-plug`, `brief-open-slot-not-asked`,
  `brief-two-slots-held-by-no-ledger`. Năm dòng mới ở vùng `brief` nói điều còn hở: không phép kiểm nào thấy tác tử
  có chạy `brief` trước khi dựng; lời đáp nằm ở hàng chờ chứ không vào sổ nào; lời đáp nào cũng đóng ô, kể cả một lời
  bác không lời; mỗi ô một khuyến nghị dù ô mở vì lý do nào, và bảy ô chỉ nói nơi ghi; lời gọi in ra là của `decide`,
  vốn không từ chối bản công cụ cũ như `--queue`.
- Trang luật của kho này có thêm đoạn trỏ tới phiếu; `tools/design-assembly/` nhận bản mới của `waiting.mjs`,
  `screens.mjs` và `components.mjs` qua `make design-apply`.
- Một lượt soát mã độc lập trước PR: không điểm chặn, không điểm nặng, hai điểm vừa và hai điểm nhẹ; mỗi điểm sửa
  đều có bài kiểm thấy đỏ trước.
  - Vừa, đã sửa: màn có mã mà hàng chờ không gọi tên được vẫn được in lời gọi và lời mời `--queue`, rồi cả hai bị
    `decide` từ chối. Nay ô ấy nói thẳng là không hỏi được, kèm lý do.
  - Vừa, đã sửa: câu hỏi viết tay không có khuyến nghị, hoặc không nói dễ hay khó đảo, vẫn được in «đi tiếp theo
    khuyến nghị». Nay phiếu chỉ nói thế khi có khuyến nghị và câu hỏi nói rõ là dễ đảo.
  - Nhẹ, đã sửa: hai mã màn chỉ khác chữ hoa cho cùng một mã câu hỏi, nên phiếu của màn thứ hai nói «còn mở» và in
    một lời gọi sẽ bị từ chối. Nay nó nói mã câu hỏi đã có chủ.
  - Nhẹ, đã sửa: trang skill và lời đầu tệp nói «không đọc đồng hồ» mà không nêu ngoại lệ là ngày của câu hỏi
    `--queue` ghi.
  - Bài kiểm yếu, đã sửa: khối «không ghi đè» thật ra chứng «hàng chờ không đọc được thì không ghi gì»; lời chú nay
    nói đúng thế, và thêm một khối «một câu không hỏi được thì không câu nào được ghi». Thêm bài cho hàng chờ dạng
    một tệp chung và cho `--queue` đi cùng `--out`. Chỗ canh «tệp đã có» trong `queue.mjs` không bài nào tới được:
    hàng chờ đọc mọi tệp `.json` của thư mục nên một tệp trùng tên đã bị bắt từ trước; giữ lại làm lớp canh thứ hai.
- Chưa tác tử độc lập nào dựng màn từ phiếu: đó là mục 5.4, tốn token, cần lời chủ repo.
