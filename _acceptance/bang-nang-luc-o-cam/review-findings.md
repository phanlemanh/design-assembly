# Review findings: bang-nang-luc-o-cam (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **New `unheld` and `step_of` fields are reference fields that nothing validates, which breaks the table's own pattern**
  Người dùng thấy gì: Two new notes in the capability table, one saying a capability is not held by any check and one saying which route it belongs to, are not checked by anything. A typo there would still pass the checks and show a slightly wrong table, though the data is correct today.
  Căn cứ: The consequence is mild: only an internal reference table could drift, nothing is lost for the user, and it is easy to notice and correct later.
  file: `plugins/design-assembly/references/capabilities.json`
  severity: medium
  Đề xuất: known-limits

- **Nothing validates the new `unheld` and `step_of` fields, so a wrong limit row or route id passes without an error**
  Người dùng thấy gì: If someone later points the new 'not held' note at a wrong or closed limit entry, or names a route that does not exist, the checks stay green. The status board could then show a slightly misleading reason for an empty socket.
  Căn cứ: Impact is light and recoverable: values are correct now, a wrong entry would only mislabel a reason on the board, and a fix can be made at any time without data loss.
  file: `plugins/design-assembly/scripts/capabilities.mjs`
  severity: low
  Đề xuất: known-limits

- **Kit executors pinned to the owner's absolute home path in a committed, public config (r1)**
  Người dùng thấy gì: Người khác tải repo công khai về sẽ không chạy lại được các bước kiểm nghiệm vì chúng trỏ vào thư mục riêng trên máy của chủ repo. Sản phẩm cho người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người dựng lại bằng chứng trên máy khác, không mất dữ liệu, và chủ repo tự đổi được sau khi thử nghiệm xong.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Project settings enable plugins from a marketplace the repo never declares (r1)**
  Người dùng thấy gì: Ai tải repo về sẽ thấy bật các tiện ích mà máy họ không tìm được nguồn, nên có thể gặp cảnh báo hoặc thiếu tiện ích. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ là cảnh báo cấu hình cho người đóng góp, và gỡ hoặc chuyển sang cấu hình cá nhân rất rẻ.
  file: `.claude/settings.json`
  severity: low
  Đề xuất: known-limits

- **same-outputs guard compares only `status --json`, not the printed board lines it claims to allow (r1)**
  Người dùng thấy gì: Bài đối chiếu đầu ra cũ và mới có thể bỏ sót một thay đổi ngoài ý muốn ở bản in cho người đọc của lệnh status. Người dùng chỉ gặp rủi ro nếu có thay đổi lạ thật sự lọt qua.
  Căn cứ: Là lỗ hổng của công cụ kiểm chứ không phải lỗi sản phẩm, chưa thấy thay đổi lạ nào, và có thể bổ sung phép so sánh sau.
  file: `_acceptance/bang-nang-luc-o-cam/rang/same-outputs.sh`
  severity: low
  Đề xuất: known-limits

- **Machine faces of sockets with no plug claim a rule is held by `make design-assembly` when no check holds it (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bảng năng lực nói một số quy tắc đã có kiểm tra trong khi thực tế chưa có, nên người hoặc tác tử đọc bảng có thể tin rằng quy tắc được giữ. Lỗi lọt qua mà không ai báo.
  Căn cứ: Gây hiểu nhầm về độ an toàn nhưng không mất dữ liệu; chữa cần định nghĩa lại cách bảng khai quy tắc chưa được giữ, nên đáng làm thành việc riêng.
  file: `plugins/design-assembly/references/capabilities.json`
  severity: medium
  Đề xuất: new-contract

- **Status drops plug-file read problems without saying so (r1)**
  Người dùng thấy gì: Nếu một tệp khai phích bị hỏng, bảng ổ cắm trong status chỉ lặng lẽ không hiện phích đó thay vì cảnh báo. Người dùng có thể tưởng ổ đó chưa có phích.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi tệp bị hỏng, bộ kiểm của plugin vẫn bắt được, và sửa lại thì đơn giản.
  file: `plugins/design-assembly/scripts/capabilities.mjs`
  severity: low
  Đề xuất: known-limits

- **same-outputs.sh crashes on the status check if the base status output is not JSON (r1)**
  Người dùng thấy gì: Khi đầu ra của lệnh status ở bản gốc không đọc được, bài đối chiếu báo lỗi sai nguyên nhân thay vì nêu rõ. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm thông báo lỗi của công cụ kiểm khó hiểu hơn, chạy lại là thấy, và công cụ này dùng một lần cho mục này.
  file: `_acceptance/bang-nang-luc-o-cam/rang/same-outputs.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3: kiểm "chuỗi có mặt" trong khi lời hứa là QUAN HỆ giữa ô cắm và bảng năng lực (r1)**
  Người dùng thấy gì: Bài kiểm bảng ổ cắm chưa chặt, nên nếu sau này status gán nhầm trạng thái hay giới hạn cho một ổ thì bài kiểm vẫn xanh. Hiện chưa thấy hiển thị sai.
  Căn cứ: Rủi ro chỉ nảy sinh khi có thay đổi sau này, không ảnh hưởng người dùng hôm nay, và siết bài kiểm sau rất rẻ.
  file: `plugins/design-assembly/tests/test-status.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: assertion âm tính đứng một mình cho nhánh detect.file (reui), không có đối chứng dương (r1)**
  Người dùng thấy gì: Chưa có bài kiểm xác nhận status nhận ra phích ngoài khi nó nằm dưới dạng một tệp trong repo, nên nếu cách nhận này hỏng thì không ai biết. Hiện chưa thấy nhận sai.
  Căn cứ: Chỉ là lỗ hổng độ phủ của bài kiểm, không mất dữ liệu, và thêm một ca kiểm sau là xong.
  file: `plugins/design-assembly/tests/test-status.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc cho bộ dò ghi sổ (stray ledger) (r1)**
  Người dùng thấy gì: Bộ dò chuyện một script ghi nhầm sổ khác chỉ được thử với một cách viết quen thuộc, nên cách viết lạ có thể lọt qua. Giới hạn này đã được ghi nhận từ trước.
  Căn cứ: Hợp đồng đã nhận trước giới hạn của phép dò tĩnh này, hậu quả nhẹ và không mất dữ liệu.
  file: `plugins/design-assembly/tests/test-capabilities.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
