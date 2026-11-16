---
type: index
title: design-assembly wiki
---

# design-assembly wiki

Short, linked pages about the _why_ of this project. Agents read this page
first; keep it under ~60 lines. Page formats: `ontology/page-types.yaml`.

## Entities

<!-- - [Customer](entities/customer.md) — who buys; VIP rules -->

- [Item](entities/item.md) — bản ghi mẫu của màn mẫu; mỗi trường khai kiểu cột

## Flows

<!-- - [Checkout](flows/checkout.md) -->

## Specs

- [0005 Sổ thiết kế thôi đi theo PR, bản đồ màn tới bài kiểm, và sổ quyết định đứng thay trưởng thiết kế](specs/0005-ledgers-stop-riding-pull-requests.md) — đã duyệt 2026-11-16, kèm luật «mọi repo, mọi giai đoạn»; dựng theo mục 8.1 đến 8.4 của kế hoạch
- [0003 Sổ màn nói màn hiện gì, chào nút nào cho vai nào; phép kiểm nối sổ màn với mô hình nghiệp vụ](specs/0003-screens-join-the-domain-model.md) — chủ kho duyệt, đã dựng (0035); số đo trên Inventory ở mục Test plan
- [0004 Bộ lệnh của design-assembly, theo việc người dùng cần xong](specs/0004-the-command-set.md) — đã duyệt 2026-11-15; đã dựng ba lệnh mới, `status` (0041), `decide` (0043) và `upgrade` (0047); hợp đồng chung đã áp cho bảy lệnh đang có (0044, 0047); khung tài liệu chung áp cho `status`, `audit` và `upgrade` (0046, 0047); mười lệnh còn lại chưa
- [0002 Design-assembly là lớp meta tạo và giữ design system cho nhiều kho](specs/0002-meta-layer-for-many-repositories.md) — bản nháp, chờ chủ kho duyệt: tầm nhìn, tiêu chí, kế hoạch; kiến trúc đầy đủ kèm sơ đồ ở `docs/architecture/meta-layer.html`
- [0001 Plugin dẫn người dùng dựng design system cho Claude Code](specs/0001-design-system-for-claude-code.md) — đề bài đã duyệt; lát đầu đã dựng, kết quả theo từng tiêu chí ở cuối mục tiêu chí

## Decisions

