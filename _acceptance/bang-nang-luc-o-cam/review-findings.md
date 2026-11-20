# Review findings: bang-nang-luc-o-cam (round 1)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kit executors pinned to the owner's absolute home path in a committed, public config**
  Người dùng thấy gì: Người khác tải repo công khai về sẽ không chạy lại được các bước kiểm nghiệm vì chúng trỏ vào thư mục riêng trên máy của chủ repo. Sản phẩm cho người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người dựng lại bằng chứng trên máy khác, không mất dữ liệu, và chủ repo tự đổi được sau khi thử nghiệm xong.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Project settings enable plugins from a marketplace the repo never declares**
  Người dùng thấy gì: Ai tải repo về sẽ thấy bật các tiện ích mà máy họ không tìm được nguồn, nên có thể gặp cảnh báo hoặc thiếu tiện ích. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ là cảnh báo cấu hình cho người đóng góp, và gỡ hoặc chuyển sang cấu hình cá nhân rất rẻ.
  file: `.claude/settings.json`
  severity: low
  Đề xuất: known-limits

- **same-outputs guard compares only `status --json`, not the printed board lines it claims to allow**
  Người dùng thấy gì: Bài đối chiếu đầu ra cũ và mới có thể bỏ sót một thay đổi ngoài ý muốn ở bản in cho người đọc của lệnh status. Người dùng chỉ gặp rủi ro nếu có thay đổi lạ thật sự lọt qua.
  Căn cứ: Là lỗ hổng của công cụ kiểm chứ không phải lỗi sản phẩm, chưa thấy thay đổi lạ nào, và có thể bổ sung phép so sánh sau.
  file: `_acceptance/bang-nang-luc-o-cam/rang/same-outputs.sh`
  severity: low
  Đề xuất: known-limits

- **Machine faces of sockets with no plug claim a rule is held by `make design-assembly` when no check holds it**
  Người dùng thấy gì: Bảng năng lực nói một số quy tắc đã có kiểm tra trong khi thực tế chưa có, nên người hoặc tác tử đọc bảng có thể tin rằng quy tắc được giữ. Lỗi lọt qua mà không ai báo.
  Căn cứ: Gây hiểu nhầm về độ an toàn nhưng không mất dữ liệu; chữa cần định nghĩa lại cách bảng khai quy tắc chưa được giữ, nên đáng làm thành việc riêng.
  file: `plugins/design-assembly/references/capabilities.json`
  severity: medium
  Đề xuất: new-contract

- **Status drops plug-file read problems without saying so**
  Người dùng thấy gì: Nếu một tệp khai phích bị hỏng, bảng ổ cắm trong status chỉ lặng lẽ không hiện phích đó thay vì cảnh báo. Người dùng có thể tưởng ổ đó chưa có phích.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi tệp bị hỏng, bộ kiểm của plugin vẫn bắt được, và sửa lại thì đơn giản.
  file: `plugins/design-assembly/scripts/capabilities.mjs`
  severity: low
  Đề xuất: known-limits

- **same-outputs.sh crashes on the status check if the base status output is not JSON**
  Người dùng thấy gì: Khi đầu ra của lệnh status ở bản gốc không đọc được, bài đối chiếu báo lỗi sai nguyên nhân thay vì nêu rõ. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm thông báo lỗi của công cụ kiểm khó hiểu hơn, chạy lại là thấy, và công cụ này dùng một lần cho mục này.
  file: `_acceptance/bang-nang-luc-o-cam/rang/same-outputs.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3: kiểm "chuỗi có mặt" trong khi lời hứa là QUAN HỆ giữa ô cắm và bảng năng lực**
  Người dùng thấy gì: Bài kiểm bảng ổ cắm chưa chặt, nên nếu sau này status gán nhầm trạng thái hay giới hạn cho một ổ thì bài kiểm vẫn xanh. Hiện chưa thấy hiển thị sai.
  Căn cứ: Rủi ro chỉ nảy sinh khi có thay đổi sau này, không ảnh hưởng người dùng hôm nay, và siết bài kiểm sau rất rẻ.
  file: `plugins/design-assembly/tests/test-status.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: assertion âm tính đứng một mình cho nhánh detect.file (reui), không có đối chứng dương**
  Người dùng thấy gì: Chưa có bài kiểm xác nhận status nhận ra phích ngoài khi nó nằm dưới dạng một tệp trong repo, nên nếu cách nhận này hỏng thì không ai biết. Hiện chưa thấy nhận sai.
  Căn cứ: Chỉ là lỗ hổng độ phủ của bài kiểm, không mất dữ liệu, và thêm một ca kiểm sau là xong.
  file: `plugins/design-assembly/tests/test-status.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture viết tay đúng khuôn bên đọc cho bộ dò ghi sổ (stray ledger)**
  Người dùng thấy gì: Bộ dò chuyện một script ghi nhầm sổ khác chỉ được thử với một cách viết quen thuộc, nên cách viết lạ có thể lọt qua. Giới hạn này đã được ghi nhận từ trước.
  Căn cứ: Hợp đồng đã nhận trước giới hạn của phép dò tĩnh này, hậu quả nhẹ và không mất dữ liệu.
  file: `plugins/design-assembly/tests/test-capabilities.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, .claude/settings.json, _acceptance/bang-nang-luc-o-cam/rang/same-outputs.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
