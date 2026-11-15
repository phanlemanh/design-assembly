---
type: decision
title: "Lệnh `decide`: câu chờ đọc từ dòng sổ và từ một hàng chờ giữ dạng dữ liệu"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md
  - wiki/decisions/0040-the-plan-of-record-and-how-it-is-kept.md
  - wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md
  - wiki/decisions/0010-only-a-row-is-an-answer.md
sources:
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/skills/decide/SKILL.md
  - plugins/design-assembly/tests/test-decide.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - design/waiting-list.json
  - docs/review-queue.md
  - docs/plan/plan.json
  - "chủ repo, 2026-11-15: «Duyệt đề bài»"
---

# 0043 Lệnh `decide`: câu chờ đọc từ dòng sổ và từ một hàng chờ giữ dạng dữ liệu

## Status

Máy chọn trong lúc dựng mục 0.7 của kế hoạch, ngày 2026-11-15; chờ chủ repo bác. Phần đề bài 0004 đã
chốt về `decide` (đầu vào, đầu ra, mã thoát) thì đã được duyệt. Mười một điều ở mục Decision là điều
đề bài không nói tới, hoặc nói khác; hai điều đầu lệch có chủ ý với chữ của đề bài và nêu rõ ở đó.

## Context

Đề bài 0004 chốt lệnh `decide`: gom mọi câu đang chờ chủ repo thành một tờ, mỗi câu một khuyến nghị
và căn cứ, trả lời một lần; chỉ ghi sau khi người trả lời, kèm tên người và ngày. Kế hoạch ghi lệnh
này «dùng ngay cho các dòng đang chờ», và giai đoạn 0 chỉ đóng khi «hàng chờ duyệt không còn dòng
chưa có lời đáp».

Dựng theo đúng chữ của đề bài thì gặp ba chỗ vướng:

- **Hàng chờ của chính kho này không phải dòng sổ.** `docs/review-queue.md` là 27 dòng văn xuôi
  trong bảng markdown: 13 điều máy đã chọn và đã dựng, 5 điều chưa bao giờ được duyệt, 7 câu còn mở,
  và 2 việc chỉ chủ repo cho phép được. Phần lớn không phải quyết định thiết kế (kiến trúc lớp meta,
  bộ chỉ số, chữ của một đề bài). `decide` đọc sổ quyết định thì không thấy dòng nào, đúng như
  `status` đang không thấy (0041).
- **Sổ quyết định không có khoá «ai xác nhận, ngày nào».** Mục Domain impact của 0004 định thêm
  khoá ấy. Nhưng sổ quyết định có một hình dạng đóng: công cụ ở repo đã nhận báo «unknown key» với
  khoá lạ và cổng của repo ấy đỏ. Lệnh đưa công cụ mới vào repo (`upgrade`) thuộc giai đoạn 1, chưa
  có.
- **Cuộc dẫn dắt viết lại dòng của nó.** Mỗi lần chạy, `new` sinh lại các dòng lấy từ
  `design/blueprint.json` (loại sản phẩm, mức truy cập, màu gốc, cách mở hồ sơ). Điều gì chỉ ghi ở
  dòng sổ thì mất ở lần chạy kế.

Các nguồn khác mà đề bài kê cho `decide` (ứng viên `intake`, đề xuất của `change` và `upgrade`, chỗ
lệch xin làm ngoại lệ) thuộc về lệnh chưa dựng.

## Decision

1. **Hai nguồn, và không đổi hình dạng của mười một sổ.** Nguồn thứ nhất là dòng sổ quyết định mà
   ghi chú nói chưa ai xác nhận: cùng một luật với `status`, và `decide` gọi chính `status` để lấy
   câu hỏi, khuyến nghị và căn cứ, nên luật viết một chỗ. Nguồn thứ hai là **hàng chờ dạng dữ
   liệu**, `design/waiting-list.json`, repo có hay không tuỳ ý: mỗi dòng có mã và câu hỏi, và có thể
   có nhóm, khuyến nghị, căn cứ, khó đảo hay không, ghi ở đâu, bác thì tốn gì. Nó không phải sổ của
   hợp đồng; cổng của repo không đọc nó. **Lệch với đề bài:** câu mở «câu đang chờ nằm ở đâu» của
   0004 khuyên «không mở sổ mới». Lý do lệch: đưa 25 câu của kho này vào sổ quyết định thì sổ thiết
   kế chứa điều không phải quyết định thiết kế, `audit` đếm chúng vào độ phủ, và repo nào muốn dùng
   cũng phải có sổ quyết định trước.
