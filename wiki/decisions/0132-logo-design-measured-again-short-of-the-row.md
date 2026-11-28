---
type: decision
title: "Skill logo-design 0.4.0 đo lại: hết lỗi nét chữ, hỏi gọn một lượt, vẫn dừng ở bước chạy thử"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0131-logo-design-measured-at-the-brand-assets-socket.md
  - wiki/decisions/0127-the-mark-plug-leaves-a-package-the-plugin-reads.md
  - wiki/decisions/0128-the-owner-chooses-a-mark-among-candidates.md
sources:
  - docs/trials/logo-design-measured-again-in-one-sitting.md
  - docs/trials/logo-design-measured-at-brand-assets.md
  - docs/trials/briefs/mark.md
  - docs/trials/count-tokens.mjs
  - plugins/design-assembly/references/plugs/logo-design.json
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-27, bốn nhãn anh bấm cho bốn câu của ca B: «cloud-pier (Recommended)», «Geist (Recommended)», «Ben May (Recommended)», «16, 14, 12 (Recommended)»"
  - "chủ repo, 2026-11-28: «Chuyển bốn lời trước», khi hai câu phải tự gõ (quyền dùng dấu, giấy phép bộ biểu tượng) chưa có"
  - "chủ repo, 2026-11-28: «Làm cả hai», đáp câu «Anh chọn «Làm cả hai» hay «Chỉ đẩy và gộp»?» của phiên điều phối, trong đó có việc giữ dòng giới hạn thay thế ở mức nặng"
---

# 0132 Skill logo-design 0.4.0 đo lại, vẫn dừng trước dòng dấu

## Status

Proposed, 2026-11-28. Lượt đo thứ hai của mục 12.3, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (tiêu chí 19 và 22), nối tiếp
[0131](0131-logo-design-measured-at-the-brand-assets-socket.md). Mục 12.3 chưa xong, giai đoạn 12 không đóng.
`ontology/` không đổi; hợp đồng sổ không đổi; phiên bản plugin không đổi.

## Context

Lượt đầu ([0131](0131-logo-design-measured-at-the-brand-assets-socket.md)) tìm thấy ba lỗi của skill: chữ của dấu
khuyết nét mà không lệnh nào thấy; tên họ chữ trong sổ không khớp tên bản cài; chữ của logo không được hỏi trước khi
dựng. Nó cũng dừng ở bước chạy thử vì chủ repo chưa viết câu quyền dùng dấu, và cần năm vòng đáp cùng một lần cài họ
chữ. Skill được sửa ở kho của nó (bản 0.4.0). Dòng «xong khi» thứ hai của giai đoạn 12 đòi một lượt ngồi và 0 lần máy
quyết thay, nên cần một lượt đo mới trên một bản sao làm lại từ đầu.

## Decision

1. **Đề chuẩn giữ nguyên** ([`docs/trials/briefs/mark.md`](../../docs/trials/briefs/mark.md)), nên hai lượt so được
   với nhau. Ca B chạy mới bằng một tác tử; ca A dựng lại bằng lệnh từ lời đáp của lượt đầu, không tác tử.
2. **Số đo** ([bản ghi](../../docs/trials/logo-design-measured-again-in-one-sitting.md)), cạnh số của lượt đầu:

   | Thước                 | Lượt đầu (0.3.0)                                            | Lượt này (0.4.0)                                                                                                     |
   | --------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
   | 1. Giữ được không     | Chữ khuyết nét, mọi lệnh kiểm vẫn qua; dừng ở bước chạy thử | Chữ không khuyết, lệnh kiểm của skill xem nét chữ và từ chối gói cũ; cổng và `make check` xanh; dừng ở bước chạy thử |
   | 2. Phải đoán mấy chỗ  | Ca B: 3 câu lên hàng chờ, 8 chỗ tự quyết                    | Ca B: 5 câu lên hàng chờ, 23 chỗ tự quyết (kê mịn hơn)                                                               |
   | … quyết thay chủ repo | 0 (đọc chặt: 1 mỗi ca)                                      | Ca B: 1 (đọc chặt: 2); ca A: 0 (đọc chặt: 1)                                                                         |
   | 3. Chạy được ở đâu    | Trên máy, không mạng; cần họ chữ cài đúng tên               | Như cũ; tên họ chữ được hỏi ngay ở lượt hỏi đầu                                                                      |
   | 4. Tốn bao nhiêu      | Ca B 308 442; ca A 289 898; cả lượt 1 023 545               | Ca B 256 882; ca A không tác tử; cả lượt ghi ở bản ghi, dưới trần 850 000                                            |

