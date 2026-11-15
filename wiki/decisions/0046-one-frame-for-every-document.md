---
type: decision
title: "Khung tài liệu chung: một mô-đun dựng sáu phần, bìa mang ngày của commit cuối, PDF in từ trang bằng trình duyệt của repo"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0020-handoff-book.md
  - wiki/decisions/0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md
  - wiki/decisions/0043-decide-reads-ledger-rows-and-a-waiting-list-kept-as-data.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0031-adapters-hold-library-names.md
sources:
  - plugins/design-assembly/scripts/document.mjs
  - plugins/design-assembly/scripts/family.mjs
  - plugins/design-assembly/scripts/stage.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/book.mjs
  - plugins/design-assembly/scripts/command.mjs
  - plugins/design-assembly/tests/test-document.mjs
  - plugins/design-assembly/tests/test-status.mjs
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/checks.md
  - docs/plan/plan.json
  - "chủ repo, 2026-11-15: «người dùng kỳ vọng như làm việc với một studio chuyên nghiệp nhưng với hoạt động của một engineer»"
---

# 0046 Khung tài liệu chung, áp cho `status` và `audit`

## Status

Accepted cho phần đề bài 0004 đã chốt: mục «Khung chung của mọi tài liệu» và dòng «Mỗi lệnh có một
sản phẩm bàn giao» của hợp đồng chung (mục 0.6 của kế hoạch). Mười lựa chọn ở mục Decision là máy
chọn trong lúc dựng, ở những chỗ đề bài để ngỏ; chờ chủ repo bác. Chủ repo chưa xem tài liệu nào:
theo đề bài, một mẫu tài liệu chỉ xong khi chủ repo đã xem nó một lần.

## Context

Đề bài 0004 đòi mỗi lệnh có một tài liệu bàn giao, và mọi tài liệu dùng một khung sáu phần. Trước
thay đổi này chỉ `handoff` cho ra một tài liệu; `status` và `audit` chỉ in chữ ra màn hình. Đề bài
để ngỏ những chỗ sau:

- Khung nằm ở đâu, và lệnh đưa gì cho nó.
- «Ngày» trên bìa là ngày nào, khi lệnh phải cho cùng một kết quả trên cùng một repo.
- PDF dựng bằng gì. Cuốn sổ đã có một đường in PDF, nằm lẫn trong mã của nó.
- Tài liệu trông thế nào để đứng cùng một họ với cuốn sổ.
- `status` phải đếm cả hàng chờ, mà luật «dòng nào đang chờ» nằm ở `decide`, và `decide` lại đang
  đọc `status`.

## Decision

1. **Khung viết một chỗ:** `plugins/design-assembly/scripts/document.mjs`. Lệnh đưa dữ kiện, khung
   dựng một trang HTML tự chứa. Sáu phần luôn có và luôn theo thứ tự của đề bài: bìa, một trang cho
   người quyết, phát hiện, khuyến nghị, việc kế, «tài liệu này không thấy gì». Phần không có gì để
   nói thì nói vậy bằng một dòng, không bị bỏ.
2. **Khung từ chối vẽ** khi một khuyến nghị không nêu nó dựa vào đâu (nguyên tắc chủ repo đã chốt,
   một chuẩn, hoặc một số đo trên repo), khi một phát hiện không có bằng chứng, hoặc khi trang cho
   người quyết kê quá ba điều. Tiêu chí 14 của đề bài vì thế được giữ ở chỗ dựng, không chỉ ở bài
   kiểm.
3. **Tài liệu dựng từ đúng dữ kiện của `--json`.** `status` và `audit` mỗi lệnh có một hàm chuyển
   kết quả của nó thành dữ kiện cho khung; không phép đo nào được thêm. Bốn mức nặng (cao, vừa,
   thấp, ghi nhận) do từng lệnh xếp: cao là thứ đang hỏng hôm nay, vừa là thứ chờ người hoặc giữ ít
   hơn nó nói, thấp là thứ đứng được trên nền yếu hơn.
4. **Ngày trên bìa là ngày của commit cuối,** không phải ngày dựng: lệnh không đọc đồng hồ. Cạnh
   ngày là mã commit, kèm một dấu khi repo còn thay đổi chưa commit. Thư mục `--out` nằm trong repo
   không tính là thay đổi của repo, nên dựng hai lần vẫn ra cùng một trang. Repo chưa có commit thì
   bìa nói không có ngày. Không thêm cờ để đưa ngày vào: một luật, không hai.
