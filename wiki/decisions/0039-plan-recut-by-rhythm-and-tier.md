---
type: decision
title: Kế hoạch xếp lại theo nhịp của vòng đời và mức phục vụ, không theo repo
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md
  - docs/review-queue.md
sources:
  - docs/architecture/meta-layer.html
  - docs/trials/README.md
  - docs/trials/results.tsv
  - plugins/design-assembly/references/limits.json
  - repo-standards/docs/ranh-gioi-ba-kho.md
  - "chủ repo, 2026-11-15: «design-assembly là một repo meta/plugin hoạt động trên mọi repo mọi giai đoạn»; «Kiểm tra kỹ lưỡng và viết lại kế hoạch»"
---

# 0039 Kế hoạch xếp lại theo nhịp của vòng đời và mức phục vụ, không theo repo

## Status

Proposed. Máy viết ngày 2026-11-15 theo lời chủ repo cùng ngày; chủ repo chưa duyệt. Thay cách cắt
chặng của [0032](0032-review-after-stage-two-and-stage-three-recut.md) cho phần việc còn lại; các lát
đã làm theo 0032 giữ nguyên.

## Context

Kế hoạch của đề bài 0002 xếp việc theo repo: kho này, Inventory, hai kho bên cạnh, lõi của họ. Ba lát
trên Inventory đã gộp, nên tiến độ đọc theo cách ấy trông gần xong chặng giữa. Chủ repo chỉ ra chỗ
lệch: plugin sinh ra để phục vụ mọi repo ở mọi giai đoạn, và báo cáo tiến độ nói quá nhiều về một
repo.

Kiểm lại ngày 2026-11-15, chỉ đọc:

- Plugin đóng gói được, có hướng dẫn cài, nhưng chưa cài ở máy này hay ở Inventory; bản 0.0.1 chưa
  từng tăng. Mọi lần chạy tới nay gọi script từ kho này.
- Cả mười lượt thử độc lập chạy trên bản sao của kho này. Repo thật duy nhất là Inventory, do chính
  phiên dựng plugin làm.
- Trong năm nhịp của vòng đời, nhịp «tính năng cần khối mới» chưa có gì ngoài một dòng tên sổ. Nhịp
  «định kỳ» thiếu đề xuất nâng hạng, và cuốn sổ chỉ vẽ được trên một nền dựng.
- Mức «Chỉ luật» chưa thử trên repo nào ngoài họ.
- Repo Standards có trang ranh giới ba kho, nhưng chưa gọi plugin trong mã; kit nghiệm thu đọc hai
  trong mười một sổ.
- Lệnh đo thang bốn nấc sập trên Inventory đã nhận, vì nó diễn lại việc nhận.
- Hai dòng giới hạn về hình dạng sổ của Inventory đã lỗi thời từ khi PR 58 của Inventory gộp.

## Decision

1. **Hai trục của kế hoạch là nhịp và mức**, lấy từ tài liệu kiến trúc: năm nhịp của vòng đời một
   repo, ba mức phục vụ. Mỗi đợt nêu nó làm ô nào nhúc nhích.
2. **Inventory là một repo kiểm chứng** của mức «Đồng hành». Thay đổi ở đó vẫn đi trên nhánh riêng,
   kèm hồ sơ nghiệm thu có chữ ký.
3. **Tám đợt, theo thứ tự** (chi tiết ở mục Plan của đề bài 0002): sửa thước và dọn hàng chờ; cài
   được và lên đời được; đo độ rộng trên repo khác; nhịp nhập kho; bộ chuyển thứ hai; nhịp «mỗi thay
   đổi» theo trang ranh giới; hai kho bên cạnh gọi và đọc; lõi của họ.
4. **«Cài được và lên đời được» đi trước việc rút thêm công cụ.** Mỗi bản sửa của plugin đang tốn
   một lần chép tay và một hồ sơ nghiệm thu ở repo đã nhận; không gỡ chỗ này thì mọi đợt sau đều
   chậm theo.
5. **Đo độ rộng trước khi viết bộ chuyển mới.** Một lượt chỉ đọc trên repo ngoài họ cho số thật về
   mức «Chỉ luật», và cho biết bộ chuyển nào đáng viết.
6. **Bảy tiêu chí của đề bài giữ nguyên chữ.** Bốn tiêu chí nêu tên Inventory; có viết lại thành «một
   repo đã có» hay không là câu hỏi cho chủ repo (hàng chờ, dòng C7).

## Consequences

- Mục Plan, Test plan và Open questions của đề bài 0002 viết lại; mục Intent và Acceptance criteria
  không đổi.
- Tài liệu kiến trúc, mục «Lộ trình và tiêu chí đạt», còn vẽ năm chặng theo repo. Chưa sửa: nó chờ
  cùng lượt duyệt kiến trúc (hàng chờ, dòng B1).
- Sổ giới hạn: đóng `reference-register-other-shape` và `reference-screen-ledger-differs`; mở
  `plugin-never-installed`, `trials-on-this-repository-only` và `ladder-replays-adoption`.
- Hàng chờ duyệt thêm hai dòng: B6 (bản kế hoạch này) và C7 (chữ của tiêu chí).
- Không dòng mã nào của plugin đổi trong quyết định này.
