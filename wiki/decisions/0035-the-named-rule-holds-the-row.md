---
type: decision
title: Chỉ luật dòng sổ nêu tên mới giữ được dòng sổ ấy
links:
  - wiki/decisions/0033-re-run-the-repository-lint.md
  - docs/trials/inventory-ladder.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/eslint.mjs
  - plugins/design-assembly/tests/test-lint.mjs
  - "lượt chấm 1 của hồ sơ nghiệm thu adopt-design-assembly ở Inventory, phát hiện t3"
  - "chủ repo, 2026-11-15: «Siết, sửa AC-2»"
---

# 0035 Chỉ luật dòng sổ nêu tên mới giữ được dòng sổ ấy

## Status

Accepted. Chủ repo chọn ngày 2026-11-15 («Siết, sửa AC-2»). Thay mục 5 của
[0033](0033-re-run-the-repository-lint.md); các mục khác của 0033 giữ nguyên.

## Context

Mục 5 của 0033 cho phép: luật khác chặn được đoạn mã phạm thì quyết định vẫn tính là giữ, kèm một
câu nói vậy. Lượt thấy-đỏ khi đó tắt mọi luật đã chặn, nên nó luôn đỏ, kể cả khi luật dòng sổ nêu
tên không chặn đoạn nào.

Lượt chấm 1 của hồ sơ nghiệm thu ở Inventory cho thấy hệ quả. Trên một bản dựng tạm, tắt riêng luật
dòng sổ nêu tên của «màu là vai trò», «thang chữ» hay «khoảng cách», lệnh kiểm vẫn xanh: luật chặn
giá trị tuỳ ý chặn thay. Sổ quyết định nói «giữ bằng luật X, chạy lại ở đây», nhưng luật X có thể bị
tắt mà cổng không đỏ.

## Decision

1. **Luật nêu tên phải chặn mọi đoạn mã phạm.** Lệnh kiểm chỉ tính đoạn là bị chặn khi chính luật
   dòng sổ nêu tên báo lỗi trên nó. Luật khác cũng chặn thì không tính.
2. **Bản bị đổi tắt đúng luật đó.** Lượt thấy-đỏ chỉ tắt luật dòng sổ nêu tên, không tắt các luật
   khác đã chặn. Nhờ vậy cổng đỏ đúng lúc luật ấy bị tắt hay thôi chặn.
3. **Không qua thì vẫn là «tự khai»**, và lệnh nói rõ đoạn nào lọt, kèm tên luật không chặn nó.
4. **Repo đã nhận trước đó** có phép kiểm trỏ tới luật không gánh được quyết định: cổng của repo đỏ
   ngay khi chép bản công cụ mới vào. Phép kiểm ấy phải bỏ khỏi dữ liệu của công cụ, và dòng sổ về lại
   «tự khai». Việc này người làm, vì «nhận» không chép lại công cụ ở repo đã nhận (giới hạn
   `adopt-does-not-refresh-tool`).

## Consequences

- **Kho này:** «màu là vai trò» về lại «tự khai», vì luật nó nêu tên chỉ chặn bảng màu. Quyết định
  máy giữ 37 xuống 36, lệnh kiểm 43 xuống 42.
- **Inventory:** «khoảng cách» về lại «tự khai», vì luật nó nêu tên chỉ bắt bậc lệch thang. «Màu»
  và «thang chữ» vẫn được giữ, vì luật nêu tên có chặn mọi đoạn. Chín phép kiểm lint còn tám, mười
  tám quyết định giữ còn mười bảy; tiêu chí AC-2 của hồ sơ nghiệm thu đổi theo.
- Muốn giữ lại các dòng đó, repo sửa dòng sổ cho trỏ tới luật thật sự chặn, hoặc mở rộng luật nó nêu
  tên. Đó là lựa chọn của chủ repo; plugin không viết lại dòng sổ.
- Ghi ở sổ giới hạn, dòng `lint-held-by-another-rule`, đã đóng.
