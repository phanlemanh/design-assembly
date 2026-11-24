---
type: decision
title: "Lấy lại filters qua lối chuẩn hoá: cổng xanh, lần dùng thứ hai rẻ bằng nửa, nhưng hai lỗi đã lọt còn nguyên"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0096-reui-measured-at-the-components-socket.md
  - wiki/decisions/0103-the-store-improves-widen-a-block-and-see-items-behind-their-pin.md
  - docs/trials/filters-through-conform.md
sources:
  - docs/trials/filters-through-conform.md
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Cho chạy», ước tính 850 nghìn token, trần 1,2 triệu"
---

# 0104 Lấy lại filters qua lối chuẩn hoá: cổng xanh, lần dùng thứ hai rẻ bằng nửa, nhưng hai lỗi đã lọt còn nguyên

## Status

Accepted, 2026-11-24. Lượt thử của lát 6, đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md),
tiêu chí 14 và 15, theo lời chủ repo («Cho chạy»). Mục 11.6 vẫn ở `doing`; giai đoạn 11 chưa đóng (xem Consequences).

## Context

Lần đo trước ([0096](0096-reui-measured-at-the-components-socket.md)) lấy `filters` theo lối cũ: cổng chỉ xanh khi sàn
bị tắt, hai lỗi khả năng truy cập lọt qua, và không đo lần dùng thứ hai. Lát 2 tới lát 6 dựng lối mới: lấy về, chuẩn
hoá bằng bản vá ghi lại, nhập kho khi bản ghi đủ, và kho tốt dần.

## Decision

Ghi kết quả như đã đo, không chỉnh. Bản ghi đầy đủ: [filters-through-conform](../../docs/trials/filters-through-conform.md).

1. **Lối mới đi trọn được.** Lấy về, chuẩn hoá, nhập kho, cổng xanh.
   - Không luật nào tắt ngoài danh sách khai miễn: phiên chạy lượt thử đếm lại được 0.
   - Chi phí chuẩn hoá `filters`: 24 bản vá, 82 điều khai miễn trên 16 luật, 30 tệp, khoảng 21 phút, 447 781 token.
2. **Lần dùng thứ hai rẻ hơn nhiều.** `intake` trả ở bậc 1; không tệp nào của khối hay của nguồn phải đổi; không vòng
   sửa nào.
   - Tự quyết 8 chỗ, so với 13 lần đầu.
   - Khoảng 11 phút, so với 21.
   - 231 101 token, so với 447 781.
3. **Tiêu chí 14 chưa đạt ở một vế.** Cả hai lỗi đã lọt lần trước vẫn còn trên màn đang chạy: ô nổi `role="dialog"`
   không tên, và vùng `role="status"` đọc «Top level, 2 items». Lối chuẩn hoá không chạy phép kiểm khả năng truy cập
   nào trên một màn dùng món, dù mức «bắt buộc» của đề bài đòi.
4. **Danh sách khai miễn rộng hơn đề bài cho.** 18 điều khai miễn thuộc luật kiểu dáng, trong khi mức «bắt buộc» nói
   giá trị kiểu dáng là của hệ. Lý do của cả 82 điều do tác tử viết, và người đứng thay chủ repo đáp; chưa người thật
   nào duyệt.

## Consequences

- **Dòng «done when» của giai đoạn 11 đã được lượt thử cho thấy**: món đi trọn, cổng xanh, không luật tắt ngoài khai
  miễn, lần dùng thứ hai được đo cạnh lần đầu. Nhưng giai đoạn chưa đóng, vì hai lẽ:
  - tiêu chí 14 của đề bài chưa đạt (hai lỗi còn);
  - giai đoạn đòi chủ repo duyệt từng điều khai miễn của một món, mà 82 điều ở đây là lời đáp thay trong bản sao.

  Đóng hay chưa là lời chủ repo.

- Sổ giới hạn **mới**, từ lượt thử:
  - `conform-exempts-mandatory-rules`;
  - `conform-runs-no-accessibility-check`;
  - `exemptions-never-reach-the-owner`;
  - `find-reads-taken-down-files-as-own`;
  - `words-check-reads-type-parameters`.
- Sổ giới hạn **mới**, từ lần soát PR 129 và PR 130:
  - `widen-records-an-earlier-hand-edit`;
  - `widen-takes-an-older-outside-block`;
  - `before-name-lets-a-new-file-through`.
- `plug-measure-counts-the-first-use` vẫn mở: lượt này đo lần dùng thứ hai một lần, các thước của phép đo phích chưa
  đổi.
