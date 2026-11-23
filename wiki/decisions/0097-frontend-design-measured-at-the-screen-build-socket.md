---
type: decision
title: "Skill frontend-design được đo ở ổ dựng màn theo bốn thước"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0090-plugs-sees-the-session-falls-back-and-shows-the-board.md
sources:
  - docs/trials/frontend-design-measured-at-screen-build.md
  - docs/trials/screen-trial-14-after-the-second-fixes.md
  - docs/trials/results.tsv
  - plugins/design-assembly/references/plugs/frontend-design.json
  - "chủ repo, 2026-11-23: «Mở phiên đo», đáp câu «Mở phiên đo frontend-design song song với ReUI?»"
  - "chủ repo, 2026-11-23: «Cho chạy một nhánh», đáp câu cho chạy lượt đo một nhánh, ước tính khoảng 550 nghìn token"
---

# 0097 Skill frontend-design được đo ở ổ dựng màn theo bốn thước

## Status

Accepted, 2026-11-23. Phích thứ ba của mục 10.2, theo thứ tự chủ repo chốt ở câu hỏi 5 của đề bài 0014. Chủ repo cho
chạy một nhánh sau khi nghe quy trình và ước tính.

## Context

Ổ dựng màn đòi mã qua cổng, dòng của sổ màn, sổ cột và sổ loại cột, và bài trình duyệt theo vai. Phích của plugin là
trang luật cùng lệnh `brief`. Lần thử 11 đến 14 cho số chỗ phải đoán của phích ấy trên đề chuẩn: 9, 11, 14, 13.

`frontend-design` là một skill tại chỗ, không tài khoản. Bản đo là bản 1.1.1 của plugin chính thức, tên phiên
`frontend-design:frontend-design`. Không lộ trình nào của plugin gọi phích ngoài ở ổ này: trang luật và `brief` không đọc
dòng `plug-screen-build`. Nên «dựng qua phích ngoài» hôm nay chỉ xảy ra khi có người bảo tác tử dùng skill. Lượt đo làm
đúng việc ấy, trên một bản sao còn trang luật và cổng. Số đo:
[docs/trials/frontend-design-measured-at-screen-build.md](../../docs/trials/frontend-design-measured-at-screen-build.md).

## Decision

1. **Phích `frontend-design` nay là «đã đo»** ở ổ dựng màn, `beats_plugin: false`.
2. **Số đo theo bốn thước:**
   - **Giữ được không.** Cổng xanh khi phiên điều phối chạy lại: 118 bài đơn vị, 126 bài trình duyệt. Có dòng sổ màn, hai
     màn chung một bảng, sổ loại cột khớp. 0 giá trị thiết kế ngoài sổ, 0 tệp cấm đụng bị đổi, không gói mới. Nhưng thứ
     giữ là trang luật và cổng, không phải skill: skill không nêu sổ, cổng hay hàng chờ nào, và bảo lập một bộ token
     riêng (mã màu, kiểu chữ, bố cục) mà không lệnh nào giữ. Tác tử không lập bộ ấy, vì repo đã định.
   - **Người dùng phải đoán mấy chỗ.** 12 sau khi kiểm (tác tử khai 30): 12 vào hàng chờ, 0 tự quyết lặng lẽ. 0 lời đáp
     ghi thay chủ repo. Trong khoảng 9 đến 14 của lần 11 đến 14, tức «không tăng, không giảm» theo luật đọc đặt trước.
   - **Chạy được ở đâu:** tại chỗ, không tài khoản, không mạng lúc chạy; không gì của repo ra khỏi máy.
   - **Tốn bao nhiêu:** tác tử dựng 295 493 token, 58 lần gọi công cụ, 14 phút 51 giây; lần 12 đến 14 là 295 đến 339
     nghìn. Cả lượt khoảng 450 nghìn, ước tính trước khoảng 550 nghìn.
3. **Theo luật chọn của 0008, phích của plugin vẫn là mặc định ở ổ dựng màn.** Phích ngoài không thắng ở thước 1 hay 2:
   thước 1 đứng nhờ phích của plugin, thước 2 nằm trong độ lệch của các lượt cũ. Thước 3 không loại nó: nó đủ điều kiện
   làm phích chính nếu về sau thắng. Một nhánh, một lượt, nên `false` nghĩa là «chưa cho thấy thắng», không phải «thua».
4. **Chủ repo vẫn chọn được skill này** ở bước `plugs`, để chạy bên cạnh trang luật. Lượt đo cho thấy hai thứ đi cùng
   nhau không làm hỏng gì trên repo đã có hướng đi: tác tử theo repo ở mọi chỗ skill và repo chỉ hai hướng.
5. **Đo lại** khi skill ra bản mới, khi một lộ trình trao skill đã chọn cho người dựng thay cho lời người, và trên một
   repo chưa có hướng đi.

## Consequences

- Với tệp phích có `measured.screen-build`, lệnh `plugs` trên một phiên có skill này nay hỏi một câu ở ổ dựng màn, khuyến
  nghị phích của plugin. Trước đây ổ ấy không có câu nào, vì phích chưa đo.
- **Cho lượt thử của dòng «xong khi» (tiêu chí 13), chưa chạy:**
  - Trên bản sao của kho này, một màn dựng qua skill đã chọn vẫn qua cổng, số chỗ đoán nằm trong khoảng cũ, và số lần
    quyết thay bằng 0. Ba điều của dòng «xong khi» giữ được với phích này.
  - Ba điều lượt này không chứng. Lượt ấy chạy trên một repo mới, nơi chưa có hướng đi, và skill bảo tự chọn bảng màu,
    font và bố cục: đó là chỗ một lần quyết thay dễ xảy ra nhất, và là chỗ lượt này không đo. Không lộ trình nào trao
    skill cho người dựng, nên lượt ấy cũng phải bảo tác tử bằng lời. Và lượt ấy nên đếm cả giá trị ngoài sổ, như lượt
    này.
- Máy này có một skill cá nhân cùng tên trần `frontend-design`, nội dung khác. Tệp phích khớp theo tên, nên `plugs` đọc
  skill ấy cũng thành phích đã đo. Ghi ở sổ giới hạn.
- Ba dòng sổ giới hạn mới: `plugs-skill-name-matches-a-namesake`, `screen-build-plug-reached-only-when-told`,
  `screen-build-plug-measured-beside-the-rules-page`.
- Lần đầu một tác tử dựng gặp cổng xuất của mục 10.4: thêm màn làm `DESIGN.md` cũ, cổng nêu lệnh sửa, tác tử sửa một
  bước.
