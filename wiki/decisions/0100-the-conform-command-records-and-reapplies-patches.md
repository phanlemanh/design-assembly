---
type: decision
title: "Lệnh conform: bản vá ghi lại, áp lại trên món mới, và luật tắt cho cả thư mục"
links:
  - wiki/specs/0015-choose-before-make-conform-before-intake.md
  - wiki/decisions/0099-an-outside-item-is-conformed-before-it-is-taken-in.md
  - wiki/decisions/0098-choose-before-make-at-the-components-socket.md
  - wiki/decisions/0096-reui-measured-at-the-components-socket.md
sources:
  - plugins/design-assembly/scripts/conform.mjs
  - plugins/design-assembly/scripts/conform-rules.mjs
  - plugins/design-assembly/scripts/intake.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/templates/tools/design-assembly/contract.mjs
  - plugins/design-assembly/references/capabilities.json
  - plugins/design-assembly/references/vocabulary.json
  - plugins/design-assembly/references/contract.md
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/conform/SKILL.md
  - plugins/design-assembly/tests/test-conform-command.mjs
  - tools/patch_ui.mjs
  - "chủ repo, 2026-11-24, gõ ở phiên điều phối: «Dựng lát 3», sau khi được báo lát này chuyển việc viết bản ghi chuẩn hoá sang máy và xử lý luật tắt cho cả thư mục"
---

# 0100 Lệnh conform: bản vá ghi lại, áp lại trên món mới, và luật tắt cho cả thư mục

## Status

Accepted, 2026-11-24. Lát 3 của đề bài [0015](../specs/0015-choose-before-make-conform-before-intake.md), mục 11.3 của
kế hoạch, dựng theo lời chủ repo («Dựng lát 3»). Plugin 0.52.0.

## Context

Lát 2 ([0099](0099-an-outside-item-is-conformed-before-it-is-taken-in.md)) dựng bản ghi chuẩn hoá, nhưng người phải
viết tay mọi mã băm, bản vá và điều miễn, và một chỗ sửa vào mã của món vẫn là sửa tay có kèm lý do. Chủ repo đã nhận ở
câu hỏi 2 của đề bài: chuẩn hoá là một lệnh riêng tên `conform`; và ở câu hỏi 4: cho vá mã nhà cung cấp chỉ bằng bản vá
ghi lại, linh kiện đơn thì bọc trước, sửa tay vẫn cấm. Sàn đã có mầm của cách này: `tools/patch_ui.mjs` vá một linh kiện
nền bằng mã, chạy lại ra cùng kết quả, và dừng khi mã gốc không còn khớp. Lát 2 cũng để lại cho lát này luật bị tắt cho
cả thư mục của món.

## Decision

1. **Lệnh `conform`**, một lệnh riêng của ổ linh kiện, ghi sổ `conform`. Mỗi lần gọi làm một việc:
   - **bắt đầu** (`--source`, `--item`, `--file`): ghi bản ghi từ các tệp như lúc lấy về, mỗi tệp một mã băm, chưa bản vá,
     chưa điều miễn;
   - **ghi một bản vá** (`--patch`, `--reason`): chỗ sửa từ tệp như lần commit gần nhất tới tệp như hiện giờ, ghi thành một
     diff trong bản ghi, kèm lý do, theo thứ tự;
   - **ghi một điều miễn** (`--exempt`, `--file`, `--reason`);
   - **áp lại trên món mới** (`--taken-down`): các bản vá của mỗi tệp được áp lại theo thứ tự, và lệnh nêu tên từng tệp
     được lấy về lại. Tệp bằng tệp lúc lấy về là món cũ lấy về lại. Tệp không bằng tệp lúc lấy về, cũng không bằng tệp sau
     khi vá, chỉ được coi là món mới khi nguồn đã được ghim lại kể từ lúc viết bản ghi (mã băm ghim trong bản ghi khác mã
     băm ghim hiện giờ); nếu không, đó là sửa tay, lệnh thoát 2, nêu tên tệp, không ghi gì. Một bản vá không còn khớp thì
     lệnh thoát 2, nêu tên bản vá, và không ghi gì (tiêu chí 7). Một tệp của món không có trên đĩa cũng dừng như vậy. Chạy
     dưới một ghim mà bản ghi chưa giữ, lệnh ghi mã băm ghim mới kể cả khi không tệp nào mới, để việc ghim lại nguồn cho món
     khác không mở đường cho một chỗ sửa tay về sau;
   - **không cờ nào**: nói bản ghi có giữ không, gồm mỗi tệp là tệp sau khi vá, các bản vá dẫn ngược về tệp như lúc lấy
     về, mọi luật bị tắt đều có điều miễn, và ghim của nguồn vẫn là ghim bản ghi giữ. Thoát 1 khi có điều chưa giữ.

   Chạy hai lần ra cùng mã băm và lần sau không ghi gì (tiêu chí 7). Lệnh không gọi mô hình, không dùng mạng, không chạy
   dòng cài; nó dùng git của máy để tạo và áp một diff, và git của repo để đọc tệp như lần commit gần nhất.

