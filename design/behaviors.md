# Hành vi của màn hình

Mỗi tình huống có một câu trả lời. Dùng nó, đừng nghĩ ra cách khác.

## Trạng thái

Mỗi màn khai đủ các trạng thái trong `design/states.json`; màn không tải dữ liệu thì được miễn ở
đó, kèm lý do.

Một trạng thái hiện ra vì một điều kiện thật: yêu cầu đang chờ hoặc thất bại, kết quả rỗng, bộ lọc
không khớp, thao tác của người dùng. Không bao giờ vì một công tắc: một prop hay giá trị trên đường
dẫn chỉ có mặt để chọn trạng thái. Bài kiểm chọn điều kiện qua nguồn dữ liệu.

- **Đang tải (loading):** cho thấy hình dạng của nội dung sắp tới, không dùng vòng quay, bằng `Skeleton`.
- **Trống (empty):** nói vì sao trống và mục tới đây bằng cách nào, bằng `Empty`. Có `Button` chỉ
  khi ngay tại màn này làm được việc lấp đầy nó, như thêm mục đầu tiên. Không làm được gì tại chỗ
  thì không có nút; nhiều nhất là một liên kết trong câu chữ, trỏ tới nơi việc đó xảy ra. Không
  lặp lại điều hướng thành một nút, không khoác áo nút chính cho một liên kết.
- **Lỗi (error):** nói điều gì hỏng và mời thử lại, bằng `Alert` với `variant="destructive"`.
- **Không tìm thấy (no results):** nói rằng tìm không ra và mời xoá bộ lọc, bằng `Empty` và một `Button`.
- **Đang lưu (saving):** giữ biểu mẫu trên màn và khoá nút gửi, bằng `Button` với `disabled`.
- **Xác nhận xoá (confirm delete):** gọi tên thứ sắp xoá và hỏi trước khi làm, bằng `Dialog`.
- **Xoá thất bại (delete failed):** giữ hộp thoại và mục đó, nói rằng chưa xoá được, bằng `Alert`.

## Báo cho người dùng

- **Lỗi của một ô hay một trường:** báo ngay tại ô đó.
- **Kết quả của một thao tác:** báo bằng toast, qua `notifyDone` trong `src/lib/notify.ts`. Màn
  không gọi thẳng thư viện toast, và không mở hộp thoại của trình duyệt.
- **Toast có nút thì ở lại** tới khi người dùng bấm nút đó hoặc bấm đóng. Toast không có nút tự
  tắt, và chỉ được tự tắt vì kết quả cũng đã thấy ngay trên màn.
- **Mỗi lúc một toast:** toast mới thay toast cũ, không xếp chồng.
- **Rời màn thì toast của màn đó đi theo:** thứ đưa người dùng sang màn khác gọi `notifyClear`
  trong `src/lib/notify.ts`. Chỉ một mô-đun được gọi thư viện toast; mô-đun thứ hai làm cổng đỏ.
- **Toast không là lối duy nhất:** việc nút trên toast làm được thì trên màn cũng làm được.
- **Sự cố của cả màn:** hiện ở chỗ của nội dung, như trạng thái lỗi ở trên.

## Đổi dữ liệu

Việc đảo được thì làm ngay, và toast báo kết quả kèm nút hoàn tác: thêm một mục. Việc không đảo
được thì hỏi trước, câu hỏi gọi tên thứ sẽ mất: xoá một mục.

## Thao tác thất bại

Thất bại thì báo ở nơi người dùng vừa làm, và không bao giờ im lặng.

- **Hộp thoại hay biểu mẫu còn mở:** báo ngay trong đó, giữ nguyên thứ người dùng đã nhập: xoá
  một mục thất bại.
- **Thao tác làm ngay:** báo bằng toast qua `notifyFailed` trong `src/lib/notify.ts`. Toast nói
  việc gì chưa xong rồi nói làm gì tiếp, có nút «Thử lại», không tự tắt và được đọc lên như một
  cảnh báo: thêm một mục thất bại.
- **Hoàn tác thất bại:** không bao giờ báo như đã hoàn tác. Toast nói thứ đó hiện đang ở đâu và
  mời thử lại.
- **Màn có thao tác làm ngay** khai thêm một trạng thái cho thao tác ấy thất bại trong
  `src/screens.ts`, để bài kiểm trình duyệt nhìn thấy cả toast.

## Sau một thao tác

- **Tiêu điểm không bao giờ rơi vào khoảng không.** Phần tử vừa dùng mà rời khỏi trang thì tiêu
  điểm chuyển đi: sang cùng nút ở dòng kế, hết dòng kế thì dòng trước; danh sách không còn dòng
  nào thì vào nút của trạng thái đang hiện thay bảng; không có nút thì vào tiêu đề màn. Bài kiểm
  trình duyệt đỏ khi sau một thao tác không còn gì giữ tiêu điểm.
- **Đang chờ trả lời:** nút vừa bấm bị khoá nhưng vẫn giữ tiêu điểm (`disabled` kèm
  `focusableWhenDisabled`), dòng hay trạng thái chứa nó ở yên. Dưới một giây không báo gì; từ một
  giây nút nói nó đang làm, qua `useSlow` trong `src/lib/slow.ts`.
- **Một mục thay đổi thì danh sách đổi tại chỗ.** Không đưa cả danh sách về trạng thái đang tải
  vì một dòng thêm, bớt hay được hoàn tác. Đang tải chỉ dành cho lần tải đầu và lần thử lại.
