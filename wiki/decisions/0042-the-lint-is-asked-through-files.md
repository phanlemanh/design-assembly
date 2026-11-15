---
type: decision
title: Lint của repo được hỏi qua tệp, có giới hạn thời gian, và báo lỗi bằng chính lời của lỗi
links:
  - wiki/decisions/0033-re-run-the-repository-lint.md
  - wiki/decisions/0035-the-named-rule-holds-the-row.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/lint.mjs
  - plugins/design-assembly/templates/tools/design-assembly/adapters/eslint.mjs
  - plugins/design-assembly/tests/test-lint.mjs
  - "chủ repo, 2026-11-15: cổng đỏ một lần ngay sau khi gộp ba PR, xanh khi chạy lại; mở phiên riêng để sửa"
---

# 0042 Lint của repo được hỏi qua tệp, có giới hạn thời gian, và báo lỗi bằng chính lời của lỗi

## Status

Accepted. Máy chọn cách sửa ngày 2026-11-15, chờ chủ repo bác. Đổi cách công cụ gọi lint mà
[0033](0033-re-run-the-repository-lint.md) mục 6 đặt ra («chạy bản repo đã cài, trong một tiến trình
riêng»); các mục khác của 0033 và 0035 giữ nguyên.

## Context

Ngày 2026-11-15, ngay sau khi gộp ba PR, cổng của kho này đỏ một lần ở bài kiểm «nhận chạy lại
lint», rồi xanh khi chạy lại. Lời báo chỉ có `the lint could not be run: node:fs:483`: đó là chỗ trong
mã của Node nơi lỗi được ném, không phải lỗi. Một repo khác đã thấy đúng dòng này một lần khi chấm hồ
sơ nghiệm thu, và khi đó lỗi bị đổ cho chuyện khác.

Đo lại ở phiên này, trên máy của chủ repo:

- **Lỗi thật** (ghi lại toàn bộ lời của tiến trình con): `EAGAIN: resource temporarily unavailable,
read`. Chạy cả thư mục bài kiểm của plugin tám lượt cùng lúc, mười sáu lượt xong thì đã có mười lần
  tiến trình lint chết như vậy. Phần lớn rơi vào bài kiểm không kiểm lời của lint, nên chỉ đôi khi
  cổng đỏ.
- **Cơ chế**, dựng lại được mỗi lần: công cụ trao câu hỏi cho tiến trình lint qua đầu vào chuẩn, và
  tiến trình đọc nó một lần, đồng bộ. Nhưng chỉ cần tệp của công cụ nhập bất kỳ thứ gì từ mô-đun
  `process` của Node, Node đã mở đầu vào chuẩn thành luồng không chờ. Khi đó, nếu tiến trình tới chỗ
  đọc trước lúc tiến trình cha kịp ghi, lệnh đọc không chờ mà báo «chưa có gì», tức EAGAIN. Máy rảnh
  thì cha luôn ghi kịp; máy bận thì không. Một tiến trình con viết bằng ngôn ngữ khác thấy đầu vào đó
  là đầu vào chờ, nên lỗi do chính Node của tiến trình con gây ra.
- **Treo**: phép thử trước đó (720 lượt đọc 200 KB qua đầu vào chuẩn) có ba tiến trình treo quá mười
  lăm phút. Phiên này không dựng lại được lần treo nào và không biết chính xác vì sao chúng treo.
  Công cụ khi đó cũng không có giới hạn thời gian, nên một tiến trình lint không trả lời giữ cổng
  của repo chờ mãi.
- **Lời báo bị cắt**: công cụ chỉ giữ dòng đầu của lời tiến trình con, mà dòng đầu là chỗ trong mã.
  Lời báo khi lint không đọc được cấu hình của repo cũng chỉ là một đường dẫn tệp.

## Decision

1. **Không còn ống nối hai tiến trình.** Công cụ viết câu hỏi vào một tệp trong một thư mục tạm của
   riêng lần gọi đó, đưa tên thư mục trên dòng lệnh, đọc lời đáp từ một tệp khác ở đó, rồi xoá thư mục,
   kể cả khi có lỗi. Tiến trình lint không có đầu vào chuẩn và không ghi gì ra đầu ra chuẩn.
2. **Có giới hạn thời gian.** Lint không trả lời trong 120 giây thì bị dừng hẳn, và cổng báo «the lint
   did not answer within N seconds», kèm tên biến môi trường `DESIGN_ASSEMBLY_LINT_SECONDS` để repo có
   lint chậm nới ra. Đã ghi xong lời đáp thì tiến trình lint thoát ngay, nên một bộ cắm của lint còn để
   lại đồng hồ chạy cũng không giữ cổng chờ.
3. **Lỗi được báo bằng chính lời của nó.** Tiến trình chết thì công cụ báo dòng mang tên và lời của
   lỗi, không báo chỗ trong mã. Lint không đọc được cấu hình của repo thì báo «the repository's lint
   failed:» kèm lời của lint, ở cả hai loại câu hỏi (tìm tệp màn nơi luật bật, và chạy đoạn mã phạm);
   trước đây chỉ loại thứ hai bắt lỗi.

## Consequences

- Năm bài kiểm mới ở `plugins/design-assembly/tests/test-lint.mjs`, mỗi bài đã thấy đỏ trên công cụ
  cũ: lỗi của lint đến tay người gọi bằng lời của nó; tiến trình chết được báo bằng lời của lỗi; lint
  không trả lời bị dừng và được nêu tên trong giới hạn; câu hỏi không còn đi qua đầu vào chuẩn; và
  tiến trình lint vẫn trả lời khi câu hỏi tới trễ 1,5 giây. Bài cuối dựng lại đúng lỗi gốc mỗi lần
  chạy: trên công cụ cũ tiến trình chết với EAGAIN, không cần máy bận.
- Sau khi sửa: cả thư mục bài kiểm của plugin chạy tám bản cùng lúc, năm lượt mỗi bản, 40 lượt mà
  không tiến trình lint nào chết; trước khi sửa, 16 lượt đã có 10 lần. Các lượt đỏ còn lại ở phép đo
  này đều là bài kiểm bảng mẫu và cuốn sổ, vì tám bản chạy trong cùng một thư mục làm việc dùng chung
  thư mục đầu ra của hai bài đó; cổng chỉ chạy một bản nên không gặp.
- Lần treo của phép thử cũ vẫn chưa được giải thích. Cách sửa bỏ đi chính thứ đã treo (đọc qua ống),
  và giới hạn thời gian biến mọi lần treo khác thành một lỗi có tên.
- Các repo đã nhận plugin vẫn chạy công cụ cũ cho tới khi bản mới được chép vào, việc này cần chủ repo
  cho phép từng nơi (giới hạn `adopt-does-not-refresh-tool`). Dòng `lint-request-read-before-written`
  của sổ giới hạn đã mở và đóng cùng lần sửa này.
