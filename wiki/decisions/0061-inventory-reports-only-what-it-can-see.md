---
type: decision
title: "Lệnh inventory kiểm kê kho, và chỉ báo điều nó thấy được"
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/decisions/0060-find-searches-the-store-nearest-first.md
  - wiki/decisions/0058-the-audit-script-takes-its-command-name.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
sources:
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/store.mjs
  - plugins/design-assembly/templates/tools/design-assembly/affected.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/vite.mjs
  - plugins/design-assembly/skills/inventory/SKILL.md
  - plugins/design-assembly/tests/test-inventory.mjs
  - plugins/design-assembly/tests/test-inventory-findings.mjs
  - plugins/design-assembly/tests/helpers/store-repo.mjs
  - docs/trials/reusable-store-on-copies.md
  - "chủ repo, 2026-11-19: «Làm 3.4»; cho sao chép ba repo để đo: «Cho cả ba»"
---

# 0061 Lệnh inventory kiểm kê kho, và chỉ báo điều nó thấy được

## Status

Accepted, 2026-11-19. Phần hai của mục 3.4 (phần một là quyết định 0058), theo phần B2 và C của đề bài 0006 mà chủ
repo đã duyệt. Máy chọn cách làm trong khuôn đề bài; chỗ lệch và chỗ thêm nằm cuối mục Decision.

## Context

`find` trả lời «kho có thứ này chưa». Còn thiếu câu hỏi ngược: kho đang giữ gì, và có đáng tin không. Có thứ không màn
nào dùng, có thứ mã dùng mà sổ không ghi, có thứ lấy hai lần, có khối đã lệch bản nguồn hoặc bị sửa mà không ghi lý do.
Đề bài 0006 gọi đó là sáu loại phát hiện. Dòng «xong khi» thứ hai của giai đoạn 3 đòi lệnh báo đủ sáu loại trên repo thử,
và không báo gì trên repo lành.

## Decision

1. **Một lệnh chỉ đọc, `scripts/inventory.mjs`, theo hợp đồng lệnh chung.**
   - Cờ: `--store repo|starter|external|all`, `--kind`, `--strict`, `--target`, `--json`, `--out`.
   - Mã thoát: 0; với `--strict`, 1 khi có phát hiện; 2 khi gọi sai hoặc repo không đọc được.
   - Không mạng, không tiến trình con, không ghi gì ngoài thư mục `--out`.
   - Skill `inventory` gọi nó. Tài liệu là «Inventory report», `inventory-report.html`.
2. **Ra máy:**
   - `stores[]`: đếm theo kho và loại, `repo`, `starter`, `external` (mỗi nguồn một dòng).
   - `items[]`: mỗi khối của sổ nhập kho, rồi mỗi linh kiện mà tệp không phải tệp của một khối. Mỗi mục có tệp, nguồn,
     màn dùng, khung có dùng không (`frame`), và trạng thái: `in-use`, `unused`, `retired`, hoặc `retired-in-use`.
   - `findings[]`: mỗi phát hiện kèm các mảnh nó nói tới và bằng chứng.
   - `blind[]`: những gì không xét được, và vì sao.
3. **Bộ đọc chung, `scripts/store.mjs`.** `find` và `inventory` đọc dữ liệu công cụ, sổ nhập kho và linh kiện qua cùng
   một chỗ. Một khối, một tệp, một linh kiện vì vậy mang cùng nghĩa với cả hai lệnh, và `change` (3.5) sẽ đọc như thế.
   `find` chỉ đổi chỗ import; 24 bài kiểm của nó giữ hành vi.
4. **Khung ứng dụng là một bên dùng.**
   - Bộ chuyển nền dựng `vite` có thêm `entries(root)`: các module mà `index.html` tải.
   - `screensOf` trả thêm `frame`, gồm các tệp vào ấy và mọi thứ chúng nhập, cùng `routed` khi repo xếp màn theo thư mục.
   - Ở repo xếp màn theo thư mục, khung là các tệp máy chủ tự chạy, như `affected` đã đọc.
5. **Sáu phát hiện, mỗi loại một luật đo được:**
   - `unused`: khối chưa nghỉ hoặc linh kiện riêng mà tệp không màn nào, cả khung, với tới. Linh kiện của thư viện chỉ
     được đếm.
   - `unrecorded`: linh kiện riêng có màn hoặc khung với tới, sổ không có khối cho tệp ấy, và `before` không kê nó (theo
     tệp hoặc theo tên).
   - `duplicate`: các tệp nối với nhau vì ba lý do. Hai khối cùng một mục của cùng một nguồn. Hai tệp giống nhau từng
     byte. Hai tệp riêng xuất cùng một tên. Mỗi nhóm tệp nối với nhau là một phát hiện.
   - `outdated`: khối lấy từ nguồn ngoài mà `pin` khác bản ghim hiện tại. Nhóm theo nguồn: một nguồn ghim lại là một
     phát hiện.
   - `modified`: tệp khối khác hash ở `taken`, hoặc, với khối của bộ khởi đầu, khác tệp mẫu của bản plugin đang cài; và
     khối không có `changed`.
   - `promote`: một tên xuất có tên viết hoa (không phải `export default`) trong tệp trang của một màn, mà màn khác nhập.
