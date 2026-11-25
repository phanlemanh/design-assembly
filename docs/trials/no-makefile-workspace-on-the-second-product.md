# Repo không Makefile, gói không src/: lượt thử trên bản sao của sản phẩm thứ hai cùng họ

Chạy ngày 2026-11-25, cho mục 7.4 của kế hoạch, plugin 0.66.0 trên nhánh
`claude/no-makefile-workspace-db323c`, so với plugin 0.65.0 của main (`3d2d8a3`). Quyết định:
[0120](../../wiki/decisions/0120-a-repository-with-no-makefile-and-a-package-with-no-src-folder.md).

## Làm gì

- **Hai bản sao, lấy bằng `git archive HEAD`** vào thư mục nháp của phiên, mỗi bản một `git init`
  riêng để thấy được tệp nào đổi; không `node_modules`. Repo thật chỉ được đọc.
  - **crm-onehub**, sản phẩm thứ hai cùng họ, nhánh `onehub` ở `4aebb767d` (2026-11-21).
  - **Inventory**, repo kiểm chứng, nhánh `main` ở `1ea13196` (2026-11-24), để dựng lõi họ.
- **Lệnh:** script của plugin gọi thẳng, `--target` là gốc bản sao hoặc gói ứng dụng `apps/app`.
  Mọi lần chạy chạm lõi đặt `DESIGN_ASSEMBLY_CORES` vào một tệp trong thư mục nháp.
- **Trước và sau:** cùng bản sao, plugin của main (giải nén từ `git archive` của main) rồi plugin của
  nhánh.

## Hình dạng bản sao

Workspace bun và turbo, `workspaces: ["apps/*", "packages/*"]`, mười hai gói, không Makefile ở đâu.
Lint và định dạng bằng biome và oxlint. Gói ứng dụng `apps/app`: `app/` 515 tệp `.tsx`, `components/`
189, `lib/` 2, `test/` 257, không `src/`; `tsconfig.json` khai `"@/*": ["./*"]`; `components.json`
trỏ stylesheet sang `packages/ui/src/styles/globals.css`, stylesheet ấy nhập `geist.css`, tệp khai
biến `--ds-*` trong `@layer base { :root {…} .dark {…} }`, màu viết `lab(…)` và
`hsla(var(--…-value), 1)`. Có `_acceptance/config.yaml` ở gốc.

## Trước, plugin 0.65.0

