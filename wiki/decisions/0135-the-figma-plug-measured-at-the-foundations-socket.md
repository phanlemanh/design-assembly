---
type: decision
title: "Phích Figma được đo theo bốn thước ở ổ nền, từ tệp .fig thật của chủ repo"
links:
  - wiki/specs/0018-figma-at-the-foundations-socket.md
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
  - wiki/decisions/0109-mobbin-measured-at-the-reference-socket.md
  - wiki/decisions/0130-bring-in-reads-a-real-export-of-variables.md
  - wiki/decisions/0133-the-figma-plug-file-and-the-pinned-export-of-variables.md
sources:
  - docs/trials/figma-plug-measured-at-foundations.md
  - docs/trials/briefs/foundations.md
  - docs/trials/figma-fig-real-sample.md
  - plugins/design-assembly/references/plugs/figma.json
  - plugins/design-assembly/references/limits.json
  - plugins/design-assembly/tests/test-bring-in.mjs
  - docs/plan/plan.json
  - "chủ repo, 2026-11-28, gõ ở phiên điều phối: «Chạy 13.4», đáp câu «Anh cho chạy lượt đo 13.4, trần 600 nghìn token, kèm chạy công cụ đọc `.fig` của bên thứ ba trên bản chép tệp của anh chứ?»"
  - "chủ repo, 2026-11-28, đáp ba câu hỏi của cầu nối trong hộp hỏi của phiên đo: «Giữ «standard»», «Giữ «floor»», «Giữ Geist Variable»"
---

# 0135 Phích Figma được đo theo bốn thước ở ổ nền, từ tệp .fig thật của chủ repo

## Status

Proposed, 2026-11-28. Mục 13.4 của kế hoạch, tiêu chí 14 của đề bài
[0018](../specs/0018-figma-at-the-foundations-socket.md). Lượt đo chạy theo lời chủ repo («Chạy 13.4»). Phán quyết ở
mục Decision là máy áp luật chọn của đề bài [0008](../specs/0008-capabilities-sockets-and-plugs.md) lên số đo; chủ repo
nhận hay bác khi duyệt trang này. Không script hay mẫu nào của plugin đổi, nên plugin giữ bản 0.79.0. `ontology/` và
hợp đồng sổ không đổi.

## Context

Phích Figma có tệp phích từ mục 13.3 ([0133](0133-the-figma-plug-file-and-the-pinned-export-of-variables.md)) và chưa
có số đo. Lối nó dẫn trước là lối tệp `.fig`: người lưu tệp về máy, tự chạy một công cụ đọc, rồi đưa tệp JSON biến cho
cầu `bring-in`. Lượt đọc thử ngày 2026-11-26 chạy trên plugin 0.76.0, trước khi cầu được sửa
([0130](0130-bring-in-reads-a-real-export-of-variables.md)), và không phải lượt đo.

Lượt này đo trên plugin 0.79.0, `main` ở `d405e7f`, từ đúng tệp hệ thiết kế ấy của chủ repo (219 256 009 byte). Số đo
và mọi lệnh ở [docs/trials/figma-plug-measured-at-foundations.md](../../docs/trials/figma-plug-measured-at-foundations.md).
Bốn thước và cách đo lấy từ [0088](0088-claude-design-system-measured-on-four-measures.md) và
[0109](0109-mobbin-measured-at-the-reference-socket.md).

Phần đọc tệp JSON là cầu của chính plugin. Thứ tệp phích thêm vào là đường từ công cụ thiết kế tới một tệp cầu đọc
được, điều cần có trên máy, và tên phích trên dòng ghim. Nên nhánh đối chứng là plugin khi không có tệp phích ấy: nó
không nói được cách lấy tệp, và người mang hệ vào phải tự đọc từng giá trị trong công cụ rồi gõ.

## Decision

1. **Phích `figma` nay là «đã đo» ở ổ nền, `beats_plugin: false`.** Ổ hướng đi, ổ thứ hai nó khai, chưa đo và không có
   mục `measured`.
