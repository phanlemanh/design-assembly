---
type: decision
title: Trạng thái của màn, chữ trên màn và câu báo lỗi, phần máy đọc được từ mã nguồn
links:
  - wiki/decisions/0012-column-types.md
  - wiki/decisions/0010-only-a-row-is-an-answer.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/patterns.mjs
  - plugins/design-assembly/tests/test-patterns.mjs
  - design/states.json
  - src/screens.ts
---

# 0013 Trạng thái của màn, chữ trên màn và câu báo lỗi, phần máy đọc được từ mã nguồn

## Status

Accepted. Chủ kho duyệt bộ khuyến nghị cho bậc «trạng thái của màn và lời văn» ngày 2026-11-12
(«Duyệt, dựng»), dựng theo hai lượt. Bản ghi này là lượt đầu: ba câu máy kiểm tĩnh được, và việc
sửa mức dày của bảng. Cách nhận ra một câu báo lỗi trên màn là máy chọn, chờ chủ kho bác.

## Context

Bậc này hỏi sáu câu, phần lớn là hành vi lúc chạy. Chủ kho đã có luật cho cả sáu ở một kho sản
phẩm; sàn của Repo Standards đã có trạng thái, tệp chữ và danh sách màn ở kho này. Chuẩn ngành đọc
tại nguồn (Carbon, NN/g, GOV.UK): trạng thái trống thay cho phần tử lẽ ra hiện; lỗi đặt gần nguồn;
câu lỗi nói chuyện gì xảy ra và cách sửa.

Trong lúc soạn, máy thấy luật bảng ở kho sản phẩm đó đã đổi so với bản dùng để dựng quyết định
0012: hàng ở mức dày là 32 px, không phải 40 px.

## Decision

1. **Trạng thái hai tầng.** Plugin mang bốn trạng thái mà vùng dữ liệu nào cũng có: đang tải,
   trống, lỗi, tìm không ra. Kho thêm trạng thái riêng trong `design/states.json`, tệp của người.
   Mỗi màn trong danh sách màn phải khai đủ, hoặc được miễn kèm lý do. Bốn trạng thái nền không
   bỏ được.
2. **Mọi chữ trên màn lấy từ một nơi của kho.** Màn không viết chữ giữa hai thẻ, cũng không viết
   chữ trong thuộc tính mà người đọc hoặc nghe được.
3. **Câu báo lỗi có hai phần bắt buộc: chuyện gì xảy ra, làm gì tiếp.** «Vì sao» thêm khi hệ thống
   biết. Đây là chỗ lệch có chủ đích so với luật ba phần chủ kho đã viết: hệ thống thường không
   biết vì sao, và ba nguồn đọc được đều nêu hai phần.
4. **Mức dày của bảng là 32 px**, theo luật hiện tại của chủ kho. Ô ở mức dày không còn đệm dọc,
   và ô tiêu đề cao bằng hàng.
5. **Ba câu còn lại để lượt sau**: kênh thông báo, hỏi trước hay hoàn tác (cần linh kiện mới), và
   mở hồ sơ cạnh danh sách (ghi luật khi có màn đầu tiên cần nó).

## Consequences

- **Kho này (2026-11-12):** ba dòng sổ mới, đều do máy giữ. Kho đáp 26/38 quyết định lõi (10 máy
  giữ, 13 tự khai, 3 đã ghi). Bậc này lên 5/8.
- **Đo trên trình duyệt:** điện thoại ở mức dày, hàng và hàng tiêu đề đúng 32 px; màn rộng ở mức
  thường, 48 px.
- **Một phép kiểm đã bị bỏ trước khi dùng.** Bản đầu đo câu lỗi qua tên khoá trong tệp chữ, và báo
  sai rằng một câu lỗi của màn mẫu thiếu phần hai, trong khi màn có hiện phần đó. Phép kiểm giờ đọc
  thẳng thông báo lỗi trên màn.
- **Ở kho đối chứng (chỉ xem)** phép kiểm chữ tìm ra chữ viết thẳng trong một trang thử. Kho đó đã
  có dòng sổ và bài kiểm riêng cho câu này; adopt không đụng.

Giới hạn và điều còn mở:

- **Cả ba dòng chỉ giữ phần đọc được từ mã nguồn.** Trạng thái: màn có khai, không phải màn có
  hiện đúng; việc tới được từng trạng thái do bài kiểm trình duyệt của sàn giữ. Chữ: chữ ghép
  trong mã không được đọc, và chữ có dấu nháy hay ngoặc có thể lọt. Câu lỗi: có đủ hai phần, không
  phải lời văn có đúng không.
- **Câu báo lỗi được nhận ra qua một linh kiện cụ thể** (thông báo kiểu lỗi của bộ linh kiện ở
  sàn). Kho báo lỗi bằng cách khác thì không có gì để đo, và không có dòng.
- **Danh sách màn là tệp của sàn.** Kho không có nó thì không có dòng trạng thái.
- Bề rộng cột chữ theo nội dung thật, luật mới của chủ kho, chưa dựng.
- Bản ghi 0012 ghi mức dày 40 px; con số đó đã được thay bằng 32 px ở đây.
