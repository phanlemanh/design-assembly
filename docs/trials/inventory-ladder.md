# Thang bốn nấc ở Inventory

Theo quyết định [0032](../../wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md).
Bốn nấc đo việc plugin có thành lớp meta hay không, trên một repo không phải repo đối chứng. Mỗi
lát của chặng 3 phải làm ít nhất một nấc nhúc nhích.

Số ở mục «Lát đầu» đo trên **bản sao** của Inventory trong thư mục tạm. Mục «Trên nhánh riêng của
Inventory» ghi phần đã làm thật, theo lời cho phép của chủ repo.

Đo lại bằng `make design-ladder`: lệnh dựng một bản sao bỏ đi, chạy bốn bước, in bảng, rồi xoá bản
sao. Nó không bao giờ ghi vào Inventory, và dòng cuối của nó nói Inventory có bị đổi không.

## Trên nhánh riêng của Inventory

Chủ repo cho phép ngày 2026-11-14: làm bước 1 và 2 trên một nhánh riêng, không đẩy lên GitHub.

- Nhánh `chore/adopt-design-assembly`, tách từ `main` ở `1226ec5`, đặt trong thư mục làm việc
  riêng `.claude/worktrees/adopt-design-assembly` của Inventory. Bản chính của Inventory vẫn ở
  `main`, không đổi.
- Trước khi làm, đo lại trên bản sao ở `1226ec5`: cả bốn bước ra đúng số như lần đo ở `786cadf`.
- **Bước 1 đã làm**, hai commit trên nhánh. Cổng của Inventory xanh trước và sau. Số bài kiểm giữ
  nguyên (1696), cảnh báo lint giữ nguyên. Độ tất định do công cụ của chính Inventory đo lên từ
  36/53 thành 42/59.
- Bước 1 đụng tới thư mục công cụ, tệp make và thư mục cấu hình tác tử của Inventory. Theo luật tự
  chủ của Inventory đó là loại thay đổi cao nhất: người giữ mã phải ký trước khi gộp.
- **Bước 2 đã làm**, một commit trên nhánh. Chủ repo giữ cả ba giả định: ứng dụng, mức AA, màu
  thương hiệu đang dùng (`#0246ff`). Thêm bốn dòng: tương phản của màu chính (máy giữ, bốn cặp sáng
  và tối) và ba dòng ghi lời người. Sổ màn mang số phiên bản; công cụ đọc sổ màn của Inventory vẫn
  chạy. Cổng của Inventory xanh, 1696 bài kiểm.
- Thang trên nhánh sau bước 2, khớp số đo trên bản sao: sổ đúng hình dạng 4 trên 5 (sổ linh kiện
  vẫn lệch cho tới bước 3), câu lõi có lời đáp 29 trên 39, câu lõi máy giữ 2, quyết định máy giữ 7,
  kit vẫn M1.
- Độ tất định do công cụ của Inventory đo: 42/59 thành 43/63, tỉ lệ 71% xuống 68%. Ba lời người là
  dòng không có lệnh kiểm, nên tăng mẫu số. Đó là cách đếm đúng, không phải lùi.

## Lát đầu, đo ngày 2026-11-14

Bản sao lấy ở commit `786cadf` của Inventory (2026-11-14). Bốn bước, mỗi bước một bản sao riêng,
chồng lên bước trước.

| Nấc                              | Mốc đầu    | 1. Chạy «nhận» | 2. Ba lời đáp, số phiên bản | 3. Plugin giữ sổ linh kiện, khai với kit |
| -------------------------------- | ---------- | -------------- | --------------------------- | ---------------------------------------- |
| Sổ đúng hình dạng                | 2 trên 4   | 3 trên 5       | 4 trên 5                    | 5 trên 5                                 |
| Câu lõi có lời đáp               | 24 trên 39 | 25 trên 39     | 29 trên 39                  | 29 trên 39                               |
| Câu lõi máy của plugin giữ       | 0          | 1              | 2                           | 2                                        |
| Quyết định máy giữ, cả ngoài lõi | 0          | 6              | 7                           | 9                                        |
| Công cụ viết tay được thay       | 0          | 0              | 0                           | 1, với ba chỗ kém đi nêu dưới            |
| Bậc trong thang của kit          | M1         | M1             | M1                          | M2                                       |

