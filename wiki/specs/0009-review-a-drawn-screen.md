---
type: spec
title: Lệnh review — soát một màn đã dựng bằng hình, mắt soát là một phích cắm
status: approved
tier: 1
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0031-adapters-hold-library-names.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0069-the-capability-table-and-its-checks.md
  - wiki/decisions/0070-the-rules-page-opens-with-what-the-owner-fixed.md
sources:
  - docs/plan/plan.json
  - docs/trials/results.tsv
  - docs/trials/kit-on-this-repository.md
  - design/escapes.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/plugs/design-critique.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - "skill design-critique và accessibility-review của gói design bản 1.2.0, đọc một bản chép trên máy ngày 2026-11-20, chỉ đọc, chưa chạy"
  - "chủ repo, 2026-11-20: «Có, viết đề bài», đáp câu «Viết đề bài cho mục 5.2 (lệnh review) để anh duyệt?»"
  - "chủ repo, 2026-11-20: «Duyệt cả năm», đáp câu «Duyệt đề bài 0009 theo cả năm khuyến nghị?»"
---

# 0009 Lệnh review — soát một màn đã dựng bằng hình, mắt soát là một phích cắm

Máy viết ngày 2026-11-20 theo lời chủ repo («Có, viết đề bài»). Chủ repo duyệt đề bài và đáp cả năm câu hỏi theo khuyến
nghị cùng ngày («Duyệt cả năm»). Đây là đề bài cho mục 5.2 của kế hoạch. Đề bài 0004 đã tả lệnh `review`; đề bài 0008
chốt nó là ổ cắm đầu tiên có phích ngoài. Trang này nối hai điều ấy thành tiêu chí dựng được.

## Intent

Cổng xanh chưa có nghĩa là màn ổn. `review` cho ổ cắm «soát thiết kế» một con mắt: nó chụp màn đã dựng, đo thứ máy
đo được trên hình, đưa hình cho một mắt soát, rồi nối mỗi phát hiện với thứ chủ repo đã quyết.

### Vì sao cần

- Năm lượt thử dựng màn theo đề chuẩn (lần 7 đến 11) đều có cổng xanh; ba lượt trong đó vẫn có lỗi lọt
  (`docs/trials/results.tsv`).
- Sổ lỗi lọt có 25 dòng (`design/escapes.md`). Một dòng tiêu biểu: ở bề rộng 320, tên ứng dụng và ba liên kết điều
  hướng bẻ đôi giữa chữ, mà mọi lệnh kiểm đều cho qua vì không có cuộn ngang.
- Lượt dọn việc tồn ngày 2026-11-20 đo được mô tả của toast lỗi ở giao diện tối chỉ đạt 1,7:1. Cổng chỉ đo giao diện
  sáng.
- Bảng năng lực ghi ổ cắm này có phích mặc định là cổng, và cổng không nhìn hình: dòng giới hạn
  `capability-design-review-sees-no-picture`.

### Bốn phần, ai làm phần nào

| Phần | Làm gì                                                                                      | Ai làm                             |
| ---- | ------------------------------------------------------------------------------------------- | ---------------------------------- |
| Chụp | Vẽ màn ở mỗi bề rộng đã khai, sáng và tối, ở từng trạng thái nếu được yêu cầu               | Design Assembly, không gọi mô hình |
| Đo   | Đo trên màn đã vẽ những điều máy đo được mà cổng chưa đo                                    | Design Assembly, không gọi mô hình |
| Nhìn | Xem hình và nêu điều một con mắt thấy                                                       | Phích cắm: một skill soát          |
| Gặt  | Nối mỗi phát hiện với một dòng sổ, một dòng luật hay một nguyên tắc; không nối được thì hỏi | Design Assembly, không gọi mô hình |

Phần «chụp» và «đo» là phích mặc định của ổ cắm: chúng chạy được khi không cài thêm gì, đúng luật thứ hai của đề bài 0008. Phần «nhìn» là phích ngoài. Phần «gặt» là của ổ cắm, nên luôn thuộc Design Assembly.

### Mắt soát bên ngoài, sau khi đọc

- `design-critique` (gói `design` bản 1.2.0) nhận một ảnh chụp, một đường dẫn Figma hoặc một lời tả. Nó soát theo
  năm mặt (ấn tượng đầu, dễ dùng, thứ bậc nhìn, nhất quán, khả năng truy cập) và trả một bản văn xuôi có ba mức nặng.
- Nó không biết luật của repo: không phát hiện nào trỏ tới một dòng sổ hay một nguyên tắc. Nó không có dạng máy đọc
  được, và không có gì giữ lời nó nói.
- Vậy nó đạt phần «nhìn» và không đạt phần «gặt». Đó đúng là chỗ chia của đề bài 0008: cắm con mắt, tự viết phần nối.
- `accessibility-review` cùng gói soát theo WCAG 2.1 mức AA. Nó thuộc ổ cắm «báo cáo khả năng truy cập», không thuộc
  ổ cắm này, và đề bài này không cắm nó.
