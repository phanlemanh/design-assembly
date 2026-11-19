---
type: decision
title: "Lệnh change cho nghỉ hoặc gộp một khối, nói tác động trước, và chỉ ghi sau lời đáp của chủ repo"
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md
  - wiki/decisions/0061-inventory-reports-only-what-it-can-see.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
  - wiki/decisions/0052-the-intake-ledger-joins-the-contract-one-file-per-block.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
sources:
  - plugins/design-assembly/scripts/change.mjs
  - plugins/design-assembly/scripts/asking.mjs
  - plugins/design-assembly/scripts/intake-write.mjs
  - plugins/design-assembly/templates/tools/design-assembly/waiting.mjs
  - plugins/design-assembly/templates/tools/design-assembly/affected.mjs
  - plugins/design-assembly/skills/change/SKILL.md
  - plugins/design-assembly/tests/test-change.mjs
  - docs/trials/reusable-store-on-copies.md
  - "chủ repo, 2026-11-19: «Làm 3.5»; cho đo trên bản sao ba repo: «Cho cả ba»"
---

# 0063 Lệnh change cho nghỉ hoặc gộp một khối, nói tác động trước, và chỉ ghi sau lời đáp của chủ repo

## Status

Accepted, 2026-11-19. Mục 3.5, theo phần B4 của đề bài 0006 mà chủ repo đã duyệt. Máy chọn cách làm trong khuôn đề bài;
chỗ lệch và chỗ thêm nằm cuối mục Decision.

## Context

Kho có `intake` để ghi một thứ mới, `find` để tra và `inventory` để giữ cho kho đáng tin. Còn thiếu cách cho một thứ ra khỏi
kho mà không làm gãy màn. Đề bài 0006 đòi ba điều:

- Lệnh nói tác động trước: màn nào, linh kiện nào, phép kiểm nào, dòng `import` nào.
- Mọi lần cho nghỉ hay gộp đều qua hàng chờ.
- Lệnh không xoá tệp nào và không sửa mã màn.

## Decision

1. **Một lệnh, `scripts/change.mjs`, theo hợp đồng lệnh chung.**
   - Lời gọi: một khối, gọi theo khoá nhu cầu hoặc theo tên; rồi một trong hai `--retire --why SENTENCE` hoặc
     `--merge-into NEED`, có thể kèm `--why`. Thêm `--dry-run`, `--target`, `--json`, `--out`.
   - Mã thoát: 0 khi đã ghi, hoặc khối đã nghỉ nên không còn gì để đổi; 1 khi chờ chủ repo, hoặc chủ repo đã bác; 2 khi
     gọi sai, khi tên không có trong sổ, khi repo chưa có sổ nhập kho, hoặc khi repo không đọc được. Khi thoát 2, lệnh
     không ghi gì.
   - Không mạng, không tiến trình con. Skill `change` gọi lệnh. Tài liệu là «Change report», `change-report.html`.
2. **Tác động đi trước.**
   - **Màn:** lấy từ `affectedBy` của `affected.mjs` (quyết định 0053), nên trùng đúng tập màn mà `screensOf` với tới.
     Không lần được thì là mọi màn, kèm lý do: không có sổ màn, có một `import` không lần được, hoặc tệp không thuộc màn
     nào.
   - **Khung:** lệnh nói khung ứng dụng có với tới tệp khối hay không.
   - **Linh kiện và phép kiểm:** các linh kiện nhập tệp khối, và các phép kiểm của dữ liệu công cụ nêu tệp ấy.
   - **Dòng cần sửa:** mỗi dòng `import` nêu tệp khối, kèm tệp và số dòng. Lệnh đọc bằng cùng bộ phân giải mà cổng dùng,
     kể cả bí danh của `tsconfig`; `aliasesOf` nay được xuất ra.
3. **Một câu chờ, `design/waiting/change-<khoá>.json`.**
   - Mục của câu là `block:<khoá>`, loại mục mới của hàng chờ. Phần căn cứ ghi lý do và tác động bằng lời.
   - Thay đổi được hỏi là ứng viên duy nhất của câu. Vì vậy lời đáp chỉ có thể là giữ hoặc bác, và cổng cũng đọc như thế.
4. **Sau khi chủ repo giữ,** lần gọi kế ghi `retired: { on, by, why }`, cùng `merged_into` khi gộp, vào đúng mục của khối:
   - `on` và `by` lấy từ lời đáp, không bao giờ từ đồng hồ.
   - Người ghi viết bằng cách viết khoá riêng của repo. Ở sổ theo mảnh, lệnh tìm tệp của khối theo nhu cầu nó ghi, không
     theo tên tệp.
   - Mỗi lần ghi đều được đọc lại: chỉ mục ấy có thêm khoá, mọi mục khác giữ nguyên. Sổ dùng CRLF thì dòng thêm cũng dùng
     CRLF.
   - Không tệp nào bị xoá. Màn vẫn nhập khối thì `inventory` báo `retired-in-use`, cho tới khi người hoặc tác tử sửa các
     dòng đã kê.