6. **Không báo điều không thấy.**
   - Không có sổ màn: không báo `unused`, `unrecorded`, `promote`.
   - Không tìm được tệp vào của khung, hoặc có một `import` không lần được: không báo `unused`. Một mảnh chỉ khung hoặc
     chỉ `import` ấy với tới sẽ bị gọi oan là không dùng.
   - Không có sổ nhập kho: không báo `unrecorded`, `duplicate`, `outdated`, `modified`.
   - Khối không có `pin`, không có `taken`, hoặc nguồn không đọc được: không báo, mà kê tên khối ở `blind[]`.
7. **Hai khối là «cùng một mục» chỉ khi danh mục của một nguồn đọc được có mục ấy.** Một chữ danh mục không có, chẳng
   hạn chữ «tạo tay» của repo chưa khai bằng `values`, không nêu mục nào. Lần đo đầu trên repo kiểm chứng đã gom chín
   khối `tao-tay` thành một nhóm `duplicate`; luật này bỏ nhóm sai ấy, và có bài kiểm.
8. **Khối từ bộ khởi đầu ghi `from: starter`, và `source` là tên mục trong `references/starter.json`.** `intake` (3.3)
   sẽ ghi đúng như thế. `pin` của một khối từ nguồn ngoài khớp khi bằng bản ghim, hoặc bằng ngày lấy về của bản ghim (sổ
   thường ghi ngày).
9. **Kiểu màn chỉ được đếm** ở `stores[]`, không có trạng thái: chưa có cách đo một kiểu màn có được dùng hay không.

Chỗ thêm so với đề bài: phát hiện `outdated` nhóm theo nguồn, để «cài cả sáu cho đủ sáu mã, mỗi mã đúng một lần» đứng
được khi một nguồn ghim lại kéo theo nhiều khối. Dòng giới hạn thứ tư `inventory-unused-silenced-by-one-untraced-import`
ghi cái giá của mục 6.

Một người đọc lại độc lập không thấy lần sập nào, không thấy chỗ nào ghi ra đĩa, và không thấy `find` đổi hành vi. Họ
nêu mười chỗ cho kết quả sai hoặc dừng sai; cả mười đã sửa, mỗi chỗ kèm một bài kiểm thấy đỏ trước:

- Một màn có trong sổ mà không tìm thấy trang: không báo `unused`, và «không xét» nêu tên màn.
- Tệp chỉ có khối đã nghỉ trỏ tới không còn là bản thứ hai trong `duplicate`.
- `promote` chỉ nhận tên dạng linh kiện, kể cả `export async function`; hằng số như `PAGE_SIZE` không tính.
- Sổ nhập kho có khối không phải danh sách: không báo bốn loại cần sổ, và nói vì sao.
- Tệp khối nằm ngoài repo không bao giờ được đọc.
- Một tệp không đọc được chỉ vào «không xét»; phần còn lại của kiểm kê vẫn được đưa ra.
- `changed` viết bằng chữ cũng là lý do.
- `pin` khớp cả số bản của bản ghim.
- Tệp vào của khung bỏ qua thẻ `<script>` nằm trong chú thích, bỏ phần `?…` của địa chỉ, và không đọc nhầm `data-src`.
- Khối không tên, không nhu cầu được gọi là «(unnamed)».

## Consequences

- Dòng «xong khi» thứ hai của giai đoạn 3 có lệnh chứng:
  - `node --test plugins/design-assembly/tests/test-inventory-findings.mjs`: repo lành không báo gì; mỗi chỗ cài làm hiện
    đúng một mã; gỡ thì mất; cài cả sáu cho đủ sáu mã.
  - `node plugins/design-assembly/scripts/inventory.mjs --target . --strict` thoát 0 trên ứng dụng mẫu.
- Bốn dòng giới hạn mới ở vùng `inventory`:
  - `inventory-duplicates-by-name-and-source-only`;
  - `inventory-promotion-within-one-repository`;
  - `modified-needs-the-hash-taken-at-intake`;
  - `inventory-unused-silenced-by-one-untraced-import`.
    `audit-workspace-reads-top-src-only` nay nói cả `inventory`.
- `scripts/inventory.mjs` thôi từ chối mọi lời gọi. Ai còn gọi tên cũ để chạy `audit` nhận một báo cáo khác. README nói
  điều đó, như quyết định 0058 đã báo trước.
- Repo kiểm chứng, đo trên bản sao, có 12 linh kiện các màn dùng mà sổ không ghi, và một cặp khối ghi cùng một mục của
  `reui`. Các khối của nó chưa có `pin` và `taken`. Sửa ở repo ấy là việc của chủ repo, chỉ khi chủ repo cho phép.
- Bộ chuyển nền dựng và `affected.mjs` nằm trong công cụ chép vào repo, nên cây công cụ đổi; plugin lên 0.11.0.
