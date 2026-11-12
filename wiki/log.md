---
type: log
title: Change log of the wiki and notable code changes
---

# Log

Newest first. One line each: `YYYY-MM-DD — what changed — link`.

- 2026-11-12 — Cuốn sổ bàn giao thêm tờ kiểu màn và tờ đường đi; câu hỏi còn mở hiện bằng ngôn ngữ của kho — [0020](decisions/0020-handoff-book.md), `plugins/design-assembly/scripts/book.mjs`.
- 2026-11-12 — Skill bàn giao và cuốn sổ design system: bìa, màu theo vai kèm tương phản, chữ và hình khối, mọi trạng thái của màn thật; cuốn sổ làm lộ cặp chữ phụ trên nền phụ dưới ngưỡng — [0020](decisions/0020-handoff-book.md), `plugins/design-assembly/scripts/book.mjs`, `plugins/design-assembly/skills/handoff/`.
- 2026-11-12 — Bảng mẫu cho tầng foundations: màu gốc, thang chữ, bo góc được vẽ trên màn thật của kho, người chọn bằng chữ cái; hướng dẫn đổi sang «vẽ rồi mới hỏi» — [0019](decisions/0019-show-then-ask.md), `plugins/design-assembly/scripts/specimen.mjs`.
- 2026-11-12 — Bậc governance: hướng nhập giữa các phần của mã (máy giữ) và sổ lỗi lọt có lệnh kiểm dạng, bắt đầu với sáu dòng thật; audit đếm ngoại lệ có chủ ý — [0018](decisions/0018-import-direction-and-slips.md), `design/parts.json`, `design/escapes.md`.
- 2026-11-12 — Bốn luật cho sau một thao tác: tiêu điểm không mất (có bài kiểm trình duyệt), danh sách đổi tại chỗ, trạng thái trống, đi lại giữa các màn; sửa bốn trạng thái của màn mẫu đang làm mất tiêu điểm — [0017](decisions/0017-after-an-action.md), `src/example/ReferenceScreen.tsx`, `design/behaviors.md`.
- 2026-11-12 — Chạy thử lần bốn bằng ba tác tử độc lập và sửa điều nó tìm ra: lệnh kiểm cỡ màn bị qua mặt bằng chú thích, audit im lặng về câu chưa ai xác nhận, hướng dẫn về trang kiểu màn — [spec 0001](specs/0001-design-system-for-claude-code.md), `plugins/design-assembly/`.
- 2026-11-12 — Dựng bậc templates (kiểu màn, màn mẫu, cỡ màn được kiểm, bài kiểm trình duyệt có thẻ) và luật thao tác thất bại; sửa tương phản của nút chính khi rê chuột — [0016](decisions/0016-screen-kinds-and-failed-actions.md), `design/patterns/`, `src/lib/notify.ts`.
- 2026-11-12 — Viết bàn giao phiên làm việc, để một phiên mới tiếp tục được khi chủ kho đổi tài khoản — `docs/HANDOFF.md`.
- 2026-11-12 — Chạy thử lần ba bằng ba tác tử độc lập (dẫn dắt, adopt, và lần đầu một tác tử dựng màn); cuộc dẫn dắt để lại trang luật cho tác tử; adopt gọi tên dòng sổ chưa có lệnh kiểm và gắn khi người bảo; đóng hai lỗ hổng của cổng và hai điều lệnh nói sai — [0015](decisions/0015-rules-page-and-rows-without-a-check.md).
- 2026-11-12 — Thêm kênh thông báo (toast qua một mô-đun, cài gói `sonner`) và luật hỏi trước hay hoàn tác; adopt nhận bài kiểm gắn thẻ của kho làm bằng chứng; cột chữ co theo nội dung; kho này lên 28/38 quyết định lõi — [0014](decisions/0014-channels-and-undo.md).
- 2026-11-12 — Thêm ba lệnh kiểm cho bậc trạng thái và lời văn (màn khai đủ trạng thái, màn không viết chữ trực tiếp, câu báo lỗi đủ hai phần); sửa mức dày của bảng về 32 px theo luật hiện tại của chủ kho; kho này lên 26/38 quyết định lõi — [0013](decisions/0013-states-words-error-messages.md).
- 2026-11-12 — Chủ kho xem lại thay đổi mô hình dữ liệu của tầng bảng dữ liệu và giữ thực thể mẫu `Item` cùng khoá `display` — [Item](entities/item.md).
- 2026-11-12 — Thêm tầng bảng dữ liệu: kiểu cột quyết định canh lề, bề rộng, mật độ; thêm thực thể mẫu `Item` và khoá `display` vào mô hình dữ liệu (cần người xem lại); màn mẫu dùng các phần bảng mới; kho này lên 23/38 quyết định lõi — [0012](decisions/0012-column-types.md), [Item](entities/item.md).
- 2026-11-12 — Thêm lệnh kiểm cỡ vùng bấm, đo chiều cao control từ mã nguồn; ngưỡng 24 px (AA) và 44 px (AAA) đối chiếu tại nguồn WCAG 2.2; kho này lên 19/38 quyết định lõi — [0011](decisions/0011-target-size-from-source.md).
- 2026-11-12 — Chạy thử lần hai bằng hai tác tử độc lập (kho trước plugin, bản sao kho đối chứng); sửa audit để chỉ dòng sổ mới là lời đáp và tự in bước kế, sửa adopt và ba skill theo 27 phát hiện — [0010](decisions/0010-only-a-row-is-an-answer.md), [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-12 — Thêm sổ linh kiện sinh từ mã nguồn (50 linh kiện ở kho này), có lệnh kiểm giữ khớp và lệnh sinh lại; lệnh soát kế hoạch của kit nhận sổ — [0009](decisions/0009-component-manifest.md).
- 2026-11-12 — Thêm tệp design tokens sinh từ stylesheet, có lệnh kiểm giữ khớp và lệnh sinh lại; bộ đọc của kit nhận tệp; bậc foundations của kho này lên «tự khai» — [0008](decisions/0008-design-tokens-file.md).
- 2026-11-12 — Thêm lệnh adopt: ghi dòng sổ và đặt lệnh kiểm quanh giá trị kho đã có, không ghi đè; cuộc dẫn dắt từ chối sinh đè lên giá trị riêng; kho này từ 9/38 lên 17/38 quyết định lõi — [0007](decisions/0007-adopt-existing-values.md).
- 2026-11-12 — Sổ quyết định chuyển sang `design/decisions.yaml` chuẩn; mười tầng gộp về bảy; thêm danh mục 64 quyết định chuẩn và audit cho mọi bậc — [0006](decisions/0006-one-ledger-one-layer-list.md).
- 2026-11-12 — Chốt đầu ra là design system chuẩn hoá theo bậc và ranh giới với Repo Standards, kit; dựng bậc audit (kiểm kê chỉ đọc, chạy trên mọi kho) — [0005](decisions/0005-output-tiers-and-boundaries.md), `plugins/design-assembly/scripts/inventory.mjs`.
- 2026-11-11 — Foundations thêm type scale, spacing scale, shape, kèm ba loại lệnh kiểm mới; ghi hai giới hạn của bộ linh kiện sàn — [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Chạy thử cuộc dẫn dắt bằng hai tác tử mới (giao hết, từng tầng); sửa bản xem trước để chạy trước khi duyệt, và năm chỗ hướng dẫn mơ hồ — [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Dựng lát đầu của plugin: bốn tầng, hàm tính màu từ source color, lệnh kiểm và determinism rate; áp vào ứng dụng gốc — [spec 0001](specs/0001-design-system-for-claude-code.md), `plugins/design-assembly/`, `design/`.
- 2026-11-11 — Thống nhất output là plugin dẫn dắt; thêm bảng từ vựng chuẩn ngành và bài kiểm giữ nó — [0004](decisions/0004-output-and-vocabulary.md), [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Thêm khung plugin và viết lại đề bài theo hướng «bằng và cho Claude Code» — [0003](decisions/0003-plugin-inside-the-repo.md), [spec 0001](specs/0001-design-system-for-claude-code.md).
- 2026-11-11 — Thêm đề bài lát mỏng và bản ghi lựa chọn dựng kho — [spec 0001](specs/0001-design-system-for-claude-code.md), [0002](decisions/0002-setup-choices.md).
- 2026-11-11 — Repository created with repo-setup (React + TypeScript SPA — Vite, npm, ESLint (react-hooks), Prettier, Vitest + Testing Library).
