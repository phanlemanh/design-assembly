---
type: decision
title: "Mắt soát là một phích, phần gặt thuộc ổ cắm: hợp đồng phát hiện và ba nhóm của lệnh review"
links:
  - wiki/specs/0009-review-a-drawn-screen.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0071-the-review-command-draws-and-measures-before-any-eye.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
sources:
  - plugins/design-assembly/scripts/review.mjs
  - plugins/design-assembly/scripts/review-harvest.mjs
  - plugins/design-assembly/scripts/review-record.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/skills/review/SKILL.md
  - plugins/design-assembly/tests/test-review-harvest.mjs
  - plugins/design-assembly/tests/helpers/review-repo.mjs
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/plugs/design-critique.json
  - "chủ repo, 2026-11-20: «Duyệt cả năm», đáp câu «Duyệt đề bài 0009 theo cả năm khuyến nghị?»"
  - "chủ repo, 2026-11-20: «Sổ lỗi lọt (Khuyến nghị)», đáp câu về phát hiện dựa vào một dòng của trang luật nằm dưới mục cổng giữ"
---

# 0072 Mắt soát là một phích, phần gặt thuộc ổ cắm

## Status

Accepted, 2026-11-20. Lát 2 của mục 5.2, đề bài 0009: tiêu chí 4, 5 và 8. Tiêu chí 10 (bản quyết định cắm phích, có
số đo từ một lượt thử) là trang riêng. Plugin lên 0.22.0.

## Context

Lát 1 (quyết định 0071) chụp và đo, rồi dừng ở câu «chưa con mắt nào xem hình». Đề bài 0009 giao phần «nhìn» cho một
phích ngoài và giữ phần «gặt» cho Design Assembly: một skill soát nhận được ảnh, nhưng không biết luật của repo, không
trả dạng máy đọc được, và không có gì giữ lời nó nói. Lát này viết đúng phần nối ấy: một dạng cố định cho lời của mắt
soát, và một quy tắc nói mỗi phát hiện đi về đâu.

## Decision

1. **Một tệp phát hiện, một dạng, lệnh kiểm.** Mắt soát xem ảnh và gói soát, rồi tác tử ghi lời của nó vào
   `review-findings.json` (bản 1): màn nào, mắt nào, và mỗi phát hiện có `picture` (mã một ảnh của gói), `severity`
   (`high`, `medium`, `low`), `saw` (điều mắt thấy, bằng lời của nó), `rests_on`, và có thể có `fix`, `place`.
   `review <màn> --findings TỆP` đọc tệp trước khi vẽ gì. Một phát hiện thiếu ảnh, thiếu mức, thiếu `rests_on`, có
   khoá lạ, hay trỏ tới điều repo không có (một dòng sổ không tồn tại, một dòng không có trên trang luật, một nguyên
   tắc chủ repo chưa chốt) làm cả tệp bị từ chối với mã 2; lời từ chối mở đầu bằng tên tệp người gọi đưa, nêu từng
   phát hiện và điều nó thiếu, và không gì được ghi. Ảnh và cỡ trang của từng ảnh chỉ biết được sau khi vẽ (một trạng
   thái không tới được, một giao diện tối ứng dụng không có thì không có ảnh), nên phát hiện trỏ tới ảnh không vẽ, hay
   có `place` nằm ngoài trang của ảnh nó, bị từ chối ngay sau bước vẽ, vẫn trước mọi lần ghi.
2. **`rests_on` có bốn loại, đọc như nhau ở hai nguồn.** Một dòng của sổ quyết định (`ledger-row`, kèm phép kiểm và
   tầng của dòng), một dòng của trang luật (`rule-line`, kèm mục và việc cổng có giữ nó không), một nguyên tắc chủ repo
   đã chốt (`principle`, kèm lời của nó), hoặc không gì (`nothing`, kèm lý do). Phát hiện của mắt soát mang `kind:
"seen"` và cùng bộ khoá với phát hiện máy đo; mỗi phát hiện có thêm `by` (`review` hay tên mắt). Hai nguồn được
   đánh số chung, nặng trước, nên chú thích trên ảnh vẫn khớp số phát hiện. Phát hiện mắt không chỉ chỗ được ghi chú
   trên cả tấm ảnh và nói thẳng như vậy. Gói soát vẫn chỉ mang phát hiện của máy: nó là thứ mắt đọc trước khi nhìn.
