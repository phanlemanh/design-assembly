---
type: decision
title: "Lệnh find tra kho từ gần tới xa, dừng ở tầng đầu tiên trả lời"
links:
  - wiki/specs/0006-the-reusable-store.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
  - wiki/decisions/0046-one-frame-for-every-document.md
  - wiki/decisions/0053-a-command-says-which-screens-a-change-reaches.md
sources:
  - plugins/design-assembly/scripts/find.mjs
  - plugins/design-assembly/references/starter.json
  - plugins/design-assembly/skills/find/SKILL.md
  - plugins/design-assembly/scripts/command.mjs
  - plugins/design-assembly/tests/test-find.mjs
  - docs/trials/reusable-store-on-copies.mjs
  - docs/trials/reusable-store-on-copies.md
  - "chủ repo, 2026-11-19: «Làm 3.2»; cho sao chép ba repo để đo: «Cho cả ba»"
---

# 0059 Lệnh find tra kho từ gần tới xa, dừng ở tầng đầu tiên trả lời

## Status

Accepted, 2026-11-19. Mục 3.2 của kế hoạch, theo phần B1 của đề bài 0006 mà chủ repo đã duyệt. Máy chọn cách làm trong
khuôn đề bài; chỗ lệch và chỗ mở rộng nằm cuối mục Decision.

## Context

Trước khi dựng một linh kiện, một khối hay một màn, người và tác tử cần biết kho đã có thứ đó chưa. Trả lời câu ấy hôm
nay nghĩa là đọc sổ nhập kho, thư mục linh kiện, trang kiểu màn và danh mục của nguồn ngoài, từng thứ một. Repo kiểm chứng
đã tự viết một lệnh tra danh mục theo chữ; plugin chưa có. Mục 3.1 đã cho sổ nguồn ngoài và các khoá mới của sổ nhập kho;
`find` là lệnh đầu tiên đọc chúng.

## Decision

1. **Một lệnh chỉ đọc, `scripts/find.mjs`, theo hợp đồng lệnh chung.** Chữ của nhu cầu hoặc một tên đứng trước các cờ;
   `--kind`, `--limit` (mặc định 5), `--target`, `--json`, `--out`. Thoát 0 khi có thứ khớp, 1 khi không, 2 khi gọi
   sai hoặc repo không đọc được. Không gọi mô hình, không dùng mạng, không chạy tiến trình con, không ghi gì ngoài thư mục
   `--out`. Một skill `find` gọi nó.
2. **Bốn tầng, gặp ở tầng nào dừng ở tầng đó.**
   - Tầng 1, kho của repo: các khối của sổ nhập kho (tên, nhu cầu, mô tả, và tên linh kiện của tệp khối), các linh kiện
     (sổ linh kiện dựng trong bộ nhớ, hoặc đọc thư mục của thư viện qua bộ chuyển khi repo không giữ sổ), các trang kiểu
     màn.
   - Tầng 2, bộ khởi đầu của plugin qua bảng mới `references/starter.json`.
   - Tầng 3, kho chung của họ sản phẩm: chưa có, `searched` nói vậy.
   - Tầng 4, các nguồn ngoài đã ghim, theo `order`.

   Tầng không được đọc vì tầng gần hơn đã trả lời vẫn có dòng trong `searched`, với `read: null` và lý do.

3. **Khớp theo chữ.** Chữ được cắt ở mọi dấu không phải chữ cái hay chữ số và ở chỗ đổi hoa thường. Một mục khớp khi nó
   giữ mọi từ của lời tra, hoặc lời tra bằng tên hay khoá nhu cầu của nó. Mục chỉ giữ một phần các từ là gần khớp: được
   kê, không làm dừng việc tra. Xếp: nguồn ngoài theo `order`, rồi mục bằng tên hay nhu cầu, rồi nhiều từ trùng hơn,
   rồi theo tên.
4. **Một khối và linh kiện của nó là một mục.** Linh kiện mà tệp là tệp của một khối trong sổ nhập kho không được kê riêng;
   khối mang `component`, thuộc tính, biến thể và các màn dùng nó. Hỏi `--kind component` thì khối ấy cũng trả lời. Khối
   đã cho nghỉ (`retired`) hay đã gộp (`merged_into`) không bao giờ được đưa ra, và linh kiện của tệp nó cũng không: cho
   nghỉ một khối là cho nghỉ tệp của nó.
5. **Bộ khởi đầu chỉ đưa ra thứ repo dùng được và chưa có.** Mỗi mục của `starter.json` có tên, nhu cầu, loại
   (`component` hay `block`), mô tả, các tệp của `templates/owned/` và các loại bộ chuyển nó cần. Một mục thiếu bộ chuyển,
   hoặc repo đã có linh kiện cùng tên, không được đưa ra, và `searched` nói vì sao. Bộ chuyển tự nói nó có mặt hay không:
   `present(root)` mới ở bộ chuyển `components` và `source`, nên lõi vẫn không nêu tên thư viện. Một bài kiểm giữ cho bảng
   kê mọi tệp không phải bài kiểm của `templates/owned/` đúng một lần.
