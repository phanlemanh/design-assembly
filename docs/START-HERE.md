# Bắt đầu từ đây

## Kho đang ở đâu

Đây là bộ khung, chưa phải sản phẩm. Hiện có một màn mẫu: danh sách có ô lọc, thêm và xoá mục, đủ
tám trạng thái (sẵn sàng, đang tải, lỗi, trống, không tìm thấy, xác nhận xoá, đang xoá, xoá thất
bại). Dữ liệu là giả, giữ trong bộ nhớ.

Việc của kho này nằm ở [đề bài lát mỏng](../wiki/specs/0001-design-system-for-claude-code.md).

## Ba lệnh hằng ngày

| Lệnh          | Làm gì                                                                         |
| ------------- | ------------------------------------------------------------------------------ |
| `make dev`    | Chạy ứng dụng tại máy để xem màn                                               |
| `make format` | Sắp lại định dạng mã                                                           |
| `make check`  | Chạy trọn cổng kiểm: lint, kiểu, bài kiểm, rào thiết kế, kiểm trên trình duyệt |

## Trong kho có gì

| Đường dẫn                                | Là gì                                                                 | Cần làm gì                     |
| ---------------------------------------- | --------------------------------------------------------------------- | ------------------------------ |
| `src/example/`                           | Màn mẫu. AI sẽ chép nó khi dựng màn mới, nên lỗi ở đây lan ra mọi màn | Giữ sạch                       |
| `src/screens.ts`                         | Danh sách màn và cách tới từng trạng thái                             | Thêm một mục cho mỗi màn mới   |
| `src/components/ui/`                     | Linh kiện của shadcn                                                  | Không sửa tay                  |
| `src/lib/labels.ts`, `src/lib/format.ts` | Mọi chữ trên màn, và cách viết số, tiền, ngày                         | Sửa chữ ở đây                  |
| `design/behaviors.md`                    | Mỗi trạng thái hiện gì                                                | Đọc trước khi dựng màn         |
| `design/terms.json`                      | Từ không được dùng thay nhau. Đang trống                              | Điền khi có từ vựng nghiệp vụ  |
| `tools/design_guards.mjs`, `tests/e2e/`  | Bộ rào và bài kiểm trên trình duyệt                                   | Không sửa ở đây                |
| `ontology/`                              | Khái niệm nghiệp vụ. Đang trống                                       | Thêm bằng `/ontology-add`      |
| `wiki/`                                  | Lý do của các quyết định                                              | Ghi khi quyết điều gì đáng nhớ |
| `setup-blueprint.yaml`                   | Các lựa chọn lúc dựng kho                                             | Chỉ để đọc                     |

## Điều gì tự chạy

Chưa có gì. Tệp CI đã có nhưng kho chưa lên GitHub nên CI không chạy. Trong Claude Code cũng không
có gì tự chạy: muốn kiểm thì gõ `make check`.

## Về an toàn

- Điểm của `doctor` đang là 100/100. Nó đo việc các tệp và bước kiểm có mặt, và rào có đỏ khi đưa
  lỗi vào. Nó không đo mã có đúng không, và không đo ý tưởng của kho có hiệu quả không.
- `.claude/settings.json` giúp tránh nhầm, không phải hàng rào tuyệt đối.
- Mức `starter` không có kiểm trước commit và không quét bí mật.

## Chưa làm

- Tính năng nào ngoài màn mẫu.
- Kho trên GitHub, triển khai.
- Kho trên GitHub: mọi commit mới chỉ nằm trên máy này.
- Bốn bước dựng và bước đo trong đề bài lát mỏng.

## Bước kế

Hỏi Claude: «Đọc `wiki/specs/0001-design-system-for-claude-code.md` rồi làm bước 1 của Plan».
Gặp tệp chưa hiểu, hỏi: «Tệp này để làm gì, và ai đọc nó?».

## Các quyết định

Mỗi tầng một dòng ở [0002](../wiki/decisions/0002-setup-choices.md); bản gốc ở
`setup-blueprint.yaml`.
