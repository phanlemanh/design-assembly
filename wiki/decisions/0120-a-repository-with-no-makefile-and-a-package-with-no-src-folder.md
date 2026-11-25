---
type: decision
title: "Repo không có Makefile có cổng là một script của gói; gói không giữ src/ được đọc ở chỗ nó giữ màn; gốc workspace nói gói nào để nhắm"
links:
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/decisions/0114-a-repository-joins-its-family-and-inherits.md
  - docs/trials/breadth-on-two-repositories.md
  - docs/trials/no-makefile-workspace-on-the-second-product.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/source-folders.mjs
  - plugins/design-assembly/templates/tools/design-assembly/host-make.mjs
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/styles.mjs
  - plugins/design-assembly/templates/tools/design-assembly/color.mjs
  - plugins/design-assembly/templates/tools/design-assembly/ledger.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/templates/tools/design-assembly/governance.mjs
  - plugins/design-assembly/templates/tools/design-assembly/probes.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/shadcn.mjs
  - plugins/design-assembly/scripts/script-gate.mjs
  - plugins/design-assembly/scripts/workspace.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/scripts/audit.mjs
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/scripts/upgrade.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/host-strings.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/skills/adopt/SKILL.md
  - plugins/design-assembly/tests/test-script-gate.mjs
  - plugins/design-assembly/tests/test-source-folders.mjs
  - plugins/design-assembly/tests/test-nothing-moves.mjs
  - "phiên điều phối, 2026-11-25: chủ repo đáp «Mở cả hai» cho câu «Mở hai phiên song song: 7.2 lát 3, và một mục mới sửa hai giới hạn chặn crm-onehub?»"
  - "repo cùng họ thứ hai ở nhánh onehub 4aebb767d, chép bằng git archive vào thư mục tạm; repo kiểm chứng ở 1ea13196, chép như thế; không ghi gì vào hai repo thật"
---

# 0120 Repo không có Makefile, gói không giữ src/, và gốc của workspace

## Status

Đã dựng ngày 2026-11-25, mục 7.4 của kế hoạch, plugin 0.66.0. Chủ repo thêm mục bằng lời «Mở cả
hai». Ba đoạn hợp đồng cần người duyệt (mục «Hệ quả»).

## Context

Mục 7.3 sẽ chạy trên bản sao của sản phẩm thứ hai cùng họ. Phiên điều phối đã thấy plugin chưa tới
được đó; phiên này xem lại bằng plugin 0.65.0 của main, trên một bản sao lấy bằng `git archive`,
trước khi thiết kế. Thấy như sau, theo hình dạng:

- **Hình dạng.** Một workspace nhiều gói (`apps/<tên>`, `packages/<tên>`), khai ở `workspaces` của
  `package.json` gốc, không Makefile ở đâu cả; công cụ lint và định dạng không phải ESLint và
  Prettier. Gói ứng dụng giữ màn ở `app/`, `components/`, `lib/` và test ở `test/`, ngay ở đỉnh gói,
  không có `src/`; `tsconfig.json` của gói khai `"@/*": ["./*"]`; `components.json` trỏ stylesheet
  sang gói giao diện anh em. Stylesheet ấy nhập một tệp khai các biến gốc trong `@layer base`, màu
  viết bằng `lab()` ở giao diện sáng và `hsla(var(--x-value), 1)` ở giao diện tối.
- **Ở gốc.** `audit` và `status` thoát 0, không stylesheet, 0 tệp nguồn, «nothing more this plugin
  can run here yet: src/index.css is missing»; `inventory` 0 món; `find` «no component folder at
  src/components»; `adopt --dry-run` 0 dòng.
