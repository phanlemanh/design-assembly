---
type: decision
title: "Chọn trước, tạo sau ở ổ linh kiện: phích ngoài là một bậc của thang, không là đối thủ"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/specs/0006-the-reusable-store.md
  - wiki/decisions/0096-reui-measured-at-the-components-socket.md
  - wiki/decisions/0089-plugs-command-asks-where-a-measured-plug-is-here.md
sources:
  - plugins/design-assembly/scripts/plugs.mjs
  - plugins/design-assembly/scripts/plugs-page.mjs
  - plugins/design-assembly/scripts/capabilities.mjs
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/plugs/reui.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/plugs/SKILL.md
  - plugins/design-assembly/tests/test-plugs.mjs
  - plugins/design-assembly/tests/test-capabilities.mjs
  - "plugs.mjs --dry-run --short của nhánh này chạy lên repo kiểm chứng tại 1ad8469f ngày 2026-11-24; kho ấy không đổi tệp nào"
  - "chủ repo, 2026-11-24: «Duyệt cả chín», đáp câu duyệt đề bài 0015 theo khuyến nghị của cả chín câu hỏi"
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Gửi, mở song song», cho giai đoạn 11 mở song song giai đoạn 10"
  - "chủ repo, 2026-11-24: «Dựng lát 1»"
---

# 0098 Chọn trước, tạo sau ở ổ linh kiện: phích ngoài là một bậc của thang, không là đối thủ

## Status

Accepted, 2026-11-24. Lát 1 của đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md), mục 11.1 của
kế hoạch, dựng theo lời chủ repo («Dựng lát 1»). Plugin 0.50.0.

## Context

Đề bài 0015 đặt luật dùng lại cho ổ linh kiện theo bốn vế chủ repo nêu, và chủ repo đã duyệt cả chín câu hỏi theo
khuyến nghị. Câu 1 cho lát này làm ngay; vì thế giai đoạn 11 mở song song giai đoạn 10.

Lời khuyên của `plugs` ở ổ linh kiện đi ngược luật ấy. Tiêu chí 5 của đề bài
[0014](../specs/0014-outside-plugs-set-up-in-one-sitting.md) chỉ cho một phích ngoài làm khuyến nghị khi số đo của nó
thắng phích của plugin. Trước lát này, `plugs` của plugin 0.49.0 chạy lên repo kiểm chứng hỏi «phích nào làm ổ linh
kiện» và khuyên `intake`, với lý do in ra là ReUI không thắng ở
[0096](0096-reui-measured-at-the-components-socket.md). Repo ấy theo luật «kho, rồi ReUI, rồi tạo tay»; một tác tử đọc
câu khuyên ấy hiểu là đừng chọn ReUI.

Ở ổ linh kiện, một nguồn ngoài không làm cùng một việc với `intake`. `intake` đi thang ba bậc: kho của repo, rồi bộ
khởi đầu của plugin và các nguồn ngoài repo đã ghim, rồi tạo tay. Một nguồn ngoài là một bậc trên thang ấy, nên so nó
với `intake` theo kiểu ai thắng là so sai hai thứ.

## Decision

1. **Luật chọn trước, tạo sau, cho ổ linh kiện**, theo bốn vế của đề bài 0015:
   - chọn trước, tạo sau: bên muốn tạo tay phải nêu lý do, bên muốn dùng lại thì không;
   - kho lớn dần: thứ dùng lần đầu thành của kho, lần sau cùng nhu cầu là bậc 1;
   - kho tốt dần: một nhu cầu, một lời giải; chưa đủ thì mở rộng chính nó;
   - nhất quán cả hệ: sàn, plugin và vòng giao việc hiểu cùng một luật.

   Thang chỉ xuống bậc khi bậc trên không đáp ứng. «Không đáp ứng» là một câu trỏ vào việc người dùng cần làm hay một
   luật của sản phẩm. «Tạo tay nhanh hơn», «gọn hơn» hay «trông chưa đẹp» không phải lý do. Thua ở bốn thước cũng không
   phải lý do giữ một nguồn ngoài khỏi thang.

