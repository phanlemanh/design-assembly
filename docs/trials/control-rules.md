# Luật tự khai mà đề dựng màn chạm tới

Chốt ngày 2026-11-13, **trước** lần chạy đầu của nhánh đối chứng (`control-arm.md`), ở commit mà hai
nhánh cùng dùng. Không sửa sau khi thấy bài làm; sửa thì ghi ngày sửa và không so hai bên vết sửa.

Mỗi dòng là một luật mà trang luật của plugin nói ra nhưng **không lệnh kiểm nào của cổng giữ**, và
đề `briefs/screen.md` chạm tới. Phiên điều phối đọc bài làm của từng nhánh và ghi mỗi dòng là
**giữ**, **phạm**, hay **không áp** (bài làm không có chỗ nào luật đó nói tới). Chỉ dòng **phạm** được
đếm vào cột `declared_broken`.

| #   | Luật                                                                                                                                                                    | Cách xem                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| L1  | Khái niệm «cất đi» và các hành động của nó có trong `ontology/` trong cùng thay đổi, và được ghi là chờ người duyệt; màn không tự đặt tên khái niệm mà mô hình không có | `git diff ontology/`; tìm chữ «duyệt» hay «review» trong phần ghi của thay đổi |
| L2  | Cất, đưa lại hay xoá một dòng không đưa cả danh sách về trạng thái đang tải; danh sách đổi tại chỗ                                                                      | Đọc mã xử lý sau khi thao tác xong                                             |
| L3  | Hoàn tác đưa mục về đúng chỗ cũ và không hiện thêm toast                                                                                                                | Đọc mã của hoàn tác                                                            |
| L4  | Hoàn tác thất bại thì nói mục hiện đang ở đâu, không bao giờ báo như đã hoàn tác                                                                                        | Đọc chữ của toast khi hoàn tác thất bại                                        |
| L5  | Việc nút trên toast làm cũng làm được từ chính màn: toast không là lối duy nhất                                                                                         | Cất rồi đưa lại được từ màn đã cất; đưa lại rồi cất lại được từ màn chính      |
| L6  | Trạng thái trống của màn đã cất nói vì sao trống và mục tới đây bằng cách nào; không có nút (không thêm được mục từ màn này); nhiều nhất một liên kết trong câu chữ     | Đọc phần trống của màn mới                                                     |
| L7  | Không đặt liên kết sang màn khác cạnh tiêu đề màn                                                                                                                       | Đọc phần đầu của màn mới và màn chính                                          |
| L8  | Mỗi dòng chờ phần của nó: một dòng đang chờ thì các dòng khác vẫn dùng được                                                                                             | Đọc trạng thái chờ: theo từng dòng hay chung cả màn                            |
| L9  | Thao tác trên dòng có hỏi trước (xoá hẳn) đóng hộp thoại khi người xác nhận; dòng tự chờ; xong hay thất bại đều báo bằng toast, thất bại có nút thử lại không hỏi lại   | Đọc luồng xoá hẳn                                                              |
| L10 | Hoàn tác làm một dòng quay lại thì tiêu điểm vào đúng nút đó của dòng vừa quay lại                                                                                      | Đọc chỗ đặt tiêu điểm sau hoàn tác                                             |
| L11 | Phần tải, thử lại và lọc giống nhau giữa các màn danh sách là một phần chung, không phải bản chép                                                                       | So mã của màn mới với màn chính                                                |
| L12 | Một thao tác trên dòng hiện thành nút; từ hai trở lên gom sau một nút «⋯»                                                                                               | Đếm thao tác trên một dòng của mỗi màn và xem cách hiện                        |
| L13 | Trong danh sách thao tác của dòng, thao tác đảo được đứng trước, xoá đứng cuối                                                                                          | Đọc thứ tự các nút                                                             |

Ngoài bảng: các dòng đăng ký mà chỉ tác tử đọc trang luật mới biết phải thêm (màn mới trong trang
kiểu màn, khai trạng thái theo sổ trạng thái) **không** là luật ở đây. Phiên điều phối thêm hộ trước
khi lắp cổng, và lệnh kiểm nào đỏ chỉ vì thiếu chúng thì ghi vào `bookkeeping_red`.
