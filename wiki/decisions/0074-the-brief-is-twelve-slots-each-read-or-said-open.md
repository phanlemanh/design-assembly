---
type: decision
title: "Phiếu brief là mười hai ô, mỗi ô đọc được thì kèm nguồn, không đọc được thì nói thẳng là còn mở"
links:
  - wiki/specs/0010-the-screen-brief.md
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0070-the-rules-page-opens-with-what-the-owner-fixed.md
  - wiki/decisions/0071-the-review-command-draws-and-measures-before-any-eye.md
  - wiki/decisions/0072-an-eye-is-a-plug-the-harvest-belongs-to-the-socket.md
sources:
  - plugins/design-assembly/scripts/brief.mjs
  - plugins/design-assembly/scripts/brief-slots.mjs
  - plugins/design-assembly/scripts/brief-readers.mjs
  - plugins/design-assembly/scripts/brief-sheet.mjs
  - plugins/design-assembly/scripts/review-pack.mjs
  - plugins/design-assembly/references/brief-slots.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-brief.mjs
  - plugins/design-assembly/tests/helpers/brief-repo.mjs
  - plugins/design-assembly/tests/helpers/fixed-day.mjs
  - "chủ repo, 2026-11-21: «Duyệt cả năm», đáp câu «Duyệt đề bài 0010 theo cả năm khuyến nghị?»"
---

# 0074 Phiếu brief là mười hai ô, mỗi ô đọc được thì kèm nguồn, không đọc được thì nói thẳng là còn mở

## Status

Accepted, 2026-11-21. Lát 1 của mục 5.1, đề bài 0010: tiêu chí 1, 2, 3, 6, 7, 8 và 11. Lát 2 (tiêu chí 4, 5, 9, 10)
chưa dựng. Plugin lên 0.23.0.

## Context

Đề bài 0010 đã chốt hình dạng: một phiếu cho một màn của sổ màn, mười hai ô theo danh mục đóng, mỗi ô ở một trong ba
trạng thái. Lát này dựng phần đọc: phiếu nói được gì từ điều repo **đã** định, và nói thẳng chỗ nào repo chưa nói.
Phần hỏi (lời gọi `decide --ask`, `--queue`, ô «đang hỏi», ô «đã định bằng lời đáp») là lát 2.

Trước lát này, điều một màn cần nằm ở bảy nơi và tác tử tự ghép. Lệnh `review` (quyết định 0071, 0072) đã có một bộ
đọc cho một màn: dòng sổ màn, các dòng trang luật áp vào màn, nguyên tắc và hướng đi chủ repo đã chốt.

## Decision

1. **Danh mục là dữ liệu, bộ đọc là mã, và một phép kiểm giữ hai thứ khớp nhau.** Mười hai ô nằm ở
   `references/brief-slots.json`: số, mã, tên, câu hỏi ô ấy trả lời, và `reads` (đọc từ đâu) hoặc `unheld` (chưa sổ nào
   giữ, kèm lý do; `when` là `always`, hay `planned` cho ô chỉ có nguồn khi màn đã dựng). Mỗi ô có nguồn có đúng một
   bộ đọc trong `scripts/brief-readers.mjs`. `catalogueProblems` đỏ khi: một ô không bộ đọc nào đọc mà cũng không được
   khai là chưa sổ nào giữ; một ô khai chưa sổ nào giữ mà vẫn có bộ đọc; một bộ đọc không có ô; số của ô lệch chỗ.
2. **Một ô là «đã định» khi bộ đọc không còn lý do nào để mở, và «còn mở» khi còn.** Bộ đọc trả `answer` (mỗi dòng
   một câu kèm nguồn) và `why` (mỗi lý do ô còn mở). Ô còn mở vẫn giữ phần đọc được: màn có `family` mà chưa có trang
   kiểu màn thì ô 1 mở và vẫn nói tên kiểu. Lát này không ô nào ở trạng thái «đang hỏi» và ô mở không in lời gọi nào.
3. **Nguồn của mỗi câu là tệp cùng dòng sổ, khoá hay số dòng.** Dòng sổ màn: tệp chứa dòng (tệp riêng của màn khi sổ
   chia mỗi màn một tệp), mã màn, khoá. Trang kiểu màn: tệp, khoá ở phần đầu trang và số dòng của khoá. Dòng luật: tệp
   và số dòng, kèm mục. Mô hình nghiệp vụ: `ontology/actions.yaml` hay tệp thực thể, và tên thao tác hay tên trường.
