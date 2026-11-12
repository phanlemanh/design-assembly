---
type: spec
title: Plugin dẫn người dùng dựng design system cho Claude Code
status: approved
tier: 1
links:
  - wiki/decisions/0003-plugin-inside-the-repo.md
  - wiki/decisions/0004-output-and-vocabulary.md
sources:
  - plugins/design-assembly/references/vocabulary.json
  - repo-standards/docs/superpowers/specs/2026-11-09-design-layer-design.md
  - repo-standards/tests/scenarios/design-bank.md
  - onehub-quy-hang/docs/plan/kien-truc-he-design-da-repo.md
  - onehub-quy-hang/docs/plan/ma-tran-kiem-ke-design-claude-code.md
  - onehub-inventory/docs/design-standard-proposal.md
---

# 0001 Plugin dẫn người dùng dựng design system cho Claude Code

Bản thứ ba, chủ kho duyệt ngày 2026-11-11. Hai điều đã thống nhất trước đó nằm ở quyết định 0004:
output là một plugin dẫn dắt, và từ vựng lấy trọn từ chuẩn của ngành. Hai bản nháp trước nằm trong
lịch sử git của tệp này. Lát đầu đã dựng; kết quả theo từng tiêu chí ở mục «Kết quả lát đầu».

## Intent

**Output, một câu.** Người dùng gõ một lệnh trong kho của họ; plugin dẫn họ qua các tầng quyết
định; khi xong, kho đó có một design system mà Claude Code dựng màn được mà không phải đoán, kèm
một điểm đo.

**Sản phẩm là cuộc dẫn dắt.** Design system là thứ người dùng có được ở kho của họ. Ứng dụng ở gốc
kho này là reference implementation: nơi chứng minh cuộc dẫn dắt chạy được.

**Từ vựng.** Mọi tên mà cuộc dẫn dắt đưa ra cho người dùng lấy từ
`plugins/design-assembly/references/vocabulary.json`, để một designer chuyên nghiệp không gặp từ
lạ. Thuật ngữ giữ nguyên tiếng Anh trong mọi ngôn ngữ trò chuyện và được giải thích ở lần đầu xuất
hiện. Từ nào do dự án tự đặt thì ghi rõ là tự đặt.

**Ranh giới với hai thứ đã có.** Repo Standards dừng ở việc đặt sàn. Kit nghiệm thu chấm từng tính
năng. Plugin này đi từ sàn lên một design system.

### Các tầng của cuộc dẫn dắt

Người quyết từ trên xuống, máy dựng từ dưới lên. Tầng chỉ có một đáp án hợp lý thì máy tự đi và báo
một dòng.

Từ quyết định 0006 (2026-11-12) chỉ còn một danh sách tầng, dùng chung cho cuộc dẫn dắt, sổ quyết
định và bản audit. Một quyết định thuộc tầng của vật mà nó ràng buộc.

| Tầng        | Vật nó ràng buộc                                        | Ai trả lời                                   | Đã dựng |
| ----------- | ------------------------------------------------------- | -------------------------------------------- | ------- |
| Context     | Không vật nào: phán đoán về sản phẩm và từng màn        | Người                                        | Có      |
| Foundations | Giá trị trong stylesheet: màu, chữ, khoảng cách, bo góc | Người chọn theme; máy tính các design tokens | Có      |
| Components  | Một linh kiện                                           | Máy đề xuất, người có quyền bác              | Chưa    |
| Patterns    | Hành vi theo thời gian: state, lưu, xoá, báo            | Máy, theo chuẩn có sẵn                       | Chưa    |
| Content     | Lời và định dạng                                        | Người                                        | Chưa    |
| Templates   | Cấu trúc của một trang                                  | Người chọn trong danh sách đóng              | Chưa    |
| Governance  | Luật về chính hệ: ngoại lệ, chiều phụ thuộc, cổng kiểm  | Máy đặt sổ; người ghi lý do khi dùng         | Chưa    |

