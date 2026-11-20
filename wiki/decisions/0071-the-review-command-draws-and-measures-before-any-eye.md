---
type: decision
title: "Lệnh review chụp và đo trước khi có con mắt nào: phích mặc định của ổ cắm soát thiết kế"
links:
  - wiki/specs/0009-review-a-drawn-screen.md
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
sources:
  - plugins/design-assembly/scripts/review.mjs
  - plugins/design-assembly/scripts/review-shots.mjs
  - plugins/design-assembly/scripts/review-pack.mjs
  - plugins/design-assembly/scripts/review-record.mjs
  - plugins/design-assembly/scripts/measure.mjs
  - plugins/design-assembly/scripts/stage.mjs
  - plugins/design-assembly/scripts/document.mjs
  - plugins/design-assembly/skills/review/SKILL.md
  - plugins/design-assembly/tests/test-review.mjs
  - plugins/design-assembly/tests/test-measure.mjs
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-20: «Duyệt cả năm», đáp câu «Duyệt đề bài 0009 theo cả năm khuyến nghị?»"
  - "chủ repo, 2026-11-20: «Giữ «cần mắt người»», đáp câu «Chữ bị hộp rút gọn bằng dấu ba chấm: để ở «cần mắt người», hay tính là phát hiện?»"
---

# 0071 Lệnh review chụp và đo trước khi có con mắt nào

## Status

Accepted, 2026-11-20. Lát 1 của mục 5.2, đề bài 0009: tiêu chí 1, 2, 3, 6, 7 và 9. Lát 2 (tiêu chí 4, 5, 8 và 10)
chưa dựng. Plugin lên 0.21.0.

## Context

Cổng xanh chưa có nghĩa là màn ổn: ba trong năm lượt thử dựng màn có cổng xanh mà vẫn có lỗi lọt, và cổng chỉ đo
tương phản ở giao diện sáng, trên hai cặp vai màu. Bảng năng lực ghi ổ cắm «soát thiết kế» do một mình cổng giữ, và
cổng không nhìn hình. Đề bài 0009 chia việc soát làm bốn phần (chụp, đo, nhìn, gặt) và giao hai phần đầu cho phích
mặc định: chúng phải chạy được khi không cài thêm gì.

## Decision

1. **Một lệnh chỉ đọc, theo hợp đồng chung.** `review <mã màn>` nhận `--target`, `--states`, `--json`, `--out DIR`
   (kèm `--format pdf`). Mã thoát: 0 khi không thấy gì, 1 khi có phát hiện hoặc một ảnh được yêu cầu mà không vẽ
   được, 2 khi gọi sai, màn không có trong sổ màn hay chưa dựng, hoặc repo không có nền dựng plugin vẽ được. Không có
   `--out` thì màn vẫn được vẽ và đo, và không tệp nào được ghi.
2. **Chụp qua nền dựng và trình duyệt của chính repo.** Mỗi bề rộng đã khai một ảnh sáng và một ảnh tối, mỗi trạng
   thái một bộ khi có `--states`. Cách tới một trạng thái và cách bật giao diện tối nay nằm một chỗ
   (`reachState`, `setDark` trong `scripts/stage.mjs`); cuốn sổ bàn giao và bảng mẫu gọi cùng chỗ ấy thay vì mỗi
   nơi chép một bản. Lệnh chờ mọi chuyển động có kết thúc xong rồi mới đo: màu còn đang chuyển sang giá trị tối không
   phải là màu để đo.
3. **Hai phép đo, không gọi mô hình, tách khỏi lệnh.** `scripts/measure.mjs` gồm một đầu dò chạy trong trang và các
   hàm thuần trên điều đầu dò báo, để cổng dùng lại được sau này:
   - tương phản của chữ với nền người đọc thật sự thấy: mọi lớp nền từ gốc trang tới chữ được chồng lên nhau, kể cả
     lớp trong suốt và độ mờ của cả nhóm; ngưỡng theo mức tuân thủ repo đã chọn (AA khi repo không nêu), chữ lớn
     được đòi thấp hơn;
   - chữ bị bẻ giữa từ (một từ nằm trên hai dòng mà không có chỗ ngắt do người viết đặt; ngắt sau gạch nối, gạch
     dài hay dấu gạch chéo là chỗ ngắt của người viết) và chữ bị cắt (một phần chữ nằm ngoài hộp giấu phần không
     vừa, mà không có dấu nào báo). Chữ được hộp rút gọn có báo, bằng dấu ba chấm hay giới hạn số dòng, không thành
     phát hiện: nó được nêu ở mục «cần mắt người». Đề bài không nói rõ điểm này; chủ repo chốt ngày 2026-11-20:
     giữ ở «cần mắt người».
4. **Một chỗ phạm là một phát hiện.** Cùng một cặp màu ở nhiều chỗ, nhiều bề rộng là một phát hiện; cùng một từ bị bẻ
   ở mọi ảnh là một phát hiện. Mỗi phát hiện có số, ảnh mang chú thích của nó, vị trí, mức, số đo, cách sửa, và
   `rests_on`: dòng `color-contrast` của sổ quyết định khi repo có dòng ấy, còn không thì nói thẳng là không dựa vào
   gì. Lệnh không tự nghĩ ra luật cho một phát hiện.