2. **Tên người và ngày ghi vào ghi chú của dòng sổ, không thêm khoá.** Mệnh đề «chưa ai xác nhận»
   được thay bằng `confirmed by TÊN on NGÀY`, `refused by TÊN on NGÀY: CÂU` hoặc
   `answered by TÊN on NGÀY: GIÁ TRỊ`, đặt cuối ghi chú; phần còn lại của ghi chú và mọi byte khác
   của sổ giữ nguyên. **Lệch với đề bài:** mục Domain impact của 0004 định thêm khoá riêng. Lý do
   lệch: thêm khoá hôm nay làm đỏ cổng của repo đã nhận cho tới khi có `upgrade`. Khoá riêng đi cùng
   `upgrade`, khi công cụ ở repo lên đời được.
3. **Lời «giữ» cho một dòng do cuộc dẫn dắt sinh ra cũng ghi vào blueprint.** Khoá của lựa chọn ấy
   vào danh sách `confirmed` của tầng trong `design/blueprint.json`, là chỗ cuộc dẫn dắt đã đọc để
   biết người xác nhận đề xuất nào. Nhờ đó lần chạy kế của `new` không biến lời đáp trở lại thành
   đề xuất.
4. **Bác và lời đáp khác đều là lời đáp; lệnh ghi lại và không đổi gì khác.** Dòng bị bác không bị
   xoá: dòng sổ giữ nguyên kèm câu chủ repo nói; dòng hàng chờ ở lại tệp kèm `answer`, `said`, `by`,
   `on`. Giá trị bị bác vẫn nằm trong repo cho tới khi có người đổi; mọi tờ trình về sau nêu tên
   các dòng ấy.
5. **Việc chỉ chủ repo cho phép thì liệt kê, không nhận lời đáp, không tính vào mã thoát.** Hai
   dòng mục D là phép cho từng bước, không bao giờ «xong» bằng một chữ giữ hay bác. Tính chúng vào
   mã thoát thì lệnh không bao giờ về 0, và điều kiện đóng giai đoạn 0 không chứng minh được bằng
   lệnh.
6. **Lời đáp chỉ người mới cho được mà sổ chưa có dòng thì liệt kê và tính là đang chờ,** kèm lệnh
   ghi được nó (`adopt` với cờ). `decide` không ghi dòng ấy: viết dòng đó là việc nhận, kéo theo dữ
   liệu lệnh kiểm.
7. **«Khó đảo» không do máy đoán.** Dòng sổ được đánh dấu khi nó thuộc tầng mà mọi tầng khác dựng
   lên trên (bối cảnh, nền). Dòng hàng chờ được đánh dấu khi chính dòng ấy nói vậy; dòng không nói
   thì kết quả là «không nói» (`null`), và tờ trình đếm số dòng không nói, để im lặng không bị đọc
   thành «dễ đảo».
8. **`docs/review-queue.md` thành trang trỏ; 27 dòng chép sang dữ liệu đúng nguyên văn từng ô.**
   Ô nào của trang cũ vào đúng một trường; bài kiểm so dữ liệu với trang cũ trong lịch sử git. Hai
   chỗ máy **thêm chữ**: mỗi dòng mục A có khuyến nghị «Giữ» và căn cứ «máy đã chọn và đã dựng điều
   này; ghi ở quyết định NNNN», suy từ tiêu đề mục và cột «ở đâu»; trang cũ không có cột khuyến nghị
   cho mục A. Dòng mục B và C giữ nguyên ô «máy khuyến nghị» và không có căn cứ riêng: tờ trình nói
   thẳng là hàng chờ không nêu căn cứ. Không dòng nào được đánh dấu khó đảo, vì trang cũ không nói.
