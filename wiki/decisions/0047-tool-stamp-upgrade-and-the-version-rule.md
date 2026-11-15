---
type: decision
title: "Dấu bản công cụ, lệnh `upgrade` dừng khi mất mục hay cổng đỏ, và số bản do cổng giữ"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0040-the-plan-of-record-and-how-it-is-kept.md
  - wiki/decisions/0038-a-component-is-drawn-with-what-its-file-hands-on.md
sources:
  - plugins/design-assembly/scripts/stamp.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/skills/upgrade/SKILL.md
  - plugins/design-assembly/tests/test-upgrade.mjs
  - plugins/design-assembly/references/releases.json
  - plugins/design-assembly/references/limits.json
  - tools/plugin_version.mjs
  - tools/plugin_version_test.mjs
  - mk/plugin.mk
  - docs/plan/plan.json
---

# 0047 Dấu bản công cụ, lệnh `upgrade` dừng khi mất mục hay cổng đỏ, và số bản do cổng giữ

## Status

Máy chọn trong lúc dựng mục 1.2 và 1.3 của kế hoạch, ngày 2026-11-16; chờ chủ repo bác. Phần đề
bài 0004 đã chốt về `upgrade` (đầu vào, đầu ra, mã thoát, những gì nó ghi) thì đã được duyệt. Chín
điều ở mục Decision là điều đề bài không nói tới; điều 6 và điều 7 bỏ lại một phần đề bài có nêu, và
mỗi phần bỏ lại có một dòng sổ giới hạn.

## Context

Repo đã nhận plugin giữ một bản sao công cụ ở `tools/design-assembly/`. Khi plugin sửa công cụ, người
ta chép tay từng tệp rồi dựng hồ sơ nghiệm thu; lần gần nhất bản sửa ghi trùng làm sổ linh kiện mất
quan hệ «dựng từ» mà không ai báo trước (0036, sửa lại ở 0038). Repo không ghi mình lấy bản nào, nên
`status` chỉ so được nội dung (0041) và không nói được bản sao từ đâu ra hay đã bị sửa tay chưa (giới
hạn `status-tool-stamp-never-written`); không lệnh nào đưa công cụ mới vào (giới hạn
`adopt-does-not-refresh-tool`). Số bản của plugin đứng ở `0.0.1` từ ngày đầu, dù công cụ đã đổi nhiều
lần.

## Decision

1. **Dấu bản ở `design/tool-stamp.json`, hai khoá: `version` và `tree`.** `version` là số bản của
   plugin đã ghi công cụ; `tree` là mã cây git của `tools/design-assembly/` đúng lúc ghi, tính từ tệp
   như `git write-tree` (0041). Chỗ và hình dạng giữ đúng như `status` đã đọc từ 0041, để không repo
   nào phải đổi lần nữa. Nằm cạnh các sổ ở `design/` vì repo giữ nó trong git như một tệp khoá; nó
   không là sổ của hợp đồng và cổng không đọc nó, vì không lệnh kiểm nào cần nó để đỏ.
2. **Mọi lệnh ghi công cụ ghi dấu cùng lúc.** Dấu sinh trong `vendored()` của
   `plugins/design-assembly/scripts/apply.mjs`, chỗ duy nhất gom công cụ để chép, nên `new`, `adopt`
   và `upgrade` không thể ghi công cụ mà quên dấu. Mã đọc và tính cây chuyển từ `status.mjs` sang
   `plugins/design-assembly/scripts/stamp.mjs`, một chỗ cho cả ba lệnh và `status`.
3. **Không có dấu thì so bằng nội dung.** Repo nhận trước ngày này vẫn chạy: `status` nói «no stamp»;
   `upgrade` coi là «bản không rõ» và so từng tệp. Bản sao nào trùng đúng cây công cụ của một bản đã ghi
   ở `references/releases.json` thì được gọi bằng số bản ấy, kèm chữ «by its content».
4. **`upgrade` luôn in trước khi ghi, và dừng khi mất mục hay cổng đỏ.** Bốn điều in mỗi lần: tệp
   công cụ nào tạo, đổi, hay xoá vì bản mới không còn; sổ nào máy sinh lại khác đi, từng mục thêm,
   bớt, đổi; quyết định nào đổi trạng thái; bước design-assembly của cổng sẽ xanh hay đỏ. Còn một mục
   bị bớt, hoặc cổng đỏ, thì lệnh không ghi gì và kết thúc 1. Hai cờ riêng, `--accept-lost-entries` và
   `--accept-red-gate`, mỗi cờ nói người đã đọc đúng điều ấy và chấp nhận; skill phải hỏi người trước
   khi dùng. Hai cờ thay vì một, để chấp nhận mất mục không kéo theo chấp nhận cổng đỏ.
