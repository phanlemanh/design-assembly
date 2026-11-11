---
type: spec
title: Quyết từ trên xuống, dựng từ dưới lên
status: draft
tier: 1
links: [wiki/decisions/0002-setup-choices.md]
sources:
  - repo-standards/docs/superpowers/specs/2026-11-09-design-layer-design.md
  - repo-standards/tests/scenarios/design-bank.md
  - onehub-quy-hang/docs/plan/kien-truc-he-design-da-repo.md
  - onehub-quy-hang/docs/plan/ma-tran-kiem-ke-design-claude-code.md
  - onehub-inventory/docs/design-standard-proposal.md
---

# 0001 Quyết từ trên xuống, dựng từ dưới lên

Bản nháp do máy soạn ngày 2026-11-11 từ một phiên trao đổi với chủ kho. Chủ kho chưa duyệt.

## Intent

Ý tưởng gốc của chủ kho: mô phỏng bằng công thức và lắp ghép, đi từ nhỏ đến lớn, qua các thành phần
kết hợp với lựa chọn, để cùng Claude Code thiết kế lại hệ design.

Sau khi đối chiếu với số đo đã có, ý tưởng được chỉnh một điều: **quyết từ trên xuống, dựng từ dưới
lên**.

- **Lượt xuống, người quyết, một lần ngồi.** Bốn loại câu hỏi chỉ người trả lời được: ý định sản
  phẩm (công cụ hay trang đọc), kiểu màn cần có (chọn trong danh sách đóng), nhận diện (màu, phông,
  giọng), từ vựng nghiệp vụ. Mỗi câu có khuyến nghị và thấy hệ quả ngay trên màn đang chạy.
- **Lượt lên, máy dựng và tự kiểm.** Giá trị nền (chuẩn có sẵn trước, công thức sau), linh kiện
  (biến thể đóng), hành vi và lời và định dạng (ma trận trạng thái), rồi màn mẫu cho từng kiểu màn.
  Mỗi tầng phải từng đỏ khi phá thử rồi mới được làm nền cho tầng trên.
- **Bộ mô phỏng là khung nhìn vào kho thật**, không phải một trang đứng riêng: màn mẫu đang chạy
  cộng đèn báo lấy từ chính bộ rào của kho.

Vì sao đổi hướng quyết: tầng giá trị nền là nơi đau ít nhất (0 lần làm lại vì token, 207 token chỉ
cần giữ 7 biến thương hiệu), còn phần thiếu dồn ở hành vi, lời và nghĩa dữ liệu (13 trong 19 thành
phần thiếu của ma trận kiểm kê 49 dòng).

### Giả thuyết đo được

Lần đo ba của tầng design ở Repo Standards (2026-11-11) đạt chất lượng (0 trạng thái thiếu so với
18, 0 lỗi rào so với 76) nhưng trượt ngưỡng token: x1,43, cần không quá x1,30. Phần token thêm đến
từ việc tác tử đọc và chép cả màn mẫu, bài kiểm ứng dụng và trang luật.

Giả thuyết của kho này: **nếu màn được lắp từ khối đóng thay vì chép màn mẫu, tác tử đọc ít hơn và
viết ít hơn, nên token về dưới x1,30 mà vẫn giữ 0 trạng thái thiếu.**

## Acceptance criteria

Lát mỏng đầu tiên chỉ làm một kiểu màn: danh sách có lọc (màn 1 của phép đo).

1. Màn danh sách có lọc được dựng bằng cách khai báo: cột theo kiểu, năng lực theo tên, trạng thái
   bắt buộc. Thiếu trạng thái thì không biên dịch được.
2. Người đi lượt xuống trong một lần ngồi, tối đa bốn câu hỏi, mỗi câu có khuyến nghị.
3. Mỗi lựa chọn thành một dòng trong sổ quyết định, có lệnh kiểm; lệnh kiểm phải từng đỏ.
4. `make check` qua, và bộ rào vẫn đỏ khi đưa lỗi mẫu vào.
5. Đo bằng đúng giao thức đã khoá ở `repo-standards/tests/scenarios/design-bank.md`, riêng màn 1:
   trạng thái thiếu bằng 0, lỗi rào còn lại bằng 0, token không quá x1,30 so với nền đối chứng.

Tiêu chí 5 tốn tiền API. Chỉ chạy khi chủ kho đồng ý.

## Domain impact

Chưa có khái niệm nghiệp vụ nào. Khi cần cột theo kiểu (tiền, ngày, người, tình trạng) thì thêm
khoá hiển thị vào ontology, theo hướng `display` của đề xuất chuẩn hoá ở onehub-inventory.

## Plan

1. Chốt bốn câu hỏi lượt xuống cho lát này và ghi câu trả lời vào sổ quyết định.
2. Dựng khối danh sách đóng trên linh kiện sẵn có: kiểu cột quyết định canh và định dạng, không mở
   tuỳ chọn kiểu dáng.
3. Dựng lại màn mẫu bằng khối đó; giữ nguyên bài kiểm trạng thái hiện có.
4. Thêm khung nhìn «đèn báo» đọc kết quả từ bộ rào của kho.
5. Đo màn 1 theo giao thức đã khoá, nếu chủ kho cho chạy.

## Test plan

- Bài kiểm đơn vị và bài trình duyệt hiện có phải giữ xanh qua từng bước.
- Mỗi luật mới có một ca đưa lỗi vào và một ca hợp lệ, cùng chỗ với `tools/design_guards.mjs`.
- Phép đo ở tiêu chí 5 dùng nền đối chứng và cách chấm của Repo Standards, không tự đặt thước.

## Autonomy tier

Máy tự làm bước 1 đến 4 trong kho này. Bước 5 cần chủ kho cho phép vì tốn tiền. Mọi thay đổi ở
Repo Standards hay kit nghiệm thu nằm ngoài kho này và cần chủ kho quyết riêng.

## Open questions

- Nền shadcn đặt sẵn giá trị nền và linh kiện, nên phần «công thức» chỉ còn ở vài chỗ: sắc nhạt của
  màu thương hiệu, màu chữ trên nền, mật độ, bề rộng cột. Chủ kho có muốn kho này tự sinh cả thang
  chữ và khoảng cách bằng công thức không? Số đo hiện có nói là không đáng.
- Ngôn ngữ và tiền tệ (`vi-VN`, VND) do máy suy từ ngôn ngữ hội thoại. Chủ kho có thể bác.
- Ý tưởng này không chạm 55 % số lần làm lại do bài kiểm và hạ tầng, và không trả lời được trải
  nghiệm có tốt không.
- Một phiên khác đang đo và sửa tầng design ở Repo Standards. Kết quả ở đó có thể đổi nền của kho
  này; chưa có cách đồng bộ.