9. **Tệp lời đáp: mỗi dòng một lời đáp, một dòng sai thì từ chối cả tệp.** Mã câu, rồi `giữ` (hay
   `giu`, `keep`), `bác` (hay `bac`, `refuse`) kèm một câu, hoặc một giá trị bằng chữ của người đáp.
   Mã lạ, mã của một việc xin phép, câu đã có lời đáp, dòng thiếu lời đáp: mã thoát 2 và không ghi
   gì. Lệnh không sửa một lời đáp đã ghi.
10. **Người đáp là ai:** `--by`, không có thì lấy tên git của repo, không có nữa thì từ chối. Ngày:
    `--on`, không có thì hôm nay. Tên và ngày không phải quyết định; lời đáp thì phải của người.
11. **`--dry-run` in đúng điều lần chạy thật in,** trừ hai dòng nói chưa ghi gì: tệp sẽ ghi, điều
    đổi trong từng tệp, tờ trình sau khi ghi, và cả mã thoát.

## Consequences

- **Ở kho này, tờ trình có 25 câu và 2 việc xin phép;** chưa câu nào có lời đáp, và máy không đáp
  câu nào. `make design-decide` in tờ trình; chủ repo đáp bằng một tệp lời đáp. Mục 0.7 của kế hoạch
  ở trạng thái «đang làm» cho tới khi chủ repo đáp.
- **`status` chưa đổi.** Nó vẫn báo «không gì chờ trong sổ» ở kho này, vì nó chưa đọc hàng chờ
  (giới hạn `status-reads-ledgers-only` còn mở), và vẫn trỏ `new` làm lệnh trả lời cho dòng chưa
  xác nhận. `status.mjs` đang thuộc mục 0.5 của kế hoạch nên không sửa ở đây. Việc nối tiếp: `status`
  đọc hàng chờ và trỏ sang `decide`.
- **Sổ giới hạn thêm khu `decide` và mười một dòng:** bốn nguồn chưa đọc
  (`decide-intake-candidates-not-read`, `decide-change-proposals-not-read`,
  `decide-upgrade-proposals-not-read`, `decide-exceptions-not-read`); tên và ngày nằm trong chữ của
  ghi chú (`decide-answer-kept-in-the-note`); cuộc dẫn dắt viết lại dòng đã có lời đáp, làm mất tên
  và ngày của lời «giữ» và làm lời bác quay lại thành câu hỏi
  (`decide-guide-rewrites-an-answered-row`); lời bác không đổi gì
  (`decide-records-a-refusal-and-changes-nothing`); lệnh không biết ai viết tệp lời đáp
  (`decide-cannot-tell-who-wrote-the-answers`, mức cao); lời đáp chưa có dòng thì không ghi được
  (`decide-does-not-record-a-call-without-a-row`); dấu khó đảo theo tầng hoặc theo lời của dòng
  (`decide-hard-to-undo-by-layer-or-by-word`); chưa có bảng mẫu cho câu thẩm mỹ và chưa có tài liệu
  bàn giao (`decide-no-specimen-and-no-document`).
- **Bảng từ vựng thêm hai từ đặt trong dự án:** `decision sheet` và `waiting list`.
- **Điều chỉ luật trong skill giữ:** lệnh ghi theo tệp lời đáp và không biết ai viết tệp. Skill cấm
  tác tử tự điền lời đáp; không phép kiểm nào giữ điều đó.
- **Việc nối tiếp cho lệnh khác:** `new` cần giữ ghi chú mà `decide` đã viết khi sinh lại dòng;
  khoá «ai xác nhận, ngày nào» đi cùng `upgrade`; ngoại lệ vào sổ ghi chỗ lệch có chủ ý đi cùng
  `change`.
- Chưa có lượt thử độc lập nào cho lệnh này, và chưa chạy lệnh trên repo nào ngoài kho này và các
  repo bỏ đi của bài kiểm.