- Các skill ấy mới được đọc, chưa chạy. Bản đọc là một bản chép trên máy, có thể cũ hơn bản đang cài.

### Hai mặt bàn giao

- **Mặt người (xem được, quyết được):** một biên bản theo khung sáu phần (quyết định 0046). Ảnh màn có chú thích đánh
  số; mỗi số là một phát hiện, xếp theo mức nặng, kèm điều nó dựa vào và cách sửa. Với mỗi phát hiện chưa có luật nào
  giữ, biên bản đặt đúng một câu cho chủ repo: thành luật, hay để đó.
- **Mặt máy (đã định, không phải đoán):** `findings[]` trong `--json`, mỗi phát hiện có số, ảnh, vị trí, mức, và
  `rests_on` thuộc một trong bốn loại: một dòng sổ, một dòng của trang luật, một nguyên tắc chủ repo đã chốt, hoặc
  «không dựa vào gì». Mã thoát theo hợp đồng chung: 0 khi sạch, 1 khi có phát hiện, 2 khi repo không có nền dựng
  plugin vẽ được.

### Điều `review` không làm

- Không kết luận một tính năng đạt hay không: đó là việc của kit nghiệm thu, vốn gọi `review` như một dụng cụ đo
  (đề bài 0004, câu hỏi về ranh giới).
- Không biến phát hiện thành luật. Chỉ chủ repo làm việc ấy, qua hàng chờ.
- Không sửa màn.
- Không soát bản vẽ Figma hay một lời tả: chỉ soát màn đang chạy của repo.

## Acceptance criteria

Mỗi dòng chứng bằng một lệnh.

1. **Chụp.** `review` với mã một màn trong sổ màn ghi vào `--out` một ảnh cho mỗi bề rộng đã khai, sáng và tối; thêm
   `--states` thì có ảnh cho từng trạng thái của màn. Repo không đổi: băm của cây trước và sau bằng nhau.
2. **Gói soát.** Lệnh ghi một gói cho mắt soát: danh sách ảnh, các dòng luật áp vào màn, nguyên tắc và hướng đi chủ
   repo đã chốt, các dòng sổ của màn. Chạy hai lần trên cùng repo cho cùng gói; phần hình không tính.
3. **Đo.** Phích mặc định đo hai điều trên màn đã vẽ, ở mọi bề rộng và cả hai giao diện: tương phản của chữ với nền
   nó đứng trên, và chữ bị bẻ giữa từ hoặc bị cắt. Một repo thử có màn cố ý phạm ba chỗ cho đúng ba phát hiện; gỡ một
   chỗ thì còn hai.
4. **Hợp đồng phát hiện.** Một tệp phát hiện bị từ chối khi một phát hiện thiếu số ảnh, thiếu mức, hoặc thiếu
   `rests_on`; lời từ chối nêu phát hiện nào và thiếu gì.
5. **Gặt.** Với mỗi phát hiện, lệnh nói nó thuộc nhóm nào trong ba nhóm, và có bài kiểm cho từng nhóm:
   - dựa vào một dòng sổ có phép kiểm: phép kiểm đã để lọt; lệnh in dòng cần thêm vào sổ lỗi lọt;
   - dựa vào một dòng luật không có phép kiểm, hoặc một nguyên tắc: lệnh in câu hỏi cho hàng chờ;
   - không dựa vào gì: vào mục «cần mắt người», không thành câu hỏi nào cho tới khi có người nhận nó.
6. **Số khớp.** Số chú thích trên ảnh bằng số phát hiện trong biên bản (đề bài 0004, tiêu chí 16).
7. **Không có mắt vẫn chạy.** Khi phiên không có skill soát nào, lệnh vẫn chụp, đo và ra biên bản; mục «không thấy
   gì» nói rõ chưa con mắt nào xem hình.
8. **Lõi sạch.** Tên skill soát chỉ nằm trong thư mục phích cắm; phép kiểm của mục 5.0 vẫn xanh. Skill `review` của
   plugin gọi mắt soát qua tên đọc từ bảng ổ cắm, không viết tên ấy trong lời của nó.
9. **Bảng năng lực.** Ổ cắm «soát thiết kế» có phích mặc định mới là lệnh `review`; dòng giới hạn
   `capability-design-review-sees-no-picture` được đóng, hoặc thu hẹp thành đúng điều còn hở.
10. **Bản quyết định cắm phích.** Mắt soát bên ngoài được cắm kèm một bản quyết định có số đo theo bốn thước của đề
    bài 0008 (giữ được, số chỗ đoán, chạy được ở đâu, giá), lấy từ một lượt thử trên bản sao bỏ đi.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Hợp đồng sổ không thêm sổ nào: `review` không ghi sổ.
Hàng chờ không thêm loại mục: câu hỏi của một phát hiện dùng loại `decision:<mã dòng sổ>` đã có, hoặc không gắn mục
nào. Bảng năng lực đổi ở một ổ cắm (tiêu chí 9).

