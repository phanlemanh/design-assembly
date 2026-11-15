# Thang bốn nấc ở Inventory

Theo quyết định [0032](../../wiki/decisions/0032-review-after-stage-two-and-stage-three-recut.md).
Bốn nấc đo việc plugin có thành lớp meta hay không, trên một repo không phải repo đối chứng. Mỗi
lát của chặng 3 phải làm ít nhất một nấc nhúc nhích.

Số ở mục «Lát đầu» đo trên **bản sao** của Inventory trong thư mục tạm. Mục «Trên nhánh riêng của
Inventory» ghi phần đã làm thật, theo lời cho phép của chủ repo.

Đo lại bằng `make design-ladder`: lệnh dựng một bản sao bỏ đi, chạy bốn bước, in bảng, rồi xoá bản
sao. Nó không bao giờ ghi vào Inventory, và dòng cuối của nó nói Inventory có bị đổi không.

## Đo trên Inventory đã nhận, ngày 2026-11-15

Theo quyết định [0042](../../wiki/decisions/0042-the-ladder-starts-from-the-state-it-finds.md).
Inventory đã nhận plugin trên `main`, nên các bước không còn gì để làm. Bản sao ở `c53b35d`, kèm kit.
Bốn dòng bằng nhau, và là chỗ Inventory đang đứng:

| Nấc                              | Mốc đầu và cả ba bước |
| -------------------------------- | --------------------- |
| Sổ đúng hình dạng                | 7 trên 7              |
| Câu lõi có lời đáp               | 29 trên 40            |
| Câu lõi máy của plugin giữ       | 10                    |
| Quyết định máy giữ, cả ngoài lõi | 16                    |
| Bậc trong thang của kit          | M2                    |

- Không còn phép so hai sổ linh kiện: sổ ở Inventory là sổ plugin ghi, công cụ cũ đã bị bỏ.
- Các bảng bên dưới đo trên bản sao **trước khi nhận**. Lệnh không đo lại được chúng trên Inventory
  nữa; chúng ở lại làm lịch sử.
- Quyết định máy giữ là 16, thấp hơn 18 của bước 3 ở lần đo trước. Một dòng chênh là sổ linh kiện:
  bản plugin ở repo này đọc linh kiện mới hơn bản công cụ Inventory đang giữ. Dòng còn lại chưa truy.

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

## Lát ba: bộ đọc linh kiện so với công cụ của Inventory, đo ngày 2026-11-14

Theo quyết định [0034](../../wiki/decisions/0034-component-reader-equal-to-the-reference-tool.md).
`make design-ladder` in phép so sau bảng, trên bản sao ở `1226ec5`. Thang bốn nấc không đổi so với
lát hai; thứ đổi là sổ plugin ghi ở bước 3.

| So theo tên, 270 linh kiện có ở cả hai | Lát đầu       | Lát ba                                |
| -------------------------------------- | ------------- | ------------------------------------- |
| Danh sách thuộc tính                   | không có      | giống 268                             |
| Biến thể                               | giống 264 chỗ | giống 262; 8 chỗ plugin ghi thêm      |
| Tệp khuôn                              | 1 so với 10   | 10 như nhau, plugin thêm `DataRegion` |
| Thư viện mua thứ hai                   | «của riêng»   | thư viện                              |

- Số biến thể lát đầu đếm theo cách khác (có cả lỗi đọc chú thích), nên hai cột không so thẳng
  được với nhau.
- 64 tên chỉ công cụ của Inventory có: 34 hằng số, 30 kiểu dữ liệu. Không phải linh kiện.
- **Bước 3 đã làm trên nhánh riêng của Inventory**, chủ repo cho phép ngày 2026-11-14, một commit:
  plugin ghi sổ linh kiện; lệnh sinh lại, cổng, bài kiểm sổ, skill dựng màn và dòng sổ «cấp linh
  kiện» đọc sổ mới; công cụ cũ của Inventory bị bỏ; sổ token và sổ linh kiện khai với kit. Bản ghi
  quyết định 0032 của Inventory.
- Cổng của Inventory xanh, 1697 bài kiểm (thêm một), cổng chứng minh màn đọc sổ mới không lỗi. Độ
  tất định do công cụ của Inventory đo: 43/63 thành 45/65.
