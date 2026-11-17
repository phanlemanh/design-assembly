---
type: decision
title: "Bản sao nông tự lấy phần lịch sử mà hai phép kiểm của sổ quyết định cần"
links:
  - wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md
  - wiki/decisions/0055-the-reference-repository-takes-0-7-0-without-the-two-rows-of-8-3.md
  - wiki/specs/0005-ledgers-stop-riding-pull-requests.md
sources:
  - plugins/design-assembly/templates/tools/design-assembly/owner-calls.mjs
  - plugins/design-assembly/tests/test-owner-calls-shallow.mjs
  - plugins/design-assembly/references/checks.md
  - plugins/design-assembly/references/limits.json
  - docs/trials/upgrade-inventory-0-7-0.md
  - "chủ repo, 2026-11-17: «Làm 0.7.1»"
---

# 0056 Bản sao nông tự lấy phần lịch sử mà hai phép kiểm của sổ quyết định cần

## Status

Accepted, 2026-11-17. Một phần của mục 8.4 trong kế hoạch, plugin bản 0.7.1. Hướng sửa là của chủ repo, chọn ở quyết
định 0055: sửa ở plugin, không ở repo kiểm chứng. Máy chọn cách làm.

## Context

`decision-sheet` và `owner-calls` so nhánh với chỗ nó tách khỏi nhánh chính. Quyết định 0054, mục 8, chọn: có git mà
không tìm ra nhánh chính thì cả hai đỏ, để một màn mới không lọt qua.

CI thường dựng bản sao nông, sâu một commit, nhiều khi không có tham chiếu nào tới nhánh chính. Repo kiểm chứng giữ CI
nông và đòi `make check` xanh trong bản sao ấy. Vì vậy ở bản 0.7.0, hai phép kiểm luôn đỏ ở đó, và chủ repo hoãn hai dòng
này (quyết định 0055).

## Decision

1. **Trong bản sao nông mà không tìm ra chỗ tách, hai phép kiểm tự lấy lịch sử từ remote tên `origin`.**
   - Trước hết lấy nhánh chính, 50 commit.
   - Rồi lấy sâu thêm ở cả hai phía, commit đang đứng và nhánh chính: 50, 100, 200, 400, 800, cho tới khi hai phía gặp
     nhau.
   - Sau năm vòng mà chưa gặp thì lấy trọn lịch sử.
   - Lấy từng bước vì repo lớn có thể có rất nhiều commit; phần lớn nhánh tách gần đỉnh nhánh chính.
2. **Nhánh chính của remote: `main`, rồi `master`. Không bao giờ lấy theo `HEAD` của remote.**
   - Thứ tự này khớp với thứ tự hai phép kiểm vẫn thử ở máy.
   - Lý do bỏ `HEAD` là đo được. Script của repo kiểm chứng dựng bản sao từ chính thư mục làm việc, mà `HEAD` của thư mục
     ấy là nhánh đang làm. Lấy theo `HEAD` thì nhánh bị so với chính nó, và màn mới lọt qua. Lần chạy thử đầu đã gặp
     đúng chuyện ấy. Người soát độc lập chỉ ra rằng để `HEAD` làm đường lui cuối cũng vẫn hở như thế, khi remote không có
     `main` lẫn `master`.
   - Repo có nhánh chính tên khác thì khai tên ấy trong dữ liệu công cụ. Tên viết kèm `origin/` hay `refs/heads/` cũng
     được.
3. **Không bao giờ chờ.**
   - Mọi lệnh git của hai phép kiểm chạy với `GIT_TERMINAL_PROMPT=0`. Lệnh ssh chạy ở chế độ không hỏi, trừ khi repo đã
     đặt lệnh ssh của riêng mình.
   - Mỗi lần gọi tới remote dừng sau hai phút.
4. **Không lấy được thì vẫn đỏ, kèm lời của git.**
   - Bản sao nông không có `origin`: đỏ.
   - Remote không có `main` lẫn `master`, và dữ liệu công cụ không khai tên: đỏ.
   - Lệnh lấy thất bại hay quá giờ: đỏ.
   - Bản sao đầy đủ thì không lấy gì; cách làm cũ giữ nguyên.
