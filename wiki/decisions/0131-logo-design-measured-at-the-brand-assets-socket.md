---
type: decision
title: "Skill logo-design đo ở ổ tài sản thương hiệu theo bốn thước, hai ca, dừng ở bước chạy thử"
links:
  - wiki/specs/0017-brand-assets-the-logo-and-the-icon-set.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0127-the-mark-plug-leaves-a-package-the-plugin-reads.md
  - wiki/decisions/0128-the-owner-chooses-a-mark-among-candidates.md
  - wiki/decisions/0097-frontend-design-measured-at-the-screen-build-socket.md
sources:
  - docs/trials/logo-design-measured-at-brand-assets.md
  - docs/trials/briefs/mark.md
  - docs/trials/count-tokens.mjs
  - plugins/design-assembly/references/plugs/logo-design.json
  - plugins/design-assembly/references/limits.json
  - "chủ repo, 2026-11-27: «Chạy cả hai ca», đáp câu «Anh chọn «Chạy cả hai ca» (khoảng 1,0 triệu, trần 1,3 triệu) hay «Một ca trước» (ca B, khoảng 550 nghìn, trần 700 nghìn)?»"
  - "chủ repo, 2026-11-27: «Dừng ở đây», đáp câu cho lượt đo kết thúc ở bước chạy thử khi chưa có câu quyền dùng dấu"
---

# 0131 Skill logo-design đo ở ổ tài sản thương hiệu theo bốn thước

## Status

Proposed, 2026-11-27. Lát 2 của mục 12.3, theo đề bài
[0017](../specs/0017-brand-assets-the-logo-and-the-icon-set.md) (tiêu chí 19 và 22), chạy theo lời chủ repo «Chạy cả hai
ca». Lượt đo dừng ở bước chạy thử theo lời chủ repo «Dừng ở đây». Mục 12.3 chưa xong, giai đoạn 12 không đóng.
`ontology/` không đổi; hợp đồng sổ không đổi.

## Context

Lát 1 ([0127](0127-the-mark-plug-leaves-a-package-the-plugin-reads.md)) cắm phích `logo-design` ở ổ tài sản thương hiệu
với chữ «chưa đo»: `plugs` liệt kê nó mà không bao giờ hỏi chủ repo chọn. Skill được làm lại ở kho của nó cho khớp tờ kê
`LOGO_PACKAGE` (bản 0.3.0). Luật chọn ai làm của [0008](../specs/0008-capabilities-sockets-and-plugs.md) đòi số đo theo
bốn thước, trên bản sao bỏ đi, bằng đề chuẩn. Ổ này chưa có đề chuẩn.

## Decision

1. **Đề chuẩn của ổ** là [`docs/trials/briefs/mark.md`](../../docs/trials/briefs/mark.md): một nhu cầu (sản phẩm có tên
   mà chưa có dấu), hai ca, không gợi cách làm, tên sản phẩm bịa. Đổi một chữ thì cắt chuỗi số đo. Ghi chú cho lần đo
   sau: tên sản phẩm của đề nên là tiếng Anh hoặc không dấu, vì chủ repo muốn chữ trong logo như vậy; lần này đề giữ
   nguyên như lúc tác tử nhận.
