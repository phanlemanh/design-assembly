---
type: decision
title: "Chạy lại lần dùng đầu của filters: tiêu chí 14 đạt trọn, giai đoạn 11 có đủ bằng chứng để đóng"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0104-filters-taken-in-through-conform-measured.md
  - wiki/decisions/0105-a-mandatory-rule-is-never-exempted.md
  - wiki/decisions/0106-the-floating-parts-of-an-outside-item-are-opened.md
  - docs/trials/filters-rerun-criterion-26.md
sources:
  - docs/trials/filters-rerun-criterion-26.md
  - docs/plan/plan.json
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Cho chạy», ước tính khoảng 1 triệu token, trần 1,4 triệu"
---

# 0107 Chạy lại lần dùng đầu của filters: tiêu chí 14 đạt trọn, giai đoạn 11 có đủ bằng chứng để đóng

## Status

Accepted, 2026-11-24. Tiêu chí 26 của phần bổ sung đề bài
[0015](../specs/0015-choose-before-make-conform-before-intake.md), mục 11.6 của kế hoạch, theo lời chủ repo («Cho
chạy»).

## Context

Lần dùng đầu ([0104](0104-filters-taken-in-through-conform-measured.md)) cho cổng xanh, nhưng hai lỗi khả năng truy
cập còn nguyên và 25 điều khai miễn thuộc luật bắt buộc. Mục 11.8 ([0105](0105-a-mandatory-rule-is-never-exempted.md))
và 11.7 ([0106](0106-the-floating-parts-of-an-outside-item-are-opened.md)) dựng hai phần còn thiếu. Lượt chạy lại kiểm
xem lối mới có buộc được hai điều ấy không.

## Decision

Ghi kết quả như đã đo, không chỉnh. Bản ghi: [filters-rerun-criterion-26](../../docs/trials/filters-rerun-criterion-26.md).

1. **Tiêu chí 14 đạt trọn trên bản sao ứng dụng mẫu.** Phiên chạy lượt thử đếm trên bản sao:
   - cổng xanh, gồm phần kiểm phần nổi;
   - 0 luật tắt ngoài khai miễn;
   - 0 khai miễn luật bắt buộc;
   - ô nổi có tên;
   - không còn câu tiếng Anh nào;
   - `axe` của repo sạch khi phần nổi đang mở.
2. **Lối mới buộc được việc vá.**
   - 25 điều khai miễn của lần đầu nay là 10 bản vá đưa mã về luật bắt buộc.
   - Hai lỗi khả năng truy cập cùng một câu tiếng Anh lần đầu chưa thấy được sửa trong mã của món.
   - Khai miễn từ 82 xuống 58, bản vá từ 24 lên 30.
3. **Giá phải trả:**
   - 552 937 token, so với 447 781 lần đầu;
   - khoảng 33 phút, so với 21;
   - 21 chỗ tự quyết, so với 13.

   Phần lớn chỗ tăng là các giá trị của thang mà tác tử phải chọn khi bỏ giá trị tuỳ ý.

4. **Mục 11.6 xong.** Cả hai dòng «done when» của giai đoạn 11 đã được cho thấy bằng lệnh trên bản sao. Giai đoạn 11
   chưa ghi `done` được, vì công cụ kế hoạch không cho một giai đoạn xong khi giai đoạn đứng trước nó (giai đoạn 10, giai
   đoạn hiện tại) chưa xong. Đóng thế nào là câu hỏi cho chủ repo.

## Consequences

- Sổ giới hạn **mới**:
  - `inventory-reads-conformed-files-as-unrecorded`;
  - `store-block-changed-without-widening`;
  - `base-library-folder-still-asks-an-exemption`.
- Dòng mở đầu của phần bổ sung nay nói mục 11.7 đã dựng.
- 58 điều khai miễn trong bản sao là lời người đứng thay. Ở một repo thật, chủ repo duyệt từng điều qua câu hỏi của
  `intake`.