Accessibility, conformance và distribution không phải tầng. Mỗi yêu cầu accessibility rơi về vật nó
ràng buộc, tên chuẩn ghi ở trường nguồn. Conformance là cột lệnh kiểm của mọi dòng. Distribution là
việc vật tới được tay kit và kho khác.

### Kho của người dùng nhận được gì

- Decision record cho từng tầng.
- Design tokens tính từ theme.
- Core components có giao diện lập trình đóng.
- Bảng interaction patterns theo state.
- Component manifest, và một trang vẽ ra từ manifest.
- Design lint và bài kiểm trên màn chạy, mỗi cái đã từng đỏ.
- Trang luật và móc cho Claude Code.
- Điểm đo: determinism rate, tức số quyết định có lệnh kiểm tự động chia cho tổng số quyết định.
  Tên này do chủ kho đặt, không phải từ của ngành.

### Điều không tất định hoá được

Theme (tính cách thương hiệu), ý định của từng page, và lời. Cuộc dẫn dắt nói thẳng như vậy và
không chấm ba thứ đó.

### Đầu ra và các bậc (quyết định 0005, 2026-11-12)

Đầu ra là một design system chuẩn hoá nằm dưới `design/` của repo, đạt theo bậc: audit,
foundations, core components, patterns và content, templates, governance. Mỗi bậc cần vật trong
repo, lệnh kiểm từng đỏ, và một việc Claude Code tự làm được. Bảng bậc, ranh giới với Repo
Standards và kit nghiệm thu, và năm điều chỉnh nằm ở quyết định 0005.

Tầng là các bước người dùng đi qua; bậc là thứ họ nhận được. Một bậc đạt khi mọi quyết định lõi
của nó trong danh mục chuẩn (`plugins/design-assembly/references/standard-decisions.json`) đã có lời
đáp và vật của nó nằm trong repo.

### Sổ chuẩn, danh mục chuẩn (quyết định 0006, 2026-11-12)

Sổ quyết định là `design/decisions.yaml`, theo định dạng một kho của chủ kho đã dùng: mỗi dòng trỏ
tới nơi chứng minh, không chứa giá trị. Plugin chỉ ghi các dòng nó giữ, và giữ nguyên từng byte dòng
của người khác. Danh mục chuẩn có 64 quyết định từ bốn nguồn; 38 quyết định thấy ở ít nhất hai
nguồn là lõi. Đo ngày 2026-11-12: kho này đáp 9/38, kho đối chứng đáp 26/38.

### Sinh hoặc nhận (quyết định 0007, 2026-11-12)

Một giá trị vào sổ theo một trong hai đường. Kho chưa có giá trị riêng thì cuộc dẫn dắt sinh ra.
Kho đã có thì lệnh adopt để nguyên giá trị, thêm dòng sổ cho bằng chứng kho đang chạy, và đặt lệnh
kiểm quanh giá trị đang có, chỉ khi lệnh kiểm đó đang xanh và đỏ được. Cuộc dẫn dắt từ chối ghi đè
giá trị riêng của kho trừ khi người bảo thay. Sau khi adopt, kho này đáp 17/38 quyết định lõi.

### Tệp design tokens (quyết định 0008, 2026-11-12)

Vật của bậc foundations là `design/tokens.json`, sinh từ stylesheet theo định dạng kit nghiệm thu
đọc. Stylesheet là nơi đổi giá trị; tệp được ghi lại bằng `make design-tokens`, và một lệnh kiểm
làm cổng đỏ khi hai bên lệch nhau. Kho này có 47 token và đáp 18/38 quyết định lõi; bậc foundations
ở mức «tự khai».

### Sổ linh kiện (quyết định 0009, 2026-11-12)

Vật của bậc core components là `design/component-registry.json`, sinh từ mã nguồn linh kiện: mỗi
linh kiện được xuất ra có tên, tệp và các biến thể dạng `trục=giá trị`. Sổ được ghi lại bằng
`make design-components`, và một lệnh kiểm làm cổng đỏ khi sổ lệch mã nguồn. Bậc này vẫn chưa đạt:
năm quyết định lõi về bảng dữ liệu và cỡ vùng bấm chưa có lời đáp.