4. **Mười một bộ đọc, đọc ở đâu:**
   - Ô 1 kiểu màn và màn mẫu: `family` của dòng; trang kiểu màn có `nhom` trùng; tệp màn mẫu trang nêu, và tệp ấy phải
     có thật.
   - Ô 2 màn cho thấy gì: `shows`; trường của từng thực thể và `display` của trường.
   - Ô 3 thao tác và vai: `entry`, `actions`; vai giữ từng thao tác, qua `modelOf` của sàn (cùng mã với phép kiểm
     `screen-actions`).
   - Ô 4 trạng thái: `states`; bảng `design/states.json`; danh sách màn của ứng dụng nêu những trạng thái nào. Mở khi
     dòng thiếu một trạng thái bảng bắt buộc.
   - Ô 5 linh kiện: sổ linh kiện; khuôn, khe bắt buộc và thứ cấm ngoài khuôn của trang kiểu màn. Repo để sổ linh kiện
     ngoài git thì đọc từ mã nguồn bằng chính hàm lệnh `make design-components` dùng, không ghi gì, và nguồn nói rõ thế.
   - Ô 6 chữ: các dòng tầng `content` của sổ quyết định, và khoá tiêu đề của màn.
   - Ô 7 luật: các dòng trang luật áp vào màn, của `factsOf`.
   - Ô 8 nguyên tắc và hướng đi: của `factsOf`. Mở khi chủ repo chưa chốt nguyên tắc nào, hoặc chưa chọn hướng đi.
   - Ô 9 bề rộng và lệnh kiểm: bề rộng đã khai; các phép kiểm mà dòng sổ quyết định trỏ tới, gom theo phép kiểm.
   - Ô 10 đổi mô hình nghiệp vụ, tính ra: thao tác và thực thể dòng nêu mà mô hình chưa có, nêu tên từng cái.
   - Ô 11 chỗ trong điều hướng: vị trí của màn trong danh sách màn của ứng dụng, với màn đã dựng.
5. **Một thứ thiếu chỉ mở một ô, và điều dòng sổ không nói thì không bao giờ được đọc thành «không cần gì».** Thực
   thể hay thao tác mô hình chưa có được nhắc ở ô 2 và ô 3 nhưng chỉ ô 10 mở vì nó; chưa có trang kiểu màn thì ô 1 mở,
   còn ô 5 chỉ nói khuôn chưa biết. Dòng «chờ» ấy mang `waits_on` (số của ô nó chờ) để máy đọc không lầm là đã có câu
   trả lời. Lát 2 hỏi mỗi ô mở một câu; mở hai ô vì một thứ thiếu thì thành hai câu cho một điều. Ngược lại, dòng sổ
   thiếu hẳn `shows`, `entry` hay `actions`, hoặc viết chúng không phải dạng danh sách, thì ô 2, ô 3 mở và ô 10 cũng
   mở: không tính được màn cần gì ở mô hình. Mô hình trao một thao tác cho vai mà `roles.yaml` không kê thì ô 3 mở và
   nêu tên vai, không in «không vai nào giữ».
6. **Một bộ đọc với `review`.** `screenOf` và `factsOf` của gói soát nhận thêm `{ unbuilt }` để đọc cả màn `planned`;
   `review` gọi như cũ và vẫn từ chối màn chưa dựng. Khoá `rules`, `principles`, `unfixed_principles`, `direction` của
   `--json` là đúng dữ kiện gói soát mang. Bài kiểm so hai đầu ra, một lần bằng `packOf`, một lần bằng tệp gói mà một
   lượt `review` thật ghi ra.
7. **`--json`.** Các khoá đề bài 0004 nêu (`screen`, `kind`, `reference`, `components[]`, `states[]`, `rules[]`,
   `actions[]`, `checks[]`), thêm `slots[]` (mười hai ô: số, mã, tên, câu hỏi, trạng thái, `answer`, `why`) và `open[]`.
   Khoá `asked[]` của đề bài 0010 để lại cho lát 2, cùng trạng thái «đang hỏi».
8. **Mã thoát.** 0 khi không ô nào chưa định; 1 khi còn ô mở; 2 khi gọi sai, màn không có trong sổ (lời từ chối kê các
   màn sổ có), màn mang trạng thái khác `built` và `planned`, không có sổ màn, hay repo không đọc được. Tệp hỏng bị từ
   chối bằng tên tệp, không bằng lỗi của mã.
9. **Phiếu theo khung sáu phần.** Phần quyết định kê từng ô mở, mỗi ô một câu; phần phát hiện có mỗi ô mở một mục và
   bảng mười hai ô với nguồn từng câu; phần «không thấy gì» kê các giới hạn đang mở của vùng `brief` và của mọi tài
   liệu. Không khuyến nghị nào: phiếu mang điều đã quyết, không đề xuất điều gì của riêng nó.