5. **Cổng nói khi nó đã lấy lịch sử.** Một dòng ghi chú ở cả hai phép kiểm nêu nhánh đã lấy và remote.
6. **Lịch sử thiếu chỉ làm phép so khắt khe hơn, không lỏng hơn.**
   - Chỗ gặp nhau tìm thấy trên lịch sử chưa đủ luôn là một tổ tiên chung thật.
   - Nếu có một tổ tiên chung mới hơn mà chưa lấy về, chỗ tìm thấy cũ hơn nó. Khi ấy nhánh bị tính là thêm nhiều hơn,
     nên phép kiểm đỏ hơn chứ không xanh sai.
7. **Hai dòng giới hạn mới** cho hai điều thấy ở repo kiểm chứng, theo quyết định 0055:
   - `decision-sheet-reads-tags-in-test-data`: chuỗi `decision:ID` trong dữ liệu của một bài kiểm bị đọc như bằng chứng;
   - `fragment-copy-older-than-the-folder`: bản sao một tệp nằm ngoài git có thể cũ hơn thư mục mảnh.

   Dòng `owner-calls-needs-git-and-a-main-branch` viết lại cho khớp cách làm mới; nó vẫn mở, vẫn «keep».

## Consequences

- Trên bản sao nông của chính repo này, dựng như script của repo kiểm chứng:
  - với bản 0.7.0, hai phép kiểm đỏ «no main branch»;
  - với bản 0.7.1, cổng xanh, và in rằng đã lấy `main` từ `origin`;
  - thêm một trang màn mới vào bản sao ấy thì `owner-calls` đỏ đúng mục `pattern:board`.
- Bài kiểm mới: 13 bài ở `test-owner-calls-shallow.mjs`.
  - Có hai kiểu bản sao nông: kiểu repo kiểm chứng (lấy một commit theo mã, rồi thêm `origin`) và kiểu PR của CI (chỉ
    commit gộp).
  - Có các trường hợp: nhánh cách xa, lấy từng bước, lấy trọn khi các bước không đủ, tên nhánh khai trong dữ liệu, commit
    riêng mà remote không có, remote không có, remote không tới được, remote có `HEAD` ở nhánh đang làm, remote không
    có `main` lẫn `master`, và tên nhánh có tiền tố.
  - Mười bài được thấy đỏ trước khi có mã. Bài cho lần đẩy thẳng lên nhánh chính xanh sẵn, vì cách cũ đã đúng ở đó. Hai
    bài viết sau mã (commit riêng, lấy trọn) được thấy đỏ bằng đột biến.
  - Sáu bản đột biến đều bị bắt: bỏ việc lấy, bỏ từng bước, bỏ bước lấy trọn, chỉ lấy phía nhánh chính, bỏ đường lui
    khi commit không có trên remote, và không lấy theo tên khai.
- Một phép kiểm nay có thể ghi vào repo: tham chiếu `refs/remotes/origin/<nhánh>` và độ sâu của bản sao nông.
  - Việc ấy chỉ xảy ra trên bản sao nông, và chỉ khi không tìm ra chỗ tách.
  - Một bản sao nông trên máy của người, chạy `make check`, cũng được lấy thêm lịch sử. Khi lịch sử dài hơn mọi bước,
    nó được lấy trọn.
- Người soát độc lập đọc thay đổi. Kết luận có một lỗi nặng và hai lỗi vừa; cả ba đã sửa:
  - **nặng:** lấy theo `HEAD` của remote khi không có `main` lẫn `master` có thể so nhánh với chính nó. Nay đường ấy bị
    bỏ, và có bài kiểm thấy đỏ trước khi sửa;
  - **vừa:** lệnh gọi remote không có hạn giờ. Nay có hai phút, và ssh không hỏi;
  - **vừa:** việc ghi vào repo chưa được nói ra. Nay `checks.md` và dòng giới hạn nói rõ.

  Các điểm nhẹ đã sửa: ghi chú «đã lấy» nay in cả ở nhánh nơi repo gặp plugin; có thêm bài cho tên nhánh có tiền tố;
  hàm lấy lịch sử tách làm ba. Hai trường hợp chưa có bài kiểm: remote có cả `main` lẫn `master`, và một `origin/main`
  cũ có sẵn trong bản sao nông. Trường hợp sau chỉ làm phép so khắt khe hơn, theo mục 6.

- Repo kiểm chứng cần lên đời thêm một lần để thêm hai dòng. Bài kiểm bản sao nông của repo ấy đã có mục miễn cho
  `owner-calls.mjs`.
- `affected` vẫn dừng trên bản sao nông khi không có `--base` hay `--files`. Lệnh ấy chưa dùng ở cổng, và bên chạy nó là
  việc của Repo Standards.
- Số bản plugin lên `0.7.1`.
