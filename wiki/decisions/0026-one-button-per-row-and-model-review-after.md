---
type: decision
title: Một nút trên một dòng, và mô hình dữ liệu được duyệt sau
links:
  - wiki/decisions/0021-rules-the-builder-guessed.md
  - wiki/decisions/0024-scope-locked-limits-and-trial-briefs.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/references/checks.md
  - design/behaviors.md
  - design/patterns/danh-sach.md
  - docs/trials/results.tsv
  - "chủ repo, 2026-11-13: «Sửa hai chỗ đó», chọn «Từ hai thì gom» và «Thêm luôn, người duyệt sau»"
---

# 0026 Một nút trên một dòng, và mô hình dữ liệu được duyệt sau

## Status

Accepted. Chủ repo chọn cả hai ngày 2026-11-13, sau lần thử bảy. Thay mục 1 và mục 3 của
[0021](0021-rules-the-builder-guessed.md) ở đúng hai điểm nêu dưới đây; phần còn lại của 0021 giữ
nguyên.

## Context

Lần thử bảy tìm ra hai chỗ mà luật tự chọi nhau.

1. **Thao tác trên dòng.** Mục 3 của 0021 cho một dòng hai nút chữ và chỉ gom từ ba. Nhưng ở bề
   rộng 320, cột thao tác đứng yên phải chừa chỗ cho cột cuộn rộng nhất. Ở danh sách mẫu, cột đó
   chỉ được rộng khoảng 93px, mà hai nút chữ cần khoảng 164px. Tác tử dựng màn làm theo luật thì
   phép kiểm đỏ 16 lượt, và nó phải dừng lại hỏi.
2. **Ai được sửa mô hình dữ liệu.** Mục 1 của 0021 bảo tác tử «không được sửa mô hình» thì dừng lại
   hỏi, nhưng không nói tác tử nào thuộc diện đó. `AGENTS.md` lại cho mọi thay đổi sửa mô hình,
   kèm người duyệt trong mô tả thay đổi. Lần sáu tác tử dừng lại hỏi, lần bảy nó tự sửa: cùng một
   đề mà hai cách đọc.

## Decision

1. **Một thao tác thì hiện thành nút; từ hai trở lên thì gom sau một nút «Thao tác» của dòng, ở mọi
   bề rộng.** Bấm nút đó mở ra danh sách các nút (kiểu «mở rộng»), thao tác đảo được đứng trước,
   xoá đứng cuối. Không chia luật theo bề rộng: một luật cho mọi bề rộng giữ một đường tới mỗi
   trạng thái, nên danh sách bước của bài kiểm trình duyệt vẫn là một bộ. Khi một dòng rời bảng,
   tiêu điểm sang cùng nút ở dòng kế, tức nút «Thao tác» khi các thao tác gom sau nó.
2. **Màn cần khái niệm mà mô hình chưa có thì tác tử thêm luôn vào `ontology/`**, trong cùng thay
   đổi, và ghi rõ trong mô tả thay đổi rằng mô hình đã đổi, chờ người duyệt trước khi gộp. Chỉ khi
   repo cấm tác tử sửa mô hình thì nó mới dừng lại hỏi. Nó không bao giờ đặt tên khái niệm trong
   màn mà mô hình không có.

## Consequences

- Trang luật cho tác tử, trang hành vi, trang kiểu màn danh sách và tài liệu lệnh kiểm của plugin
  nói cùng một điều. Trang luật là trang plugin sinh ra; repo nào chạy lại hướng dẫn sẽ nhận bản
  mới.
- Giá của luật 1: trên màn rộng, kể cả xoá cũng phải bấm hai lần khi dòng có từ hai thao tác. Màn
  mẫu chỉ có một thao tác nên không đổi.
- Giá của luật 2: một tên khái niệm sai chỉ lộ ra lúc duyệt, sau khi màn đã dựng. Lưới là bước
  duyệt trước khi gộp, không phải một câu hỏi giữa chừng.
- Lần thử sau, tác tử dựng màn không còn phải hỏi ở hai chỗ này. Hai câu trả lời niêm phong của nó
  (mô hình dữ liệu, hai nút ở 320) vẫn giữ, phòng khi tác tử vẫn hỏi.
- Sổ giới hạn đóng ba dòng: `two-row-actions-overflow-narrow`, `focus-target-behind-disclosure`,
  `data-model-ask-or-edit-unclear`.
- Phần dựng sẵn cho nút «Thao tác» đã có, cùng ngày: `RowActions`, cài cùng cột thao tác ở
  `src/components/ui/row-actions.tsx`. Ba chỗ mà lần bảy tác tử phải đoán giờ do phần này quyết, máy
  đề xuất và chờ chủ repo bác: danh sách nổi ngay dưới nút, sát mép phải, phủ lên các dòng bên dưới
  nên không làm cột rộng ra; mỗi lúc chỉ một danh sách mở; bấm một thao tác thì danh sách đóng và
  tiêu điểm về nút của dòng, nút đó được giữ trong lúc thao tác chờ. Phần này dùng thư viện mà
  hộp thoại của sàn đã dùng, không cài gói mới. Bài kiểm riêng ở `tests/row-actions.test.tsx`. Đã
  thử trên một bản sao tạm có màn mẫu dùng phần này với hai thao tác: cả 75 lượt kiểm trình duyệt
  qua, kể cả các trạng thái xoá đi qua nút «Thao tác» và tiêu điểm sau khi xoá.
- Không lệnh kiểm nào đếm số nút trên một dòng. Phép kiểm ở bề rộng 320 bắt được hai nút chữ trên
  dữ liệu mẫu, nhưng chỉ trên dữ liệu mẫu (dòng `320-check-sample-data-only`).
