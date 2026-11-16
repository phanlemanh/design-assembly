---
type: decision
title: "Giai đoạn thứ chín của kế hoạch: gỡ va chạm cho ba kho, chạy song song"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0040-the-plan-of-record-and-how-it-is-kept.md
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
  - wiki/specs/0004-the-command-set.md
sources:
  - docs/plan/plan.json
  - "repo-standards/docs/three-repo-overview-design.md, mục 5, 7 và 8 (PR 14 của kho đó)"
  - 'chủ repo, 2026-11-16, ở phiên Repo-standards: «Gửi qua design-assembly ở phiên "Design Assembly" yêu cầu thực hiện cho hạn mục của mình và cung cấp bối cảnh hoàn chỉnh.»'
  - "chủ repo, 2026-11-16, ở phiên Repo-standards: «Đồng ý, nếu liên quan design thì là design assembly còn nếu ko thì ở delivery loop»"
  - "chủ repo, 2026-11-16, ở phiên này, sau bản rà soát: «Duyệt kế hoạch»"
---

# 0048 Giai đoạn thứ chín của kế hoạch: gỡ va chạm cho ba kho, chạy song song

## Status

Accepted, 2026-11-16. Chủ repo duyệt bằng câu «Duyệt kế hoạch», sau khi máy rà lại bản trình và sửa bảy chỗ.

## Context

Bản thiết kế tổng quan ba kho của Repo Standards đo trên repo kiểm chứng: trong 30 PR gộp gần nhất, cặp PR nào
cũng chạm chung ít nhất một tệp. Tám tệp sổ gây ra phần lớn; ba trong số đó thuộc lớp thiết kế. Hệ quả là 64 lần gộp
nhánh chính ngược vào nhánh và 71 lần ghim lại bằng chứng trên 30 PR. Bản tổng quan giao cho kho này ba gói: sổ thiết
kế thôi đi theo PR, bản đồ từ màn tới bài trình duyệt, và sổ quyết định đứng thay vai trưởng thiết kế.

Máy kiểm ba gói với mã thật và đếm lại số đo, tại đúng thời điểm Repo Standards đo. Số khớp: sổ linh kiện 14 PR, sổ
khối 13, sổ màn 9, trang mẫu hành vi 8, bảng vai × màn × nút 6. Chủ repo chốt luật xếp chủ: tệp liên quan thiết kế về
kho này. Theo luật đó sổ khối, trang mẫu hành vi và bảng vai × màn × nút về kho này.

Kế hoạch chính thức (quyết định 0040) có tám giai đoạn và không mục nào mang việc này. Quyết định 0040 cho làm việc
ngoài kế hoạch trên một nhánh khai `off-plan`, nhưng đây không phải một việc lẻ: nó có năm bước, chạm năm mục đã có
(3.1, 5.1, 5.3, 6.2, 7.2), và chạy qua nhiều PR.

## Decision

1. **Thêm giai đoạn 8, «Gỡ va chạm cho ba kho», chạy song song với giai đoạn đang mở.** Năm mục: 8.0 đề bài chi
   tiết; 8.1 sổ thôi đi theo PR; 8.2 lệnh nói tệp đổi ảnh hưởng màn nào; 8.3 sổ quyết định đứng thay trưởng thiết kế;
   8.4 repo kiểm chứng nhận ba bước trên bằng `upgrade`. Giai đoạn 1 và 2 khai nó là chạy cạnh, để `plan-check` coi nó
   đang mở.
2. **Giai đoạn 8 ghép với các mục đã có, không thiết kế hai lần.** Sổ khối của repo kiểm chứng chính là «sổ nhập kho»
   mà mục 3.1 sẽ định hình: 8.1 chốt hình dạng ấy, mục 3.1 dùng lại. Phần còn lại chạm mục 5.1 (phiếu giao việc dựng
   màn), 5.3 (bài trình duyệt theo vai), 6.2 (kit đọc sổ màn) và 7.2 (registry khối). Đề bài 0005 ghi từng chỗ ghép.
3. **Kho này nhận ba tệp chưa ai nhận**, theo luật xếp chủ của chủ repo: sổ khối, trang mẫu hành vi, bảng vai × màn ×
   nút. Nhận nghĩa là kho này định hình dạng và phép kiểm; ai ghi từng mảnh vẫn theo luật «mỗi tệp một bên ghi».
4. **Thứ tự theo kho giữ như chủ repo đã chốt:** dựng ở kho này trước, rồi mới đưa sang repo kiểm chứng. Không sửa
   delivery-loop. Mỗi lần đụng repo kiểm chứng vẫn cần chủ repo cho phép riêng.
5. **Đo bằng một phép đếm.** Trên 30 PR gộp gần nhất của repo kiểm chứng, đếm số PR chạm từng tệp trong thư mục thiết
   kế. Con số «cặp PR chạm nhau» của bản tổng quan không dùng để chấm giai đoạn này, vì nó chỉ giảm khi cả nhật ký
   wiki và trang lộ trình cũng được gỡ, là việc của hai kho kia.

## Consequences

- Kế hoạch có chín giai đoạn. Đề bài 0002 còn vẽ bảng tám giai đoạn; bảng ấy giữ lý do của lúc đó, trạng thái chỉ sống
  ở `docs/plan/plan.json`.
- Một phần của câu «duyệt kiến trúc» đến sớm. Chủ repo đã hoãn việc duyệt kiến trúc tới cổng của giai đoạn 6 (câu B1
  của hàng chờ). Giai đoạn 8 chốt trước riêng phần «kho nào giữ sổ nào»; phần còn lại của kiến trúc vẫn chờ giai đoạn 6.
- Hôm nay giai đoạn 8 không làm chậm mục nào: mục 1.4 chờ PR khác của repo kiểm chứng gộp, giai đoạn 2 chờ chủ repo
  chỉ định hai repo. Về sau nó tranh chỗ với giai đoạn 3.
- Lợi ích về tốc độ gộp không đến từ một mình kho này. Xung đột thật của PR lên đời đang chờ (hai tệp: trang lộ trình
  và nhật ký wiki) không nằm ở sổ thiết kế nào.
- Chưa dựng gì. Mục 8.0 dừng ở cổng: chủ repo duyệt đề bài 0005 rồi máy mới bắt đầu 8.1.