5. **Gộp chỉ vào một nhu cầu khác mà sổ đang giữ và chưa nghỉ.** Lệnh kiểm điều này lúc hỏi, và kiểm lại lúc làm theo.
6. **Lời đáp được làm theo đúng như đã hỏi.**
   - Lời gọi xin một thay đổi khác với thay đổi chủ repo đã giữ là gọi sai.
   - Xin một thay đổi khác trong lúc câu cũ còn chờ: lệnh nói thay đổi mới chưa được hỏi.
   - Sau khi bị bác, một thay đổi khác thành câu mới, `change-<khoá>-2`. Câu bị bác được giữ nguyên.
7. **Phần chung với `intake` nằm ở `scripts/asking.mjs`.** Hai lệnh dùng chung cách đọc sổ, đọc hàng chờ, và ghi một câu
   chờ đã được kiểm như cổng kiểm. Mỗi lệnh nêu bản công cụ đầu tiên đọc được câu của nó: 0.12.0 cho `intake`, 0.13.0 cho
   `change`. Công cụ cũ hơn thì lệnh bảo `upgrade` trước.

Chỗ lệch và chỗ thêm so với đề bài:

- **Lần gọi làm theo lời đáp không cần nêu lại thay đổi.** Câu chờ đã giữ thay đổi; nêu một thay đổi khác là gọi sai.
- **Lời đáp bằng lời riêng không được nhận.** Câu chỉ có một ứng viên, nên chủ repo giữ hoặc bác, kèm điều nên làm thay.
- **`--why` khi gộp là tuỳ chọn.** Không có thì lý do là «merged into <khoá>».

Một người đọc lại độc lập không thấy lần sập nào, không thấy lần ghi nào vào sai mục, và xác nhận `intake` giữ nguyên hành
vi khi chuyển sang `asking.mjs`. Họ nêu bốn chỗ, và cả bốn đã sửa, mỗi chỗ kèm một bài kiểm. Mỗi bài kiểm được thấy đỏ bằng
cách làm hỏng đúng chỗ ấy:

- Ở sổ theo mảnh mà tệp không mang tên nhu cầu, lệnh hỏi được, nhưng hỏng lúc làm theo.
- Một mục đã có khoá `retired` để trống thì bị ghi thêm khoá trùng. Nay lệnh từ chối trước khi hỏi.
- Sổ dùng CRLF thì nhận các dòng chỉ dùng LF.
- Có hai chỗ hở lúc hỏi. Một nhu cầu do hai mục cùng trả lời mà không bị chặn. Một thay đổi khác xin trong lúc câu cũ còn
  chờ thì bị bỏ qua mà lệnh không nói gì.

Họ cũng chỉ ra một điều mà lệnh chưa thấy hết. Khi một tệp gom (`index.ts`) xuất lại khối, lệnh chỉ kê dòng xuất lại; nơi
thật sự dùng khối thì không được kê. Dòng giới hạn `change-impact-by-imports-only` ghi điều này.

## Consequences

- **Tiêu chí 13 có lệnh chứng:** `node --test plugins/design-assembly/tests/test-change.mjs`.
  - Tác động bằng đúng tập màn mà `screensOf` với tới.
  - Sau lời đáp, mục của khối có `retired`, tệp khối còn nguyên, và mọi tệp ở `src/` giữ nguyên từng byte.
  - `inventory` báo `retired-in-use`.
- **Tiêu chí 14:** `decide` hiện câu `block:` cùng tác động và thay đổi được hỏi. Dòng giới hạn
  `decide-change-proposals-not-read` đóng.
- **Ba dòng mở mới ở vùng `change`:**
  - `change-lists-the-import-lines-and-edits-none`;
  - `change-impact-by-imports-only`;
  - `change-to-and-migrate-not-built`, là câu hỏi 8 của đề bài: `--to` và `--migrate` để sang giai đoạn 4.
- **Lần đo trên bản sao** (`docs/trials/reusable-store-on-copies.md`):
  - Repo kiểm chứng thoát 2, vì công cụ của nó là bản 0.7.1.
  - Trên bản sao, khi tạm bỏ dấu bản công cụ, lệnh chỉ ra rằng cho nghỉ khối `bang-nhieu-dong` chạm tới bảy màn và 25
    dòng `import`.
  - Hai repo của giai đoạn 2 chưa có sổ nhập kho, nên không có khối nào để đổi.
- **Plugin lên 0.13.0.** `waiting.mjs` và `affected.mjs` nằm trong công cụ chép vào repo, nên cây công cụ đổi.
