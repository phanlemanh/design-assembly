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
- Bản sao của nhánh không vẫn mang lịch sử git, trong đó có các trang đã bỏ. Ở lần hai, tác tử nhánh
  không thấy tên các tệp đó qua lịch sử và báo rằng không mở nội dung. Lần sau nên dựng nhánh không
  từ một bản không có lịch sử.

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

## Lần hai: repo mới của sàn (dựng 2026-11-13)

Lần đầu cho thấy mã của repo đối chứng đã mang sẵn các luật, nên lần hai chạy trên một repo mà mã
chưa mang luật: repo mới của sàn (commit `e56e77c`), với plugin đã áp như một người dùng thật áp.

- **Repo gốc:** repo mới của sàn, chồng lên bài làm của vai dẫn dắt lần chín (các câu trả lời niêm
  phong, cùng các sửa của nó trên màn mẫu để qua bài kiểm trình duyệt mà plugin cài), rồi áp plugin
  ở bản hiện tại. Khai thêm gói toast trong `package.json` của bản sao (gói đã có trong thư viện
  chép sang, không tải gì), để plugin cài được mô-đun báo kết quả mà đề dùng. Repo gốc xanh: 22
  quyết định, 28 lệnh kiểm.
- **Nhánh có:** repo gốc như nó là.
- **Nhánh không:** repo gốc bỏ đúng danh sách ở trên, `design/behaviors.md` là bản của sàn, và bỏ
  dòng nhật ký wiki mà cuộc dẫn dắt viết (dòng đó trỏ tới các trang đã bỏ).
- **Điều khác lần đầu:** repo chỉ có một màn và không có khung điều hướng; mô hình dữ liệu chưa có
  thực thể nào; không có phần dùng chung nào ngoài các phần plugin cài. Phần `TypedTable` không có
  (plugin chỉ cài nó khi mô hình có trường khai kiểu cột), nên số phần có sẵn tính trên năm.
- **Một chỗ hổng của plugin hiện ra lúc dựng:** plugin cài mô-đun báo kết quả và phần vẽ toast
  nhưng không gắn phần vẽ vào ứng dụng, nên toast không hiện. Để nguyên cho cả hai nhánh.

### Kết quả lần hai

Cả hai nhánh qua cổng của chính mình mà không phải sửa vòng nào ở cấp `make check`; lắp cổng của
plugin lên bài làm thì cả hai 0 trên 28 lệnh kiểm đỏ, không thiếu dòng đăng ký nào.

**Khác nhau ở luật tự khai: nhánh có phạm 0 trên 13, nhánh không phạm 3.** Ba luật nhánh không phạm:

- **L4:** hoàn tác thất bại nói «chưa hoàn tác được» mà không nói mục đang ở đâu;
- **L6:** trạng thái trống của màn đã lưu trữ có một liên kết khoác áo nút chính, chép lại điều
  hướng;
- **L9:** xoá giữ hộp thoại trong lúc chờ, báo lỗi trong hộp thoại, và xoá xong không báo gì. Đây
  là cách của màn mẫu và của trang hành vi bản sàn; nhánh có thì theo trang luật và viết lại cả
  màn mẫu.

Phần có sẵn: nhánh có dùng 4 trên 5, nhánh không 5 trên 5. Phần nhánh có không dùng là nhãn giữ bề
rộng, vì trong luồng xoá mới hộp thoại đóng ngay và không còn nút nào đổi chữ. Số này vì vậy không
nói nhánh nào tốt hơn.

Chi phí: nhánh có tốn hơn khoảng một phần tư, 272 nghìn so với 218 nghìn token, 68 so với 54 lần
gọi công cụ; thời gian gần bằng nhau, 19 và 17 phút.

**Đọc kết quả.** Lệch ba luật, nên theo đề không còn là «chưa kết luận», nhưng mới một lượt mỗi
nhánh. Kết quả cùng chiều với điều lần đầu gợi ý: trang luật có tác dụng ở nơi mã chưa mang luật,
và tác dụng nằm ở các luật mà cổng không giữ. Cổng của plugin không bắt được điều gì ở cả hai lần.
Nên chạy thêm một lượt mỗi nhánh trên repo mới trước khi dựa vào hiệu số này.

**Điều hai nhánh cùng gặp,** đã ghi vào sổ giới hạn:

- toast không hiện, vì plugin cài mô-đun báo kết quả mà không gắn phần vẽ vào ứng dụng;
- repo mới không có khung điều hướng, nên màn thứ hai phải tự dựng cách đi lại; cả hai cùng chọn đổi
  màn không tải lại trang;
