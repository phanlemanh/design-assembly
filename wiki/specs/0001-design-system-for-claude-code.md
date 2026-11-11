---
type: spec
title: Hệ design bằng Claude Code và dành cho Claude Code
status: draft
tier: 1
links:
  - wiki/decisions/0002-setup-choices.md
  - wiki/decisions/0003-plugin-inside-the-repo.md
sources:
  - repo-standards/docs/superpowers/specs/2026-11-09-design-layer-design.md
  - repo-standards/tests/scenarios/design-bank.md
  - onehub-quy-hang/docs/plan/kien-truc-he-design-da-repo.md
  - onehub-quy-hang/docs/plan/ma-tran-kiem-ke-design-claude-code.md
  - onehub-inventory/docs/design-standard-proposal.md
---

# 0001 Hệ design bằng Claude Code và dành cho Claude Code

Bản nháp thứ hai, máy soạn ngày 2026-11-11 theo ý tưởng chủ kho nêu cùng ngày. Chủ kho mới duyệt
một điều: dựng khung plugin bên trong kho (quyết định 0003). Phần còn lại của trang này chưa được
duyệt. Bản nháp thứ nhất («quyết từ trên xuống, dựng từ dưới lên») nằm trong lịch sử git của tệp
này; nó được giữ lại ở đây như cách làm, không còn là đề bài.

## Intent

Ý tưởng của chủ kho: thiết kế một hệ design bằng Claude Code và dành cho Claude Code. Kết quả nhìn
thấy được là một hệ design cùng các linh kiện. Mọi thứ dựa vào công thức và lắp ráp trên nền toán
học, hình học, và được đưa về tất định để Claude Code tự hành.

**«Dành cho Claude Code» nghĩa là gì.** Hệ design cho người tối ưu cho việc học và tra tài liệu. Hệ
cho máy tối ưu cho bốn thứ: bề mặt nhỏ và đóng, không viết sai được, lỗi tự nói cách sửa, tra cứu
thay cho đọc mã. Đo bằng thước đã có ở Repo Standards: token mỗi màn, số trạng thái thiếu, lỗi rào
còn lại.

**«Toán» gồm sáu loại**, mỗi loại giữ một phần của hệ:

| Phần của hệ                    | Loại toán              | Máy giữ bằng                                   |
| ------------------------------ | ---------------------- | ---------------------------------------------- |
| Giá trị: màu, chữ, khoảng cách | Số học, không gian màu | Bộ sinh từ hạt giống, giải tương phản          |
| Hình: bo góc, biểu tượng, bóng | Hình học               | Lưới chuẩn, phép dựng                          |
| Biến thể linh kiện             | Đại số kiểu            | Sai thì không biên dịch                        |
| Hành vi: tải, trống, lỗi, lưu  | Máy trạng thái hữu hạn | Thiếu trạng thái thì không biên dịch           |
| Nghĩa dữ liệu sang hiển thị    | Hàm ánh xạ             | Kiểu cột quyết định canh và định dạng          |
| Bố cục và độ phủ của bài kiểm  | Ràng buộc, tổ hợp      | Ma trận biến thể × trạng thái tự sinh bài kiểm |

**Ba thứ không tất định hoá được**, và hệ nói thẳng như vậy: hạt giống (tính cách thương hiệu), ý
định của từng màn (việc chính là gì), và lời.

**Hai ranh giới.**

- Hành vi bàn phím và trợ năng không suy từ công thức. Chúng lấy từ thư viện hành vi không kiểu
  dáng mà kho đã có. Hệ này sinh phần hình và phần giao diện lập trình ở trên.
- Chỗ nào mắt thấy sai dù số đúng thì sửa tay và ghi vào sổ ngoại lệ thị giác, kèm lý do.

**Cách làm** giữ từ bản nháp thứ nhất: người quyết từ trên xuống trong một lần ngồi (ý định sản
phẩm, kiểu màn, nhận diện, từ vựng); máy dựng từ dưới lên, mỗi tầng phải từng đỏ khi phá thử rồi
mới làm nền cho tầng trên.

### Giả thuyết đo được

Lần đo ba của tầng design ở Repo Standards (2026-11-11) đạt chất lượng (0 trạng thái thiếu so với
18, 0 lỗi rào so với 76) nhưng trượt ngưỡng token: gấp 1,43 lần, cần không quá 1,30. Token thêm đến
từ việc tác tử đọc và chép màn mẫu, bài kiểm ứng dụng và trang luật.

