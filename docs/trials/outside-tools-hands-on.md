# Thử tay Claude Design và stitch-skills: đo trên bản sao

Đo ngày 2026-11-20, theo lời chủ repo («thử dùng trên chính cả claude design và stitch-skills sau đó viết
báo cáo đánh giá»). Việc này ngoài kế hoạch; nó trả lời câu hỏi 5 của đề bài
[0007](../../wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md) và kiểm lại các nhận định của đề
bài ấy bằng việc làm thật thay cho việc đọc tài liệu.

## Đo gì, trên đâu

- **Đối tượng:** một bản sao bỏ đi của kho này tại `4ec65b7`, dựng theo cách của vai dựng màn trong
  [README](README.md) (bỏ `plugins/`, `docs/`, các bản quyết định và đề bài). Không repo thật nào bị đụng.
- **Hai điểm xuất phát:** từ code đã có (bản sao), và từ số không với một thương hiệu bịa (một tên, một
  màu, một font, một dòng mô tả giọng nói).
- **Bốn việc cho mỗi công cụ:** lập hệ; dựng màn theo đề chuẩn [`briefs/screen.md`](briefs/screen.md);
  đổi một quyết định; cố tình phạm một luật.
- **Ai làm:** phiên điều phối tự làm cả hai vai, người dùng và tác tử, theo đúng bộ chỉ dẫn mỗi công cụ
  đưa ra. Các câu công cụ sẽ hỏi người đều do phiên điều phối tự đáp. Đây là trải nghiệm của một tác tử,
  chưa phải của một người ngồi trước màn hình.
- **Claude Design:** dùng hai loại artifact «Design System» và «Design» có sẵn trong phiên. Kết quả là ba
  artifact riêng tư trên tài khoản của chủ repo. Lối dựng linh kiện thật (cần cài và dựng code) và lệnh
  `/design-sync` không thử.
- **stitch-skills:** bản tại `4cf4db8`, giấy phép Apache-2.0, chỉ đọc. Chủ repo chọn mức không khoá: bốn
  skill chạy tại chỗ (`extract-design-md`, `taste-design`, `enhance-prompt`, `site-md`). Không gọi dịch
  vụ Stitch, không cài và không chạy gì từ bản sao của nó.

## Kết quả, cùng một bảng

Cột cuối là kho này. Ba dòng «dựng màn» của nó lấy từ lần chạy thử 11, cùng đề chuẩn, trong
[`results.tsv`](results.tsv); dòng «phạm luật» lấy từ phép đo của giai đoạn 8
([stage-8-done-when.md](stage-8-done-when.md): một màu viết thẳng ở gốc làm cổng đỏ). Ba cột không cùng
loại đầu ra: lần 11 kết thúc bằng code chạy được dưới `make check`, Claude Design bằng bốn bức hình, Stitch
ở mức không khoá bằng một lời nhắc. Vì vậy số chỗ đoán không so thẳng được với nhau.

| Đo gì                               | Claude Design                       | stitch-skills, không khoá         | Design Assembly           |
| ----------------------------------- | ----------------------------------- | --------------------------------- | ------------------------- |
| Lập hệ từ code: tệp ra              | 20 tệp, 76 token màu                | 1 tệp văn xuôi, 211 dòng          | không đo ở lần này        |
| Lập hệ từ code: chỗ phải tự quyết   | 12                                  | 12                                | không đo ở lần này        |
| Lập hệ từ số không: giá trị tự chọn | 20 trên 21                          | gần hết, theo gu cố định          | không đo ở lần này        |
| Câu hỏi tới người khi lập hệ        | 2 lượt (mang gì vào; linh kiện nào) | 0                                 | không đo ở lần này        |
| Dựng màn: đầu ra                    | 4 bảng vẽ                           | 1 lời nhắc 27 dòng, chưa có màn   | code, cổng xanh           |
| Dựng màn: chỗ đoán                  | 13                                  | cùng các quyết định, ghi vào lời  | 9                         |
| Dựng màn: lần dừng hỏi người        | 0 (luồng cho 1 lượt, tối đa 4 câu)  | 0                                 | 0; có 6 câu vào hàng chờ  |
| Yêu cầu của đề bị bỏ sót            | 1, không gì bắt                     | 0 trong lời nhắc                  | không đo ở lần này        |
| Phép kiểm bằng máy chạy trên đầu ra | tương phản, ngay trên trang hệ      | 0                                 | toàn bộ cổng              |
| Đổi màu chính: thứ đổi theo         | 31 bí danh; còn lại không           | không gì                          | không đo ở lần này        |
| Phạm luật có bị chặn không          | không                               | không đo được (bộ kiểm chưa chạy) | có, cổng đỏ (giai đoạn 8) |