### Cỡ vùng bấm (quyết định 0011, 2026-11-12)

Mọi control phải khai chiều cao đạt cỡ vùng bấm của mức conformance: 24 px ở AA, 44 px ở AAA.
Chiều cao đọc từ lớp CSS trong mã nguồn linh kiện, không từ màn đã vẽ, và chỉ đo chiều cao. Kho này
có ba control đo được, nhỏ nhất đúng 24 px.

### Bảng dữ liệu (quyết định 0012, 2026-11-12)

Mỗi trường khai kiểu cột một lần ở mô hình dữ liệu. Kiểu cột quyết định canh lề (chỉ kiểu «số»
canh phải) và bề rộng tối thiểu của cột; bảng tự chuyển sang mức dày khi các cột không đủ chỗ. Màn
không tự đặt ba thứ đó, và một lệnh kiểm làm cổng đỏ khi có màn làm vậy. Bậc core components của
kho này đủ 10/10 quyết định lõi, ở mức «tự khai».

### Trạng thái, chữ và câu báo lỗi (quyết định 0013, 2026-11-12)

Mỗi màn khai đủ bốn trạng thái mà vùng dữ liệu nào cũng có, cộng các trạng thái riêng của kho. Màn
không viết chữ trực tiếp. Câu báo lỗi có hai phần: chuyện gì xảy ra, làm gì tiếp. Máy giữ phần đọc
được từ mã nguồn của cả ba; phần hành vi lúc chạy do bài kiểm của kho giữ. Ba câu còn lại của bậc
này (kênh thông báo, hỏi trước hay hoàn tác, mở hồ sơ cạnh danh sách) chưa dựng.

### Kênh thông báo và hoàn tác (quyết định 0014, 2026-11-12)

Kết quả một thao tác được báo bằng toast, qua một mô-đun của kho; đảo được thì toast kèm hoàn tác,
không đảo được thì hỏi trước. Máy giữ việc màn không đi vòng qua kênh; hành vi do bài kiểm của kho
giữ, và adopt ghi dòng sổ trỏ tới bài kiểm có gắn thẻ tên quyết định.

### Kiểu màn và thao tác thất bại (quyết định 0016, 2026-11-12)

Mỗi màn thuộc đúng một kiểu màn; mỗi kiểu có một trang nêu việc chính, các tệp của nó và một màn
thật làm mẫu. Mọi trạng thái của mọi màn được kiểm trên trình duyệt ở các bề rộng kho đã khai,
hẹp nhất là 320. Một thao tác làm ngay mà thất bại thì báo bằng toast không tự tắt, có nút thử
lại; hoàn tác thất bại không bao giờ báo như đã hoàn tác. Trang kiểu màn do người quyết: kịch bản
không viết nó.

### Vì sao cần plugin này

Bản trước ghi giả thuyết «giảm token», neo vào lần đo ba của Repo Standards (token gấp 1,43 lần).
Lần đo bốn của họ đã đạt cả ba ngưỡng, nên giả thuyết đó hết căn cứ. Lý do còn đứng: Repo Standards
không áp tầng design vào kho đã có, kit chỉ chấm từng tính năng, nên không ai chuẩn hoá design
system của một kho đã có, và không ai đi quá màn mẫu đầu tiên.

## Acceptance criteria

Lát đầu tiên là một đường dẫn dắt trọn vẹn nhưng hẹp, để chứng minh cuộc dẫn dắt trước khi chứng
minh một linh kiện.

1. Một lệnh của plugin chạy trong một kho trống có sàn của Repo Standards và đi hết ba tầng:
   Context, Foundations (chỉ phần màu của theme), Conformance.
2. Có hai độ sâu như lệnh dựng kho của Repo Standards: giao hết cho Claude, hoặc dừng ở từng tầng.
3. Mỗi tầng ghi một decision record vào kho người dùng: chọn gì, vì sao, đã loại gì.
4. Từ source color, máy tính tonal palette và các color role bằng hàm thuần: cùng đầu vào thì ra
   cùng kết quả từng byte. Mỗi cặp chữ và nền có bài kiểm contrast ratio từng đỏ.