3. **Chưa phải một lượt ngồi trọn.** Chủ repo đáp bốn câu chọn trong một lần. Hai câu chỉ người viết được, quyền dùng
   dấu và giấy phép bộ biểu tượng, được hỏi ba lần và chưa có; anh nói «Chuyển bốn lời trước». Không ai viết thay, nên
   không dòng dấu nào được ghi.
4. **Dòng «xong khi» thứ hai của giai đoạn 12 chưa đạt:** thiếu dòng dấu, dòng bộ biểu tượng chưa có giấy phép, và ở
   ca B tác tử tự ghi bộ biểu tượng mà không hỏi chủ repo chọn bộ nào.
5. **Tệp phích:** chữ `about` sửa cho đúng bản 0.4.0. Không thêm mục `measured`: có mục ấy thì `plugs` hỏi chủ repo chọn
   phích, trong khi chưa lượt nào thấy dòng dấu được giữ và nguồn gốc bộ máy dựng hình chưa được xác nhận. Dòng
   `logo-design-plug-unmeasured` vẫn mở.
6. **Khuyến nghị của chủ repo ở ổ này không tự đổi** (tiêu chí 19), như ở 0131.

## Consequences

- Sổ giới hạn: đóng `logo-package-drawing-unchecked` và `logo-plug-wordmark-language-unasked`; mở năm dòng
  `logo-package-drawing-checked-by-the-plug-only`, `logo-row-titled-by-the-name-not-the-wordmark`,
  `icon-set-choice-not-asked-of-the-owner`, `decide-ask-takes-a-licence-as-a-recommendation`,
  `status-calls-a-queued-ground-a-measurement`. Cách xử lý ghi ở năm dòng mới là đề xuất của phiên đo, chờ chủ repo. Dòng `logo-package-drawing-checked-by-the-plug-only` ở mức nặng theo lời chủ repo («Làm cả hai», 2026-11-28): nó thay cho dòng mức nặng vừa đóng, nên số giới hạn mức nặng plugin in ra không đổi.
- Lượt ngồi của skill gọn lại còn tối đa ba câu, nhưng hai câu giữ dòng sổ nằm ngoài lượt ấy: câu quyền dùng dấu chỉ
  hiện ra sau khi dòng đã viết, và không có chỗ nào trên hàng chờ cho nó. Đó vẫn là điểm vướng của
  `logo-licence-sentence-stalls-the-row`.
- Một lượt sau không cần vẽ hay dựng lại: hai gói đã qua lệnh kiểm nằm ở hai bản sao bỏ đi. Có hai câu của chủ repo thì
  chạy `logo-source --package` thật, viết hai câu vào hai dòng, rồi chạy cổng và `make check`.
- Lệnh kiểm nét chữ nằm ở skill, không ở plugin: một gói từ nơi khác với chữ khuyết nét vẫn qua `logo-source --package`.
- Trong lượt này, lời đáp cỡ biểu tượng được ghi trên tờ quyết định rồi phải chép tay vào dòng (dòng giới hạn có sẵn
  `icon-set-sizes-written-by-hand`), và việc chép ấy làm bản xuất cũ đi cho tới khi viết lại.
