---
type: decision
title: "Kho tốt dần: change mở rộng một khối cho mọi màn dùng nó, inventory nêu từng món đứng sau bản ghim"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0099-an-outside-item-is-conformed-before-it-is-taken-in.md
  - wiki/decisions/0100-the-conform-command-records-and-reapplies-patches.md
  - wiki/decisions/0102-the-gate-holds-the-choice.md
sources:
  - plugins/design-assembly/scripts/change.mjs
  - plugins/design-assembly/scripts/intake-write.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/conform.mjs
  - plugins/design-assembly/templates/tools/design-assembly/sources-ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/change/SKILL.md
  - plugins/design-assembly/skills/inventory/SKILL.md
  - plugins/design-assembly/tests/test-store-improves.mjs
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Dựng lát 6», cho phần dựng, không cho lượt thử"
---

# 0103 Kho tốt dần: change mở rộng một khối cho mọi màn dùng nó, inventory nêu từng món đứng sau bản ghim

## Status

Accepted, 2026-11-24, cho phần dựng của lát 6 đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md),
mục 11.6 của kế hoạch, theo lời chủ repo («Dựng lát 6»). Plugin 0.55.0. Lượt thử lấy lại `filters` (tiêu chí 14, 15)
chưa chạy: nó tốn token và cần lời riêng. Mục 11.6 vì vậy ở `doing`.

## Context

Vế 3 của đề bài: kho tốt dần, một nhu cầu một lời giải. Hôm nay `change` chỉ cho nghỉ hoặc gộp một khối, nên một khối
thiếu gì thì người dựng làm khối thứ hai cạnh nó (dòng giới hạn `store-block-cannot-be-extended`). Và `inventory` so
món ngoài với bản ghim bằng ngày hay bản ghi trên dòng sổ, nên một lần ghim lại cùng ngày không được thấy, còn món mới
lấy về mà chưa nhập kho thì không được so.

## Decision

1. **`change <need> --widen --why SENTENCE`.**
   - Nói trước khối chạm màn nào, khung nào, linh kiện nào và dòng import nào, cùng cách đọc của lệnh cho nghỉ khối.
   - Đặt một câu hỏi lên hàng chờ. Trước lời đáp, không gì ghi vào sổ.
   - Khi chủ repo giữ câu hỏi, người dựng sửa tệp của khối rồi gọi lại. Lệnh ghi `changed` vào dòng sổ của khối: ngày và
     tên người đáp, lý do, và mã băm của tệp sau khi mở rộng.
   - Tệp còn như lần ghi cuối thì chưa có gì để ghi, và lệnh nói phải sửa tệp nào.
   - Một khối một dòng, mở rộng cho mọi màn dùng nó, không tách khối cho một màn. Lần mở rộng sau hỏi một câu mới và
     thay `changed` cũ.
2. **Từ chối:**
   - món mà một nguồn ngoài giữ qua bản ghi chuẩn hoá: sửa nó là một bản vá ghi lại (`conform --patch`);
   - khối sổ không giữ;
   - nhu cầu có hai khối, đã từ chối từ trước;
   - khối đã cho nghỉ: không còn gì để đổi.
3. **`inventory` giữ tệp theo lần mở rộng.** Khối có `changed.sha256` thì tệp phải đúng mã băm ấy. Sửa sau đó mà không
   lần mở rộng nào ghi thì là «modified». `changed` chỉ có lý do thì như trước.
4. **Món đứng sau bản ghim, theo bản ghi chuẩn hoá.**
   - Mỗi bản ghi giữ mã băm của bản ghim lúc viết (lát 3). `inventory` so mã băm ấy với mã băm bản ghim của nguồn hôm
     nay, cho từng món, đã nhập kho hay mới lấy về. Ghim lại cùng ngày cũng thấy.
   - Không mở kết nối nào: chỉ đọc tệp nguồn, tệp ghim và bản ghi.
   - Bản ghi viết trước khi giữ mã băm ghim, hay nguồn không có ghim, thì không so được; `inventory` nói ở phần «không
     nhìn thấy».
   - Khối ngoài không có bản ghi thì so như trước.
   - Hàm băm ghim nay ở một chỗ, `pinSha256` trong `sources-ledger.mjs`, cho cả `conform` và `inventory`.

## Đổi gì trong hợp đồng

- **Sổ nhập kho**, vẫn bản 1: `changed` thêm hai khoá không bắt buộc, `by` và `sha256`. Dòng viết trước đọc như trước.
- Không sổ nào khác đổi. Cổng không thêm phép kiểm.

## Lượt thử chưa chạy (tiêu chí 14, 15)

Phần dựng đáp tiêu chí 12 và 13. Tiêu chí 14 (lấy lại `filters` qua lối mới: cổng xanh, không luật tắt ngoài danh
sách khai miễn, hai lỗi đã lọt không còn, nêu chi phí chuẩn hoá) và 15 (lần dùng thứ hai) chờ lượt thử. Cách chạy, chỗ
ghi và ước tính nằm ở mô tả của PR, để chủ repo cho hay không cho.

## Consequences

- Sổ giới hạn:
  - **đóng** `store-block-cannot-be-extended`;
  - **mới** `widen-keeps-the-latest-change`: dòng giữ lần mở rộng cuối, git giữ các lần trước;
  - **mới** `behind-the-pin-by-record-only`: khối ngoài không bản ghi thì vẫn so bằng ngày hay bản ghi.
- `plug-measure-counts-the-first-use` vẫn mở, chờ tiêu chí 15.
- Plugin lên 0.55.0. Kế hoạch: mục 11.6 `doing`; giai đoạn 11 vẫn mở.
