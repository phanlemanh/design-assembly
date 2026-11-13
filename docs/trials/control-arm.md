# Nhánh đối chứng của vai dựng màn

Soạn ngày 2026-11-13. Chủ repo cho chạy cùng ngày («Nhắn sang phiên đó, tôi cho phép chạy»), và
đã chạy một lần; kết quả ở `control.tsv` và ở mục «Lần đầu» dưới đây. Mỗi lần chạy tốn token, nên
hỏi chủ repo trước.

## Câu hỏi nó trả lời

Vai dựng màn đếm số chỗ tác tử còn phải đoán khi **có** những gì plugin để lại. Chuỗi số đó nói
plugin tốt lên hay xấu đi qua từng lần, nhưng không nói plugin có tác dụng hay không: chưa lượt nào
cho một tác tử dựng cùng màn đó khi **không có** chúng.

Nhánh đối chứng là lượt còn thiếu. Ý lấy từ cách kho Modern Web Guidance của Google chứng minh một
bài hướng dẫn: cùng một đề, một tác tử có hướng dẫn, một tác tử không.

## Hai nhánh

|          | Nhánh có                                                         | Nhánh không                                  |
| -------- | ---------------------------------------------------------------- | -------------------------------------------- |
| Đề       | `briefs/screen.md`, không đổi một chữ                            | Cũng tệp đó                                  |
| Bản sao  | Như vai dựng màn                                                 | Như vai dựng màn, bỏ thêm trang luật và cổng |
| Mã nguồn | Giữ nguyên                                                       | Giữ nguyên                                   |
| Câu đáp  | `answers/screen/`                                                | Cũng các tệp đó                              |
| Mô hình  | Cùng một mô hình, cùng mức suy nghĩ, cùng commit, chạy song song |                                              |

Nhánh có chính là lượt chạy đề chuẩn của vai dựng màn, nên nó vẫn ghi vào `results.tsv` như cũ và
chuỗi số không bị cắt.

**Nhánh không bỏ đi đúng hai thứ: trang để tác tử đọc, và cổng giữ luật.** Linh kiện, bài kiểm và
sàn của Repo Standards ở lại. Vì vậy phép so đo phần «luật» của plugin, không đo phần «mã»: mã
nguồn vẫn tự dạy tác tử qua tên linh kiện và chú thích. Đây là giới hạn của phép đo, không phải lỗi.

Bỏ khỏi bản sao của nhánh không:

- `.claude/rules/design-assembly.md`
- `design/patterns/`, `design/decisions/`, `design/decisions.yaml`, `design/escapes.md`
- `design/component-registry.json`, `design/tokens.json`, `design/theme.json`, `design/states.json`
- `tools/design-assembly/`, `mk/design-assembly.mk`

Giữ lại trong `design/` những tệp mà mã, bài kiểm hoặc sàn đọc: `terms.json`, `blueprint.json`,
`columns.json`, `column-types.json`, `screen-sizes.json`, `parts.json`, `book-words.json`.

**`design/behaviors.md` của nhánh không là bản của sàn**, lấy ở commit `e56e77c` (22 dòng). Ở repo
này trang đó đã được viết thêm hầu hết luật của plugin bằng lời thường (164 dòng): để nguyên thì
nhánh không vẫn đọc được luật. Lệnh kiểm của sàn chỉ đòi tệp có mặt, nên bản của sàn đủ cho cổng.

Bài kiểm trình duyệt mà plugin cài (`tests/e2e/templates.spec.ts`) **ở lại** ở cả hai nhánh, vì nó
là bài kiểm chứ không phải trang luật. Nên nhánh không vẫn bị giữ ở tiêu điểm và cột thao tác ở
320: phép so chỉ đo phần trang luật và cổng của plugin.

## Dựng bản sao

Cả hai nhánh dựng như vai dựng màn từ lần bảy (xem `README.md`, «Dựng bản sao»): clone repo,
checkout thưa bỏ `plugins/`, `docs/`, `wiki/decisions/`, `wiki/specs/`, `tests/plugin-*` và
`mk/plugin.mk`, gỡ khỏi `wiki/index.md` và `wiki/log.md` các dòng trỏ tới trang đã bỏ, rồi commit
trong bản sao. Nhánh không bỏ thêm các mục trong danh sách ở trên bằng cùng checkout thưa, thay
`design/behaviors.md` bằng bản của sàn, rồi commit trong bản sao.

**Hiệu chỉnh trước khi giao cho tác tử**, cả hai điều phải đúng, không thì dừng:

1. `make check` xanh trên bản sao của nhánh không khi chưa ai đụng vào. Đã thử: xanh, cổng còn
   `lint typecheck test ontology design-guards ui-floor`.
