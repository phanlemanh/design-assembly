---
type: decision
title: "Plugin dựng lõi của họ sản phẩm, người cho phép; đề bài 0016 được duyệt"
links:
  - wiki/specs/0016-the-family-core-is-born-through-the-plugin.md
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/decisions/0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md
sources:
  - docs/plan/plan.json
  - docs/architecture/meta-layer.html
  - "chủ repo, 2026-11-25: «Vậy cần làm như sau đứng về design assembly là plugin meta dùng cho mọi, giai đoạn repo và nhiều người dùng. Nên lõi repo cũng phải được sinh ra khi người dùng sử dụng design assembly?»"
  - "chủ repo, 2026-11-25: «Soạn theo hướng này»"
  - "chủ repo, 2026-11-25: «Thêm cả hai nhóm»"
  - "chủ repo, 2026-11-25: «Duyệt cả mười ba», đáp câu «Duyệt đề bài 0016 theo khuyến nghị cả mười ba câu?»"
---

# 0112 Plugin dựng lõi của họ sản phẩm, người cho phép

## Status

Accepted, 2026-11-25. Mục 7.0 của kế hoạch. Chủ repo duyệt đề bài
[0016](../specs/0016-the-family-core-is-born-through-the-plugin.md) và đáp cả mười ba câu hỏi theo khuyến nghị («Duyệt
cả mười ba»). Bản này sửa câu 7 của [0023](0023-nine-answers-for-the-meta-layer.md) ở một điểm. Chưa gì được dựng.

## Context

Câu 7 của quyết định 0023 ghi lõi của họ sản phẩm nằm ở một repo riêng tư nhỏ do chủ repo tạo, và giai đoạn 7 của kế
hoạch chờ việc ấy.

Ngày 2026-11-25, sau khi giai đoạn 10 và 11 đóng, chủ repo nêu điều cách ấy bỏ sót: design-assembly là plugin cho mọi
repo, mọi giai đoạn của repo, và nhiều người dùng. Người dùng khác không có ai tạo repo lõi hộ.

Máy soạn đề bài 0016 theo hướng ấy. Chủ repo bảo mô phỏng cách người dùng thật gặp lõi, rồi bảo kiểm điều còn thiếu;
hai lượt ấy thêm mười tiêu chí và hai câu hỏi («Thêm cả hai nhóm»).

## Decision

1. **Plugin dựng lõi, người cho phép.** Đây là điểm duy nhất của câu 7 được sửa. Vẫn giữ: lõi chỉ ra đời khi có sản
   phẩm thứ hai; lõi riêng tư và nhỏ; lõi bắt đầu với ít khoá (câu 8); repo thắng, bằng cách ghim (câu 9).
2. **Repo đứng một mình không đổi gì.** Một ngoại lệ có tên: người đã có một lõi trên máy được hỏi đúng một câu ở repo
   mới, một lần.
3. **Lõi là một thư mục có hình dạng cố định,** dùng được ngay trên máy. Lệnh của plugin không gọi mạng. Tạo repo và
   đẩy lên chỉ xảy ra sau lời người, theo lối xin phép của quyết định
   [0093](0093-send-out-asks-leave-records-the-push-and-says-when-it-is-behind.md): theo họ, ghi thành dòng, rút lại
   được, in trước gửi gì đi đâu.
4. **Mười ba lời đáp** ghi dưới từng câu hỏi của đề bài. Bốn lời đáp đổi điều đã có:
   - lệnh mới tên `core`;
   - repo khai họ bằng một tệp của sổ nguồn ngoài, với một loại mới là lõi; hợp đồng không thêm sổ;
   - plugin có một móc chạy lúc mở phiên, loại thành phần nó chưa từng có;
   - chủ của họ được đưa một khối lên lõi bằng lời mình. Luật «lên kho chung chỉ bằng nâng hạng, có bằng chứng dùng
     lần hai» của tài liệu kiến trúc được nới bằng lối ấy, và mục của kho ghi «chưa có lần dùng thứ hai».
5. **Kế hoạch:** giai đoạn 7 thêm mục 7.0 cho đề bài, ghi xong. Dòng «cần chủ repo» đổi từ «Tạo repo cho lõi» thành bốn
   việc: duyệt mỗi thay đổi hợp đồng sổ, chốt câu nào của lõi là khoá, cho phép tạo repo lõi và đẩy lên, cho phép từng
   lượt thử tốn token.

## Consequences

- Giai đoạn 7 không còn chờ một repo do người tạo. Việc kế là lát 1 của mục 7.1: hình dạng của lõi trong hợp đồng, lệnh
  dựng lõi từ repo đầu, và tờ khoá hay mặc định. Lát ấy đổi hợp đồng sổ nên cần người duyệt.
- Tám lát dựng và một lượt thử, mỗi lát một PR, gộp theo lời chủ repo.
- Điều chưa biết: lượt thử của dòng «xong khi» nhắm repo cùng họ thứ hai, một repo nhiều gói không có Makefile. Hai
  giới hạn đang mở (`audit-workspace-reads-top-src-only`, `adopt-without-makefile-writes-nothing`) có thể chặn lối nhận
  ở đó; nếu chặn, máy dừng và hỏi.
- Tài liệu kiến trúc (mục 6, 12 và 17) còn ghi câu 7 theo lời cũ và luật nâng hạng chưa nới. Nó được cập nhật khi các
  lát dựng xong.
- Sáu việc để sau và bốn việc không làm ghi ở mục «Ngoài phạm vi» của đề bài.