## Claude Design: điều thấy khi tự làm

**Lập hệ từ code.**

- Luồng là trích xuất. Bộ chỉ dẫn đặt hai lượt câu hỏi: mang những gì vào, và lấy linh kiện nào. Không có
  câu nào về nguyên tắc, hướng đi hay gu. Điều này khớp với bản điều tra đọc tài liệu.
- Mười hai chỗ phải tự quyết mà bộ chỉ dẫn không nói. Ví dụ: stylesheet khai `:root` hai lần thì lấy giá
  trị nào; 31 dòng bí danh màu của Tailwind có là token không; cỡ chữ lấy ở đâu khi code không khai.
- Sáu nấc bo góc viết bằng `calc()` bị bỏ theo đúng luật của luồng, dù linh kiện dùng bốn nấc trong số đó.
- Font đến từ một gói npm, không phải tệp trong repo, nên chỉ được nêu tên. Trang hiện chữ bằng font dự
  phòng mà không báo.
- Không dựng code thì 15 linh kiện chỉ có lời hướng dẫn; trang ghi «No preview yet» cho từng cái.
- Trang hệ tự đo tương phản và hiện tỉ lệ cạnh mỗi màu chữ. Ngoài phép đo ấy, không gì kiểm thứ được ghi
  vào: phiên điều phối đã bịa một tên ví dụ trong sách thương hiệu và chỉ tự đọc lại mới thấy.

**Lập hệ từ số không.** Bộ chỉ dẫn định sẵn cỡ của một hệ đầu tiên (6 tới 10 màu, 5 tới 7 kiểu chữ, 4 nấc
khoảng cách, 3 bo góc) và bảo nói rõ là hệ nhỏ. Nó không đặt câu hỏi nào và không trình hướng nào: từ ba
đầu vào, 20 trên 21 giá trị do phiên điều phối tự chọn.

**Dựng màn.**

- Canvas giữ một bản chép của tệp token, kèm số bản và ngày chép; bộ chỉ dẫn ghi «a copy never changes by
  itself». Màu đi vào bảng vẽ dưới dạng giá trị viết thẳng: bốn bảng vẽ có 82 chỗ viết màu và không chỗ nào
  tham chiếu token.
- Hệ không có code dựng sẵn nên nút, bảng, hộp thoại phải vẽ lại bằng tay theo lời mô tả.
- Bộ chỉ dẫn của loại Design ghi «NEVER VERIFY UNLESS THE USER ASKED». Đề yêu cầu màn chính có thao tác cất
  mục; phiên điều phối không vẽ màn chính và chỉ phát hiện khi đếm lại để ghi chép.
- Chỉ bốn trạng thái được vẽ (danh sách, xem một mục, xác nhận xoá, trống). Không gì trong luồng đòi vẽ
  trạng thái đang tải, lỗi, không tìm thấy, thất bại, khổ điện thoại hay giao diện tối.
- Năm giá trị ngoài hệ lọt vào mà không ai cố ý: một bóng đổ và một lớp phủ (hệ không có token bóng), hai
  bo góc chính là hai nấc đã bị bỏ lúc lập hệ, và hai bề rộng.

