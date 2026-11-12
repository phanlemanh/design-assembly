---
type: decision
title: Đầu ra là design system chuẩn hoá nằm trong repo, theo bậc; ranh giới với hai kho bên cạnh
links:
  - wiki/specs/0001-design-system-for-claude-code.md
  - wiki/decisions/0004-output-and-vocabulary.md
sources:
  - plugins/design-assembly/references/tiers.json
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/tests/test-inventory.mjs
---

# 0005 Đầu ra là design system chuẩn hoá nằm trong repo, theo bậc; ranh giới với hai kho bên cạnh

## Status

Accepted. Chủ kho nêu định nghĩa đầu ra và duyệt bảng bậc ngày 2026-11-12, rồi duyệt ranh giới và
năm điều chỉnh cùng ngày, sau khi máy kiểm kê Repo Standards và delivery-loop.

## Context

Quyết định 0004 nói đầu ra là một plugin dẫn dắt. Chủ kho nói rõ thêm điều người dùng kỳ vọng: một
bộ design system hoàn chỉnh, nằm ngay trong repo, người và Claude Code đều xem được, đã chuẩn hoá để
Claude Code tự hành. Đầu vào là bất kỳ định dạng nào đội ngũ đang dùng; kho có thể chưa có design
system, có dở, hoặc đã có đủ cho người. Sự chuẩn hoá là đầu ra, và nó cần các bậc deliverable là vật
chỉ tay vào được.

Trước khi dựng, máy kiểm kê hai kho bên cạnh ở chế độ chỉ đọc để định ranh giới.

## Decision

**1. Đầu ra.** Một design system chuẩn hoá nằm dưới `design/` của repo. Plugin là phương tiện. Ba
tình huống của kho là ba kiểu đầu vào; đầu ra là một.

**2. Một bậc cần đủ ba thứ:** vật nằm trong repo; lệnh kiểm chạy trong cổng kiểm của repo và từng
được thấy đỏ; một việc Claude Code tự làm được mà không đoán.

**3. Các bậc, gọi bằng tên, không đánh số riêng.** Danh sách máy đọc được ở
`plugins/design-assembly/references/tiers.json`.

| Bậc                 | Ứng với bản kiến trúc | Vật                                                 | Claude Code tự làm được                  |
| ------------------- | --------------------- | --------------------------------------------------- | ---------------------------------------- |
| Audit               | Trước L1              | Bản kiểm kê, tính lại được bất cứ lúc nào           | Biết cái gì đã quyết, đã giữ, bị đi vòng |
| Foundations         | L1                    | Design tokens máy đọc được, theme, sổ quyết định    | Không phải chọn một giá trị thô          |
| Core components     | L2                    | Sổ linh kiện máy đọc được                           | Chọn linh kiện bằng tra cứu              |
| Patterns và content | L3                    | Bảng interaction patterns; nguồn nhãn, từ vựng      | Biết trạng thái nào hiện gì, nói thế nào |
| Templates           | L3                    | Bản đồ khuôn, mỗi nhóm một reference implementation | Dựng một màn mới thuộc kiểu đã biết      |
| Governance          | L5                    | Sổ ngoại lệ, sổ lỗi lọt                             | Xử lý chỗ lệch chuẩn mà không làm mục hệ |

Conformance (L4 của bản kiến trúc) không phải một bậc: nó là điều kiện ra của mọi bậc. Thang M0–M3
của kit là số đo kit tự đọc ra từ vật của Foundations và Core components; không gộp vào đây.

**4. Ranh giới.**

|             | Repo Standards                                                      | design-assembly                                        | Kit nghiệm thu                        |
| ----------- | ------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------- |
| Khi nào     | Lúc dựng kho                                                        | Sau khi có sàn, và ở kho đã có sẵn                     | Mỗi vòng tính năng                    |
| Làm gì      | Đặt sàn: nền linh kiện, bộ soát, kiểm trên trình duyệt, một màn mẫu | Chuẩn hoá design system thành vật trong repo, theo bậc | Chấm phần thay đổi của từng tính năng |
| Giữ giá trị | Vài giá trị lúc dựng                                                | Có                                                     | Không: chỉ có ổ cắm đọc từ kho        |