5. **Giao diện tối người dùng chưa tới được thì ghi mức thấp.** Lệnh luôn vẽ và đo cả hai giao diện. Nó coi là «tới
   được» khi màn tự chuyển tối lúc hệ thống đòi tối, hoặc khi mã nguồn của ứng dụng có dòng tự bật tối. Không có cả
   hai thì phát hiện chỉ thấy ở giao diện tối mang mức thấp, kèm lý do. Ứng dụng không có giao diện tối thì chỉ vẽ
   sáng và nói rõ.
6. **Gói soát cho con mắt đến sau.** `review-pack.json` kê các ảnh, các dòng của trang luật áp vào màn, nguyên tắc
   và hướng đi chủ repo đã chốt (qua `principlesOf` và `directionOf`), dòng sổ của màn và dòng sổ các phép đo dựa
   vào, cùng điều đã đo. Gói không ghi giờ hay tên máy, nên hai lần chạy cho cùng gói.
7. **Biên bản theo khung sáu phần, có hình.** Khung tài liệu chung nay nhận hình kèm chú thích đánh số, và từ chối
   vẽ khi số chú thích không khớp số phát hiện, mỗi phát hiện đúng một chú thích. Biên bản trỏ tới ảnh bằng tên tệp
   cạnh nó, không nhúng ảnh, nên hai lần chạy cho cùng một trang từng byte. Với mỗi phát hiện chưa có luật nào giữ,
   trang cho người quyết đặt một câu: thành luật, hay để đó. Mục «không thấy gì» mở đầu bằng điều chưa con mắt nào
   xem hình.
8. **Bảng năng lực đổi ở một ổ cắm.** Phích mặc định của «soát thiết kế» là lệnh `review`; cổng vẫn là một phích của
   ổ cắm, không còn là mặc định. Dòng giới hạn `capability-design-review-sees-no-picture` đóng; phần còn hở thành
   dòng `capability-design-review-no-eye-on-the-picture`: chưa skill soát nào được gọi và chưa phát hiện nào của nó
   được gặt, cho tới lát 2.

## Consequences

- Chạy trên màn mẫu của chính kho này với `--states` (48 ảnh), lệnh ra ba phát hiện, cả ba chỉ ở giao diện tối và
  mang mức thấp vì ứng dụng mẫu chưa có công tắc tối. Hai trong ba là đúng hai chỗ kế hoạch đang gác lại: mô tả của
  toast lỗi 1,7:1 và nút «Xoá» trong hộp thoại xác nhận (lệnh đo 4,25:1, bằng số của lượt dọn việc tồn; ba lượt chạy lại sau khi gộp cho cùng số ấy). Chưa sửa chỗ
  nào: `review` không sửa màn.
- Lượt chạy thử ấy cũng bắt được một lỗi của chính lệnh trước khi nó vào PR: đo ngay sau khi bật giao diện tối cho ra
  phát hiện giả, vì màu còn đang chuyển. Từ đó có bước chờ chuyển động ở quyết định 2.
- Cây của repo không đổi, với một điều phải nói rõ: nền dựng của chính repo giữ phần nó đã chuẩn bị trong thư mục
  gói cài (như mọi lần chạy máy chủ phát triển của nó), nên bài kiểm «cây không đổi» băm cây mà bỏ thư mục ấy ra.
  Dòng giới hạn `review-build-cache-in-the-packages-folder` ghi điều này.
- Một lượt soát mã độc lập trước PR nêu năm điểm mức vừa, đều đã sửa và có bài kiểm: chữ đứng trên màu trang mặc
  định của trình duyệt ở giao diện tối bị đo thành 1:1; ngắt dòng sau gạch dài bị tính là bẻ giữa từ; chữ rút gọn
  có chủ ý bị tính là bị cắt; lượt chạy bị từ chối vẫn để lại tệp trong `--out`; một ảnh hỏng làm dừng cả lượt.
- Mười dòng giới hạn mới, chín dòng thuộc vùng `review`. Đáng kể nhất: nền của chữ được đọc từ các phần tử bao quanh
  nó, nên chữ đặt đè lên phần tử khác bằng vị trí bị đo sai nền, và chữ trên ảnh hay nền chuyển màu không được đo mà
  chỉ được nêu là «cần mắt người»; chỉ đo trạng thái nghỉ (không đo rê chuột, tiêu điểm, chữ gợi ý, giá trị trong
  ô nhập); việc «người dùng tới được giao diện tối hay không» đọc từ mã nguồn bằng một mẫu chữ; lệnh mới chạy trên
  một ứng dụng dựng tạm và ứng dụng mẫu của kho này, chưa trên repo sản phẩm thật nào.
- Vẻ ngoài của biên bản không có bài kiểm. Chủ repo chưa xem mẫu nào (`review-record-look-unseen-by-the-owner`).
- Lát 2 nối tiếp trên cùng dữ liệu: `findings[]` đã mang `rests_on` thuộc bốn loại đề bài nêu (lát này mới dùng hai:
  một dòng sổ, hoặc không dựa vào gì); hợp đồng phát hiện cho mắt soát bên ngoài, ba nhóm của phần gặt, cờ
  `--queue` và bản quyết định cắm phích chưa có gì được dựng.