5. Mọi tên tầng, tên lựa chọn và câu hỏi mà lệnh đưa ra đều có trong bảng từ vựng. Bảng từ vựng
   không còn dòng nào ở mức `unchecked`.
6. Một lệnh chấm in determinism rate của kho, và chỉ đếm lệnh kiểm nào đã từng đỏ.
7. Chạy lại lệnh trên kho đã đi qua thì không đổi gì.
8. Bài kiểm của plugin tự dựng một kho trống, chạy trọn đường dẫn dắt, rồi chạy cổng kiểm của kho
   đó.

Đo token theo giao thức của Repo Standards để dành cho lát sau, khi cuộc dẫn dắt đã tới Templates.

## Kết quả lát đầu

Dựng ngày 2026-11-11. Lát đầu đi bốn tầng thay vì ba: thêm Accessibility, vì ngưỡng contrast ratio
của Foundations lấy từ conformance level.

| Tiêu chí                       | Kết quả      | Căn cứ                                                                                                                                       |
| ------------------------------ | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Một lệnh đi hết các tầng    | Đạt          | Hai tác tử mới, mỗi tác tử một kho tạm, đi trọn từ lệnh dẫn dắt tới `make check` xanh. Xem «Chạy thử» bên dưới                               |
| 2. Hai độ sâu                  | Đạt          | Một lượt giao hết (máy đề xuất màu), một lượt duyệt từng tầng (designer đưa `#ffba00`, dừng ba lần)                                          |
| 3. Decision record từng tầng   | Đạt          | `design/decisions/*.md`, sinh từ blueprint                                                                                                   |
| 4. Hàm thuần, contrast từng đỏ | Đạt          | Chạy hai lần ra cùng văn bản; 7 source color × 2 conformance level đều đạt ngưỡng khi đọc lại từ stylesheet                                  |
| 5. Từ vựng                     | Đạt một phần | Tên tầng và tên lựa chọn có bài kiểm; không còn dòng `unchecked`. Câu hỏi trong lệnh dẫn dắt chỉ được chặn bằng danh sách từ cần tránh       |
| 6. Lệnh chấm                   | Đạt          | `make design-rate`: 6/9 ở kho này. Lệnh kiểm không thể đỏ thì bị báo, không được tính                                                        |
| 7. Chạy lại không đổi gì       | Đạt          | Bài kiểm chạy hai lần; ở kho này chạy thêm sau `make format` vẫn không đổi                                                                   |
| 8. Bài kiểm dựng kho trống     | Một phần     | Kho tạm dùng stylesheet và Makefile thật của kho này, chạy trọn apply và các lệnh kiểm. Cổng kiểm đầy đủ chỉ chạy ở reference implementation |

### Chạy thử (2026-11-11)

Hai tác tử chưa từng thấy cuộc trao đổi này, mỗi tác tử nhận một bản sao sạch của kho ở commit gốc,
chỉ được trỏ tới tệp hướng dẫn của plugin. Máy chính đóng vai người dùng ở các điểm dừng và chấm
kết quả từ tệp trong kho tạm, không từ lời tác tử tự báo.

| Lượt      | Người dùng                                     | Kết quả                                                                                                                          |
| --------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Giao hết  | «Tôi không rành thiết kế, cứ theo khuyến nghị» | Máy đề xuất `#0e7490`. Nền sáng giữ nguyên (5,35:1), nền tối dời màu (4,99:1). Rate 6/9, `make check` xanh                       |
| Từng tầng | Designer, màu thương hiệu `#ffba00`            | Dừng ở accessibility, foundations, duyệt cuối. Nền sáng dời sang vàng đậm (4,74:1), nền tối giữ màu (11,58:1). `make check` xanh |

Áp lại hai kho bằng bản plugin đã sửa: không tệp nào đổi, trừ hai tệp ghi lại loại của quyết định
conformance level.

**Chỗ vấp và cách đã sửa**