Giả thuyết: **màn lắp từ khai báo trên khối đóng thì tác tử đọc ít và viết ít hơn, nên token về
dưới 1,30 lần mà vẫn giữ 0 trạng thái thiếu.**

## Acceptance criteria

Lát mỏng đầu tiên đi trọn một đường dọc, hẹp: từ hạt giống tới một màn danh sách có lọc.

1. Một tệp hạt giống do người điền. Bộ sinh là hàm thuần: cùng hạt giống thì ra cùng kết quả từng
   byte.
2. Bộ sinh ghi ra giá trị màu của kho, và mỗi giá trị có bài kiểm tương phản từng đỏ.
3. Một khối danh sách đóng: cột khai theo kiểu, năng lực bật theo tên, trạng thái là bắt buộc.
   Thiếu trạng thái hoặc đặt kiểu dáng tự do thì không biên dịch.
4. Một sổ đăng ký máy đọc được: linh kiện, biến thể, trạng thái. Trang danh mục vẽ ra từ sổ đó,
   không ai viết tay.
5. Màn mẫu được dựng lại bằng khối ở tiêu chí 3; mọi bài kiểm trạng thái hiện có vẫn xanh.
6. Bộ sinh, khuôn và quy trình nằm trong plugin; ứng dụng ở gốc kho chỉ nhận kết quả.
7. Đo màn 1 theo giao thức đã khoá ở Repo Standards: trạng thái thiếu bằng 0, lỗi rào còn lại
   bằng 0, token không quá 1,30 lần nền đối chứng.

Tiêu chí 7 tốn tiền API. Chỉ chạy khi chủ kho đồng ý.

## Domain impact

Chưa có khái niệm nghiệp vụ nào, và plugin không được chứa khái niệm nào. Tiêu chí 3 cần một danh
sách đóng các kiểu hiển thị (tiền, ngày, người, tình trạng, số đếm, chữ). Danh sách này thuộc về
hệ design, không thuộc về một sản phẩm.

## Plan

1. Chốt tệp hạt giống và bốn câu hỏi của lượt xuống; ghi câu trả lời vào sổ quyết định.
2. Bộ sinh màu trong plugin, kèm bài kiểm tất định và bài kiểm tương phản.
3. Khối danh sách đóng và danh sách kiểu hiển thị.
4. Sổ đăng ký và trang danh mục tự sinh.
5. Dựng lại màn mẫu bằng khối mới.
6. Đo màn 1, nếu chủ kho cho chạy.

## Test plan

- Bài kiểm đơn vị và bài trình duyệt hiện có giữ xanh qua từng bước.
- Mỗi luật mới có ca đưa lỗi vào và ca hợp lệ, sinh bằng mã trong chính lần chạy.
- Bộ sinh có bài kiểm chạy hai lần và so kết quả.
- Bài đo ở tiêu chí 7 dùng nền đối chứng và cách chấm của Repo Standards, không tự đặt thước.

## Autonomy tier

Máy tự làm bước 1 đến 5 trong kho này sau khi chủ kho duyệt đề bài. Bước 6 cần chủ kho cho phép
riêng vì tốn tiền. Thay đổi ở Repo Standards hay kit nghiệm thu nằm ngoài kho này.

## Open questions

- Hạt giống gồm những gì? Đề xuất của máy: màu gốc, độ rực, mật độ, bo góc, phông. Thang chữ và
  thang khoảng cách dùng chuẩn có sẵn, vì số đo ghi nhận 0 lần làm lại do chúng. Chủ kho muốn sinh
  cả hai thang đó bằng công thức thì nói rõ, đề bài sẽ rộng ra.
- Giữ bộ linh kiện đang có làm lớp hình, hay sinh lại lớp hình từ công thức trên thư viện hành vi?
  Cách sau đúng với ý tưởng hơn nhưng mất bộ rào đi kèm bộ linh kiện hiện tại.
- Biểu tượng, biểu đồ và luật chuyển động chưa nằm trong lát nào.
- Hệ này không chạm phần làm lại do bài kiểm và hạ tầng, và không trả lời được trải nghiệm có tốt
  không.
- Một phiên khác đang đo và sửa tầng design ở Repo Standards. Kết quả ở đó có thể đổi nền của kho
  này; chưa có cách đồng bộ.
