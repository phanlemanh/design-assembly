---
type: decision
title: Trang luật cho tác tử dựng màn, và dòng sổ có sẵn mà chưa có lệnh kiểm
links:
  - wiki/decisions/0010-only-a-row-is-an-answer.md
  - wiki/decisions/0014-channels-and-undo.md
  - wiki/specs/0001-design-system-for-claude-code.md
sources:
  - plugins/design-assembly/scripts/apply.mjs
  - plugins/design-assembly/scripts/adopt.mjs
  - plugins/design-assembly/templates/tools/design-assembly/ledger.mjs
  - .claude/rules/design-assembly.md
---

# 0015 Trang luật cho tác tử dựng màn, và dòng sổ có sẵn mà chưa có lệnh kiểm

## Status

Accepted theo kết quả lần chạy thử thứ ba ngày 2026-11-12 mà chủ kho yêu cầu («Chạy thử»). Hai
luật dưới đây là máy rút ra từ phát hiện của ba tác tử độc lập, chờ chủ kho bác.

## Context

Lần thử này có ba tác tử, mỗi tác tử một bản sao: đi trọn cuộc dẫn dắt trên kho chưa có plugin;
adopt trên bản clone của một kho sản phẩm đã có hệ riêng; và, lần đầu, một tác tử **dựng màn** trên
kho hiện tại (thêm một cột, thêm một thao tác có hoàn tác) mà không được đọc phần trong của plugin.

Tác tử dựng màn làm xong cả hai việc, cổng xanh ngay lần đầu. Nhưng các luật nó cần thì nó tìm ở
một trang hành vi mà máy viết tay cho riêng kho này. Cuộc dẫn dắt không để lại trang nào như thế ở
kho khác: tác tử dựng màn ở đó sẽ chỉ biết luật khi cổng đỏ.

Ở kho sản phẩm, adopt im lặng trước những dòng sổ đã có mà chưa có lệnh kiểm, kể cả khi kho đã có
bài kiểm cho đúng điều đó; bản audit thì nói «không gì bắt được thay đổi».

## Decision

1. **Cuộc dẫn dắt và adopt để lại một trang luật ở nơi tác tử đọc trước khi đụng màn**
   (`.claude/rules/design-assembly.md`). Trang được viết từ những luật đang được giữ ở chính kho
   đó, nên không nêu luật chưa giữ hay tệp không có. Nó có công thức cho việc hay làm (thêm một
   cột) và lệnh phải chạy sau mỗi loại thay đổi.
2. **Dòng sổ có sẵn mà chưa có lệnh kiểm được gọi tên, không bị bỏ qua.** Audit nêu bằng chứng mà
   dòng chưa trỏ tới; adopt liệt kê dòng nào nó giữ được và bằng gì.
3. **Chỉ khi người nêu tên dòng, adopt mới gắn lệnh kiểm vào**: thêm đúng một dòng chữ, phần còn
   lại của dòng sổ nguyên từng byte. Luật «không viết lại dòng của người» giữ nguyên với mọi
   trường hợp khác.
4. **Điều máy đề xuất thay người thì sổ nói rõ là chưa ai xác nhận**, và audit in điều đó.

## Consequences

- **Lỗ hổng của cổng do tác tử dựng màn tìm ra, đã đóng:** canh lề hay bề rộng đặt lên chính các
  phần bảng mới thì trước đây lọt; chữ viết thẳng trong mã (nhãn cột, chữ giữa ngoặc nhọn) trước đây
  lọt.
- **Hai điều lệnh nói sai về kho sản phẩm, đã sửa:** tệp token bỏ sót giá trị chế độ tối khi kho
  chia chúng ra hai bộ chọn, nên đổi một màu tối mà cổng vẫn xanh; và câu «không gì bắt được thay
  đổi» cho bốn dòng mà kho đã có bài kiểm.
- **Lệnh kiểm «có trong cổng» từng bị qua mặt** khi Makefile thôi chạy các bước được thêm vào; giờ
  nó đọc cả Makefile.
- Lời hướng dẫn sai ở năm chỗ đã viết lại; lệnh tách ghi chú «luật chưa đạt» khỏi gợi ý «không có
  gì sai». Màu nguồn nhận cả dạng OKLCH.
- Bài kiểm của plugin: 122 lên 132.

Giới hạn và điều còn mở, do ba tác tử nêu mà máy không tự quyết:

- **Thao tác làm ngay mà thất bại thì báo thế nào, và hoàn tác thất bại thì sao**: trang hành vi
  chưa nói. Tác tử dựng màn đã phải đoán.
- **Toast không phải một trạng thái của màn**, nên bài kiểm trình duyệt của sàn không đi qua nó,
  và phép kiểm câu lỗi không đọc chữ trong toast.
- **Số hiện ra không qua bộ định dạng thì không lệnh kiểm nào bắt.**
- **Một hành vi mới vào mô hình dữ liệu ra sao** (thuộc tính, trạng thái hay hành động), và kiểu dữ
  liệu của màn có phải lấy từ mã sinh ra không: hướng dẫn của sàn và màn mẫu nói khác nhau. Đây là
  việc của Repo Standards và chủ kho.
- Canh lề đặt lên một phần tử nằm trong ô vẫn lọt. Chữ ghép bằng mã phức tạp hơn vẫn lọt.
- Các sửa đổi sau lần thử này lại chưa được tác tử độc lập thử.