2. **Số đo theo bốn thước ở ổ nền:**
   - **Giữ được không.**
     - Công cụ đọc chạy một lần trên bản chép của tệp, mạng bị chặn: thoát 0, bản xuất 1 516 734 byte, trùng từng byte
       với bản xuất ngày 2026-11-26. Tệp gốc giữ nguyên `sha256` trước và sau.
     - Tệp có 3 254 giá trị của 1 713 biến trong 43 collection. Cầu đọc 1 633 giá trị của 839 biến trong 11 collection
       của tệp; gạt 1 539 giá trị của 32 collection là bản sao của thư viện; 82 giá trị của tệp không vào: 2 của một
       biến đúng/sai, 80 alias dừng ở chỗ bản xuất không có giá trị. Không dòng `not read` nào. Một bộ đếm viết riêng,
       không dùng mã của cầu, ra cùng các số ấy.
     - Ba lỗ hổng của lượt ngày 2026-11-26 đã hết trên tệp thật (chi tiết ở trang chạy thử).
     - Ứng viên giữ bốn khoá của ổ nền (màu gốc, thang chữ, tỉ lệ thang, bo góc) và nêu một họ chữ. 1 633 giá trị đọc
       được dùng để tính ra bốn khoá ấy; các màu khác, khoảng cách và tám trục mode không thành token. Token của ổ nền
       vẫn do phích `tokens` của plugin viết từ hướng được chọn.
     - Ba giá trị ngược sổ (thang chữ, bo góc, font chữ thường) thành ba câu hỏi, đủ cả ba. Màu gốc trùng sổ.
     - Giữ bằng lệnh: dòng sổ nguồn có ghim; `variables-source --check` thoát 1 khi tệp đổi một byte. Cổng thì vẫn xanh
       với tệp đã đổi (dòng giới hạn `variables-pin-not-held-by-the-gate`).
   - **Người dùng phải đoán mấy chỗ.**
     - Có phích, một tác tử chỉ có đề chuẩn và skill `bring-in`: **0 chỗ** phải tự quyết về hình dạng dữ liệu (không cờ
       `--kind`, không `--collection`, không chọn mode, biến hay tên nào, không gõ giá trị nào). Nó tự khai 7 chỗ khác
       phải tự quyết, 3 trong đó nó không chắc là việc của mình.
     - Không phích, đếm bằng lệnh của plugin, không phải một lượt chạy: `bring-in --ways` chỉ nói «hỏi người dùng tệp»;
       bảng mẫu chỉ có ba hướng của plugin; sáu giá trị mà cầu tự đọc (màu gốc, thang chữ, tỉ lệ, bo góc, hai họ chữ)
       thì người phải tự tìm trong công cụ, chọn collection và mode, rồi gõ hay quy đổi: **6 chỗ**. Không lệnh nào so
       chúng với sổ.
     - Số lần máy đáp thay chủ repo: 0. Ba câu hỏi được hỏi chủ repo trong phiên đo, và chủ repo đáp cả ba.
   - **Chạy được ở đâu.**
     - Lối tệp không cần mạng: công cụ đọc, cầu và phép so ghim đều chạy khi mạng bị chặn, và không gì được gửi đi.
     - Nó cần một tài khoản Figma có quyền lưu tệp về máy, và một công cụ đọc `.fig` của bên thứ ba trên máy. Theo luật
       của 0008, cần tài khoản thì chỉ làm phích phụ.
   - **Tốn bao nhiêu.**
     - Công cụ đọc 32,7 giây; cầu 0,08 giây.
     - Tác tử của nhánh có phích: 139 499 token, 13 lần gọi công cụ, 3 phút 34 giây, theo bộ đếm của phiên.
     - Chủ repo: ba câu hỏi, một lần đáp.
     - Nhánh đối chứng không tốn token của tác tử nào vì không chạy bằng tác tử. Tổng của phiên đo ở báo cáo của phiên.
3. **Vì sao `beats_plugin: false`.** Theo luật chọn của 0008, một phích làm mặc định khi thắng cả bốn thước.
   - Thước 3 xếp nó vào phích phụ.
   - Thước 1: thứ nó để lại là một hướng ứng viên bốn khoá, không phải token của ổ nền, và ghim của bản xuất chưa được
     cổng giữ.
   - Thước 2 là chỗ nó thắng: 0 chỗ so với 6.

   Nên phích `tokens` của plugin vẫn là mặc định ở ổ nền. Phích Figma được bày với nhãn «đã đo», và bước `plugs` hỏi
   về nó ở ổ nền khi nó có trong phiên, không bao giờ khuyến nghị nó.

