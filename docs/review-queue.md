# Việc chờ chủ repo xem

Từ ngày 2026-11-15 hàng chờ không còn viết ở trang này. Nó là dữ liệu, và lệnh `decide` của plugin in
nó thành một tờ trình (quyết định
[0043](../wiki/decisions/0043-decide-reads-ledger-rows-and-a-waiting-list-kept-as-data.md)). Từ ngày
2026-11-17 mỗi câu là một tệp ở [`design/waiting/`](../design/waiting/), tên tệp là mã câu (quyết
định [0054](../wiki/decisions/0054-the-decision-ledger-stands-in-for-the-head-of-design.md)).

Hàng chờ gom ngày 2026-11-14, theo quyết định
[0032](../wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md). Khi thành dữ liệu,
27 dòng của trang này được chép sang đủ, từng ô đúng nguyên văn: 25 câu ở mục A, B, C, và hai việc ở
mục D mà chỉ chủ repo cho phép được. Một bài kiểm so dữ liệu với trang cũ trong lịch sử git.

## Xem tờ trình

```sh
make design-decide
```

Mỗi câu có một khuyến nghị và căn cứ. Lệnh kết thúc bằng mã 1 khi còn câu chờ, nên `make` báo lỗi ở
dòng cuối; đó không phải lỗi.

## Trả lời

Viết lời đáp vào một tệp, mỗi dòng một câu: mã câu, rồi **giữ**, **bác** kèm một câu muốn đổi thế
nào, hoặc một lời đáp bằng chữ của mình.

```text
A1 giữ
A2 bác Đổi màn mẫu thứ hai thành màn khác
C1 Màn thật
```

Xem trước, rồi ghi:

```sh
make design-decide DECIDE_ARGS="--answers TỆP --dry-run"
make design-decide DECIDE_ARGS="--answers TỆP"
```

Lời đáp được ghi vào đúng tệp của câu ấy trong `design/waiting/`, kèm tên người đáp và ngày.
Dòng bị bác không bị xoá: nó giữ nguyên, kèm câu chủ repo đã nói.

Máy không tự đánh dấu dòng nào là đã duyệt, và không tự viết tệp lời đáp.

Hai việc ở mục D (cho phép từng bước ở repo khác, cho phép chạy phép đo tốn tiền) vẫn nằm trong tờ
trình, nhưng không trả lời bằng giữ hay bác: chủ repo cho phép từng lần, bằng lời.