| Chỗ vấp                                                                          | Ai gặp    | Đã sửa                                                                                                   |
| -------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| Bản xem trước đòi duyệt rồi mới chạy, nên người dùng phải duyệt mà không thấy số | Cả hai    | Bản xem trước chạy trước khi duyệt, ngay khi accessibility và foundations đã quyết, và in contrast ratio |
| Thiếu số, một tác tử tự ước tính tương phản (sai: 1,7:1 và ngưỡng 3:1)           | Từng tầng | Hướng dẫn cấm ước tính, bắt trích số của bản xem trước. Tác tử tự đính chính trước người dùng            |
| Không có hình dạng của tệp blueprint                                             | Cả hai    | Hướng dẫn có mẫu, kèm nghĩa của `source` và `rejected`                                                   |
| Không rõ bước «mời dán quyết định có sẵn» có phải điểm dừng                      | Cả hai    | Ghi rõ không phải                                                                                        |
| «Hai câu trả lời chỉ người có» mâu thuẫn với chế độ giao hết                     | Giao hết  | Giao hết thì đề xuất và ghi `proposed`; duyệt từng tầng thì hỏi                                          |
| Conformance level hiện «không có lệnh kiểm» mà không phải loại phán đoán         | Từng tầng | Đổi sang loại phán đoán; bài kiểm nay đòi mọi quyết định không có lệnh kiểm phải là phán đoán            |
| `--help` thoát lỗi, chỉ in một dòng                                              | Cả hai    | In đủ hai chế độ, thoát 0                                                                                |

Hai tác tử cùng thử dựng một bản sao «đã duyệt» bên ngoài kho để lách chỗ vấp đầu; quyền của phiên
chặn cả hai lần. Không tác tử nào sửa plugin hay commit.

### Foundations đủ bốn phần (2026-11-11)

Foundations nay quyết thêm type scale, spacing scale và shape, ngoài màu.

| Phần          | Người chọn                                           | Máy giữ bằng                                                                                             |
| ------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Type scale    | Giữ thang của sàn, hoặc modular scale với một tỉ lệ  | Giữ thang sàn: stylesheet không tự khai biến cỡ chữ. Modular: mỗi bậc lớn hơn bậc dưới, dòng không chồng |
| Spacing scale | Không hỏi: chỉ có đơn vị 4px của sàn                 | Stylesheet không tự khai `--spacing`                                                                     |
| Shape         | Một bậc corner radius theo tên của Material Design 3 | `--radius` phải ra đúng giá trị đã chọn, kể cả khi có luật viết sau                                      |

Nguồn đã đọc lại: modular scale (Tim Brown, A List Apart 2011; modularscale.com), thang corner
radius của Material Design 3, biến `--spacing` và thang cỡ chữ mặc định của Tailwind 4, lưới 4dp và
8dp của Material Design 1.

Ở ứng dụng gốc, máy giữ khuyến nghị cho một application: thang chữ và bo góc của sàn. Determinism
rate lên 9/12.

**Hai giới hạn tìm ra trên trình duyệt.** Áp thử modular scale (major third) và bo góc large lên ứng
dụng gốc rồi đo bằng trình duyệt:

- Các cỡ chữ và bo góc mới được dùng thật: tiêu đề 20/28px, nhãn tình trạng 10px, ô nhập bo 16px.
- Nút của bộ linh kiện sàn ghi cứng cỡ chữ `0.8rem` và chặn bo góc ở 10–12px, nên không theo hai
  quyết định này. Không sửa linh kiện của nhà cung cấp; ghi vào trang tầng foundations và để tầng
  core components đóng.
- Từ minor third trở lên, text-xs nhỏ hơn 12px, cỡ nhỏ nhất của sàn. Không chuẩn nào đặt cỡ chữ tối
  thiểu, nên bản xem trước chỉ cảnh báo, không chặn.

Một quyết định foundations ghi trước khi có ba phần mới vẫn áp được: máy giữ giá trị của sàn và in
một dòng báo, không bắt chọn lại.

Cổng kiểm của ứng dụng gốc bắt thêm một lỗi: sau `make format`, chạy lại cuộc dẫn dắt ghi đè tệp
quyết định theo cách trình bày cũ, nên lint đỏ. Lần áp lại nay so tệp JSON theo nội dung, có bài
kiểm cho cả hai chiều (trình bày khác thì để yên, nội dung khác thì ghi lại).