2. Lắp lại các tệp đã bỏ lên một bản chép của bản sao đó rồi chạy `make design-assembly`: phải
   xanh. Đã thử: 23 quyết định, 29 lệnh kiểm, xanh. Điều này chứng minh bước chấm ở dưới bắt đầu từ
   số không.

## Chấm

Số chỗ tác tử tự khai là đoán **không dùng để so hai nhánh**. Tác tử ở nhánh không chẳng có trang
nào để biết mình đang đoán điều gì, nên nó sẽ khai ít hơn chứ không nhiều hơn.

So bằng kết quả, đo trên bài làm của mỗi nhánh:

| Số                    | Cách đo                                                                                                         | Ai đo             |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | ----------------- |
| Luật máy giữ bị phạm  | Lắp cổng của plugin lên bài làm, chạy `make design-assembly`, đếm lệnh kiểm đỏ trên 29                          | Máy               |
| Phần có sẵn được dùng | Màn mới dùng mấy trên sáu phần: `TypedTable`, `RowActions`, `TableActions`, `WithRecord`, `HeldLabel`, `notify` | Máy, bằng tìm chữ |
| Luật tự khai bị phạm  | Đối chiếu bài làm với danh sách dòng sổ chưa có lệnh kiểm mà đề chạm tới                                        | Phiên điều phối   |
| Cổng của chính nó     | `make check` xanh hay đỏ lúc tác tử nói xong, và số vòng sửa                                                    | Máy               |
| Chi phí               | Token, số lần gọi công cụ, thời gian                                                                            | Máy               |

Ba điều giữ cho phép chấm công bằng:

- **Danh sách luật tự khai chốt trước khi chạy**, ghi thành tệp (`control-rules.md`), không sửa sau
  khi thấy bài làm.
- **Tách sổ sách khỏi luật.** Bài làm của nhánh không sẽ thiếu những dòng đăng ký mà chỉ tác tử
  đọc trang luật mới biết phải thêm (khai màn mới vào trang kiểu màn, vào sổ trạng thái). Phiên
  điều phối thêm các dòng đó hộ rồi mới đếm; lệnh kiểm nào đỏ chỉ vì thiếu dòng đăng ký thì ghi
  riêng, không tính là phạm luật.
- **Cổng của sàn chạy như nhau ở cả hai nhánh**, nên không tính vào hiệu số.

## Ghi kết quả

Mỗi lần chạy thêm hai dòng, mỗi nhánh một dòng, vào `control.tsv` (tạo ở lần chạy đầu), với các
cột: `trial`, `date`, `arm` (`with` hay `without`), `gate`, `rounds`, `held_red`, `bookkeeping_red`,
`parts_used`, `declared_broken`, `tokens`, `tool_calls`, `minutes`, `note`.

## Giới hạn

- Mỗi nhánh một lượt thì hiệu số nhỏ không nói lên điều gì. Hai nhánh bằng nhau hoặc lệch một thì
  ghi «chưa kết luận» và chạy lại, không diễn giải.
- Phiên điều phối biết bài nào của nhánh nào khi chấm phần luật tự khai.
- Một đề, một kiểu màn, một repo. Kết quả không nói gì về repo không phải repo đối chứng.

## Lần đầu (2026-11-13)

Hai nhánh cùng dựng từ commit `40c6376`, chạy song song. Hiệu chỉnh đạt cả hai điều: nhánh không
xanh khi chưa ai đụng vào; lắp lại cổng lên nó thì xanh, 23 quyết định, 29 lệnh kiểm.

**Chưa kết luận: hai nhánh bằng nhau ở mọi số.** Cả hai qua cổng của chính mình mà không phải sửa
vòng nào; lắp cổng của plugin lên bài làm thì cả hai 0 trên 29 lệnh kiểm đỏ, không thiếu dòng đăng
ký nào; cả hai dùng 5 trên 6 phần có sẵn; cả hai giữ cả 13 luật của `control-rules.md`. Chi phí gần
nhau: 225 nghìn và 200 nghìn token, 46 và 43 lần gọi công cụ, 61 và 64 phút.

Hai bài làm gần như cùng một kiến trúc: cùng một móc dùng chung cho việc đổi dòng, cùng một phần vẽ
nút «⋯» bọc quanh `RowActions`, cùng luồng hoàn tác và tiêu điểm. Cả hai đều chép cách làm của màn
mẫu và các phần dùng chung đã có. Đọc thử, chưa kết luận: **ở repo đối chứng hiện nay, mã nguồn đã
mang sẵn các luật**, nên bỏ trang luật và cổng đi không đổi bài làm. Phép so này vì vậy đo được
rất ít ở repo này; nó sẽ có nghĩa hơn ở một repo mà mã chưa mang luật, như repo mới của sàn.

Điều duy nhất khác thấy được: số chỗ tự khai là đoán, 16 ở nhánh có và 24 ở nhánh không. Đề đã nói
trước số này không dùng để so hai nhánh.
