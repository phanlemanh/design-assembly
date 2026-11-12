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

| Tầng                 | Quyết định gì                                                          | Ai trả lời                                   | Máy giữ bằng                                     |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------ |
| Context              | Sản phẩm là công cụ làm việc hay trang đọc; nền kỹ thuật               | Người                                        | Decision record                                  |
| Foundations          | Theme: source color, type scale, spacing scale, shape, density, motion | Người chọn theme; máy tính các design tokens | Hàm thuần; contrast ratio và target size tự kiểm |
| Components           | Bộ core components; variant và state của từng cái                      | Máy đề xuất, người có quyền bác              | Kiểu đóng: sai thì không biên dịch               |
| Interaction patterns | Empty, loading, error state; lưu; destructive action                   | Máy, theo chuẩn có sẵn                       | State bắt buộc trong kiểu                        |
| Content guidelines   | Voice and tone, từ vựng nghiệp vụ, localization                        | Người                                        | Một nguồn nhãn, một hàm định dạng, design lint   |
| Templates            | Những template nào sản phẩm cần                                        | Người chọn trong danh sách đóng              | Một reference implementation cho mỗi template    |
| Accessibility        | Conformance level                                                      | Máy: AA, người có quyền bác                  | Kiểm trên màn đang chạy                          |
| Conformance          | Design lint, visual regression                                         | Máy                                          | Mỗi luật có ca đỏ và ca xanh                     |
| Distribution         | Registry và component manifest                                         | Máy                                          | Manifest sinh từ mã, có bước so                  |
| Governance           | Recipes, snowflakes, graduation, optical adjustment                    | Máy đặt sổ; người ghi lý do khi dùng         | Ngoại lệ không lý do thì bị chặn                 |

Người trả lời bốn loại câu hỏi: Context, theme, Content guidelines, Templates.

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

Mười tầng của cuộc dẫn dắt là các bước người dùng đi qua; bậc là thứ họ nhận được.

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
- Mức AAA dùng ngưỡng 7:1 cho chữ. Con số này máy nhớ từ WCAG 1.4.6, chưa đọc lại nguồn.
- Màu chính giữ nguyên source color khi đạt ngưỡng. Material Design thì lấy một tone cố định của
  palette. Hai cách cho hai màu nút khác nhau; hiện theo cách của sàn Repo Standards.
- Density, elevation, motion và iconography chưa nằm trong lát nào. Density phải đi cùng spacing:
  ở sàn này một đơn vị vừa là khoảng cách vừa là kích thước của control.
- Kho chưa có sàn của Repo Standards thì cuộc dẫn dắt làm gì: từ chối, hay đặt sàn trước?
- Plugin này không chạm phần làm lại do bài kiểm và hạ tầng, và không trả lời được trải nghiệm có
  tốt không.
- Một phiên khác đang đo và sửa tầng design ở Repo Standards. Kết quả ở đó có thể đổi sàn mà cuộc
  dẫn dắt đứng lên.