Ba điều tìm ra khi dựng:

- Màu sau khi làm tròn có thể vượt khỏi dải màn hình hiển thị được. Giá trị ghi ra nay được cắt sau
  khi làm tròn, để trình duyệt vẽ đúng giá trị mà lệnh kiểm đã tính.
- Lệnh kiểm chạy qua một đường dẫn liên kết thì thoát êm mà không kiểm gì. Đã sửa và có bài kiểm.
- Material Design 3 gọi là source color; «seed» là từ của Flutter. Đã đổi theo Material.

### Chạy thử lần hai (2026-11-12)

Hai tác tử chưa thấy cuộc trao đổi nào, mỗi tác tử một bản sao: kho này ở trạng thái trước khi có
plugin, và một bản clone của kho đối chứng. Chúng chỉ được đọc ba skill và đầu ra của lệnh. Câu của
người nằm trong tệp niêm phong, chỉ mở khi skill bảo hỏi.

**Điều đứng vững.** Không tệp nào của kho bị đổi sai: ở bản sao kho đối chứng chỉ sổ quyết định
được nối thêm dòng, 50 dòng cũ nguyên từng byte, stylesheet, lint, bài kiểm và các tệp thiết kế giữ
tay không đổi. Tác tử tự tính lại tương phản và ra cùng số (6,32:1). Bốn lần cố ý làm hỏng một giá
trị đều làm cổng đỏ đúng dòng. Chạy lại lần hai không đổi gì.

**Điều sai, đã sửa.**

- Bản audit đếm điều nó suy ra là «người đã ghi», và nhìn kho khác với lệnh adopt (quyết định
  0010).
- Không rõ kho nào đi đường nào; bản audit giờ in bước kế.
- Tệp dữ liệu công cụ do adopt ghi làm bước kiểm định dạng của kho đỏ. Đã xác nhận bằng bộ định
  dạng thật, và giờ có bài kiểm dùng chính bộ định dạng đó.
- Bản xem trước của adopt chỉ in tên quyết định, không in giá trị nó sẽ giữ; lần chạy hai im lặng
  về phần chưa đọc được; tệp người tự giữ bị xếp nhầm mục; không có đường ghi loại sản phẩm.
- Thông báo khi tệp token lệch bảo «đừng sửa tay» trong khi chính stylesheet mới là bên đổi. Giờ
  nó nêu tên token và cả hai giá trị.
- Cuộc dẫn dắt nói «mọi tỉ lệ tương phản đều được kiểm»; thật ra chỉ hai cặp của màu chính. Đã sửa
  lời và ghi phạm vi vào dòng sổ.
- Cuộc dẫn dắt một mình không đưa kho tới bậc nó dựng; giờ nó chạy adopt ở cuối.

**Điều còn nguyên.**

- Ba bài kiểm trình duyệt của sàn vẫn chưa vào sổ được vì tệp không mang thẻ tên quyết định.
- Màu máy đề xuất khi người chưa có màu là chọn tuỳ ý; hướng dẫn giờ bắt nói rõ điều đó.
- Tệp niêm phong lộ mọi câu trả lời ngay lần mở đầu; đó là lỗi của cách dựng cuộc thử.
- Các sửa đổi chưa được tác tử độc lập thử lại.

### Chạy thử lần ba (2026-11-12)

Ba tác tử, mỗi tác tử một bản sao. Hai tác tử đầu như lần hai (dẫn dắt trên kho chưa có plugin,
adopt trên bản clone của kho đối chứng). Tác tử thứ ba, lần đầu, làm việc của người dùng cuối:
dựng màn trên kho hiện tại (thêm một cột, thêm một thao tác có hoàn tác), không được đọc phần trong
của plugin.

