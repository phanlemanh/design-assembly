---
type: decision
title: Kế hoạch chính thức tám giai đoạn, và cách giữ cho việc làm bám theo nó
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0004-the-command-set.md
  - wiki/decisions/0039-plan-recut-by-rhythm-and-tier.md
  - docs/review-queue.md
sources:
  - docs/plan/plan.json
  - tools/plan.mjs
  - tools/plan_test.mjs
  - mk/plan.mk
  - "chủ repo, 2026-11-15: «Duyệt và ghi, những lần trước thường rời kế hoạch, làm thế nào để bám sát kế hoạch thực hiện đến khi hoàn tất?»"
---

# 0040 Kế hoạch chính thức tám giai đoạn, và cách giữ cho việc làm bám theo nó

## Status

Accepted cho bản kế hoạch: chủ repo duyệt ngày 2026-11-15 («Duyệt và ghi»), đóng dòng B6 của hàng chờ.
Thay [0039](0039-plan-recut-by-rhythm-and-tier.md): tám đợt của 0039 thành tám giai đoạn, có gắn lệnh
của đề bài 0004. Phần «cách giữ» ở mục Decision là máy chọn để trả lời câu hỏi của chủ repo cùng ngày,
chờ chủ repo bác.

## Context

Chủ repo hỏi vì sao những lần trước việc làm thường rời kế hoạch. Nhìn lại ngày 2026-11-14 và 15:

- **Kế hoạch là văn xuôi ở ba nơi** (đề bài, trang bàn giao, tài liệu kiến trúc). Không lệnh nào đọc
  nó, nên nó lỗi thời mà không ai thấy; trang bàn giao đã lệch hai lần.
- **Việc đi theo phát hiện gần nhất.** Một lượt chấm tìm ra lỗi, lỗi thành việc, việc sinh một lần
  chép công cụ, lần chép sinh phát hiện mới. Mỗi bước đúng khi đứng riêng, và mỗi bước đều được chủ
  repo cho làm; cộng lại thì hai ngày đi quanh một repo.
- **Không nhánh nào nói nó phục vụ mục nào của kế hoạch.** Mười PR gộp trong hai ngày, không PR nào
  nêu tên một chặng.
- **Kế hoạch chưa được duyệt** cho tới hôm nay, nên không có gì để bám.
- **Thước đo vị trí bị hỏng:** lệnh đo thang sập trên repo đã nhận.

## Decision

1. **Kế hoạch chính thức là một tệp dữ liệu:** `docs/plan/plan.json`. Tám giai đoạn; mỗi giai đoạn có
   các mục, điều kiện «xong khi», và việc cần chủ repo. Đúng một giai đoạn đang mở. Đề bài 0002 giữ
   lý do và tiêu chí; trạng thái chỉ sống ở tệp này.
2. **Một lệnh nói đang ở đâu:** `make plan` in giai đoạn đang mở, từng mục và trạng thái, giai đoạn kế,
   những thứ đã để sang bên, và số commit trên nhánh chính tự khai là ngoài kế hoạch.
3. **Cổng kiểm giữ kế hoạch** (`plan-check`, nằm trong `make check`):
   - đúng một giai đoạn đang mở; giai đoạn chưa mở thì chưa mục nào được bắt đầu, trừ giai đoạn được
     khai là chạy song song;
   - giai đoạn chỉ đóng khi mọi mục xong và có ghi ngày cùng bằng chứng;
   - **mỗi nhánh nêu mục nó phục vụ:** một commit của nhánh kết bằng dòng `Plan: <mã mục>`, hoặc
     `Plan: off-plan — <lý do>` khi việc không có trong kế hoạch. Nhánh không nêu thì cổng đỏ.
4. **Phát hiện mới không tự thành việc.** Nó vào danh sách «để sang bên» của tệp kế hoạch, kèm giai
   đoạn nó chờ, trừ khi nó chặn điều kiện «xong khi» của giai đoạn đang mở.
5. **Việc ngoài kế hoạch vẫn làm được, nhưng phải có tên.** Khi chủ repo bảo làm một việc kế hoạch
   không có, máy nói một dòng: việc ấy thuộc giai đoạn nào và làm chậm mục nào, rồi làm theo lời chủ
   repo, trên một nhánh khai `off-plan`.
6. **Giai đoạn đóng bằng lệnh, không bằng lời.** Mỗi dòng «xong khi» phải có một lệnh cho thấy nó
   đúng; kết quả ghi vào tệp kế hoạch lúc đóng.

## Consequences

- Mục Plan của đề bài 0002 viết lại theo tám giai đoạn; bảng thứ tự dựng lệnh của đề bài 0004 đổi
  theo số giai đoạn. Hàng chờ duyệt rút dòng B6.
- `AGENTS.md` thêm một mục ngắn cho tác tử: đọc `make plan` trước khi làm, và nêu mục trong commit.
- CI lấy đủ lịch sử để thấy nhánh chính; ở nơi không thấy nhánh chính, phép kiểm nói rõ là nó không
  kiểm được phần «nhánh nêu mục», và không giả vờ đã kiểm.
- Hai phiên đang chạy (sửa lỗi lint, dựng lệnh `status`) bắt đầu trước luật này. Khi nhánh của chúng
  gộp nhánh chính vào, chúng thêm dòng `Plan: 0.1` và `Plan: 0.2`.
- Giới hạn biết trước: phép kiểm chỉ thấy một nhánh có nêu mục hay không, không thấy việc trong nhánh
  có đúng là mục ấy không; điều đó vẫn là việc của người duyệt PR. Việc làm mà không qua nhánh nào thì
  không lệnh nào thấy.