## Plan

Hai PR, mỗi PR chạy được riêng.

1. **Lát 1, phích mặc định.** Chụp, gói soát, hai phép đo, biên bản, bảng năng lực. Xong lát này thì `review` đã dùng
   được khi không cài thêm gì. Tiêu chí 1, 2, 3, 6, 7, 9.
2. **Lát 2, mắt soát và phần gặt.** Hợp đồng phát hiện, ba nhóm của phần gặt, skill `review` gọi mắt soát, và bản
   quyết định cắm phích sau một lượt thử. Tiêu chí 4, 5, 8, 10.

Phần chụp dùng lại cách vẽ đã có của cuốn sổ bàn giao và của bảng mẫu (`scripts/book.mjs`, `scripts/specimen.mjs`),
qua bộ chuyển trình duyệt; không thêm thư viện nào.

## Test plan

- Mỗi tiêu chí có bài kiểm trên một repo bỏ đi dựng trong thư mục tạm, như các lệnh đang có.
- Bài kiểm «cây không đổi» cho `review`, như các lệnh chỉ đọc đang có.
- Hai phép đo có bài thử hai chiều: thấy khi có chỗ phạm, không thấy khi gỡ.
- Phần gặt thử bằng tệp phát hiện viết tay, không cần mắt soát nào: bài kiểm vì vậy tất định.
- Mắt soát bên ngoài đo một lần trên bản sao bỏ đi: màn của đề chuẩn có cài sẵn các chỗ phạm; đếm chỗ nó thấy, chỗ nó
  bỏ sót và chỗ nó nêu mà không phải lỗi. Lượt thử tốn token, nên hỏi chủ repo trước khi chạy.
- Vẻ ngoài của biên bản không có bài kiểm: chủ repo xem mẫu một lần trước khi mẫu được coi là xong.

## Autonomy tier

Máy dựng sau khi chủ repo duyệt đề bài và đáp các câu hỏi; mỗi lát một PR, gộp là lời của chủ repo. Cắm một phích
ngoài, đổi phích mặc định của ổ cắm, và chạy lượt thử tốn token: luôn là lời chủ repo. Không sửa Delivery Loop, Repo
Standards hay repo kiểm chứng. Không gửi hình của repo ra dịch vụ ngoài nào: mắt soát chạy trong phiên của người dùng.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả năm theo khuyến nghị ngày 2026-11-20 («Duyệt cả năm»).

1. **Cắm mắt soát nào trước?** Khuyến nghị: `design-critique`. Bảng năng lực đã khai nó cho ổ cắm này, và nó nhận
   ảnh chụp. `accessibility-review` thuộc ổ cắm khác và soát theo WCAG 2.1, trong khi lệnh dẫn dắt của plugin nêu
   WCAG 2.2. Đã nhận: cắm `design-critique` trước.
2. **`review` có ghi câu hỏi vào hàng chờ không?** Đề bài 0004 nói `review` không ghi vào repo; đề bài 0008 nói phát
   hiện không nối được thì vào hàng chờ. Khuyến nghị: mặc định chỉ đọc và in sẵn lệnh hỏi cho từng phát hiện; thêm cờ
   `--queue` thì nó ghi câu hỏi, mỗi câu một tệp mới như `decide --ask` vẫn làm. Cách này giữ `review` trong nhóm lệnh
   chỉ đọc. Đã nhận: mặc định chỉ đọc, `--queue` mới ghi.
3. **Phích mặc định đo hai điều ở tiêu chí 3, hay chỉ chụp?** Khuyến nghị: đo hai điều ấy. Cả hai đến từ lỗi đã lọt
   thật, và cả hai đo được không cần mô hình. Chỉ chụp thì ổ cắm vẫn phải nhờ một skill ngoài mới thấy được gì. Đã nhận: đo hai điều ấy.
4. **Giao diện tối của một ứng dụng chưa có công tắc tối thì soát thế nào?** Khuyến nghị: vẫn vẽ và đo cả hai giao
   diện, như đề bài 0004 đòi; phát hiện ở giao diện người dùng chưa tới được thì ghi mức thấp và nói rõ lý do. Đã nhận: vẽ và đo cả hai giao diện, ghi mức thấp.
5. **Mục này có chạy qua bộ kit Delivery Loop như mục 5.0 không?** Khuyến nghị: không. Đo ở mục 5.0, tính tới lượt
   chấm 3: sáu lượt người, ba lượt chấm đỏ không vì sản phẩm, khoảng 2,2 triệu token cho tác tử con
   (`docs/trials/kit-on-this-repository.md`). Lối của repo đã đủ cho mục này: đề bài được duyệt, bài kiểm viết trước,
   `make check`, một lượt soát mã độc lập, rồi PR. Nên thử lại kit khi các va chạm còn mở trong sổ va chạm được gỡ. Đã nhận: không chạy qua kit ở mục này.