**Điều đứng vững.** Cuộc dẫn dắt để kho ở trạng thái cổng xanh; dòng «bước kế» dẫn đúng đường;
adopt không đổi gì kho đã có (chỉ nối dòng vào sổ), và mọi lần cố ý phá một giá trị đều làm cổng đỏ
đúng dòng. Tác tử dựng màn làm xong cả hai việc, cổng xanh ngay lần đầu, và tìm được luật canh lề,
bề rộng, kênh thông báo, hoàn tác mà không phải đoán.

**Điều sai, đã sửa** (quyết định 0015): các luật đó nằm ở một trang viết tay cho riêng kho này, nên
cuộc dẫn dắt giờ tự để lại trang luật; hai lỗ hổng của cổng; hai điều lệnh nói sai về kho đối
chứng; adopt im lặng trước dòng sổ chưa có lệnh kiểm; năm chỗ hướng dẫn nói sai.

**Điều còn nguyên**, là việc của chủ kho hoặc Repo Standards: thao tác làm ngay mà thất bại thì báo
thế nào; toast không được bài kiểm trình duyệt đi qua; số hiện ra không qua bộ định dạng thì không
ai bắt; một hành vi mới vào mô hình dữ liệu ra sao.

Hai điều đầu đã đóng ngày 2026-11-12 bằng quyết định 0016: luật thao tác thất bại, và hai trạng
thái thất bại đưa toast vào tầm bài kiểm trình duyệt.

### Chạy thử lần bốn (2026-11-12)

Ba tác tử như lần ba, trên bản có bậc templates và luật thao tác thất bại (quyết định 0016). Tác
tử dựng màn nhận việc khác: thêm thao tác «Lưu trữ» có hoàn tác và một màn mới thuộc kiểu danh
sách, không được đọc phần trong của plugin.

**Điều đứng vững.** Cuộc dẫn dắt đưa kho chưa có plugin từ 0 lên 34/38, cổng xanh, và tác tử tự
viết được trang kiểu màn mà lệnh kiểm nhận. Adopt trên bản clone của kho đối chứng chỉ thêm dòng
vào sổ: mọi dòng cũ nguyên từng byte, trừ hai dòng người nêu tên được thêm đúng một dòng lệnh
kiểm. Mười bốn lần phá ở đó và hơn ba mươi lần phá ở kho được dẫn dắt làm cổng đỏ đúng dòng. Tác
tử dựng màn làm xong cả hai việc, cổng xanh ngay lần đầu, và báo rằng trang kiểu màn cùng trang
hành vi đã định sẵn gần hết: kiểu của màn mới, chỗ đặt tệp, thứ tự các phần, thất bại và hoàn
tác thất bại báo thế nào. Bài kiểm trình duyệt mới đỏ ở 320 khi bài của sàn ở 390 vẫn xanh.

**Điều sai, đã sửa.** Lệnh kiểm «bài kiểm trình duyệt đọc các bề rộng» chỉ tìm tên tệp, nên một
lời chú thích cũng đủ qua: giờ nó đọc mã, bỏ chú thích, và đòi bài kiểm đi qua các bề rộng. Bản
audit thường không in dòng nào về những câu «đã ghi» mà chưa ai xác nhận, và nói «không còn gì để
làm» khi trang kiểu màn chưa có: giờ nó nêu tên cả hai. Bài kiểm trình duyệt đỏ mà chỉ in con số:
giờ nêu tên quyết định và việc cần làm. Hướng dẫn có một câu cụt đầu, không có ví dụ cho trang
kiểu màn, và bảo thêm tay hai dòng sổ trong khi luật của chính nó cấm: đã viết lại, kèm cách một
người xác nhận. Trang luật để lại sau adopt tự nhận do cuộc dẫn dắt viết và hứa các luật không có
ở dưới. Lời adopt nói về sổ linh kiện sai ở kho tự giữ sổ riêng.

**Điều còn nguyên**, chờ chủ kho hoặc Repo Standards:

- Trang kiểu màn chưa nói: đi lại giữa các màn, thao tác làm ngay trên một dòng (dòng rời đi thế
  nào, tiêu điểm về đâu), hoàn tác mà kết quả nằm ở màn khác, trạng thái trống ở màn không tạo
  được gì. Tác tử dựng màn phải đoán cả bốn.