- [0001 Record decisions in the wiki](decisions/0001-record-decisions-in-the-wiki.md)
- [0002 Các lựa chọn khi dựng kho](decisions/0002-setup-choices.md) — máy chọn, chờ chủ kho bác
- [0003 Plugin nằm trong kho, ứng dụng làm bãi thử](decisions/0003-plugin-inside-the-repo.md) — động cơ ở `plugins/design-assembly/`
- [0004 Output là plugin dẫn dắt, từ vựng lấy từ chuẩn của ngành](decisions/0004-output-and-vocabulary.md) — bảng từ vựng ở `plugins/design-assembly/references/vocabulary.json`
- [0005 Đầu ra chuẩn hoá theo bậc; ranh giới với hai kho bên cạnh](decisions/0005-output-tiers-and-boundaries.md) — bảng bậc ở `plugins/design-assembly/references/tiers.json`
- [0020 Cuốn sổ bàn giao: design system được cho xem, vẽ từ chính kho](decisions/0020-handoff-book.md) — kịch bản ở `plugins/design-assembly/scripts/book.mjs`, skill ở `plugins/design-assembly/skills/handoff/`
- [0021 Sáu luật cho những gì tác tử dựng màn phải đoán ở lần thử năm](decisions/0021-rules-the-builder-guessed.md) — cột thao tác đứng yên, nút giữ bề rộng, phần «linh kiện của kho», hai hành động của `Item`
- [0025 Khung ứng dụng và màn thứ hai: luật điều hướng có bản dựng thật](decisions/0025-app-frame-and-a-second-screen.md) — khung ở `src/App.tsx`, màn thứ hai ở `src/example/OverdueScreen.tsx`, phần vẽ dùng chung ở `src/components/`
- [0026 Một nút trên một dòng, và mô hình dữ liệu được duyệt sau](decisions/0026-one-button-per-row-and-model-review-after.md) — hai chỗ luật chọi nhau mà lần thử bảy tìm ra; luật ở `plugins/design-assembly/scripts/apply.mjs`
- [0027 Dòng tự chờ sau khi hỏi, và các màn danh sách dùng chung phần tải](decisions/0027-row-waits-alone-and-list-screens-share.md) — `src/lib/list.ts`, `src/components/item-list.tsx`, khung ở `src/App.tsx`
- [0028 Dọn nền 2: đưa luật hay bị phạm vào cổng, và lấp chỗ hổng của repo mới](decisions/0028-groundwork-two-rules-into-the-gate.md) — kiểm ở `plugins/design-assembly/templates/tools/design-assembly/patterns.mjs`, khung ở `src/components/app-frame.tsx`
- [0029 Hợp đồng, lát một: mỗi sổ một hình dạng, ba bên cùng đọc](decisions/0029-the-contract-one-shape-per-ledger.md) — hình dạng ở `plugins/design-assembly/templates/tools/design-assembly/contract.mjs`, lời ở `plugins/design-assembly/references/contract.md`
- [0030 Hợp đồng, lát hai: một sổ màn, mã chỉ giữ cách tới từng trạng thái](decisions/0030-one-ledger-of-screens.md) — sổ ở `design/screens.yaml`, bộ đọc ở `plugins/design-assembly/templates/tools/design-assembly/screen-ledger.mjs`
- [0031 Hợp đồng, lát ba: tên thư viện về bộ chuyển, lõi không nêu tên nào](decisions/0031-adapters-hold-library-names.md) — bộ chuyển ở `plugins/design-assembly/templates/tools/design-assembly/adapters/`
- [0032 Review sau chặng 2, và cắt lại chặng 3 thành lát mỏng trên Inventory](decisions/0032-review-after-stage-two-and-stage-three-recut.md) — số đo ở `docs/trials/inventory-ladder.md`, việc chờ xem ở `docs/review-queue.md`
- [0033 Chặng 3, lát hai: plugin chạy lại lint của chính repo trên đoạn mã phạm quyết định](decisions/0033-re-run-the-repository-lint.md) — đoạn mã phạm ở `plugins/design-assembly/templates/tools/design-assembly/probes.mjs`
- [0034 Chặng 3, lát ba: bộ đọc linh kiện ngang công cụ của Inventory](decisions/0034-component-reader-equal-to-the-reference-tool.md) — phép so ở `make design-ladder`
- [0035 Chỉ luật dòng sổ nêu tên mới giữ được dòng sổ ấy](decisions/0035-the-named-rule-holds-the-row.md) — thay mục 5 của 0033
- [0036 Linh kiện ở tệp định nghĩa nó, không ở tệp gom](decisions/0036-a-component-lives-where-it-is-defined.md) — sổ linh kiện bỏ dòng ở tệp chỉ xuất lại; một ý thay bởi [0038](decisions/0038-a-component-is-drawn-with-what-its-file-hands-on.md)
- [0037 Sổ màn nói màn hiện gì, chào nút nào; cổng nối sổ màn với mô hình nghiệp vụ](decisions/0037-screens-join-the-domain-model.md) — phép kiểm ở `plugins/design-assembly/templates/tools/design-assembly/screen-actions.mjs`, đo lại bằng `make design-screen-actions-reference`
- [0040 Kế hoạch chính thức tám giai đoạn, và cách giữ cho việc làm bám theo nó](decisions/0040-the-plan-of-record-and-how-it-is-kept.md) — `make plan`; thay [0039](decisions/0039-plan-recut-by-rhythm-and-tier.md)
- [0041 Lệnh `status`: việc chờ chủ repo đọc từ dòng sổ, công cụ so bằng nội dung](decisions/0041-status-reads-ledger-rows-and-compares-the-tool-by-content.md) — lệnh ở `plugins/design-assembly/scripts/status.mjs`; năm lựa chọn của máy, chờ chủ repo bác
- [0045 Lệnh đo thang làm từ trạng thái nó gặp, không diễn lại việc nhận](decisions/0045-the-ladder-starts-from-the-state-it-finds.md) — `make design-ladder` chạy trọn trên repo đã nhận
- [0042 Lint của repo được hỏi qua tệp, có giới hạn thời gian, và báo lỗi bằng chính lời của lỗi](decisions/0042-the-lint-is-asked-through-files.md) — sửa lần cổng đỏ thất thường do tiến trình lint đọc câu hỏi trước khi nó tới
- [0044 Hợp đồng chung áp cho năm lệnh đang có: một chỗ đọc lời gọi, mã thoát 1 là «xong, còn việc»](decisions/0044-one-contract-for-the-commands-that-exist.md) — hợp đồng ở `plugins/design-assembly/scripts/command.mjs`; tám lựa chọn của máy, chờ chủ repo bác
- [0046 Khung tài liệu chung: một mô-đun dựng sáu phần, bìa mang ngày của commit cuối, PDF in từ trang bằng trình duyệt của repo](decisions/0046-one-frame-for-every-document.md) — khung ở `plugins/design-assembly/scripts/document.mjs`, vẻ ngoài chung với cuốn sổ ở `plugins/design-assembly/scripts/family.mjs`; mười lựa chọn của máy, chờ chủ repo bác
- [0051 Vật dẫn xuất ngoài git được vẽ trước bên đọc của repo: một lệnh vẽ, bản một tệp của sổ màn, và upgrade không coi chúng là mất](decisions/0051-derived-files-are-written-before-the-repositorys-own-readers.md) — lệnh ở `plugins/design-assembly/templates/tools/design-assembly/derived.mjs`; kho này không bật bản một tệp; máy chọn, chờ chủ repo bác
- [0052 Sổ nhập kho vào hợp đồng, và một repo có thể giữ nó mỗi khối một tệp, đặt tên theo nhu cầu](decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md) — hình dạng ở `plugins/design-assembly/templates/tools/design-assembly/intake-ledger.mjs`; tách bằng `screen-fragments.mjs --ledger intake`; máy chọn, chờ chủ repo bác
- [0050 Một repo được giữ sổ màn mỗi màn một tệp: lựa chọn của repo, một bộ đọc cho hai hình dạng, và lệnh tách dừng khi mất mục](decisions/0050-a-repository-may-keep-the-ledger-of-screens-one-file-per-screen.md) — lệnh ở `plugins/design-assembly/templates/tools/design-assembly/screen-fragments.mjs`; kho này đã bật, sổ ở `design/screens/`; máy chọn, chờ chủ repo bác
- [0049 Một repo được giữ sổ linh kiện ngoài git: lựa chọn của repo, cổng tự vẽ lại, và một phép kiểm giữ nó ngoài git](decisions/0049-a-repository-may-keep-the-component-manifest-out-of-git.md) — lệnh ở `plugins/design-assembly/templates/tools/design-assembly/components.mjs`; kho này đã bật; máy chọn, chờ chủ repo bác
- [0048 Giai đoạn thứ chín của kế hoạch: gỡ va chạm cho ba kho, chạy song song](decisions/0048-a-ninth-stage-ledgers-stop-riding-pull-requests.md) — chủ repo duyệt 2026-11-16; kế hoạch ở `docs/plan/plan.json`
- [0047 Dấu bản công cụ, lệnh `upgrade` dừng khi mất mục hay cổng đỏ, và số bản do cổng giữ](decisions/0047-tool-stamp-upgrade-and-the-version-rule.md) — lệnh ở `plugins/design-assembly/scripts/upgrade.mjs`, sổ bản ở `plugins/design-assembly/references/releases.json`; máy chọn, chờ chủ repo bác
- [0043 Lệnh `decide`: câu chờ đọc từ dòng sổ và từ một hàng chờ giữ dạng dữ liệu](decisions/0043-decide-reads-ledger-rows-and-a-waiting-list-kept-as-data.md) — lệnh ở `plugins/design-assembly/scripts/decide.mjs`, hàng chờ của kho này ở `design/waiting-list.json`; máy chọn, chờ chủ repo bác
- [0024 Khoá phạm vi: sổ giới hạn, ba ngăn, và bộ đề thử cố định](decisions/0024-scope-locked-limits-and-trial-briefs.md) — sổ ở `plugins/design-assembly/references/limits.json`, bộ đề ở `docs/trials/`
- [0023 Chín lời đáp cho các câu còn mở của kiến trúc lớp meta](decisions/0023-nine-answers-for-the-meta-layer.md) — chủ kho duyệt cả chín; bảng đầy đủ ở mục «Chín câu đã chốt» của `docs/architecture/meta-layer.html`
- [0022 Mở một hồ sơ cạnh danh sách: câu lõi cuối, chọn bằng mắt](decisions/0022-record-beside-a-list.md) — linh kiện ở `src/components/record-panel.tsx`, bảng mẫu ở `plugins/design-assembly/scripts/specimen.mjs --section record`
- [0019 Chọn bằng mắt, giữ bằng máy: bảng mẫu cho tầng foundations](decisions/0019-show-then-ask.md) — kịch bản vẽ ở `plugins/design-assembly/scripts/specimen.mjs`
- [0018 Hướng nhập giữa các phần, và sổ lỗi lọt](decisions/0018-import-direction-and-slips.md) — bộ đọc ở `plugins/design-assembly/templates/tools/design-assembly/governance.mjs`; sổ ở `design/escapes.md`
- [0017 Sau một thao tác: tiêu điểm, danh sách đổi tại chỗ, trạng thái trống, đi lại giữa các màn](decisions/0017-after-an-action.md) — phép kiểm tiêu điểm ở `plugins/design-assembly/templates/owned/templates.spec.ts.template`; màn mẫu ở `src/example/ReferenceScreen.tsx`
- [0016 Kiểu màn, cỡ màn được kiểm, và thao tác thất bại](decisions/0016-screen-kinds-and-failed-actions.md) — bộ đọc trang kiểu màn ở `plugins/design-assembly/templates/tools/design-assembly/screens.mjs`; luật thất bại ở `src/lib/notify.ts`
- [0015 Trang luật cho tác tử dựng màn, và dòng sổ có sẵn mà chưa có lệnh kiểm](decisions/0015-rules-page-and-rows-without-a-check.md) — rút từ lần chạy thử ba; trang luật ở `.claude/rules/design-assembly.md`
- [0014 Kênh thông báo, hỏi trước hay hoàn tác, và bài kiểm của kho làm bằng chứng](decisions/0014-channels-and-undo.md) — mô-đun báo kết quả ở `src/lib/notify.ts`, bộ dò bằng chứng ở `plugins/design-assembly/scripts/proofs.mjs`
- [0013 Trạng thái của màn, chữ trên màn và câu báo lỗi, phần máy đọc được từ mã nguồn](decisions/0013-states-words-error-messages.md) — ba lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/patterns.mjs`; mức dày của bảng sửa về 32 px
- [0012 Kiểu cột quyết định canh lề, bề rộng và mật độ của bảng dữ liệu](decisions/0012-column-types.md) — bảng kiểu cột ở `design/column-types.json`, lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/columns.mjs`
- [0011 Cỡ vùng bấm được đo từ mã nguồn linh kiện](decisions/0011-target-size-from-source.md) — phép đo ở `plugins/design-assembly/templates/tools/design-assembly/components.mjs`
- [0010 Chỉ dòng sổ mới là lời đáp; bản audit tự nói bước kế](decisions/0010-only-a-row-is-an-answer.md) — rút từ lần chạy thử hai; bộ dò bằng chứng chung ở `plugins/design-assembly/scripts/proofs.mjs`
- [0009 Sổ linh kiện là vật dẫn xuất từ mã nguồn linh kiện](decisions/0009-component-manifest.md) — bộ đọc và lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/components.mjs`
- [0008 Tệp design tokens là vật dẫn xuất từ stylesheet](decisions/0008-design-tokens-file.md) — bộ sinh và lệnh kiểm ở `plugins/design-assembly/templates/tools/design-assembly/tokens.mjs`
- [0007 Nhận giá trị kho đã có thay vì sinh đè](decisions/0007-adopt-existing-values.md) — lệnh ở `plugins/design-assembly/scripts/adopt.mjs`, bảng bằng chứng sẵn có ở `plugins/design-assembly/references/known-proofs.json`
- [0006 Một sổ chuẩn, một danh sách tầng, một danh mục quyết định](decisions/0006-one-ledger-one-layer-list.md) — sổ ở `design/decisions.yaml`, danh mục ở `plugins/design-assembly/references/standard-decisions.json`

## Incidents

<!-- - [2026-01-15 Double charge](incidents/2026-01-15-double-charge.md) -->

## Metrics

<!-- weekly reports from tools/sdlc_metrics.py (team level) -->

## Log

See [log.md](log.md) for a chronological list of changes.