- lệnh kiểm đọc danh sách màn như văn bản, nên trạng thái phải viết ra từng dòng;
- màn mẫu sau khi vai dẫn dắt sửa vẫn xoá theo cách cũ, trái với trang luật.

## Lần ba: repo mới của sàn, lượt thứ hai (dựng 2026-11-13)

Cùng repo gốc với lần hai (commit `f957067` của bản sao), cùng đề, cùng 13 luật. Khác lần hai đúng
một điều: mỗi nhánh là một repo **không có lịch sử**, chỉ một commit mở đầu, nên các trang đã bỏ
không còn nằm đâu trong bản sao. Hiệu chỉnh đạt: nhánh không và nhánh có đều xanh khi chưa ai đụng
vào; lắp lại cổng lên nhánh không thì xanh, 22 quyết định, 28 lệnh kiểm.

### Kết quả lần ba

Cả hai nhánh qua cổng của chính mình, không phải sửa vòng nào ở cấp `make check`. Ở nhánh không,
một bài kiểm của chính tác tử (toast hiện chậm một nhịp) đỏ ở một trong hai lần phiên điều phối
chạy lại, rồi xanh: bài chập chờn, không tính là cổng đỏ.

- **Lắp cổng của plugin lên bài làm:** nhánh có 0 trên 28 đỏ; nhánh không **1** đỏ thật
  (`column-align`: tự đặt canh phải lên ô bảng). Lệnh kiểm `notification-channel` cũng đỏ trên
  nhánh không, nhưng là báo nhầm: nó tưởng một hàm tên `confirm` của màn là hộp thoại của trình
  duyệt. Không tính; plugin đã sửa lệnh kiểm đó, kèm bài kiểm.
- **Luật tự khai:** nhánh có phạm 0 trên 13; nhánh không phạm **6**: L1 (không ghi khái niệm mới
  vào mô hình dữ liệu), L4 (hoàn tác thất bại không nói mục ở đâu), L6 (liên kết khoác áo nút ở
  trạng thái trống), L7 (liên kết sang màn khác ngay cạnh tiêu đề), L9 (xoá giữ hộp thoại), L10
  (tiêu điểm không về dòng vừa quay lại).
- **Phần có sẵn:** 4 trên 5 và 5 trên 5, cùng lý do như lần hai.
- **Chi phí:** 236 nghìn so với 200 nghìn token, 50 so với 40 lần gọi công cụ, 16 và 17 phút.

### Gộp hai lần trên repo mới

| Lần | Luật tự khai bị phạm (có / không) | Lệnh kiểm đỏ khi lắp cổng (có / không) | Token (có / không) |
| --- | --------------------------------- | -------------------------------------- | ------------------ |
| 2   | 0 / 3                             | 0 / 0                                  | 272k / 218k        |
| 3   | 0 / 6                             | 0 / 1                                  | 236k / 200k        |

Hai lượt cùng một chiều: nhánh có trang luật giữ đủ 13 luật cả hai lần; nhánh không phạm 3 rồi 6,
và ba luật bị phạm cả hai lần (L4, L6, L9). Cái giá là khoảng 18 đến 25 phần trăm token.
Đây là kết quả đầu tiên mà phép so dựa vào được ở mức «cùng chiều qua hai lượt», chưa phải một con
số chắc. Ở repo đối chứng của lab, nơi mã đã mang luật, hai nhánh bằng nhau.

## Lần bốn: nghiệm thu Dọn nền 2 (dựng 2026-11-13)

Nghiệm thu quyết định 0028, trên repo mới của sàn. Repo gốc là repo gốc của lần hai, áp plugin bản
có 0028 (commit `742f339`), rồi sửa đúng những gì cổng mới đòi, như cuộc dẫn dắt phải sửa: khung
`AppFrame` gắn vào ứng dụng (cùng phần vẽ toast), màn mẫu xoá theo cách mới (hộp thoại đóng ngay, nút
của dòng tự chờ, kết quả báo bằng toast), và bài kiểm của màn mẫu theo đó. Repo gốc xanh: 24 quyết
định, 30 lệnh kiểm. Hai nhánh không có lịch sử. Cùng đề, cùng 13 luật.

Bài kiểm trình duyệt plugin cài ở lại ở cả hai nhánh như mọi lần, và giờ nó giữ luật hộp thoại hỏi
trước; nhánh không vì vậy cũng bị cổng của chính nó giữ luật đó.

**Đạt khi:** những luật nhánh không phạm mà cổng giờ giữ thì hiện thành lệnh kiểm đỏ khi lắp cổng lên
bài làm của nó, và nhánh có vẫn phạm 0.