2. **Bản gốc mà bản vá áp lên là tệp như lúc lấy về**, không phải nội dung trong bản chụp đã ghim. Lệnh cài viết lại nội
   dung của bản chụp (đổi đường dẫn import), nên nội dung trong bản chụp không bằng tệp lúc lấy về; mã băm lúc lấy về nằm
   trong `taken`.
3. **Một chỗ sửa tay không bao giờ được tính là bản vá.** `conform` nói tệp nào khác tệp sau khi vá mà không bản vá nào
   ghi; `inventory` báo «modified» cho đúng tệp ấy, cho mọi tệp của món chứ không riêng tệp dòng sổ nêu (tiêu chí 8).
4. **Luật bị tắt cho cả thư mục** cần điều miễn, ở `conform` và ở `intake`: một tệp cấu hình nêu thư mục của món, gồm
   danh sách bỏ qua của bộ định dạng (`formatter-ignore`), cấu hình lint (`lint-config`, theo adapter lint) hay cấu hình
   kiểm kiểu (`typecheck-exclude`, một `tsconfig*.json`). Điều miễn ấy nêu tệp cấu hình. Cấu hình được đọc như chữ.
5. **Hai lựa chọn chủ repo đã nhận tới lát 4 giữ nguyên.**

## Đổi gì trong hợp đồng

- **Sổ `conform`**, vẫn bản 1:
  - bản ghi có thêm khoá không bắt buộc `pin_sha256`, mã băm ghim của nguồn lúc món được lấy về lần gần nhất; lệnh ghi nó
    lúc bắt đầu và mỗi lần lấy về món mới;
  - một bản vá có thêm khoá không bắt buộc `diff`;
  - một điều miễn có luật là một trong ba luật thư mục nêu tệp cấu hình, không phải tệp của món; phép kiểm hình dạng nhận
    điều ấy.
- **Bản ghi viết tay theo 0.51.0** vẫn đúng hình dạng. Lệnh nói mỗi bản vá không có `diff` không áp lại được cho tới khi
  được ghi lại bằng `--patch` (có bài kiểm trên một bản ghi như vậy).
- Không sổ nào khác đổi.

## Consequences

- Bảng năng lực: ổ linh kiện ghi thêm sổ `conform`, và có phích `conform`. Skill `conform`. Bảng từ có `conform`,
  `patch`, `exemption`, mỗi từ nói khác gì từ đã có. Phép «lõi sạch» vẫn xanh: tên tệp cấu hình lint và dạng chú thích
  tắt luật lấy từ adapter lint.
- Sổ giới hạn:
  - **đóng hai dòng**: sửa mã ngoài không bằng bản vá ghi lại; một dòng sổ cho nhiều tệp;
  - **thu hẹp hai dòng**: món không chuẩn hoá trước khi nhập (còn: `intake` không chạy cổng với món bên trong); khối
    ngoài nhập vào khi còn đỏ (còn: cấu hình đọc như chữ, và công cụ riêng của repo không được thấy);
  - **bốn dòng mới**: lệnh dùng git của máy; tệp của món là tệp người nêu lúc bắt đầu; bản vá cũ bỏ đi bằng tay (kể cả
    bản vá ở ngay đầu một tệp ngắn); lấy về món mới tin vào ghim của nguồn: từ lúc nguồn được ghim lại tới lúc `--taken-down`
    ghi ghim mới cho món này, một chỗ sửa tay được nhận cùng món mới, dù lệnh nêu tên từng tệp; ghim lại nguồn cho một món
    mở khe ấy cho mọi món khác của nguồn, phép kiểm của từng bản ghi nói ghim đã cũ, và `--taken-down` chạy khi không có gì
    mới thì đóng khe; bản ghi không có mã băm ghim thì không nhận món mới: bỏ bản ghi bằng tay, lấy món về, bắt đầu lại và
    ghi lại từng bản vá.
- Plugin lên 0.52.0.
- Kế hoạch: mục 11.3 xong.