5. **PDF in từ chính trang HTML,** bằng trình duyệt trong gói của repo đích, qua bộ chuyển trình
   duyệt đã có. Đường in viết một chỗ, `printPdf` ở `scripts/stage.mjs`; cuốn sổ đổi sang dùng nó,
   nên khi in PDF nó không còn mở máy chủ dựng của repo. Tài liệu in khổ A4 đứng; trang đầu là bìa
   cùng trang cho người quyết. Repo không có trình duyệt thì trang HTML vẫn được ghi, lệnh nói lý
   do và kết thúc 1, như cuốn sổ.
6. **Một họ với cuốn sổ:** phần luật trình bày chung và cách đọc màu, cỡ chữ, bo góc từ sổ token
   của repo chuyển sang `scripts/family.mjs`; cuốn sổ và tài liệu cùng dùng. Giá trị nào trong sổ
   token không chỉ là một giá trị thì bị bỏ, trang dùng giá trị mặc định. Tài liệu thêm phần của
   riêng nó: đọc được ở bề rộng điện thoại (bảng cuộn ngang trong khung của nó) và trên giấy.
7. **`--out` đọc theo thư mục đang đứng,** không theo repo đích; lỗi `book-out-inside-target` của
   cuốn sổ không lặp lại ở đây. Có `--out` thì `--json` thêm `files` (và `not_written` khi một định
   dạng không ghi được); không có `--out` thì kết quả không thêm khoá nào và không tệp nào được ghi.
8. **Tên tài liệu và tên tệp:** «Báo cáo tình hình» là `status-report.html`, «Báo cáo rà soát thiết
   kế» là `design-audit-report.html`. Chữ trên tài liệu là tiếng Anh như mọi lời của plugin; tệp chữ
   riêng của repo cho cuốn sổ chưa tới được tài liệu.
9. **`status` đếm hàng chờ bằng luật của `decide`,** gọi chứ không chép: câu nào của
   `design/waiting-list.json` đang chờ là điều tờ trình trả lời. Vì `decide` đang đọc `status`, hàm
   `status()` giữ nghĩa «chỉ các sổ» cho `decide`; lệnh và tài liệu dùng `fullStatus()`, gồm cả hàng
   chờ. Mỗi mục của `waiting` thêm khoá `source`. Lệnh trả lời cho dòng sổ chưa ai xác nhận và cho
   câu của hàng chờ là `decide`, không còn là `new`.
10. **Báo cáo tình hình ngắn như màn hình:** viết đủ năm câu đầu, nêu tên các câu còn lại. Con số
    lệnh in kiểu «3 row(s)» được viết ra thành «3 rows» trên trang.

## Consequences

- **Bài kiểm:** `plugins/design-assembly/tests/test-document.mjs` giữ khung trên một bộ dữ kiện nhỏ
  (đủ sáu phần đúng thứ tự, phần trống có dòng của nó, khuyến nghị thiếu căn cứ bị từ chối), và giữ
  hai lệnh trên repo bỏ đi: `--out` ghi đúng một trang trong thư mục và không gì ở nơi khác, gọi hai
  lần ra cùng từng byte, không `--out` thì cây không đổi, PDF có ở nơi có trình duyệt và được nói
  rõ ở nơi không có. `test-status.mjs` thêm ba bài cho hàng chờ.
- **Sổ giới hạn:** thêm vùng `document`. Mười một dòng mở, trong đó: phát hiện chưa có hình; báo cáo
  rà soát chưa có chương khả năng truy cập và chưa in riêng được chương ấy; PDF cần trình duyệt của
  repo đích; chữ chỉ có tiếng Anh; chưa khuyến nghị nào dựa được vào một nguyên tắc vì chưa lệnh
  nào ghi nguyên tắc; vẻ đẹp của tài liệu chưa ai chấm. Dòng `status-reads-ledgers-only` đóng, thay
  bằng dòng hẹp hơn: `status` vẫn không thấy câu chờ ở ngoài các sổ và hàng chờ.
- **Tên hàm còn vướng:** `status()` nghĩa là «chỉ các sổ» chỉ vì `decide` nhập nó dưới tên ấy. Khi
  `decide` nhập bản đọc sổ dưới tên riêng thì `fullStatus()` nên lấy lại tên `status()`.
- **Cuốn sổ đổi ba chỗ, không đổi điều nó nói:** dùng luật trình bày chung, dùng `printPdf`, và lấy
  tên repo cùng mã commit từ cùng một hàm với tài liệu.
- **Chưa kiểm chứng:** chủ repo chưa xem tài liệu nào; chưa repo nào ngoài repo này được dựng tài
  liệu bằng trình duyệt của chính nó; chưa plugin nào khác gọi `--out`; mười một lệnh còn lại chưa
  có tài liệu.
