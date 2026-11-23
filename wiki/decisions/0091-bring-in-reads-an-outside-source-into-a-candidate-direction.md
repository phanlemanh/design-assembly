---
type: decision
title: "Cầu nối vào: lệnh bring-in đọc thứ công cụ ngoài làm ra thành một hướng ứng viên, giá trị ngược sổ thành câu hỏi"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0090-plugs-sees-the-session-falls-back-and-shows-the-board.md
sources:
  - plugins/design-assembly/scripts/bring-in.mjs
  - plugins/design-assembly/scripts/outside-tokens.mjs
  - plugins/design-assembly/scripts/specimen.mjs
  - plugins/design-assembly/skills/bring-in/SKILL.md
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-bring-in.mjs
  - "trang công khai đọc ngày 2026-11-23, không gửi gì của kho: github.com/google-labs-code/design.md docs/spec.md (định dạng DESIGN.md, bản alpha); docs.hyva.io trang về token của Claude Design (bên thứ ba: tệp token theo định dạng của nhóm cộng đồng design token, `$value` và `$type`)"
  - "chủ repo, 2026-11-23: «Dựng mục 10.3»"
---

# 0091 Cầu nối vào: một nguồn ngoài thành một hướng ứng viên

## Status

Accepted, 2026-11-23, chờ chủ repo bác ở các lựa chọn dưới đây. Mục 10.3 của kế hoạch, tiêu chí 9 và 15 của đề bài
0014; máy tự dựng sau lời duyệt đề bài, theo lời chủ repo «Dựng mục 10.3». Plugin lên 0.39.0.

## Context

Đề bài 0014 đòi cầu nối vào đọc tệp token và trang hệ của Claude Design, `DESIGN.md`, biến kiểu Figma thành một hướng
ứng viên đứng cạnh các hướng của plugin trên bảng mẫu; biểu thức `calc()` tính ra giá trị cuối (bài học 4 của lần thử
tay, và 0088: hệ của Claude bỏ 6 trên 6 nấc bo góc `calc()`); giá trị ngược một dòng sổ đã chốt thành câu hỏi, không thay
dòng sổ. Định dạng xuất chính thức của Claude Design chưa có trang nào của Anthropic nêu; một trang bên thứ ba nói nó
xuất tệp token theo định dạng của nhóm cộng đồng design token.

## Decision

1. **Bốn loại nguồn, tên trung tính.** `tokens` (tệp token: nhóm lồng nhau, `$value`, `$type`, tham chiếu
   `{nhóm.token}`), `design-md` (khối YAML đầu tệp của DESIGN.md: `colors`, `typography`, `rounded`, `spacing`, nhóm
   `light`/`dark`), `variables` (bản xuất biến theo bộ sưu tập và chế độ: màu là ba kênh 0 đến 1, bí danh
   `VARIABLE_ALIAS`, số là điểm ảnh), `system` (thư mục `tokens.json` và `README.md`, tên lấy từ đầu đề đầu tiên của
   README). Lõi không nêu tên công cụ ngoài nào, theo phép «lõi sạch»; loại được đoán từ đường dẫn, `--kind` sửa khi
   đoán sai.
2. **Mọi giá trị về giá trị cuối** (`scripts/outside-tokens.mjs`): tham chiếu được theo, trong cùng chế độ trước;
   `calc()` với `px`, `rem`, `var(--tên)` và `{tham.chiếu}` được tính bằng cộng, trừ, nhân, chia và ngoặc; một rem là
   16 điểm ảnh. Tham chiếu vòng lại, tên không trỏ đâu, nhân hai độ dài đều thành dòng «không đọc được» kèm lý do,
   không làm sập lệnh.
