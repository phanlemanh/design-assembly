---
type: decision
title: "Lối đặt sổ không hỏi ai vẫn đặt bộ sổ trên repo có giá trị của riêng nó, và không ghi giá trị nào của repo ấy là của sàn"
links:
  - wiki/decisions/0085-adopt-starter-lays-the-ledgers-a-repository-has-from-birth.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/specs/0013-the-two-neighbours-call-and-read.md
sources:
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-starter.mjs
  - "repo-standards, chỉ đọc, nhánh claude/call-design-assembly-4e6e87 ở 2bf508a, ngày 2026-11-22: một repo bỏ đi sinh bằng `apply.py --preset react-vite --with design --var brand_primary=#0246ff`; stylesheet của nó mang `--primary: #0246ff`"
  - "chủ repo, 2026-11-22: «Sửa ở plugin», đáp câu «Sửa lối đặt sổ của plugin để repo có màu thương hiệu cũng nhận đủ bộ sổ?»"
---

# 0087 Lối đặt sổ trên repo có giá trị của riêng nó

## Status

Đã nhận, 2026-11-22. Thay lời từ chối ở điểm 1 của quyết định
[0085](0085-adopt-starter-lays-the-ledgers-a-repository-has-from-birth.md); phần còn lại của 0085 vẫn đúng. Thuộc mục
6.1, tiêu chí 1 của đề bài [0013](../specs/0013-the-two-neighbours-call-and-read.md). Chủ repo bảo sửa («Sửa ở
plugin»). Plugin 0.36.0.

## Context

Khi soát lát 3 (Repo Standards gọi plugin), một lượt chạy thật cho thấy lỗ hổng ở phía plugin.

- Repo Standards hỏi màu thương hiệu lúc tạo repo, rồi ghi màu ấy vào stylesheet làm màu chính.
- `adopt --starter` từ chối mọi repo có màu chính mang sắc riêng, thoát 2, không đặt sổ nào. Lý do của 0085: đặt sổ trên
  sàn ghi mọi giá trị là của sàn, mà màu ấy là của repo.
- Kết quả: repo sinh ra có màu thương hiệu chỉ có hai trang của sàn dưới `design/`. Dòng «xong khi» của giai đoạn 6
  («repo sinh ra có đủ bộ sổ») không đạt cho các repo ấy.
- Chỉ bỏ lời từ chối về màu thì chưa đủ. Lời từ chối thứ hai của 0085 («repo đã nhận giá trị của chính nó trước đó») sẽ
  chặn lần chạy thứ hai trên chính repo ấy, và lời gọi phải chạy lại được mà không đổi gì.

## Decision

1. **`adopt --starter` không còn từ chối vì giá trị của repo.** Nó đặt bộ sổ lúc ra đời trên mọi repo có sàn. Mã thoát 2
   chỉ còn cho lời gọi sai hoặc repo không đọc được.
2. **Một luật quyết định giá trị là của ai.** Giá trị chỉ được ghi là của sàn (`adopted_from_floor`) khi repo chưa có gì
   của riêng nó: màu chính còn là màu xám, và chưa nhận giá trị nào của chính nó.
   - Khi màu chính có sắc riêng, hoặc repo đã nhận giá trị của chính nó trước đó, không giá trị nào được ghi thêm là của
     sàn. Đây đúng là hai điều khiến lối dẫn dắt từ chối viết đè, nên một hàm (`ownValuesProblem`) trả lời cả hai nơi. Mọi giá trị là của repo, đúng như `adopt` không cờ vẫn ghi.
   - Danh sách của sàn đã có từ lần đặt sổ trước được giữ nguyên.
3. **Lối dẫn dắt không dành cho repo ấy**, như quyết định [0007](0007-adopt-existing-values.md) đã định: nó từ chối viết
   đè, trừ khi người nói `--replace`. Bước tiếp theo là `adopt`, nơi người xác nhận màu ấy có phải màu thương hiệu đã
   chốt hay không. Câu «màu gốc» nằm trên hàng chờ; không ai được đáp thay.
4. **Rộng hơn lời chủ repo đã duyệt một điểm.** Câu hỏi chỉ nói về repo có màu thương hiệu. Lời từ chối thứ hai cũng được
   bỏ, vì lý do ở mục Context. Mối lo mà nó chặn (giá trị của repo bị ghi lại thành của sàn) nay do luật ở điểm 2 giữ.
   Điểm này được nêu với chủ repo khi báo.

## Consequences

- Chạy thật trên repo do Repo Standards sinh với màu thương hiệu: lời gọi thoát 1, cổng của plugin xanh, lần chạy thứ
  hai không đổi tệp nào, `status` nêu câu «màu gốc» trên hàng chờ. Dòng của nhịp «the repository is born» nói lối dẫn
  dắt không dành cho repo ấy.
- Dòng `next:` không phân biệt hai trường hợp: sau khi đặt sổ, trên sàn xám hay trên repo có màu thương hiệu nó đều chỉ
  tới `adopt` khi còn lời chờ. Người soát độc lập chỉ ra điều này; dòng giới hạn
  `next-names-adopt-after-the-ledgers-are-laid` ghi lại.
- Lời mời đi tiếp ở phía Repo Standards không nên cố định là lối dẫn dắt: repo được tạo với màu thương hiệu thì mời
  `adopt`. Việc ấy thuộc lát 3, ở kho của Repo Standards.
- Dòng giới hạn `starter-takes-every-value-for-the-floors` được viết lại (không còn nói tới lời từ chối). Một dòng nữa
  mở, `starter-cannot-tell-the-floors-values-beside-a-brand-colour`: bên cạnh màu thương hiệu, bo góc hay thang chữ của
  sàn cũng bị ghi là của repo, và lối dẫn dắt chỉ sinh lại chúng khi người nói `--replace`, tức là bỏ luôn màu ấy.
- Bài kiểm ở `plugins/design-assembly/tests/test-starter.mjs`: hai bài về lời từ chối được thay bằng ba bài về hành vi
  mới (repo ra đời có màu thương hiệu, màu thương hiệu thêm sau khi đã đặt sổ, repo đã nhận giá trị của chính nó).