| Nhắm vào   | Lệnh              | Thoát | Điều lệnh nói                                                                                                                                        |
| ---------- | ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| gốc        | `audit`           | 0     | «stylesheets: none found under src/», 0 tệp nguồn                                                                                                    |
| gốc        | `status`          | 0     | «nothing more this plugin can run here yet: src/index.css is missing»                                                                                |
| gốc        | `inventory`       | 0     | 0 món                                                                                                                                                |
| gốc        | `find button`     | 1     | «no component folder at src/components»                                                                                                              |
| gốc        | `adopt --dry-run` | 1     | «stylesheet: none found», 0 dòng                                                                                                                     |
| `apps/app` | `audit`           | 0     | 0 stylesheet, 0 tệp nguồn, vẫn trích `--primary #006b4f`                                                                                             |
| `apps/app` | `status`          | 0     | «the Makefile does not include mk/*.mk»                                                                                                              |
| `apps/app` | `inventory`       | 0     | 0 món                                                                                                                                                |
| `apps/app` | `find button`     | 0     | chỉ thấy một món của bộ khởi đầu                                                                                                                     |
| `apps/app` | `adopt --dry-run` | 1     | 2 tệp stylesheet; mọi cặp tương phản «cannot be read»; 56 dòng «points nowhere»                                                                      |
| `apps/app` | `adopt`, ba đáp   | 1     | 3 dòng phán đoán và `design/theme.json`; «checks-in-gate: the Makefile does not include mk/*.mk», không phép kiểm nào; sau đó `status` «0 of 3 rows» |

## Sau, plugin 0.66.0

- **Gốc.** `audit`, `status`, `inventory` thoát 1 và mở đầu bằng: workspace mười hai gói, gói giữ màn
  hoặc stylesheet là `apps/app` (963 tệp nguồn, stylesheet ở gói giao diện) và `packages/ui` (167 tệp,
  `src/styles/globals.css`), «aim at one with --target, as --target apps/app». `find` in cùng các dòng
  ấy. `adopt --dry-run` thoát 2 với cùng lời, «Nothing was written»; `git status` của bản sao sạch.
- **`apps/app`, `adopt --dry-run` không đáp.** Đọc 2 tệp stylesheet; mọi cặp tương phản của hai giao
  diện đều đo được (sáng: `--primary` trên `--background` 6,24:1; tối 3,22:1). Chín biến `--text-*`
  vẫn trỏ về đâu cả, nói một lần: theme của framework chưa cài trong bản sao.
- **`apps/app`, `adopt` thật với `--product-type application --conformance-level AA --record
source-color`.** Thoát 1 (câu hỏi họ đang chờ, vì máy có một lõi). 12 dòng: 9 giữ bằng công cụ
  (radius-value, type-scale-values, spacing-values, design-tokens, typeface, ledger-shapes,
  checks-in-gate, decision-sheet, owner-calls), 3 ghi lời người. Tệp chạm: `design/tokens.json`,
  `design/decisions.yaml`, `design/theme.json`, `tools/design-assembly/` (54 tệp),
  `design/tool-stamp.json`, `.claude/rules/design-assembly.md`, và `package.json` thêm đúng một dòng
  `"design:check": "node tools/design-assembly/check.mjs"`. Không Makefile, không `mk/`. Dòng cuối:
  «Run it with: bun run design:check»; kit nghiệm thu ở gốc nên dòng cần thêm được nói, không ghi:
  `design_assembly: "cd apps/app && node tools/design-assembly/check.mjs"` dưới `executors.script`.
- **Hai điều «would fail today», khác biệt thật:** tương phản tối của màu chính trên nền 3,22:1, dưới
  4,5:1; typeface không đọc được thứ nạp nó vì gói chưa cài.
- **Lệnh kiểm** (`node tools/design-assembly/check.mjs` trong `apps/app`): thoát 0, «9 decisions held
  by 12 checks, each seen failing on a changed copy».
- **`audit`**: đọc 963 trên 963 tệp nguồn ở `app, components, lib, test` («tsconfig.json maps @/ to
  the package's root»), thoát 1 vì hai câu bị đi vòng ở chỗ thật: thang chữ 31 chỗ, khoảng cách 36
  chỗ. **`status`**: «9 of 12 row(s) name a check that can be found; 2 failing or bypassed», bước kế là
  `audit`; không còn dòng nào về Makefile.
- **`inventory`**: 293 linh kiện, «repo components read from components/ (tsconfig.json maps @/ to
  the package's root)». **`find table`**: hai linh kiện của gói. Thư viện linh kiện nằm ở gói anh em
  nên `adopt` không ghi sổ linh kiện (giới hạn mở).
- **Lõi họ.** `core --build` trên bản sao Inventory, họ tên giả «Trial Family», khoá tám câu
  (source-color và bảy luật hành vi), mặc định table-density: thoát 0, không ghi gì vào bản sao
  Inventory. `core --join` trên `apps/app`: ghim lõi, 8 câu thừa hưởng thành dòng sổ, `source-color`
  khác lõi khoá (`#006b4f` so với `#0246ff`) nên một câu hỏi chờ chủ của họ; lệnh kiểm sau đó thoát
  1 với đúng một vấn đề: màu ấy khác màu lõi khoá và chưa ghi ngoại lệ. Đó là khác biệt thật giữa hai
  sản phẩm, không phải lỗi đọc. Chưa thử dùng lại một khối: lõi dựng từ Inventory chưa có khối nào
  (`blocks/index.json` rỗng), việc ấy là của mục 7.2 và 7.3.

## Không gì khác đổi

- **Bốn loại repo của bài kiểm** (không sổ, nhận bằng adopt có Makefile, dẫn dắt dựng, stack khác):
  sáu lệnh đọc in và thoát như 0.65.0, sau khi thay số phiên bản, số giới hạn, thư mục tạm và ngày
  bằng một chữ (`tests/test-nothing-moves.mjs`, bản ghi `tests/helpers/four-kinds-on-0.65.0.json`).
  Trên repo có Makefile, các tệp `adopt` ghi giống từng byte (trừ dấu phiên bản).
- **Repo này**, bản sao ở `3d2d8a3` kèm `node_modules`: `audit`, `find`, `inventory` giống hệt;
  `status`, `adopt --dry-run`, `upgrade --dry-run` chỉ khác ở chỗ nói bản công cụ của repo cũ hơn bản
  plugin và liệt kê mười tệp công cụ sẽ đổi, như sau mỗi phiên bản; xem trước của `upgrade` nói không
  sổ nào khác, cổng xanh.

## Chưa đo

- Script `design:check` chạy bằng `bun run` trong bản sao: chưa cài gói, nên lệnh `node` được chạy
  thẳng; hai lệnh chạy cùng một tệp.
- Lint của repo này (biome, oxlint): không có adapter; dòng trỏ luật lint sẽ chờ.
- Ba gói ứng dụng khác của workspace không giữ tệp `.tsx` nào, nên không được kể.