- **Hoàn tác đưa mọi thứ về chỗ cũ** và không hiện thêm toast: kết quả đã thấy trên màn. Toast
  hoàn tác ở lại màn nơi thao tác được làm; từ màn khác, lối đảo lại là thao tác thường của màn
  đó.
- **Nút trên toast trả tiêu điểm** về nơi người dùng đang đứng trước khi với tới toast; mô-đun
  thông báo làm việc này.
- **Tiêu điểm đi tới đâu thì thấy ở đó.** Tiêu đề hay phần tử nào nhận tiêu điểm bằng
  `tabIndex={-1}` cũng có viền như một nút khi nhận tiêu điểm.
- **Nút đang chờ giữ nguyên bề rộng.** Chữ «đang làm» không làm nút dài ra hay co lại: nhãn viết
  bằng `HeldLabel` (`src/components/held-label.tsx`), đưa cả chữ thường lẫn chữ lúc chờ.

## Thao tác trên dòng

- **Tối đa hai nút trên một dòng.** Từ ba thao tác trở lên thì gom vào một trình đơn của dòng.
  Thao tác đảo được đứng trước, xoá đứng cuối.
- **Mỗi dòng chờ phần của nó.** Một dòng đang chờ trả lời thì các dòng khác vẫn dùng được.
- **Bảng hẹp: cột tên và cột thao tác đứng yên.** Ở bề rộng hẹp, bảng cuộn ngang bên dưới cột
  đầu và cột thao tác (`TypedActionsHead`, `TypedActions`), nên tên và nút của một dòng luôn nằm
  trong khung nhìn. Bài kiểm trình duyệt đỏ khi một nút của dòng đầu nằm ngoài khung ở bề rộng
  hẹp nhất.

## Đi lại giữa các màn

Điều hướng thuộc về khung ứng dụng: một vùng, cùng chỗ và cùng thứ tự ở mọi màn, có đánh dấu màn
đang mở. Màn không tự đặt liên kết sang màn khác cạnh tiêu đề; chỗ đó dành cho việc chính của
màn. Kho này mới có một màn nên chưa có khung điều hướng; dựng nó cùng lúc với màn thứ hai.

## Kiểu màn

Mỗi màn thuộc đúng một kiểu màn. Mỗi kiểu có một trang trong `design/patterns/`: việc chính, thứ
tự các phần, lời văn, và màn mẫu để dựng theo. Đọc trang của kiểu trước khi dựng một màn thuộc
kiểu đó. Cần một kiểu mới thì viết trang của nó trước; đó là quyết định của người.

Mọi trạng thái của mọi màn được kiểm trên trình duyệt ở các bề rộng trong
`design/screen-sizes.json`: một vùng chính, một tiêu đề cấp một, không cuộn ngang, và kiểm
accessibility tự động. Bề rộng hẹp nhất là 320.

## Luật về chính hệ này

- **Hướng nhập.** Mã chia thành các phần, liệt kê từ trên xuống trong `design/parts.json`: khung
  ứng dụng, các màn, linh kiện, phần nền. Một tệp chỉ nhập phần của mình và các phần nằm dưới:
  linh kiện không bao giờ nhập một màn. Thứ hai màn dùng chung thì chuyển xuống một phần: logic
  và dữ liệu xuống phần nền; phần vẽ dùng chung thành linh kiện của kho, ở phần `shared` nằm giữa
  các màn và thư viện linh kiện. Phần vẽ của riêng một màn ở lại trong màn đó.
- **Khái niệm mới đi qua mô hình dữ liệu.** Màn cần một khái niệm hay một hành động mà mô hình
  dữ liệu chưa có thì thêm vào `ontology/` trước, trong cùng thay đổi. Tác tử không được sửa mô
  hình thì dừng lại và hỏi, không tự đặt tên khái niệm trong màn.
- **Sổ quyết định chỉ cho luật dùng chung.** Một dòng của `design/decisions.yaml` là luật mà màn
  thứ hai cũng phải theo. Lựa chọn của riêng một màn ở lại trong màn đó.
- **Lỗi lọt.** Gặp một lỗi mà mọi lệnh kiểm đều cho qua thì ghi một dòng vào `design/escapes.md`
  trước khi sửa: ngày, lỗi gì, tầng nào đáng ra phải chặn, đã làm gì.
- **Ngoại lệ có chủ ý** ở lại cạnh luật mà nó bẻ, kèm lý do: ngoại lệ lint, màn được miễn trạng
  thái, tệp rời khỏi kiểu màn. Không có sổ ngoại lệ viết tay; audit đếm cả ba.

## Mật độ

Sản phẩm này là công cụ làm việc. Chữ dùng `text-sm`.

Dòng của bảng lấy chiều cao từ mật độ của bảng, màn không tự đặt: bảng ở mức thường (48 px) khi
mọi cột hiện đủ bề rộng tối thiểu, và ở mức dày (32 px) khi không đủ chỗ. Canh lề và bề rộng tối
thiểu của một cột lấy từ kiểu cột của trường; cột chữ co theo nội dung đang hiện, không quá độ dài
mẫu của kiểu (`design/column-types.json`). Dùng `TypedTable`,
`TypedRow`, `TypedHead`, `TypedCell` cho cột dữ liệu.