3. **Ba nhóm, máy không biến phát hiện nào thành luật.** Mỗi phát hiện, của máy cũng như của mắt, có một mục trong
   `harvest`:
   - `escape`: dựa vào một dòng sổ có phép kiểm, hoặc một dòng trang luật mà cổng giữ. Phép kiểm đã để lọt; lệnh in
     dòng cần thêm vào `design/escapes.md` (ngày, điều lọt, tầng, việc đã làm) và không ghi gì. Trang luật không ghi
     tầng, nên với dòng trang luật ô tầng để trống cho người điền; dán nguyên thì cổng từ chối cho tới khi có người
     viết tầng. Đề bài không nói trường hợp dòng trang luật cổng giữ; chủ repo chốt ngày 2026-11-20: vào sổ lỗi lọt.
   - `question`: dựa vào một dòng trang luật không phép kiểm nào giữ (mục «No check holds these»), một nguyên tắc, hoặc
     một dòng sổ chưa có phép kiểm. Lệnh in câu hỏi đúng bằng lời gọi `decide.mjs --ask` sẽ hỏi nó; dòng sổ chưa có
     phép kiểm được hỏi với `--item decision:<mã>`, như phần tác động miền của đề bài nói. Khuyến nghị kèm câu hỏi là
     để luật như cũ: sửa màn này, và chỉ thành luật khi màn thứ hai cần, đúng nghĩa của một dòng sổ trên trang luật.
     Câu đã có trong hàng chờ (đang chờ, hay đã được đáp) được nói ra, và không có lời gọi nào cho nó.
   - `person`: không dựa vào gì. Nó vào mục «cần mắt người» và không thành câu hỏi nào.
4. **Chỉ `--queue` ghi, và chỉ tệp mới của hàng chờ.** Không có cờ thì repo không đổi. Có cờ thì mỗi câu hỏi là một
   tệp mới dưới `design/waiting/`, làm bởi chính mã của `decide --ask`: phần thân của `askCall` tách ra thành `askOf`,
   nhận lời hỏi ở dạng dữ liệu, và `decide --ask` gọi lại nó, nên một câu hỏi đọc như nhau dù ai hỏi. Mọi câu được
   làm trong bộ nhớ trước; một câu không hỏi được (hàng chờ là một tệp chung, một tệp trùng tên mà danh sách không đọc
   được) làm cả lượt bị từ chối, không ghi gì. Tệp hàng chờ được ghi sau cùng, sau ảnh, gói và biên bản.
5. **Skill `review` gọi mắt qua bảng ổ cắm.** Phích ngoài nay khai `kind: "skill"` khi là một skill (bốn tệp dưới
   `references/plugs/`). Câu trả lời `--json` có `eyes`: các phích ngoài của ổ cắm «soát thiết kế» là skill, kèm tên
   phiên liệt kê chúng. Skill `review` bảo tác tử tìm trong danh sách skill của phiên một skill có tên ấy, đưa nó ảnh
   và gói soát, ghi lời nó vào tệp phát hiện, không thêm không bớt, rồi chạy lại lệnh với `--findings`. Không có skill
   nào như thế thì lượt soát dừng như lát 1 và nói chưa con mắt nào xem hình. Trang skill không viết tên mắt nào;
   phép kiểm lõi sạch của mục 5.0 vẫn giữ điều đó. Hình không ra khỏi phiên.
6. **Câu trả lời và biên bản nói mắt nào đã xem.** Có phát hiện của mắt thì cả hai thôi nói «chưa con mắt nào xem
   hình» và nêu tên mắt cùng số phát hiện của nó. Biên bản thêm cho mỗi phát hiện câu nói nó đi về đâu; mục người
   quyết nêu mọi phát hiện không phép kiểm nào giữ; bước kế có thêm dòng sổ lỗi lọt, `--queue` và bảng quyết định khi
   cần.
