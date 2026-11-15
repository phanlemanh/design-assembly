---
type: decision
title: "Lệnh `status`: việc chờ chủ repo đọc từ dòng sổ, công cụ so bằng nội dung"
links:
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
  - wiki/decisions/0010-only-a-row-is-an-answer.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
sources:
  - plugins/design-assembly/scripts/status.mjs
  - plugins/design-assembly/scripts/inventory.mjs
  - plugins/design-assembly/skills/status/SKILL.md
  - plugins/design-assembly/tests/test-status.mjs
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/references/checks.md
  - docs/review-queue.md
  - "chủ repo, 2026-11-15: «Duyệt đề bài»"
---

# 0041 Lệnh `status`: việc chờ chủ repo đọc từ dòng sổ, công cụ so bằng nội dung

## Status

Accepted cho phần đề bài 0004 đã chốt (chủ repo duyệt đề bài ngày 2026-11-15). Năm lựa chọn ở mục
Decision là máy chọn trong lúc dựng, đề bài không nói tới; chờ chủ repo bác.

## Context

Đề bài 0004 chốt lệnh `status`: chỉ đọc, một màn hình, sáu khoá cho máy, mã thoát 0 và 1. Nó được
dựng đầu tiên vì chủ repo hỏi tiến độ nhiều lần mỗi phiên, và chưa lệnh nào trả lời «việc gì chờ
tôi».

Đề bài để ngỏ năm điều mà không dựng thì không biết phải chọn:

- «Mỗi nhịp một dòng» cho người, nhưng danh sách khoá cho máy không có nhịp; trong khi tài liệu bàn
  giao sau này dựng từ đúng dữ kiện của `--json`.
- «Dấu bản công cụ» thuộc về lệnh `upgrade`, chưa dựng. `status` vẫn phải đọc nó ở một chỗ nào đó,
  và vẫn phải nói được công cụ có lệch không khi repo chưa có dấu.
- Sổ quyết định chưa có khoá «ai xác nhận, ngày nào»; lệnh `decide` sẽ thêm.
- «Lệnh trả lời» của từng việc chờ: `decide` chưa có.
- Hợp đồng chung ghi mã thoát 1 khi «có chỗ cần sửa»; dòng riêng của `status` chỉ ghi «có việc chờ
  người hoặc công cụ lệch bản».

## Decision

1. **Thêm khoá thứ bảy, `rhythms`,** cạnh sáu khoá đề bài kê (`tier`, `held`, `claimed`, `waiting`,
   `tool`, `next`). Mỗi nhịp một mục: mã, tên, một câu đọc từ repo. Màn hình cho người in đúng các
   câu ấy, nên người và máy nhận cùng dữ kiện.
2. **Việc chờ chủ repo là hai loại, đều đọc từ sổ quyết định:** dòng sổ mà ghi chú nói chưa ai xác
   nhận (cuộc dẫn dắt đề xuất, hoặc đọc từ repo); và lời đáp chỉ người mới cho được mà sổ chưa có
   dòng (loại sản phẩm, mức truy cập, màu gốc), khi repo đã có sổ. Repo chưa có sổ thì chưa gì chờ:
   việc kế là lệnh `new` hoặc `adopt`. Dấu hiệu «chưa xác nhận» là chữ của ghi chú, cùng một luật
   với `audit`, viết một chỗ.
3. **Mỗi khuyến nghị kèm căn cứ, và máy không khuyên một lời đáp nó không có căn cứ.** Căn cứ là
   một số đo trên repo lúc đó (lệnh kiểm vừa chạy lại và giữ; lệnh kiểm đang đỏ; mã vòng qua; giá
   trị đọc từ repo) hoặc một chuẩn (danh mục quyết định chuẩn coi câu ấy là lõi). Với câu chỉ người
   mới biết, khuyến nghị là «đọc đề xuất rồi xác nhận hoặc đáp khác», không phải một giá trị.
4. **«Lệnh trả lời» và «lệnh kế» chỉ nêu lệnh plugin đang có.** Hôm nay là `new` (ghi lời xác nhận
   của người), `adopt` kèm cờ, và `audit`. Khi `decide` ra đời thì đổi sang nó. Có bài kiểm: lệnh
   nào được nêu cũng phải có skill.
5. **Công cụ so bằng nội dung, không bằng số bản.** `status` tính mã cây git của thư mục công cụ ở
   repo và của bản plugin đang cài, ngay trong tiến trình, không gọi git; hai thư mục cùng mã cây
   là cùng công cụ. Dấu bản công cụ, khi có, đọc ở `design/tool-stamp.json` (`version`, `tree`); chưa
   có thì nói «no stamp» và vẫn so. Chỗ đặt và hình dạng của dấu là đề xuất cho tới khi `upgrade`
   được dựng; nó chưa vào hợp đồng sổ.

Mã thoát theo dòng riêng của `status` trong đề bài: 1 khi có việc chờ người hoặc công cụ lệch. Lệnh
kiểm đang đỏ hay mã vòng qua một quyết định **không** làm mã thoát thành 1: đó là việc của cổng và
của `audit`; `status` in ra và đặt `audit` làm lệnh kế.

Đoạn trên đã được thay ngày 2026-11-15 bởi
[0044](0044-one-contract-for-the-commands-that-exist.md): `status` nay kết thúc 1 cả trong hai
trường hợp ấy, theo hợp đồng chung.

## Consequences

- **Ở kho này, `status` báo «không gì chờ trong sổ»**, nấc cao nhất ở mức «tự khai», công cụ khớp
  bản plugin, chưa có dấu. 26 dòng ở `docs/review-queue.md` nó không thấy, vì hàng chờ ấy viết
  bằng lời, không phải dòng sổ. Màn hình nêu tên giới hạn này ở mọi lần chạy. Nó đóng khi `decide`
  đưa các câu ấy vào sổ (đợt 0 của kế hoạch 0039).
- **Sổ giới hạn thêm khu `status` và năm dòng:** `status-reads-ledgers-only`,
  `status-confirmation-read-from-note`, `status-tool-stamp-never-written`,
  `status-compares-tool-folder-only`, `status-exit-ignores-failing-checks` (dòng cuối xếp «chấp
  nhận», vì theo đúng đề bài; đã đóng bởi 0044).
- **Bảng từ vựng thêm hai từ đặt trong dự án:** `rhythm` và `tool stamp`.
- **`audit` không đổi hành vi.** Kết quả `--json` của nó thêm một khoá, `values` (giá trị của
  stylesheet đến từ đâu), để `status` không phải viết lại luật ấy.
- **Chưa dựng:** tài liệu bàn giao một trang (`--out`, HTML) thuộc phần «khung chung của tài liệu»;
  dấu bản công cụ thuộc `upgrade`; khoá «ai xác nhận, ngày nào» thuộc `decide`.
- Chưa có lượt thử độc lập nào cho lệnh này; lượt thử tốn token nên chờ chủ repo cho chạy.