- Thang trên nhánh khớp bước 3 trên bản sao: sổ đúng hình dạng 5 trên 5, câu lõi máy giữ 11,
  quyết định máy giữ 18. Bậc của kit chưa đọc thẳng trên nhánh (lệnh đọc bị chặn trong phiên); trên
  bản sao với cùng thay đổi, kit ra M2.
- Chủ repo bảo đẩy và mở PR:
  [phanlemanh/onehub-inventory#58](https://github.com/phanlemanh/onehub-inventory/pull/58).
  - Main của Inventory đã tiến lên sau khi tách nhánh, và chỉ sổ linh kiện xung đột. Main được
    gộp vào nhánh, plugin ghi lại sổ từ mã đã gộp.
  - Cổng xanh trên cây đã gộp: 1755 bài kiểm, plugin giữ 18 quyết định. PR gộp được, chờ người
    giữ mã duyệt.
  - Cổng trước khi gộp của kit chặn PR. Hai dòng khai với kit tách sang
    [phanlemanh/onehub-inventory#59](https://github.com/phanlemanh/onehub-inventory/pull/59), gộp
    sau #58; bậc M2 chờ PR đó. Việc tách không gỡ được cổng: cổng đòi một hồ sơ nghiệm thu có
    chữ ký người cho mọi PR đổi đường dẫn T3.

## Lát hai: plugin chạy lại lint của repo, đo ngày 2026-11-14

Theo quyết định [0033](../../wiki/decisions/0033-re-run-the-repository-lint.md). Bản sao ở
`1226ec5`. Từ lát này bản sao đọc gói của Inventory qua một đường nối, vì lint của Inventory là một
trong các gói đó. Lệnh gỡ đường nối trước khi xoá bản sao.

| Nấc                              | Mốc đầu    | 1. Chạy «nhận» | 2. Ba lời đáp, số phiên bản | 3. Plugin giữ sổ linh kiện, khai với kit |
| -------------------------------- | ---------- | -------------- | --------------------------- | ---------------------------------------- |
| Sổ đúng hình dạng                | 2 trên 4   | 3 trên 5       | 4 trên 5                    | 5 trên 5                                 |
| Câu lõi có lời đáp               | 24 trên 39 | 25 trên 39     | 29 trên 39                  | 29 trên 39                               |
| Câu lõi máy của plugin giữ       | 0          | 10 (trước: 1)  | 11 (trước: 2)               | 11 (trước: 2)                            |
| Quyết định máy giữ, cả ngoài lõi | 0          | 15 (trước: 6)  | 16 (trước: 7)               | 18 (trước: 9)                            |
| Bậc trong thang của kit          | M1         | M1             | M1                          | M2                                       |

- Chín câu lõi lên «máy giữ»: màu là vai trò, bảng màu, thang chữ, thang khoảng cách, bo góc, điều
  khiển thô, bảng thô, đổi diện mạo linh kiện, style viết thẳng.
- Hai câu lint của Inventory **để lọt** đoạn mã phạm, nên vẫn «tự khai»:
  - tên lớp viết nguyên: lọt tên lớp ghép bằng dấu cộng, trên thẻ thường và trên linh kiện;
  - ngoại lệ lint phải có lý do: lọt ngoại lệ cho luật không thuộc bộ luật riêng của Inventory, và
    ngoại lệ tắt mọi luật cho cả tệp.
- Hướng nhập giữa các phần chưa có đoạn mã phạm. Tám câu do bài kiểm và một câu do công cụ của
  Inventory vẫn chưa được chạy lại.
- **Đã làm trên nhánh riêng của Inventory**, chủ repo cho phép ngày 2026-11-14: «nhận» chạy lại với
  plugin mới, thêm chín phép kiểm lint, dòng sổ không đổi; một commit. Cổng của Inventory xanh,
  1696 bài kiểm. Thang trên nhánh khớp bản sao: câu lõi máy giữ 11, quyết định máy giữ 16. Độ tất
  định do công cụ của Inventory đo vẫn 43/63, vì công cụ đó vốn đếm các dòng này là tự động; điều
  đổi là plugin giờ chạy lại chúng.

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