7. **Dòng giới hạn thu hẹp.** `capability-design-review-no-eye-on-the-picture` đóng. Phần còn hở thành
   `capability-design-review-eye-unheld`: không phép kiểm nào giữ lời mắt soát nói (phần gặt xếp lời ấy theo chỗ dựa,
   không biết nó đúng hay sai, không biết mắt bỏ sót gì); tác tử chép lời skill vào tệp, nên điều nó bỏ hay thêm không
   ai thấy; và phiên không có skill soát thì không có mắt nào.

## Consequences

- Phần gặt có bài kiểm cho từng nhóm, viết bằng tệp phát hiện tay, không gọi mô hình (`tests/test-review-harvest.mjs`,
  15 bài). Hai bài chạy lệnh thật trên ứng dụng dựng tạm: không có `--queue` thì băm cây trước và sau bằng nhau; có
  `--queue` thì chỉ ba tệp mới của hàng chờ xuất hiện, và chạy lại không thêm tệp nào. Một bài chạy đúng lời gọi lệnh
  in ra trên một bản chép và thấy nó ghi đúng tệp `--queue` ghi.
- Mười chín bài của lát 1 giữ nguyên và vẫn xanh. Khi không có tệp phát hiện, phát hiện của máy vẫn đi qua phần gặt:
  trên màn mẫu, tương phản dựa vào dòng `color-contrast` có phép kiểm nên vào nhóm `escape`.
- Một lượt soát mã độc lập trước PR nêu một điểm nặng và hai điểm vừa. Điểm nặng (ô tầng trống làm cổng từ chối dòng
  dán vào) là lựa chọn của chủ repo, nên giữ; bài kiểm nay chứng đúng điều ấy thay vì chỉ kiểm hình dạng dòng. Hai điểm
  vừa đã sửa: tệp hàng chờ được ghi sau biên bản, và lệnh không ghi đè một tệp đã có. Thêm một điều nhỏ cũng sửa: không
  có `--queue`, câu đã ở hàng chờ không được in thành lời gọi sẽ bị từ chối.
- Một lượt soát độc lập thứ hai, sau khi PR mở, nêu ba điểm; chủ repo cho sửa ngay trong PR («Có, gửi sửa»), cả ba có
  bài kiểm thấy đỏ trước khi sửa:
  - Biên bản đổi theo ngày chạy, vì dòng sổ lỗi lọt mang ngày của đồng hồ. Nay biên bản không đọc đồng hồ: nó nói dòng
    cần thêm bằng phần không đổi theo ngày (điều lọt, tầng, việc đã làm) và dặn ghi ngày lúc thêm. Câu trả lời cho
    người và `--json` vẫn có dòng ghi sẵn ngày chạy (`day`, `line`), để dán ngay hôm ấy. Chọn cách này thay vì ngày
    của commit cuối như trang bìa: dòng sổ lỗi lọt ghi ngày lỗi được tìm ra, không phải ngày màn được commit. Bài kiểm
    soát cùng repo với hai ngày khác nhau và thấy hai biên bản trùng từng byte.
  - Lời từ chối luôn nêu `review-findings.json` dù tệp mang tên khác. Nay nó nêu đúng tên người gọi đưa.
  - Một `place` nằm ngoài trang của ảnh được nhận, rồi chú thích bị ép vào mép ảnh. Nay phát hiện ấy bị từ chối, nêu
    phát hiện, vị trí và cỡ trang.
- Phần gặt không nói được: một phát hiện của mắt có đúng không, mắt đã bỏ sót gì, và tác tử có chép đúng lời skill vào
  tệp không. Nó chỉ nói phát hiện ấy dựa vào đâu và vì thế đi về đâu. Số đo cho các điều ấy đến từ lượt thử của bản
  quyết định cắm phích.