- Công thức «liên kết trông như nút» trong trang luật giao diện của sàn vẽ ra nút không viền.
  Trang đó còn ghi kiểm ở 1440 và 390, trong khi kho giờ kiểm cả 320.
- Sau khi adopt xong, dòng «bước kế» của audit vẫn chỉ sang adopt dù chạy lại không thêm được gì.
- Adopt chưa nói gì về kiểu màn và cỡ màn ở kho đã có: kho đối chứng kiểm bốn bề rộng, hẹp nhất
  360, và không được báo rằng mốc là 320.
- Dòng cỡ vùng bấm bỏ sót những control không khai chiều cao theo cách công cụ đọc được (ô đánh
  dấu 16 px ở kho đối chứng): không nằm trong danh sách đã đo lẫn danh sách không đo được.
- Không lệnh kiểm nào buộc màn có thao tác làm ngay phải khai trạng thái thất bại.
- Các sửa đổi sau lần thử này lại chưa được tác tử độc lập thử.

## Domain impact

Không có khái niệm nghiệp vụ nào. Plugin không được chứa bối cảnh của một sản phẩm.

## Plan

1. Tra lại nguồn cho các dòng `unchecked` trong bảng từ vựng.
2. Viết trang hướng dẫn cho ba tầng của lát đầu, theo khuôn trang tầng của Repo Standards.
3. Hàm tính màu từ source color, kèm bài kiểm tất định và bài kiểm contrast ratio.
4. Lệnh dẫn dắt: đọc tầng, hỏi, ghi decision record, gọi hàm tính, ghi tệp.
5. Lệnh chấm determinism rate.
6. Bài kiểm dựng kho trống và chạy trọn đường.

## Test plan

- Bảng từ vựng và hai tệp khai báo của plugin đã có bài kiểm, kèm ca đỏ sinh bằng mã.
- Hàm tính màu: chạy hai lần so kết quả; phá một giá trị thì bài kiểm contrast ratio phải đỏ.
- Lệnh dẫn dắt: chạy trên kho trống trong thư mục tạm; chạy lần hai phải không đổi gì.
- Lệnh chấm: một kho có lệnh kiểm không thể đỏ thì điểm không được tăng.

## Autonomy tier

Máy tự làm bước 1 đến 6 trong kho này sau khi chủ kho duyệt. Thay đổi ở Repo Standards hay kit
nghiệm thu nằm ngoài kho này. Phép đo tốn tiền API cần chủ kho cho phép riêng.

## Open questions

- Lớp hình của components: giữ bộ linh kiện đang có ở sàn, hay vẽ lại trên headless components?
  Lát đầu chưa chạm tới.
- Cách dữ liệu quyết định hiển thị (kiểu cột tiền, ngày, người): đã tra, ngành không có một tên
  chung. Polaris gọi «column content types», MUI gọi «column types», AG Grid gọi «cell data types».
  Bảng từ vựng tạm dùng «column type». Chủ kho chọn tên khi việc này thành một tầng.
- (Đã đóng 2026-11-12) Mức AAA dùng ngưỡng 7:1 cho chữ: đã đối chiếu tại nguồn, WCAG 2.2 tiêu chí
  1.4.6.
- Màu chính giữ nguyên source color khi đạt ngưỡng. Material Design thì lấy một tone cố định của
  palette. Hai cách cho hai màu nút khác nhau; hiện theo cách của sàn Repo Standards.
- Density, elevation, motion và iconography chưa nằm trong lát nào. Density phải đi cùng spacing:
  ở sàn này một đơn vị vừa là khoảng cách vừa là kích thước của control.
- Kho chưa có sàn của Repo Standards thì cuộc dẫn dắt làm gì: từ chối, hay đặt sàn trước?
- Plugin này không chạm phần làm lại do bài kiểm và hạ tầng, và không trả lời được trải nghiệm có
  tốt không.
- Một phiên khác đang đo và sửa tầng design ở Repo Standards. Kết quả ở đó có thể đổi sàn mà cuộc
  dẫn dắt đứng lên.