2. **Bảng năng lực đánh dấu ổ linh kiện là ổ có thang** (khoá `ladder` của ổ). Ở ổ có thang, phích của plugin là bên
   làm, và phích ngoài là một bậc trên thang của nó, tới được khi repo ghim nó làm nguồn. Phép kiểm hình dạng đỏ khi
   `ladder` không là `true`, khi ổ đã đóng, hay khi ổ không có phích của plugin.
3. **`plugs` không hỏi gì ở ổ có thang.** Bảng toàn cảnh in thang của repo: kho của repo; bộ khởi đầu, rồi các nguồn
   đã ghim theo thứ tự tra; tạo tay. Với mỗi phích ngoài, nó in bậc phích ấy đứng. Phích được tính là đã ghim khi
   `design/sources/` có một nguồn cùng mã với nó; khi ấy nó đứng ở bậc 2. Một phích ngoài có trong repo hay trong
   phiên mà không là nguồn đã ghim thì được nêu tên, kèm dòng nói `find` và `intake` không tới được nó, và việc ghim
   hôm nay làm tay.
4. **Câu hỏi cũ về ổ linh kiện.** Một câu còn chờ trên hàng chờ, do bản trước hỏi, được lấy đi, và lượt chạy nói vậy.
   Một câu chủ repo đã đáp vẫn thành dòng của sổ quyết định: lời của chủ repo không bị bỏ.
5. **Các ổ khác giữ luật bốn thước** của đề bài 0014, theo câu hỏi 6 của đề bài 0015.
6. **Phạm vi của 0096.** Số đo của nó giữ nguyên. Kết luận «ReUI không thắng phích của plugin» nay chỉ là số đo một
   lần dùng đầu, trên một repo chưa có bước chuẩn hoá. Nó không còn quyết lời khuyên ở ổ linh kiện. Tệp phích của ReUI
   nói nó là một nguồn trên thang của `intake` khi repo ghim nó.

Trên repo kiểm chứng, sau lát này, `plugs --dry-run --short` không còn câu hỏi nào và in: «reui is in this repository
and is no pinned source, so find and intake do not reach it at the components socket: pin it by hand in design/sources/
to put it on rung 2 of intake.» Repo ấy giữ danh mục ReUI theo dạng riêng, ngoài `design/sources/`, nên câu ấy đúng với
hôm nay. Đọc được dạng ấy là lát 4.

## Consequences

- Lệnh `plugs` thêm khoá `ladder` cho mỗi ổ (null ở ổ không có thang), và khoá `rung` cho phích ngoài ở ổ có thang. Một
  câu bị lấy đi vì ổ có thang mang `ladder: true`. Trang toàn cảnh nói phích ngoài ở ổ ấy là một bậc, không là đối thủ.
- Phích `plugs` khai đọc sổ nguồn ngoài (`reads: ["sources"]`) và không ghi sổ ấy.
- Bảy dòng giới hạn mới ở `references/limits.json`. Sáu dòng là điều các lát sau dựng: thứ tự thang do plugin cố định
  và chỉ đọc nguồn ở một dạng (lát 4); không có bước chuẩn hoá trước khi nhập (lát 2); sửa mã ngoài không bằng bản vá
  ghi lại (lát 3); cổng không giữ việc chọn (lát 5); không mở rộng được một khối (lát 6); phép đo chỉ đếm lần dùng đầu
  (lát 6). Dòng thứ bảy là giới hạn của chính lát này: phích ngoài chỉ được nhận ra là nguồn khi hai bên cùng mã. Ba dòng
  có sẵn từ 0096 được nói rộng tới 0098: khối ngoài nhập vào khi còn đỏ, một dòng sổ cho nhiều tệp, và cổng không giữ
  ghim của thư viện.
- Plugin lên 0.50.0, vì script của nó đổi.
- Kế hoạch: mục 11.1 xong; giai đoạn 11 còn sáu lát chưa làm, mỗi lát một PR gộp theo lời chủ repo.