3. **Hướng ứng viên dùng đúng khoá của mọi hướng:**
   - `source_color`: màu tên `primary`, rồi `brand`, rồi `accent`, ở chế độ sáng; token nằm dưới nhóm màu (`color`,
     `colors`, `palette`, `brand`, `theme`…) đứng trước, chính tên ấy trước sắc mặc định của nó (`primary.main`), đường
     ngắn trước đường dài; kết quả nói màu lấy từ token nào. Màu tối riêng nếu nguồn có, chỉ được nói, không được vẽ.
     Nguồn không có màu chính thì không thành hướng (mã 2).
   - `type_scale`: mọi cỡ chữ nằm trong thang của khung thì `standard`; nếu không, `modular` với tỉ lệ gần nhất của
     plugin cho bước giữa trên cỡ gốc. Dưới ba cỡ trên cỡ gốc, hay bước cách mọi tỉ lệ quá 0,1, thì không đọc thang:
     vẽ thang của sàn và nói vì sao.
   - Nhóm tên `light` hay `dark` là chế độ chỉ khi nó ở gốc hay ngay dưới nhóm màu; sâu hơn (`primary.light`) là một
     sắc. Chế độ của bản xuất biến nhận theo tên (`Dark Mode` là tối), dù chế độ nào là mặc định.
   - `corner_radius`: bo góc gốc (`base`, `default`, `md`…, nếu không thì giá trị giữa) đưa về nấc gần nhất của plugin.
   - Điều nguồn không nói thì vẽ bằng giá trị của sàn và ghi `assumed`; điều đưa về nấc gần nhất ghi `approximated`;
     phông nguồn nêu chỉ được nói ra, không thành kiểu chữ của hướng.
4. **Đứng cạnh hướng của plugin.** `specimen --section direction --from PATH` vẽ hướng ứng viên là hướng cuối của bảng
   mẫu, trên màn thật của repo, sáng và tối, với số đo tương phản như mọi hướng. Chọn nó thì ghi giá trị của nó làm lời
   đáp của chủ repo qua lối dẫn, như mọi hướng; không gì ghi thẳng vào sổ.
5. **Ngược sổ thành câu hỏi.** «Đã chốt» là khoá của tầng nền đã quyết mà chủ repo đưa ra hay xác nhận. Mỗi giá trị
   khác thành một câu `outside-<nguồn>-<khoá>` trên hàng chờ, khuyến nghị giữ giá trị đã chốt, căn cứ «sổ thắng»; từ chối
   không tự đổi gì. Chạy lại cùng nguồn không hỏi lại.
6. **Lệnh mới `bring-in`**, một phích không mặc định của ổ hướng đi, đọc sổ thiết kế (`blueprint`); có trang skill,
   từ vựng «candidate direction».

## Consequences

- Bốn dòng giới hạn mới, vùng `capabilities`: định dạng chỉ đọc từ mẫu viết cho bài kiểm, chưa tệp thật nào; chỉ đọc
  màu chính, thang chữ, bo góc; phông chỉ được nêu; từ chối không tự đổi gì.
- Đo lại hệ của Claude (0088) nay có thể tính được nấc `calc()`; quan hệ «theo» của sổ vẫn chưa dựng lại.
- Soát độc lập trước khi mở PR: không điểm nghiêm trọng; hai điểm cao đã sửa, có bài kiểm (màu chính lấy nhầm token
  `text.primary`; sắc `light`/`dark` bị đọc là chế độ); các điểm vừa đã sửa (chế độ mặc định là tối, mã câu hỏi trùng
  giữa hai nguồn cùng tên và câu cũ khi giá trị đổi, hai cỡ chữ thành thang modular, hàm quá dài); điểm nhẹ đã sửa: bo
  góc hoà chọn nấc lớn hơn, BOM đầu DESIGN.md, lời «vẽ cả màu tối của nguồn». Để lại: cỡ chữ bằng `pt` hay `%` bị bỏ
  không lời; `em` tính như rem ở mọi thuộc tính; hai biến cùng tên ở hai bộ sưu tập, biến sau thắng.
- Lựa chọn chờ chủ repo: tên lệnh `bring-in`; một rem là 16 điểm ảnh; màu chính tìm theo tên `primary`, `brand`,
  `accent`; khoá chưa chốt (guide đề xuất, chưa ai xác nhận) không sinh câu hỏi.