10. **Không đồng hồ.** Không tệp nào của lệnh đọc ngày giờ. Bài kiểm chạy lệnh thật dưới hai ngày khác nhau bằng một
    mô-đun nạp trước thay đồng hồ của tiến trình, và trước đó chứng đồng hồ giả có đổi thật.

## Consequences

- Hai mươi bài kiểm trong `tests/test-brief.mjs`, trên một kho dựng tạm chỉ gồm tệp (không dựng, không trình duyệt):
  mỗi ô có nguồn được thử cả ba cách: có nguồn thì «đã định», bỏ nguồn thì «còn mở» kèm lý do, sửa một dòng nguồn thì
  câu trả lời của ô đổi theo. Một bài nối bảng thử ấy với danh mục, nên thêm một ô có nguồn mà quên thử thì đỏ. Bài
  của tiêu chí 3 kiểm rằng dòng sổ, khoá và số dòng mà nguồn nêu có thật trong tệp nó nêu.
- **Mã thoát 0 chưa repo nào tới được qua dòng lệnh ở lát này.** Ô 12 chưa sổ nào giữ nên luôn mở, và lát này chưa có
  lời đáp của chủ repo để đóng nó. Bài kiểm của mã 0 chạy chính các bộ đọc trong một tiến trình riêng trên mười một ô
  có sổ giữ: cả mười một đã định trên màn đã dựng của kho dựng tạm, và tiến trình kết thúc bằng 0. Lát 2 mới có đường
  tới mã 0 trên repo thật.
- Trên màn `reference` của ứng dụng mẫu hôm nay: mười ô đã định, hai ô mở. Ô 12 mở vì chưa sổ nào giữ. Ô 8 mở vì bản
  thiết kế của ứng dụng mẫu chưa có nguyên tắc nào chủ repo chốt và chưa có hướng đi: đó là điều thật của repo này,
  không phải lỗi của lệnh.
- Chín dòng giới hạn mới ở vùng `brief`, đứng đầu là: ô mở chưa được hỏi (lát 2), hai ô chưa sổ nào giữ, «đã định»
  nghĩa là repo có nói chứ không phải nói đủ hay nói đúng, bộ đọc đọc ở chỗ sàn của plugin đặt nguồn, và chưa tác tử
  độc lập nào dựng màn từ phiếu (mục 5.4).
- Dòng `capability-screen-brief-has-no-plug` còn mở: bảng năng lực, trang luật trỏ tới phiếu và trang skill là lát 2.
  Lệnh chạy được bằng `node plugins/design-assembly/scripts/brief.mjs <mã màn>`; chưa có lệnh gạch chéo cho nó.
- Một lượt soát mã độc lập trước PR, không có điểm chặn, nêu hai điểm nặng và bảy điểm vừa; mỗi điểm sửa đều có bài
  kiểm thấy đỏ trước:
  - Nặng: ô 3 in «không vai nào giữ» khi mô hình có trao thao tác cho một vai mà `roles.yaml` không kê; ô 10 «đã định»
    khi dòng sổ không nói gì (cả khi `shows` viết thành một chữ thay vì danh sách). Cả hai nay mở kèm lý do.
  - Vừa, đã sửa: số dòng của danh sách màn lệch khi tệp có chú thích; nguồn của nguyên tắc nêu mã có tiền tố mà bản
    thiết kế không viết; câu về trạng thái nói quá điều danh sách màn nói; màn mang trạng thái lạ vẫn có phiếu; sổ
    linh kiện hỏng bị báo bằng lỗi của mã; ô 5 im lặng về khuôn khi chưa có trang kiểu màn; tệp màn mẫu nằm ngoài repo
    vẫn được nhận. Thêm: tên mà mọi đối tượng đều có (`constructor`) không còn bị coi là một thực thể.
  - Vừa, giữ có chủ ý: ô 2 và ô 3 vẫn tính là «đã định» khi một dòng của chúng chờ ô 10 (điểm 5 ở trên). Lượt soát
    cho rằng con số «đã định» vì thế nói quá; dòng chờ nay mang `waits_on` và dòng giới hạn
    `brief-settled-means-said-not-right` nói rõ điều này. Chủ repo có thể đảo lựa chọn này khi duyệt lát 2.
  - Bài kiểm yếu, đã sửa: mã thoát 0 trước chỉ thử một hàm trên dữ liệu sửa tay; tiêu chí 3 trước chỉ kiểm tệp có tồn
    tại; bài hai ngày nay chạy trên kho có một commit, nên ngày trên bìa cũng được thử.
  - Chưa làm: gom các hàm đọc tệp trùng với `review-pack.mjs` về một chỗ.
