---
type: decision
title: Khoá phạm vi — sổ giới hạn, ba ngăn, và bộ đề thử cố định
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/decisions/0023-nine-answers-for-the-meta-layer.md
  - wiki/decisions/0018-import-direction-and-slips.md
sources:
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-limits.mjs
  - docs/trials/README.md
  - docs/architecture/meta-layer.html
  - "chủ repo, 2026-11-13: «Bắt đầu chặng 1»"
---

# 0024 Khoá phạm vi: sổ giới hạn, ba ngăn, và bộ đề thử cố định

## Status

Accepted cho phần cơ chế. Chủ repo bảo bắt đầu chặng 1 ngày 2026-11-13; việc đầu của chặng là khoá
phạm vi. Ba thứ dưới đây là cơ chế, máy dựng. Việc xếp từng dòng vào ngăn nào, và việc chọn số
`fix`, là máy đề xuất: chủ repo bác hay chuyển ngăn bất cứ dòng nào.

## Context

Dự án đã thừa nhận rất nhiều giới hạn, nhưng thừa nhận bằng văn xuôi, rải trong 23 bản ghi quyết
định, đề bài 0001, trang bàn giao và sổ lỗi lọt. Một giới hạn chỉ nằm trong văn xuôi thì mất ngay
lần đầu có người đọc lướt qua. Không ai đếm được còn bao nhiêu, cái nào đã hết, cái nào thuộc repo
khác.

Cùng lúc, sáu lần chạy thử dùng sáu đề khác nhau, nên con số quan trọng nhất của dự án, «tác tử
dựng màn còn phải đoán mấy chỗ», không so được giữa các lần.

## Decision

1. **Một sổ giới hạn máy đọc được**, `plugins/design-assembly/references/limits.json`. Mỗi giới
   hạn một dòng: vùng, loại, mức nặng, ngăn, ngày mở, nơi đã ghi nó, và một câu nói rõ cái gì
   **không** được giữ. Dòng đã đóng thì ở lại, kèm ngày và thứ đã đóng nó, để người đọc kiểm được
   lời khai. Sáu loại: lệnh kiểm giữ ít hơn dòng sổ nó chứng minh; luật không có lệnh kiểm nào;
   báo cáo hay lệnh kiểm gây hiểu sai; chỉ chạy trên một loại repo; đã dựng nhưng chưa ai thử; và
   tài liệu nơi khác dạy ngược lại.
2. **Ba ngăn cho mọi điều còn hở**, đúng ba ngăn của lộ trình. `fix`: dự án này đóng, lộ trình nói
   khi nào. `keep`: nhận là vậy, ghi ra để không ai trông cậy nhiều hơn. `hand-off`: việc sửa
   thuộc repo khác, dòng ghi tên repo đó.
3. **Lệnh kiểm cho chính sổ đó**, trong bài kiểm của plugin: dòng đủ trường, mã không trùng, từ
   vựng đã khai và mọi từ đã khai đều có dòng dùng, dòng đóng phải nói cái gì đóng nó, dòng
   hand-off phải nói repo nào. Lệnh kiểm có ca đỏ của chính nó.
4. **Bản audit nói ra chỗ mình mù.** Mỗi báo cáo in số giới hạn đang mở và đang đóng, rồi gọi tên
   những giới hạn có thể để cổng xanh trong khi thứ nó giữ đã hỏng. Một báo cáo không nói chỗ mù
   thì đọc như một báo cáo mạnh hơn nó thật sự là.
5. **Bộ đề thử cố định**, `docs/trials/`. Mỗi vai một đề chuẩn không đổi giữa các lần, để các con
   số thành một chuỗi; mỗi lần thêm một đề dò viết mới, nhắm vào phần vừa dựng. Câu trả lời của
   người niêm phong sẵn, mỗi câu một tệp, viết bằng lời thường chứ không bằng giá trị. Kết quả vào
   `docs/trials/results.tsv`, cột chính là số chỗ tác tử phải đoán.

## Consequences

- Sổ mở với 74 dòng: 69 đang mở, 5 đã đóng. Trong 69 dòng mở có 20 ngăn `fix`, 46 ngăn `keep`, 3
  ngăn `hand-off` (hai cho Repo Standards, một cho delivery-loop). 13 dòng ở mức nặng nhất: chúng
  có thể để cổng xanh trong khi thứ chúng giữ đã hỏng.
- Năm dòng đóng ngay khi mở sổ, vì việc sau đã đóng chúng: luật cho khái niệm mới vào mô hình dữ
  liệu (quyết định 0021); hai hình dạng sổ linh kiện (quyết định 0023); tầng design của Repo
  Standards đã vào nhánh chính (đọc ngày 2026-11-13); tệp câu trả lời niêm phong lộ hết (bộ đề
  hôm nay); và «cài plugin không đổi gì» (các lát từ 0005 trở đi).
- Chuỗi số của sáu lần thử cũ chỉ điền được chỗ đề bài nói rõ: độ phủ của vai dẫn dắt ở lần bốn,
  năm, sáu, và số chỗ phải đoán của vai dựng màn ở lần năm (6) và lần sáu (3). Mọi ô khác để
  trống, và cả sáu lần đánh dấu `ad-hoc`: không so với lần bảy trở đi được.
- Việc chưa bắt đầu thì **không** vào sổ giới hạn: nó là việc trên kế hoạch, không phải giới hạn
  của thứ đã dựng. Mười một mục như vậy ở lại đề bài và trang bàn giao.
- Giới hạn của chính cơ chế này, đã có dòng trong sổ: không gì đỏ khi một lần thử chạy mà không ai
  thêm dòng vào chuỗi số; và đề chuẩn chạy trên một repo lớn dần, nên hai lần chạy không phải cùng
  một việc.