**Đổi một quyết định.** Đổi màu chính của hệ từ xanh dương sang xanh lá:

- Trong chính hệ: 31 bí danh đổi theo. Màu viền focus và 14 sắc độ của bảng màu gốc giữ màu cũ; bìa của hệ
  vẽ bằng hai sắc độ ấy; sách thương hiệu vẫn nói viền focus là màu chính. Không gì báo.
- Trên canvas: bản chép token y nguyên từng byte, bản ghi vẫn mang số bản cũ, bảng vẽ giữ màu cũ. Muốn theo
  thì cài lại bằng tay rồi sửa từng chỗ.

**Phạm luật.** Một nút được tô nền `#ff00aa`, chữ `#ffe600` (tương phản 2,84:1), bo góc 7px, cỡ chữ 13px.
Lần lưu được nhận và bảng vẽ hiện đúng như vậy. Phiên điều phối chỉ nhìn tổng quan canvas, chưa mở bảng
Theme, nên chưa biết ở đó có đánh dấu giá trị ngoài hệ không.

## stitch-skills: điều thấy khi tự làm

- **`extract-design-md`** bảo tác tử viết văn «như bài biên tập», đặt tên gợi hình cho từng màu, **gộp** các
  màu gần giống nhau, và ghi «ý đồ chứ không chỉ giá trị». Nó không hỏi người câu nào; phép kiểm của nó là
  một danh sách tác tử tự đánh dấu.
  - Khối YAML chỉ có một bảng màu phẳng nên giao diện tối không có chỗ; nó chỉ còn một câu trong phần văn.
  - Màu `oklch` phải đổi sang mã hex; viền có độ trong của giao diện tối mất khi đổi.
  - Bộ chỉ dẫn đưa hai danh sách mục khác nhau: khuôn trong skill và tệp ví dụ của chính nó.
- **`taste-design`** là một gu cố định: ba núm vặn, danh sách font bắt buộc, các điều cấm và các điều buộc
  phải có (ô bấm 44px, chuyển động lặp trên mọi thành phần đang hoạt động). Font của thương hiệu không nằm
  trong danh sách của nó; nó không nói bên nào thắng. Tệp nó sinh **không** có khối YAML mà
  `extract-design-md` gọi là bắt buộc.
- **`enhance-prompt`** chép một khối «DESIGN SYSTEM (REQUIRED)» từ `DESIGN.md` vào từng lời nhắc. Đây là
  cách ý đồ thiết kế tới tay tác tử ở mỗi lần dựng. Nó tìm `DESIGN.md` «trong dự án», còn
  `extract-design-md` ghi tệp ấy ở `.stitch/DESIGN.md`. Bảng từ khoá của nó đẩy về «card grid» và «subtle
  shadows», ngược với hệ vừa trích.
- **`site-md`** mặc định một cây thư mục cho site tĩnh, không hợp một ứng dụng React; nó nói «bảy mục» và
  kê sáu.
- **Đổi một quyết định:** tìm trong bốn skill không có chỉ dẫn nào cho lúc code hay hệ đổi. Màu chính nằm
  dạng viết thẳng 4 chỗ trong `DESIGN.md` và 1 chỗ trong lời nhắc; hai tệp có 42 mã hex.
- **Hai bộ kiểm, đọc mà chưa chạy.** Chúng cần gói `@swc/core`, kho này không có, và cài gói cần lời của
  chủ repo. Theo mã của chúng:
  - bộ cho React đạt khi tệp có một `interface …Props` và không có mã hex trong `className` viết dạng chuỗi
    thường. Mã hex trong `style`, trong lớp viết dạng biểu thức, giá trị `rgb()` hay `oklch()` đều không
    được xem. Ở bản sao, 52 trên 99 thuộc tính lớp là biểu thức, và 0 trên 15 linh kiện có
    `interface …Props`;
  - bộ cho React Native bắt mọi chuỗi có `#` kèm 3 tới 8 chữ số hex, kể cả một nhãn như số đơn hàng;
  - không bộ nào đọc `DESIGN.md`: điều được kiểm là «không có mã hex ở đây», không phải «đúng giá trị của
    hệ».

