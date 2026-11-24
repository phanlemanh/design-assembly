---
type: decision
title: "Luật bắt buộc không bao giờ được khai miễn, và danh sách khai miễn tới tay chủ repo trước khi món vào kho"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0104-filters-taken-in-through-conform-measured.md
  - wiki/decisions/0099-an-outside-item-is-conformed-before-it-is-taken-in.md
  - wiki/decisions/0100-the-conform-command-records-and-reapplies-patches.md
sources:
  - plugins/design-assembly/scripts/conform-rules.mjs
  - plugins/design-assembly/scripts/conform.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/decide.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/eslint.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-mandatory-rules.mjs
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Dựng 11.8»"
---

# 0105 Luật bắt buộc không bao giờ được khai miễn, và danh sách khai miễn tới tay chủ repo trước khi món vào kho

## Status

Accepted, 2026-11-24. Mục 11.8 của kế hoạch, tiêu chí 22 tới 25 của phần bổ sung đề bài
[0015](../specs/0015-choose-before-make-conform-before-intake.md), dựng theo lời chủ repo («Dựng 11.8»). Plugin 0.56.0.

## Context

Lượt thử lấy lại `filters` ([0104](0104-filters-taken-in-through-conform-measured.md)) nhận 82 điều khai miễn. Trong
đó 25 điều là luật mà sổ quyết định của repo giữ. Lý do của cả 82 điều chưa tới tay chủ repo. Phần bổ sung, đã duyệt
cùng tám khuyến nghị, nói luật nào bắt buộc, từ chối ở đâu, và danh sách khai miễn đến tờ quyết định thế nào.

## Decision

1. **Một luật là bắt buộc khi sổ của repo giữ nó.**
   - Đó là một dòng của sổ quyết định mà phép kiểm là `eslint:<rule>` (tiền tố lấy từ adapter của lint), hoặc một phép
     kiểm kiểu `lint` của dữ liệu công cụ.
   - Plugin không viết tên luật, thư viện hay sản phẩm nào.
   - Repo không có dòng nào như vậy thì không có luật bắt buộc (dòng giới hạn `no-mandatory-rule-declared`).
2. **`conform --exempt` từ chối luật bắt buộc, và nêu dòng giữ nó.** Nó cũng từ chối `*` (mọi luật), và một cấu hình
   lint hay tệp bỏ qua đặt thư mục của món ra ngoài mọi luật.
3. **`intake --file` từ chối mọi cách món tắt luật bắt buộc, dù bản ghi có khai miễn:**
   - chú thích cho dòng, cho dòng sau, hay cho cả tệp;
   - chú thích không nêu luật nào;
   - cấu hình lint hay tệp bỏ qua của lint (`.eslintignore`, nay adapter biết tới) nêu thư mục của món;
   - và chính điều khai miễn trong bản ghi.

   Thư mục riêng của thư viện nền, như thiết lập của thư viện nêu, là của repo, không tính cho món (dòng giới hạn
   `base-library-folder-is-the-repositorys`).

4. **Vẫn khai miễn được:** kiểm kiểu chặt (`@ts-nocheck` nữa), và luật mà không dòng nào giữ.
5. **Bản ghi viết trước:**
   - cổng vẫn xanh;
   - lần kiểm thường của `conform` nêu từng điều khai miễn luật bắt buộc;
   - `inventory` có loại phát hiện mới `exempts-mandatory`;
   - mọi lần ghi bản ghi (`--patch`, `--exempt`, `--taken-down`) bị từ chối cho tới khi điều ấy được lấy ra.
6. **Danh sách khai miễn tới tay chủ repo** (tiêu chí 25, trong mục 11.8 theo khuyến nghị 5):
   - Trước khi `intake` ghi dòng sổ cho một món của nguồn ngoài có khai miễn, danh sách lên hàng chờ thành một câu hỏi,
     `exemptions-<need>`, mỗi điều có luật, tệp và lý do.
   - Dòng chỉ được ghi khi chủ repo giữ đúng danh sách ấy. Bác thì không ghi gì. Danh sách đổi sau lời đáp thì hỏi lại
     (`exemptions-<need>-2`).
   - Tờ quyết định xếp danh sách theo luật và lý do, các tệp ở dưới: 57 điều của lượt thử thành 28 dòng.