5. **Mục của một sổ là thứ người đọc được.** Một token là một mục; một chữ trong danh sách chữ là một
   mục; một bản ghi trong danh sách đọc theo `name`, `id` hay `file`; còn lại đi xuống tới giá trị. Một
   quan hệ «dựng từ» bị mất là một mục `components[X].parts[Y]` bị bớt. Trên Inventory hôm nay, bản
   xem trước cho đúng ca này theo chiều ngược: ba quan hệ được thêm lại.
6. **Trạng thái trước đọc bằng chính bản sao của repo, trạng thái sau bằng công cụ đang cài.** Bản
   sao là mã của repo, chạy như cổng của repo vẫn chạy; bản sao quá cũ hay chạy không được thì lệnh
   nói không biết, không đoán (giới hạn `upgrade-before-runs-the-copy`). «Cổng» ở đây là bước
   design-assembly của cổng, chạy trong tiến trình trên repo như sau khi lên đời; bài kiểm riêng của
   repo nhập công cụ thì không được chạy (giới hạn `upgrade-gate-is-the-tool-step-only`).
7. **`upgrade` chỉ ghi thư mục công cụ, dấu bản và ba sổ máy sinh.** Không dòng sổ người viết,
   không stylesheet, không công cụ riêng của repo, và cũng không bước cổng `mk/design-assembly.mk`:
   lệnh so tệp ấy và nói khi nó khác (giới hạn `upgrade-leaves-gate-step`). Sổ chỉ sinh lại khi công
   cụ đổi; công cụ đã là bản mới nhất thì sổ lỗi thời là việc của cổng. `--remove` của đề bài không
   dựng: gỡ công cụ, bước cổng, sổ máy sinh và các dòng trỏ vào chúng là nhiều hơn một phần thêm nhỏ
   (giới hạn `upgrade-has-no-remove`). Ghi chú phát hành dựng trên khung chung với `--out`.
8. **Số bản do cổng giữ.** `references/releases.json` ghi mỗi bản với mã cây của `templates/`,
   `scripts/` và công cụ. `make plugin-version-check`, trong `make check`, đỏ khi hai thư mục ấy khác
   cây đã ghi cho bản hiện tại, khi hai tệp kê khai nói hai số khác nhau, khi số bản đi lùi, khi một bản
   `origin/main` đã phát hành bị ghi lại bằng cây khác, và khi bản sao công cụ hay dấu bản của chính kho
   này lệch. `make plugin-version VERSION=x.y.z` ghi số mới vào cả hai tệp kê khai, vào sổ bản và vào
   dấu bản của kho này; bản chưa phát hành trên main thì được ghi lại tại chỗ. Kỹ năng, danh mục tham
   chiếu và README không tính (giới hạn `version-counts-templates-and-scripts`), để mỗi lần sửa chữ
   không bắt phải lên số.
9. **Bản này là `0.1.0`, không phải `0.0.2`.** Theo semver cho số 0.x: thêm một lệnh và một tệp mới
   trong repo là thêm khả năng, nên tăng số giữa; `0.0.2` sẽ đọc như một bản vá. Đây cũng là bản đầu
   tiên có sổ bản, nên là bản đầu tiên `upgrade` gọi được bằng tên.

## Consequences

- Repo nhận plugin từ nay có `design/tool-stamp.json`; `status` nói bản sao từ bản nào và đã bị sửa
  sau khi đóng dấu chưa, và chỉ `/design-assembly:upgrade` là lệnh kế khi bản sao lệch. Hai giới hạn
  `status-tool-stamp-never-written` và `adopt-does-not-refresh-tool` đóng.
- Chạy thử chỉ đọc trên Inventory: không dấu, sáu tệp công cụ đổi, sổ linh kiện thêm ba quan hệ
  «dựng từ», không quyết định nào đổi trạng thái, bước cổng xanh. Lên đời thật ở Inventory là mục 1.4,
  cần chủ repo cho phép.
- Mỗi PR chạm `templates/` hay `scripts/` của plugin phải chạy `make plugin-version` một lần; sau khi
  main đã phát hành một bản, sửa tiếp phải lên số mới.
- Mở năm giới hạn ở vùng `upgrade` của `references/limits.json`.