**5. Năm điều chỉnh.**

1. Vật của Foundations, Core components và Templates dùng đúng đường dẫn và định dạng mà kit đọc:
   tệp tokens, `design/component-registry.json`, `design/patterns/<nhóm>.md`.
2. Màu thương hiệu: Repo Standards hỏi một lần lúc dựng kho. design-assembly đọc lại, chỉ hỏi khi
   kho chưa có.
3. Không thêm thang thứ ba: bậc có tên, và ứng với thang L của bản kiến trúc như bảng trên.
4. Điều kiện «không giá trị thô» trỏ vào lệnh kiểm đã có ở Repo Standards và ở kit, không viết lại.
5. Bậc Audit chạy trên mọi kho, không cần sàn. Từ Foundations trở lên ở kho đã có, design-assembly
   tạm tự nối vào cổng kiểm theo cách tối thiểu, cho tới khi Repo Standards hỗ trợ kho đã có.

## Consequences

- Bậc Audit đã dựng: `scripts/inventory.mjs`, chỉ đọc, cùng trạng thái kho thì ra cùng báo cáo. Nó
  là bậc duy nhất không có tệp nằm trong cổng kiểm: một bản kiểm kê ghi vào kho sẽ cũ sau mỗi
  commit. Tính tất định của nó được giữ ở bài kiểm của plugin.
- Một quyết định có sáu trạng thái, không phải bốn như lúc bàn: chưa quyết, bị đi vòng, đã quyết
  chưa giữ, kho tự khai là có lệnh kiểm (chưa chạy lại), máy giữ (đã chạy lại), và đã ghi (phán
  đoán của người). «Mâu thuẫn» được đo bằng số chỗ mã nguồn đi vòng qua quyết định.
- Chạy trên hai kho ngày 2026-11-12:
  - Kho này: 4/6 quyết định foundations máy giữ, 2 là phán đoán đã ghi. Foundations chưa đạt vì
    thiếu tệp tokens.
  - onehub-inventory (nhánh chính, 09b6d93): 0 chỗ đi vòng trong 35 tệp; 4 quyết định do chính kho
    khai là có lệnh kiểm; product type chưa quyết; thiếu tệp tokens. Kho đó đã có vật cho các bậc
    trên, nhưng bản này chưa kiểm được chúng.
- Bản này chỉ nói «đạt» tới bậc Foundations. Các bậc trên chỉ báo vật có hay không.
- Cuộc dẫn dắt hiện vẫn ghi đè màu chính. Vì vậy nó chưa dùng được cho kho đã có giá trị riêng;
  lệnh audit nói rõ điều đó. Phần «chỉ thêm lệnh kiểm quanh giá trị có sẵn» chưa dựng.
- Lý do tồn tại ghi ở bản đề bài trước («giảm token») đã cũ: lần đo thứ tư của Repo Standards đạt
  cả ba ngưỡng. Lý do đúng: kho đã có sẵn, và mọi thứ vượt quá màn mẫu đầu tiên.

Ba điều còn mở, cần chủ kho quyết khi tới lúc:

- **Định dạng sổ quyết định.** onehub-inventory đã có `design/decisions.yaml` (50 quyết định, cùng
  bốn loại) theo đề xuất chuẩn hoá của chủ kho. Plugin này ghi `design/decisions.json` theo dạng
  riêng. Bản kiểm kê đọc được cả hai, nhưng chuẩn chỉ nên có một.
- **Tầng design của Repo Standards chưa vào nhánh chính**; kho này dựng từ một nhánh chưa gộp.
- **Định dạng tệp tokens và sổ linh kiện mà kit đọc** chưa được đọc kỹ. Phải đọc trước khi dựng
  Foundations cho đủ và Core components.