## Điều rút ra cho Design Assembly

1. **Mang ý đồ tới tác tử là việc cả hai công cụ đều làm, và cả hai làm bằng cách chép.** Claude Design chép
   token vào canvas, Stitch chép khối design vào lời nhắc. Bản chép cũ đi ngay khi hệ đổi và không gì báo.
   Việc 1 của đề bài 0007 (đưa nguyên tắc và hướng đi vào trang luật) nên giữ cách kho này đang làm: trang
   luật sinh từ sổ, có lệnh kiểm đỏ khi lệch.
2. **Không công cụ nào giữ hệ sau lúc lập.** Dựng màn, đổi quyết định và phạm luật đều trôi qua mà không có
   tín hiệu nào. Đây là phần kho này có; nhận định «giữ lõi» của đề bài 0007 đứng vững sau khi thử.
3. **Luật tương phản của Claude Design đáng mượn.** Nó đòi đo mọi cặp chữ và nền mà ghi chú của token nêu,
   ở mọi giao diện. Đo 15 cặp của ứng dụng mẫu ở hai giao diện, hai cặp dưới 4,5:1: `muted-foreground` trên
   `muted` ở giao diện sáng (4,34:1), và `destructive` trên nền nhạt 20% của chính nó ở giao diện tối
   (khoảng 3,2:1, nền tự pha nên là số ước lượng). `design/theme.json` có bốn phép kiểm tương phản ở mức
   token, đều trên `primary`; cổng còn đo bằng axe trên màn nó vẽ. **Chưa kiểm** cổng có vẽ đúng hai cặp
   ấy không, nên chưa kết luận được là cổng bỏ sót.
4. **Nấc suy ra bằng `calc()` là chỗ dễ mất khi xuất hệ.** Claude Design bỏ sáu nấc bo góc; ở lần dựng màn
   hai nấc ấy quay lại dưới dạng giá trị viết thẳng. Việc 6 của đề bài 0007 (xuất hệ ra ngoài) cần tính ra
   giá trị cuối thay vì chép biểu thức.
5. **Từ số không, cả hai công cụ đi nhanh vì tự quyết thay người.** Đó là lối vào kho này chưa có (việc 2
   và việc 5 của đề bài 0007), nhưng cách làm của họ ngược với luật «chủ repo quyết, máy khuyên kèm căn
   cứ». Thứ đáng mượn là cỡ của một hệ đầu tiên, không phải việc bỏ câu hỏi.
6. **Một bước tự kiểm bắt được lỗi mà người làm không thấy.** Yêu cầu bị bỏ sót ở phần Claude Design là
   loại lỗi một lượt soát sẽ bắt. Điều này ủng hộ việc đưa `review` (mục 5.2) lên sớm.

## Giới hạn của lần thử

- Một tác tử đóng cả hai vai. Số chỗ đoán là tự khai rồi tự đếm lại, không có người thứ hai kiểm như các
  lần chạy thử trong `results.tsv`; vì vậy không dòng nào được thêm vào tệp ấy.
- Phần Stitch dừng ở mức không khoá: chưa có màn nào do Stitch sinh, và 12 trên 16 skill chưa được thử.
- Hai bộ kiểm của Stitch mới được đọc mã.
- Ở Claude Design chưa thử: dựng linh kiện thật, `/design-sync`, bảng Theme của canvas, và việc một người
  sửa token ngay trên trang.
- Tệp làm việc (hai tệp `DESIGN.md`, lời nhắc, bốn bảng vẽ, công cụ đo tương phản) nằm trong thư mục tạm
  của phiên và không được giữ. Ba artifact của Claude Design còn trên tài khoản của chủ repo cho tới khi
  chủ repo xoá.