Từng bước làm gì:

1. **Chạy «nhận»**, không cần câu trả lời nào của người. Plugin sinh sổ token (40 màu, tất cả ra
   mã hex) và thêm sáu dòng máy giữ. Không đổi dòng sổ, stylesheet, luật lint hay bài kiểm nào của
   Inventory.
2. **Ba lời đáp của chủ repo và một dòng trong sổ màn.** Ba lời đáp là giả định để đo, chưa phải
   lời chủ repo:
   - loại sản phẩm: ứng dụng;
   - mức accessibility: AA, mức sổ của Inventory đã ghi ở dòng `wcag-aa`;
   - ghi nhận màu thương hiệu đang dùng.

   Có ba lời đáp thì tương phản của màu chính được giữ ở cả chế độ sáng và tối. Sổ màn thêm số
   phiên bản; công cụ đọc sổ màn của chính Inventory vẫn chạy.

3. **Plugin ghi sổ linh kiện thay công cụ của Inventory**, rồi khai sổ token và sổ linh kiện với
   kit. Sau bước này:
   - kit đọc được sổ linh kiện (267 tên) và nạp được sổ token; trước đó nó từ chối sổ linh kiện;
   - cổng chứng minh màn của Inventory đọc sổ mới không lỗi;
   - phép tra khối đã duyệt không kém đi: 10 trên 17 khối có trong sổ mới, sổ cũ có 9.

## Điều lát này tìm ra

- **Màu pha.** Inventory viết bốn màu ở chế độ tối và hai màu nền bằng phép pha trong không gian
  oklch. Plugin không đọc được, nên tương phản ở chế độ tối không có gì giữ và sổ token lệch hình
  dạng. Đã sửa ở plugin: bộ đọc màu tính phép pha, đối chiếu với trình duyệt thật trên sáu màu
  (năm khớp, một lệch một nấc ở một kênh do làm tròn).
- **Bộ đọc linh kiện của plugin gần ngang công cụ Inventory tự viết.** Chạy song song trên cùng mã:
  - cấp khớp 60 trên 60, trừ 10 mục Inventory xếp là khuôn theo thư mục;
  - biến thể giống ở 264 chỗ, khác 12 chỗ, có chỗ bên này thấy nhiều hơn, có chỗ bên kia.
- **Ba chỗ kém đi nếu plugin tiếp quản sổ linh kiện hôm nay:**
  - mất danh sách thuộc tính của từng linh kiện, thứ skill dựng màn của Inventory đang dặn tác tử
    đọc;
  - chỉ một linh kiện được xếp là khuôn, thay vì mười;
  - thư viện mua thứ hai của Inventory bị tính là «của riêng repo».

  Bài kiểm sổ linh kiện của Inventory và hai lệnh trong tệp make của nó cũng phải đổi theo. Chưa
  đủ «cùng kết quả» để bỏ công cụ cũ.

- **Phần lớn câu lõi của Inventory do chính lint và bài kiểm của Inventory giữ.** Plugin ghi các
  dòng đó là «tự khai» vì nó không chạy lại chúng: 21 dòng. Số «máy của plugin giữ» vì thế sẽ thấp
  dù repo được giữ tốt. Muốn nấc này lên thật thì plugin phải chạy lại được bằng chứng của repo,
  không phải viết lại chúng.
- **Đường «nhận» chưa giữ hình dạng sổ.** Đã sửa: «nhận» thêm dòng hình dạng sổ khi mọi sổ đạt, và
  nói sổ nào lệch chỗ nào khi chưa đạt. Dòng đó giữ cả sổ thêm vào sau.

## Muốn làm thật ở Inventory thì cần gì

Chưa làm; mỗi việc cần chủ repo cho phép riêng.

- Bước 1 và 2 không gỡ gì của Inventory: thêm tệp, thêm dòng sổ, thêm một dòng số phiên bản.
- Bước 3 đụng tới thư mục công cụ và tệp cấu hình nghiệm thu của Inventory, là vùng Inventory xếp
  vào loại thay đổi phải có người ký.
- Lệnh sinh lại của Inventory phải gọi lệnh ghi sổ của plugin, nếu không vòng nghiệm thu kế sẽ ghi
  đè sổ linh kiện bằng hình dạng cũ.