6. **Người nhận** một khối cho mỗi thứ khớp: là gì, ở kho nào, tệp nào, nhận gì, biến thể nào, màn nào dùng (từ
   `screensOf`), lấy từ nguồn nào ở bản ghim nào, trang của nó. **Máy nhận** `matches`, `near`, `searched` (`store`,
   `tier`, `read`, `items`, `found`, `why`) và `next`.
7. **Dòng cài đặt của một nguồn chỉ được dựng cho tên an toàn với shell** (`[\w@./:-]`). Tên lấy từ danh mục của bên
   ngoài; tên khác thì mục vẫn được kê, không có dòng cài đặt.
8. **`readCall` nhận chữ đứng riêng khi lệnh khai `{ words: true }`,** và chỉ tra cờ trong khoá riêng của bảng cờ, nên
   chữ như `constructor` không bao giờ bị đọc thành cờ. Lệnh khác không đổi gì.
9. **Tài liệu `--out`** là báo cáo tra kho, `find-report.html`, trên khung chung; sổ giới hạn thêm vùng `find`.

Lệch và mở rộng so với đề bài 0006:

- **Bỏ dấu khi so.** Đề bài nói chữ thường. Khoá nhu cầu theo hợp đồng không có dấu (`bang-nhieu-dong`), nên lời tra «bảng
  nhiều dòng» không bao giờ «bằng nhu cầu» nếu giữ dấu. Từ được bỏ dấu (và «đ» thành «d») trước khi so.
- **Lệnh kế khi không gì khớp** nói ghi một khối mới vào sổ nhập kho, chưa nêu `intake`: lệnh ấy dựng ở mục 3.3, và một
  lệnh không được khuyên lệnh chưa có. Mục 3.3 đổi câu này.
- **Mục bộ khởi đầu không hứa dẫn dắt sẽ cài.** Dẫn dắt chỉ cài khi đủ điều kiện riêng (bảng của sàn, thư viện báo kết
  quả); `next` bảo chép tệp mẫu và xem tệp ấy nhập gì.

## Consequences

- Số đo trên bản sao ở [`docs/trials/reusable-store-on-copies.md`](../../docs/trials/reusable-store-on-copies.md), đo lại
  được bằng `docs/trials/reusable-store-on-copies.mjs`. Trên bốn repo, mọi lần gọi thoát 0 hoặc 1, gọi hai lần cho cùng
  JSON, và cây thư mục (kể cả tệp git bỏ qua) không đổi.
- **Điều mục 3.1 còn để «chưa đo» nay đã đo.** Trên bản sao repo kiểm chứng, một tệp nguồn với `pin_file` trỏ thẳng vào
  tệp ghim sẵn có của repo ấy qua phép kiểm hình dạng; bản chụp khớp `sha256` của cả hai tệp; bộ đọc đưa ra 1 969 mục
  (678 khối, 27 linh kiện, 1 264 ví dụ). Thêm một byte vào bản chụp thì nguồn thành «không đọc được» và không mục nào của
  nó được đưa ra.
- Ở repo nhiều gói và repo web ngoài họ, `find` không thấy linh kiện ở `src/` tầng trên cùng, như `audit`; dòng giới hạn
  `audit-workspace-reads-top-src-only` nay nói cả `find`. Nhu cầu viết bằng tiếng Việt không khớp danh mục viết bằng tiếng
  Anh: dòng giới hạn mới `find-matches-words-not-meaning`.
- Bài kiểm mới: 24 ở `test-find.mjs`, thấy đỏ trước khi có mã; `find` vào `test-command-contract.mjs` (một repo dựng tạm
  mới có sổ nhập kho) và `test-document.mjs` (hai trường mới cho từng lệnh: `args`, và `broken` cho khối kiểm chỉ hợp với
  `status`, `audit`). Năm cách tạm làm hỏng mã đều bị bắt: không dừng ở tầng gần, gần khớp thành khớp, đưa khối đã cho nghỉ,
  bỏ qua bộ chuyển, không khớp mà thoát 0. Bài «đổi tên không đổi dữ kiện» của 0058 nay cho script cũ đọc `references/`
  hiện tại, vì một dòng giới hạn mới không phải thay đổi của việc đổi tên.
- Một tác tử độc lập đọc lại thay đổi: không lỗi nặng, không lần sập nào; sáu điều mức vừa và vài điều nhẹ, máy kiểm lại
  trên mã. Đã sửa, mỗi điều có bài kiểm thấy đỏ trước: khối che tên linh kiện của nó; chữ như `constructor` bị đọc thành
  cờ; nguồn ngoài xếp theo tên thay vì `order`; tên lạ từ danh mục lọt vào dòng cài đặt; lời tra không có chữ nào thoát 1;
  sổ nhập kho có `blocks` không phải danh sách đọc như sổ rỗng; đường dẫn sổ nhập kho ra ngoài repo; phép kiểm sổ linh kiện
  thiếu thư mục làm cả lệnh thoát 2; mục bộ khởi đầu hứa dẫn dắt sẽ cài. Không sửa: khối đã cho nghỉ che linh kiện cùng
  tệp (mục 4 nói vì sao).
- Lần đo đầu trên ứng dụng mẫu thấy `find data table` đưa `TableActions` của bộ khởi đầu, trong khi ứng dụng mẫu đã cài nó;
  mục 5 sửa điều đó, có bài kiểm.
- Số bản plugin lên `0.10.0`: thêm một lệnh.
