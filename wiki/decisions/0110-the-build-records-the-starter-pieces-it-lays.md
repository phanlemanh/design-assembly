---
type: decision
title: "Bước dựng ghi dòng sổ nhập kho cho món của bộ khởi đầu nó đặt"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/decisions/0102-the-gate-holds-the-choice.md
  - wiki/decisions/0085-adopt-starter-lays-the-ledgers-a-repository-has-from-birth.md
  - wiki/decisions/0087-adopt-starter-lays-the-ledgers-where-a-repository-has-values-of-its-own.md
sources:
  - plugins/design-assembly/scripts/starter-intake.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-starter-intake.mjs
  - "chủ repo, 2026-11-25, gõ ở phiên điều phối: «Đi tiếp, sửa riêng»"
---

# 0110 Bước dựng ghi dòng sổ nhập kho cho món của bộ khởi đầu nó đặt

## Status

Accepted, 2026-11-25, plugin 0.59.0. Lỗi do lượt thử 19 của mục 10.4 tìm ra. Chủ repo chọn sửa bằng một PR riêng trong
lúc lượt thử chạy tiếp («Đi tiếp, sửa riêng»), đáp câu «Đi tiếp lượt này và sửa lỗi bằng PR riêng, hay dừng để sửa trước
rồi chạy lại?».

## Context

- Trên một repo chưa có hệ thiết kế, bước dựng của `new` đặt các món của bộ khởi đầu: `HeldLabel`, `WithRecord`,
  `TableActions`, `RowActions`, `useList`, và `AppFrame`, `notifyDone` khi repo có toast. Bước ấy không ghi dòng sổ nhập
  kho nào.
- Luật chọn trước, tạo sau của cổng ([0102](0102-the-gate-holds-the-choice.md)) đọc hai tệp ngoài thư mục của thư viện
  nền như nhánh tự tạo mà không có dòng sổ. Nên cổng của một repo mới đỏ ngay sau bước dựng.
- `find` gọi hai món ấy là của chính repo (`source: own`). Tác tử dẫn dắt của lượt thử ghi chúng là tự làm (`by-hand`),
  sai nguồn.
- `adopt --starter` ([0085](0085-adopt-starter-lays-the-ledgers-a-repository-has-from-birth.md),
  [0087](0087-adopt-starter-lays-the-ledgers-where-a-repository-has-values-of-its-own.md)) chỉ đặt sổ, không đặt mã.
  `upgrade` không đặt món nào của bộ khởi đầu. `intake` đã tự ghi dòng sổ khi nó chép một món. Nên lỗ hổng chỉ có ở một
  lộ trình: bước dựng, chạy qua `new` hay qua `make design-apply`.

## Decision

1. **Sửa ở bước dựng, không ở phép kiểm.** Lúc đặt một món, bước dựng ghi luôn dòng sổ như `intake` ghi:
   - `source` và `from` là `starter`, `pin` là `design-assembly <bản>`;
   - `taken` là mã băm của tệp như đã đặt;
   - `approved` là ngày dựng, không nêu tên ai.

   Vì sao không dạy phép kiểm và `find` nhận ra tệp bộ khởi đầu đặt:
   - cổng không đọc được mẫu của plugin trên đĩa của repo;
   - tệp `record-panel.tsx` mang dòng cách mở do bản thiết kế quyết, nên không có một mã băm chung;
   - một dòng sổ cho cả ba nơi đọc cùng một nguồn thật: cổng, `find` (nay nói «from: starter, pinned design-assembly
     0.59.0») và `inventory`.

2. **Không câu hỏi nào thêm.** Lời của chủ repo cho dựng là lời duyệt, nên dòng không nêu tên người. Không câu nào lên
   hàng chờ vì các món ấy.
3. **Repo đã dựng trước bản sửa** (như repo của lượt thử 19): lần dựng sau ghi dòng cho món còn đúng như đã đặt mà nhánh
   thêm. Không ghi cho:
   - tệp repo đã sửa: cổng vẫn nêu nó như mọi tệp nhánh thêm;
   - món main đã có: repo giữ nguyên như đang đứng, nên lời của `find` và `inventory` không đổi;
   - món mà một dòng sổ (theo tệp hay nhu cầu) hoặc danh sách «có từ trước» (theo tệp hay tên) đã nêu.

   Chạy trên chính repo này thì bước dựng không ghi dòng nào.

4. **Sửa sau vẫn thấy.** Dòng giữ mã băm như đã đặt, nên khi repo sửa món, `inventory` nêu «modified».
5. **Luật chọn trước của lát 5 không đổi** cho tệp người hay tác tử thêm: một linh kiện mới không dòng sổ vẫn đỏ.

## Consequences

- Trên bản chép của repo lượt thử 19, khi bỏ sổ nhập kho tác tử viết tay:
  - mã của main cho `ledger-shapes` đỏ, nêu `HeldLabel` và `WithRecord`;
  - lần dựng của 0.59.0 ghi năm dòng `source: starter`, và `ledger-shapes` xanh.
- Hợp đồng (`references/contract.md`) có thêm một đoạn nói dòng của bước dựng. Sổ nhập kho không đổi hình dạng: mọi khoá
  đã có. **Cần người soát**, vì đây là điều hợp đồng nói ai ghi gì.
- Sổ giới hạn:
  - mở rồi đóng `starter-pieces-laid-with-no-intake-row`;
  - mở `record-panel-layout-line-reads-as-modified`: bước dựng viết lại dòng cách mở của `record-panel.tsx` mỗi lần
    chạy, nên đổi cách mở thì `inventory` nêu tệp ấy «modified» dù không ai sửa tay;
  - mở `starter-pieces-recorded-by-hand-stay`: dòng `by-hand` mà một tác tử đã ghi cho món của bộ khởi đầu, như ở lượt
    thử 19, không được sửa thành `starter`. Bước dựng không bao giờ ghi đè một dòng sổ.
- Plugin lên 0.59.0. Kế hoạch: bằng chứng của mục 10.4, mục vẫn đang làm.