2. **Số đo** ([bản ghi](../../docs/trials/logo-design-measured-at-brand-assets.md)):

   | Thước                 | Ca A: có bộ biểu tượng, chưa có dấu                                                                                                                                                  | Ca B: chưa có gì                                                       | Sàn của plugin (dấu là chữ) |
   | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | --------------------------- |
   | 1. Giữ được không     | Gói có tờ kê; `verify` 0; `logo-source --package --dry-run` khớp mọi mã băm, đọc người chọn từ hàng chờ; cổng xanh trước khi ghi. Dòng dấu, giấy phép và cổng sau khi ghi: chưa thấy | Như ca A; bộ biểu tượng có dòng ghim, chưa có giấy phép                | Không tệp nào để giữ        |
   | 2. Phải đoán mấy chỗ  | 10: 2 vào hàng chờ, 8 lặng lẽ                                                                                                                                                        | 11: 3 vào hàng chờ, 8 lặng lẽ                                          | 0                           |
   | … quyết thay chủ repo | 0 (đọc chặt: 1, dấu nhỏ của biểu tượng trang chủ repo không thấy)                                                                                                                    | 0 (đọc chặt: 1, dòng bộ biểu tượng ghi theo khuyến nghị trước lời đáp) | 0                           |
   | 3. Chạy được ở đâu    | Trên máy, không mạng, không tài khoản, không khoá: Python 3, cairo; chữ đi kèm dấu cần họ chữ tiêu đề cài trên máy, và tên bản cài phải khớp tên trong sổ                            | như ca A                                                               | Mọi nơi                     |
   | 4. Tốn bao nhiêu      | 289 898 token                                                                                                                                                                        | 308 442 token                                                          | 0                           |

   Cả lượt, tính cả phiên điều phối: 1 023 545 tới lúc viết bản ghi token, trần 1,3 triệu.

3. **Không phải một lượt ngồi.** Chủ repo đáp nhiều vòng: chọn dấu, chữ và bộ biểu tượng; cho cài một họ chữ; đặt tên
   họ chữ vì skill không nhận tên bản cài; đặt chữ của logo bằng tiếng Anh sau khi gói đã dựng. Câu quyền dùng dấu được
   hỏi nhiều lần và không được viết; lượt đo dừng ở bước chạy thử. Đó là một điểm vướng của lối giao gói, ghi ở dòng
   `logo-licence-sentence-stalls-the-row`.
4. **Tệp phích không đổi:** không có mục `measured`, vì thước 1 chưa thấy dòng được giữ và cổng sau khi ghi. `plugs` vẫn
   không hỏi chủ repo chọn phích này. Dòng `logo-design-plug-unmeasured` vẫn mở, câu của nó nói phần đã đo và phần chưa.
5. **Khuyến nghị của chủ repo ở ổ này không tự đổi** (tiêu chí 19). Số đo thành câu hỏi cho chủ repo, nêu ở PR: sàn
   thắng ở ba thước vì nó không vẽ gì, còn phích là bên duy nhất để lại một dấu; chọn thước nào nặng hơn là lời của anh.
6. **Bộ máy dựng hình** của skill đến từ một tệp nén không có kho gốc; giấy phép chưa rõ. Chủ repo xác nhận trước khi
   phát hành phích; điều này không chặn lượt đo.

## Consequences

- Tám dòng giới hạn mới, mở ngày 2026-11-27: `logo-plug-typeface-name-not-matched`,
  `logo-plug-wordmark-language-unasked`, `logo-plug-small-mark-unseen`, `logo-package-unrecorded-unseen`,
  `logo-licence-sentence-stalls-the-row`, `logo-package-formatter-collides`, `decide-ask-says-red-on-the-main-branch`,
  `status-next-names-new-for-a-licence`. Không dòng nào đóng.
- Tiêu chí 19 đạt một phần: hai ca chạy theo đề chuẩn, số đo ghi ở đây, khuyến nghị không đổi; thước 1 dừng ở bước
  chạy thử. Tiêu chí 22: mỗi điều lượt này không thấy có một dòng. Dòng «xong khi» thứ hai của giai đoạn 12 chưa đạt:
  ca B để lại một bộ biểu tượng có dòng ghim và một dấu chủ repo chọn, với 0 lần quyết thay theo cách đếm, nhưng không
  trong một lượt ngồi, và dòng dấu không được viết.
- Lượt đo sau cần: câu quyền dùng dấu trong tay trước khi bắt đầu, hoặc một cách hỏi khác; tên sản phẩm không dấu ở đề;
  họ chữ tiêu đề cài trên máy dưới đúng tên sổ ghi, hoặc một bản skill nối được hai tên.
- Điều của kho skill, không ghi ở sổ của plugin: bán kính đọc khoá `radius.md` thay vì bán kính gốc của repo; mã băm
  đổi theo ngày dựng; bản dựng trong repo cần đường dẫn tới skill.