- **Ở gói ứng dụng.** `audit` đọc 0 trên 963 tệp `.tsx` (chỉ đi `src/`) dù vẫn trích được
  `--primary` qua `components.json`; `adopt` tìm được stylesheet (2 tệp) nhưng mọi cặp tương phản
  «cannot be read», 56 dòng «points nowhere» (47 vì biến nằm trong `@layer` có thụt dòng, 9 vì theme
  của framework chưa cài); `adopt` thật với ba lời đáp ghi 3 dòng phán đoán và `design/theme.json`,
  rồi «the Makefile does not include mk/*.mk», không phép kiểm nào vào cổng; `status` sau đó «0 of 3
  row(s) name a check that can be found».
- **Trong mã.** Giả định `src/` nằm ở khoảng sáu mươi chỗ: `audit` đi `src`, `readSources` mặc định
  `src`, bộ đọc linh kiện và adapter của thư viện coi `@/` là `src/`, đầu dò lint đi `src`, phép kiểm
  của món bị gỡ ghép đường dẫn bằng chuỗi. Stylesheet đã có một lối tìm chung (`findStylesheet`: dữ
  liệu công cụ, rồi `components.json`, rồi `src/index.css`) mà `audit` không dùng cho danh sách
  stylesheet. Cổng chỉ có một hình: `apply.gateProblem` đòi Makefile có dòng `include mk/*.mk`;
  `host-make.mjs` là module duy nhất mở Makefile và `mk/`; `toolInGate` đã nhận một script của
  `package.json` có nhắc đường dẫn công cụ. Câu 6 của quyết định 0023 đã chốt hướng: kho không dùng
  Makefile thì plugin phát một lệnh kiểm và khai ở chỗ kho đã có, làm khi gặp kho thật đầu tiên.

## Decision

1. **Cổng không Makefile là một script của gói, tên `design:check`.** Ở thư mục được nhận có
   `package.json` mà không có `Makefile`, `adopt` đặt công cụ như mọi nơi và thêm đúng một script
   `"design:check": "node tools/design-assembly/check.mjs"`, là dòng đầu của `scripts`, theo thụt lề
   của chính tệp. Không bao giờ ghi Makefile hay tệp `mk/` ở đó, cả `adopt` lẫn `upgrade`. Tên có
   dấu hai chấm theo nếp tên script của hệ npm, và đọc ra được đây là phép kiểm của thiết kế.
2. **Không ghi đè script của repo.** `design:check` đã có mà chạy thứ khác thì giữ nguyên, nói ra,
   và lấy `design-assembly:check`; cả hai đều đã có thì không phép kiểm nào vào cổng và báo cáo nói
   vì sao, như khi Makefile thiếu dòng `include`. Bản chạy thử liệt kê `package.json` trong các tệp
   sẽ chạm.
3. **Dòng `checks-in-gate` giữ chính script ấy.** Phép kiểm `{ "kind": "gate", "script": "<tên>" }`
   đạt khi script chạy đúng lệnh kiểm và chỉ lệnh ấy; bản đổi để nó phải hỏng là thêm `|| true`. Dòng
   sổ ghi `source: "the package script design:check"`. Hình cũ `{ "kind": "gate" }` vẫn đọc như
   trước. Báo cáo của `adopt` kết bằng dòng `gate:` nói lệnh người chạy, lấy trình quản lý gói từ
   trường `packageManager` của gói hoặc của gói gốc phía trên (không có thì nói lệnh `node` thẳng).
4. **Khai với kit nghiệm thu, nhưng không ghi ra ngoài thư mục được nhận.** Tệp
   `_acceptance/config.yaml` nằm trong thư mục được nhận thì thêm `design_assembly: "<lệnh>"` dưới
   `executors.script`; nằm phía trên (ở gốc workspace) thì nói đúng dòng cần thêm, kèm `cd <gói> &&`,
   và không ghi. Nguyên tắc: không lệnh nào ghi ngoài `--target`.
5. **Một câu trả lời cho thư mục nguồn, theo thứ tự: lời khai, cấu hình của gói, mặc định.** Module
   `source-folders.mjs` của công cụ trả lời «gói giữ màn và linh kiện ở thư mục nào»: (1) khoá
   `source_folder` trong `design/theme.json` khi người ghi, một thư mục của gói, `.` là đỉnh gói; khai
   sai thì gạt ra và nói; (2) thư mục mà `tsconfig.json` của gói ánh xạ tiền tố nhập của linh kiện
   (tiền tố `components.json` viết, không có thì `@/`); (3) `src`. Lời khai của người đứng trước điều
   máy suy ra, như lối tìm stylesheet đã làm. `audit`, `find`, `inventory`, sổ linh kiện, đầu dò lint
   và các phép kiểm đi qua mã nguồn đều hỏi câu trả lời ấy; `adopt` viết thư mục ấy vào các phép kiểm
   nó thêm. Đọc từ đỉnh gói thì bỏ thư mục ẩn, `node_modules`, `dist`, `build`, `out`, `coverage`,
   `test-results` và `tools/design-assembly`.
6. **Nói đã đọc ở đâu, chỉ khi không phải `src`.** Thư mục là `src` thì đầu ra giữ nguyên từng chữ;
   khác `src` thì `audit` nói «N of M screens and components in app, components, lib, test
   (tsconfig.json maps @/ to the package's root)», `find` và `inventory` nói thư mục linh kiện kèm lý
   do. Core không nêu framework nào: `@/` và `components.json` vẫn qua adapter của thư viện, và
   `tsconfig.json` là cấu hình của ngôn ngữ, không phải một công cụ dựng.
7. **Gốc của workspace.** Thư mục có `workspaces` trong `package.json` mà không giữ stylesheet hay mã
   nguồn của riêng nó: `audit`, `status`, `find`, `inventory` nói đây là workspace, kể các gói giữ màn
   hoặc stylesheet, bảo nhắm một gói bằng `--target`, và thoát 1; `adopt` và `upgrade` từ chối (thoát 2) và không ghi gì. Gốc có stylesheet hay mã nguồn ở thư mục nguồn của nó thì đọc như mọi repo; gốc giữ màn ở thư mục khác thì khai `source_folder`, vì đoán theo mọi tệp `.tsx` ngoài các gói sẽ nhầm tệp mẫu của kit nghiệm thu là màn.
8. **Stylesheet ở gói anh em và biến trong tầng.** `audit` lấy stylesheet theo lối tìm chung khi thư
   mục nguồn không có tệp `.css`, kèm các tệp nó nhập. Một biến do khối `@layer` khai, ở stylesheet
   hay tệp nó nhập, được theo sau khai báo không thuộc tầng (như cascade xếp). Màu `lab()` và `hsl()`
   có độ mờ đục bằng 1 được đọc. Nhiều biến vẫn «points nowhere» thì nói một lần, kèm vì sao.
9. **Dòng cần công cụ lint repo không có thì chờ.** Dòng trỏ một luật lint mà repo không có dấu hiệu
   nào của công cụ lint adapter biết (không tệp cấu hình dạng nào công cụ ấy đọc, không khoá cấu hình
   trong `package.json`, không có nó trong các gói, ở thư mục của repo hay thư mục phía trên tới đỉnh
   bản checkout): `not-held`, kèm vì sao, không bao giờ tính là giữ (trước đây một tệp mang tên luật ở
   đâu đó đủ để tính là có); `status` đếm số dòng chờ. Dấu hiệu nằm trong adapter (`signs`), core
   không nêu tên công cụ. Không viết adapter cho công cụ
   khác ở mục này: mở giới hạn `lint-tool-the-adapter-does-not-know`.
10. **Repo có Makefile nối y như trước.** Không đổi hình cổng `mk/design-assembly.mk`; bài kiểm so
    từng byte các tệp `adopt` ghi trên repo mẫu có Makefile với bản ghi của 0.65.0.

## Consequences

- **Thay đổi hợp đồng, cần người duyệt** (đoạn nguyên văn nằm ở PR): nơi khai lệnh kiểm (đoạn «A
  repository that keeps no Makefile» của `references/checks.md` và mục `check-script`,
  `script-runs-check`, `script_writes` của `references/host-strings.json`); khoá khai thư mục nguồn
  (`source_folder` của `design/theme.json`, mục «Where the source is read» của `checks.md`); dữ liệu
  công cụ có thêm `script` trong phép kiểm `gate` và `source` trong phép kiểm `components`.
- Trên bản sao, sau thay đổi: gói ứng dụng đọc 963 trên 963 tệp, `inventory` đếm 293 linh kiện,
  `find` thấy linh kiện của gói, `adopt` ghi 12 dòng và script, cổng xanh; gói gia nhập lõi dựng từ
  bản sao repo kiểm chứng, và cổng chỉ đỏ vì màu chính của gói khác màu lõi khoá
  ([lượt thử](../../docs/trials/no-makefile-workspace-on-the-second-product.md)).
- Trên bốn loại repo của các bài kiểm và trên bản sao của repo này, `audit`, `status`, `find`,
  `inventory`, `adopt --dry-run`, `upgrade --dry-run` in và thoát như 0.65.0, trừ dòng nói bản công cụ
  cũ hơn bản plugin, như sau mỗi phiên bản.
- Đóng `adopt-without-makefile-writes-nothing`, `audit-workspace-reads-top-src-only`,
  `values-under-a-cascade-layer-unread`, `audit-undecided-with-nothing-read`. Mở bảy dòng:
  `lint-tool-the-adapter-does-not-know` (nặng), `workspace-read-from-the-package-file-only`,
  `source-folder-one-folder-from-one-settings-file`, `gate-script-not-joined-to-the-repository-check`,
  `kit-told-only-where-its-file-is-in-the-folder`,
  `component-manifest-not-written-when-the-library-is-a-sibling`,
  `guide-and-change-map-read-src-for-the-at-prefix`.
- Script `design:check` không tự vào lệnh kiểm chung hay CI của repo: người nối nó vào; plugin không
  sửa script có sẵn.