## Sửa sau soát PR 134

Theo lời chủ repo («Gửi sang sửa»):

- **Chú thích đặt cấp độ luật trong tệp.** Lint còn nhận `/* eslint <rule>: "off" */`: cấp độ viết bằng chữ hay số,
  đứng riêng hay đứng đầu một mảng. Phần đọc cũ không thấy dạng này, nên một dòng chú thích như vậy cho món thoát mọi
  luật bắt buộc mà không cần điều khai miễn nào.
  - Adapter của lint nay đọc dạng ấy (`rulesLowered`). Danh sách loại chú thích lấy từ chính mã của eslint 10 đã cài:
    `eslint`, `eslint-disable`, `eslint-enable`, `eslint-disable-line`, `eslint-disable-next-line`, `exported`,
    `global`, `globals`; còn `eslint-env` thì nay bị báo lỗi.
  - Hạ một luật xuống mức cảnh báo cũng tính là tắt, vì cảnh báo không làm lint của repo này đỏ.
  - Luật bắt buộc bị từ chối. Luật khác cần điều khai miễn như mọi cách tắt khác.
- **Câu hỏi cũ về khai miễn không còn chờ.** Câu hỏi mới về danh sách khai miễn của một nhu cầu ghi `replaces` cho các
  câu cũ chưa được đáp. Khi dòng sổ đã ghi thì không câu nào về nhu cầu ấy còn chờ. Quay lại đúng danh sách đã giữ
  trước đó vẫn hỏi lại, vì lời đáp là cho một danh sách ở một lúc.
- **`conform --unexempt RULE --file PATH`** lấy một điều khai miễn ra khỏi bản ghi, và không bao giờ bị từ chối vì
  luật bắt buộc. Đây là lối ra, thay cho sửa tay tệp JSON.
- **Lần kiểm thường nói đúng việc phải làm.** Với dòng chú thích tắt một luật bắt buộc, nó nói luật ấy bắt buộc và phải
  vá; không còn khuyên thêm điều khai miễn.
- **Tờ quyết định ngắt dòng** danh sách tệp và dòng lý do ở 100 ký tự, không cắt bớt, nên không tệp nào bị giấu.

## Đổi gì trong hợp đồng

- **Hàng chờ:** khoá mới `exemptions` (danh sách có `rule`, `file`, `reason`), và loại mục mới `exemptions:<need>`.
  Câu hỏi viết trước đọc như trước.
- Sổ chuẩn hoá, sổ quyết định, sổ nhập kho và sổ nguồn ngoài không đổi hình dạng.

## Consequences

- Trên bản sao của lượt thử, lên 0.56.0:
  - cổng xanh;
  - lần kiểm thường của `conform` nêu đúng 25 điều (`no-restricted-syntax` 7, `no-arbitrary-values` 7,
    `require-static-classes` 5, `no-restyle` 3, `no-inline-styles` 3);
  - `inventory` nêu món ấy;
  - `--taken-down` bị từ chối;
  - `intake --file` từ chối trước khi có dòng.
- Bỏ 25 điều ấy thì `intake` hỏi chủ repo về 57 điều còn lại.
- Sổ giới hạn:
  - **đóng** `conform-exempts-mandatory-rules` và `exemptions-never-reach-the-owner`;
  - **mới** `no-mandatory-rule-declared` và `base-library-folder-is-the-repositorys`.
- Lần chạy lại lượt thử (tiêu chí 26) phải vá 25 chỗ thay vì khai miễn.
- Plugin lên 0.56.0. Kế hoạch: mục 11.8 xong; mục 11.7 chưa dựng.