4. **Dòng «xong khi» thứ nhất của giai đoạn 13** được lệnh cho thấy trên tệp này, với ba điều kèm theo:
   - việc lưu tệp từ Figma không nằm trong lượt đo, vì tệp đã ở trên máy;
   - công cụ đọc do phiên đo chạy theo lời chủ repo, không do một người chạy;
   - ở tám trục mode, cầu tự lấy một mode theo luật viết sẵn và in ra, không hỏi ai.

   Dòng thứ hai được trang này và mục `measured` của tệp phích cho thấy. Giai đoạn 13 chưa đóng: mục 13.2 còn `todo`,
   và đóng giai đoạn là việc của một thay đổi khác.

5. **Đo lại** khi có bản xuất do chính Figma làm của cùng tệp để so, khi công cụ đọc đổi bản, khi cầu mang thêm khoá
   ngoài bốn khoá hôm nay, hoặc khi đo ổ hướng đi.

## Consequences

- Tệp phích `references/plugs/figma.json` có `measured.foundations` trỏ `d0135`. Ba bài kiểm của
  `tests/test-bring-in.mjs` từng giữ phích là «chưa đo» nay giữ điều mới: đã đo ở ổ nền, chưa đo ở ổ hướng đi, được bày
  ở ổ nền và không bao giờ được khuyến nghị. Cả ba được thấy đỏ trước khi tệp phích đổi.
- Sổ giới hạn: đóng `design-file-plug-unmeasured`; mở năm dòng: `design-file-plug-unmeasured-at-direction`,
  `design-file-plug-measured-on-one-file`, `bring-in-keep-leaves-the-gate-red-on-exports`,
  `bring-in-kept-export-fails-the-format-check`, `bring-in-says-no-value-goes-against-once-answered`; bốn dòng có thêm
  chỗ thấy.
- Kế hoạch: mục 13.4 xong; mục gác lại «Đo phích Figma theo bốn thước» rời phần gác lại.
- **Những chỗ máy chọn**, để chủ repo xem lại:
  1. Đề chuẩn [`briefs/foundations.md`](../../docs/trials/briefs/foundations.md) do máy viết trong lượt này, vì không
     đề nào sẵn có hợp với một lượt bắt đầu từ tệp người mang tới.
  2. Nhánh đối chứng đếm bằng lệnh, không chạy bằng tác tử, để giữ trần token (lượt đo Mobbin đã vượt trần vì chạy hai
     tác tử).
  3. Phiên đo, đứng vào chỗ «người», đặt bản xuất vào `design/outside/` của bản sao trước khi tác tử bắt đầu.
  4. Phán quyết `beats_plugin: false` là luật của 0008 áp lên số đo.
  5. Lời khuyến nghị trong ba câu hỏi là lời của chính plugin («sổ thắng nguồn ngoài»); máy không thêm lời nào của
     mình.
  6. Tác tử tự chọn: `--plug figma` cho dòng ghim, ngày ghim là hôm nay, và chạy `make design-exports` khi cổng đỏ.
- **Không kiểm:**
  - Công cụ đọc là mã của bên thứ ba, giấy phép PolyForm Shield 1.0.0. Giấy phép ấy cho phép gì chưa được đọc và kiểm.
  - Đọc `.fig` là giải mã ngược một định dạng Figma không công bố; việc ấy có hợp điều khoản của Figma không thì chưa
    kiểm.
  - Không có bản xuất do chính Figma làm của tệp này để so độ đúng. 36 biến rỗng, 11 giá trị thiếu mode và 80 alias
    dừng ở chúng có thể do tệp, có thể do công cụ đọc.
  - Chủ repo giữ cả ba giá trị của sổ, nên đường «bác, rồi chọn hướng từ Figma, rồi token được viết» chưa được đi.
  - Chưa ai nhìn bảng mẫu có hướng ứng viên bằng mắt.
  - Số chỗ tự quyết là tự khai của một tác tử; phiên đo chỉ đối chiếu lệnh, tệp và trạng thái nó để lại.
  - Lối thứ hai (bản xuất sẵn có của Figma, mục 13.2) và ổ hướng đi không nằm trong lượt này.
