---
type: decision
title: "Một repo được giữ sổ linh kiện ngoài git: lựa chọn của repo, cổng tự vẽ lại, và một phép kiểm giữ nó ngoài git"
links:
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0048-a-ninth-stage-ledgers-stop-riding-pull-requests.md
  - wiki/decisions/0009-component-manifest.md
  - wiki/decisions/0047-tool-stamp-upgrade-and-the-version-rule.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/check.mjs
  - plugins/design-assembly/templates/tools/design-assembly/components.mjs
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/tests/test-components.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - design/theme.json
  - .gitignore
  - "chủ repo, 2026-11-16: «Duyệt đề bài, luôn nhớ vai trò mà mục đích là hoạt động trên mọi repo và giai đoạn repo.»"
---

# 0049 Một repo được giữ sổ linh kiện ngoài git: lựa chọn của repo, cổng tự vẽ lại, và một phép kiểm giữ nó ngoài git

## Status

Accepted, 2026-11-16. Bước 8.1a của đề bài 0005. Máy chọn cách làm trong khuôn đề bài đã duyệt; ba chỗ lệch với chữ
của đề bài ghi ở mục Decision.

## Context

Sổ linh kiện là bản chụp của mã nguồn linh kiện, nhưng nằm trong git. PR nào đụng một linh kiện cũng phải ghi lại tệp
này, nên hai PR như vậy luôn gặp nhau ở nó (14 trên 30 PR ở repo kiểm chứng). Đề bài 0005 muốn tệp thôi đi theo PR.
Chủ repo duyệt đề bài kèm một lời dặn: plugin phải chạy được trên mọi repo, ở mọi giai đoạn của repo. Vì vậy cách làm
không được buộc repo nào đổi, và không được vỡ ở repo chưa có gì.

## Decision

1. **Giữ sổ linh kiện ngoài git là lựa chọn của từng repo, tắt cho tới khi repo bật.** Lựa chọn nằm trong dữ liệu công
   cụ của repo. Bật bằng `components.mjs --out-of-git`, tắt bằng `--in-git`. Repo không bật thì không gì đổi: không
   phép kiểm mới, không tệp nào được viết thêm, sổ thiếu vẫn là lỗi như trước.
2. **Lệnh bật không đụng vào git.** Nó ghi lựa chọn và nêu hai việc còn lại cho người: thêm tệp vào `.gitignore`, và
   đưa tệp ra khỏi chỉ mục của git. Cho tới khi người làm xong, cổng đỏ và nói rõ thiếu việc nào.
3. **Cổng tự vẽ lại tệp trước khi kiểm.** Ở repo đã bật, lệnh cổng viết lại sổ linh kiện từ mã nguồn khi tệp thiếu
   hoặc cũ, rồi mới chạy các phép kiểm. Nhờ vậy một bản chép sạch có tệp, và thứ gì đọc tệp sau cổng không đọc phải
   bản cũ. Tệp mang hình dạng mới hơn công cụ thì không bị ghi đè.
4. **Một phép kiểm mới, `untracked`, giữ tệp ở ngoài git.** Nó đỏ khi git đang theo dõi tệp, và đỏ khi git không bỏ
   qua tệp. Như mọi phép kiểm của công cụ, nó được thấy đỏ trên một bản sao bị đổi. Ở thư mục không nằm trong git,
   hoặc trên máy không có git, nó không có gì để nói và cổng vẫn xanh. Khi git có đó mà không chịu trả lời (bản chép
   thuộc người dùng khác, như ở một số máy CI), phép kiểm đỏ và nêu lý do, thay vì xanh mà không hỏi được gì.
5. **Lựa chọn sống qua lần chạy kế của cuộc dẫn dắt và của lệnh nhận.** Cuộc dẫn dắt dựng lại danh sách phép kiểm mỗi
   lần chạy, nên nó đọc lựa chọn cũ và mang theo; nó không tự bật. Repo đổi đường dẫn của sổ thì lựa chọn đi theo sổ.
6. **Kho này bật lựa chọn ấy.** Sổ linh kiện của kho ra khỏi git; cổng giữ 37 quyết định bằng 44 phép kiểm.

Lệch với đề bài 0005:

- Đề bài viết phép kiểm «sổ khớp mã» sẽ đổi thành «sinh được và đúng hình dạng». **Phép kiểm cũ giữ nguyên.** Vì cổng
  đã vẽ lại tệp trước khi kiểm, phép so cũ vẫn đúng và vẫn bắt được trường hợp tệp trên đĩa bị sửa tay sau đó.
- Đề bài viết «lệnh sinh chạy trước cổng». **Chính lệnh cổng làm việc đó**, không phải một bước riêng của `make`. Lý
  do: repo không có `Makefile`, hoặc có tệp `make` bản cũ, vẫn phải được phục vụ.
- Đề bài để việc bật cho `upgrade`. **Bật là một lệnh của công cụ đã cài**, repo ở giai đoạn nào cũng gọi được.
  `upgrade` sẽ gọi cùng hàm ấy ở bước 8.4.

## Consequences

- PR ở kho này không còn mang sổ linh kiện. Người duyệt muốn xem sổ thì chạy `make design-components`.
- Đã thử trên bốn dáng repo, đều là repo dựng tạm: do cuộc dẫn dắt dựng, đã nhận hệ có sẵn, không có linh kiện nào, và
  thư mục không nằm trong git. Chưa thử trên repo kiểm chứng; chưa thử `upgrade` trên repo đã bật.
- Mười hai bài kiểm mới. Tám bài đã được thấy đỏ trước khi dựng hoặc trước khi sửa. Bốn bài xanh từ lần chạy đầu, vì
  chúng giữ hành vi cũ hoặc chạy trên dáng repo mà mã cũ vốn đã xử lý đúng: repo không bật, repo không có linh kiện,
  thư mục ngoài git, repo đã nhận.
- Một tác tử độc lập đọc lại thay đổi trước khi commit: không lỗi nặng, bốn điểm mức vừa, đều đã sửa kèm bài kiểm. Đó
  là: cổng xanh nhầm khi git không trả lời; tên tệp có dấu cách hay chữ ngoài ASCII không khớp; lựa chọn rơi mất khi
  sổ đổi đường dẫn; và một bài kiểm không chứng minh được điều nó nói.
- Ba dòng giới hạn mới, đều đang mở: chỉ sổ linh kiện có lựa chọn này (sổ token và sổ cột thì chưa); thứ đọc tệp
  trước khi cổng chạy trên bản chép sạch sẽ không thấy tệp; hai việc trong git để cho người làm.
- Kit nghiệm thu đọc sổ linh kiện ở đúng đường dẫn cũ. Việc nó xử lý thế nào khi tệp không còn trong git vẫn chưa thử;
  đó là điều kiện trước của bước 8.4.
- Số bản plugin lên `0.2.0`.
