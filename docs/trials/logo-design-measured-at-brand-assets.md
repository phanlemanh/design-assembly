# Skill logo-design đo ở ổ tài sản thương hiệu (mục 12.3, lát 2)

Một lượt, hai ca, ngày 2026-11-27, từ 09:41 tới 10:36 cho các tác tử (giờ máy, UTC+7). Chủ repo cho chạy sau khi nghe quy trình và
ước tính: câu hỏi «Anh chọn «Chạy cả hai ca» (khoảng 1,0 triệu, trần 1,3 triệu) hay «Một ca trước» (ca B, khoảng 550
nghìn, trần 700 nghìn)?», lời đáp «Chạy cả hai ca». Bản quyết định đi kèm:
[0131](../../wiki/decisions/0131-logo-design-measured-at-the-brand-assets-socket.md). Đề chuẩn mới:
[`briefs/mark.md`](briefs/mark.md).

**Kết luận ngắn:**

- Gói dấu của phương án chủ repo chọn dựng được ở cả hai ca: 34 tệp (ca A) và 26 tệp (ca B). Lệnh kiểm gói của skill
  đạt, và `logo-source --package --dry-run` của plugin so khớp mọi mã băm, đọc đúng người chọn từ tờ quyết định.
- Lượt đo dừng ở bước chạy thử theo lời chủ repo («Dừng ở đây»): câu ai giữ quyền dùng dấu, dùng ở đâu, được hỏi nhiều lần
  và không được viết. Dòng dấu chưa được ghi, nên dòng được giữ và cổng sau khi ghi chưa thấy ở cả hai ca. Cổng của hai
  bản sao xanh ở bước chạy thử.
- Sau khi kiểm, ca A còn 10 chỗ phải đoán (2 vào hàng chờ, 8 tự quyết lặng lẽ), ca B còn 11 (3 vào hàng chờ, 8 lặng lẽ).
  Lời đáp, giấy phép, tên hay ngày ghi thay chủ repo: 0 ở cả hai ca. Hai điều đứng sát ranh giới được nêu riêng ở thước 2.
- Không phải một lượt ngồi: chủ repo phải đáp năm vòng (chọn dấu, chữ và bộ biểu tượng; cho cài một họ chữ; đặt tên họ
  chữ; đặt chữ của logo bằng tiếng Anh sau khi gói đã dựng; rồi cho dừng) và cài một font lên máy. Nguyên do là skill không nối được tên họ chữ của sổ («Geist Variable», tên gói font trang web) với
  tên của bản cài trên máy («Geist»).
- Chạy ở đâu: trên máy, không mạng, không tài khoản, không khoá; cần Python 3, `cairocffi` và thư viện cairo, và họ chữ
  tiêu đề của repo cài trên máy nếu muốn có chữ đi kèm dấu.
- Tốn: 1 023 545 token cho cả lượt tới lúc viết bản ghi (hai tác tử 598 340, phiên điều phối 425 205), trần 1,3 triệu.

## Cách làm

- **Phích đo:** skill `logo-design`, bản 0.3.0, ở kho skill riêng của chủ repo tại `bc8015b` (nhánh master), cùng bộ máy
  dựng hình `geometric-construction` nằm cạnh. Phiên điều phối chép hai thư mục ấy bằng `git archive` vào thư mục nháp;
  thư mục `work/` của kho skill không được theo dõi nên không đi theo, và không gì của nó được chép.
- **Plugin:** `git archive` của `f72363f` (plugin 0.77.0) vào thư mục nháp, không đổi trong lúc chạy. Bản sao không cài
  plugin; mỗi bản sao có một tệp chạy `bin/da <lệnh>`, đặt `DESIGN_ASSEMBLY_CORES` vào một tệp riêng của ca, chạy
  `node <plugin>/scripts/<lệnh>.mjs … --target <bản sao>`.
- **Hai bản sao bỏ đi:** `git archive` của `f72363f` (worktree của phiên này), mỗi ca một thư mục. Bỏ đúng danh sách của
  lần 17: `plugins/`, `docs/`, `wiki/decisions/`, `wiki/specs/`, `tests/plugin-*`, `mk/plugin.mk`, `mk/plan.mk`, hồ sơ
  bộ kit (`_acceptance/`), cộng `LO-TRINH.html`. Bỏ phần kế hoạch của `AGENTS.md`; bỏ 146 dòng của `wiki/index.md` và
  252 dòng của `wiki/log.md` trỏ tới trang đã bỏ (hai lượt: liên kết tới bản quyết định, đề bài và `docs/`, rồi liên
  kết tới tệp của plugin, vì kiểm wiki đỏ ở bốn liên kết gãy). Định dạng lại ba trang ấy. Đặt tên sản phẩm bịa «Bến Mây»
  vào thẻ `<title>` của `index.html`. `git init` riêng, `npm ci` riêng.
- **Xanh trước khi bắt đầu:** `make check` đạt ở cả hai bản sao: 94 bài đơn vị, 80 bài trình duyệt, 43 quyết định giữ
  bằng 86 phép kiểm. Hai lần đầu đỏ vì chính việc cắt (định dạng, rồi bốn liên kết gãy), sửa như trên.
- **Ca A, có bộ biểu tượng và chưa có dấu:** sau mốc đầu, phiên điều phối chạy `da icon-source --package lucide-react`
  (ghi dòng `design/sources/lucide-react.json`, ghim 1.72.0 theo tệp khoá, chưa có giấy phép) rồi `make design-exports`;
  cổng xanh; commit làm mốc. Không ai viết giấy phép cho dòng ấy.
- **Ca B, chưa có gì:** bản sao như ở mốc đầu: sổ nguồn không có dòng bộ biểu tượng hay dấu nào.
- **Đề:** [`briefs/mark.md`](briefs/mark.md) nguyên văn tới hết mục «What to report», đoạn của ca thay vào chỗ của nó,
  rồi lời thêm: đường dẫn bản sao; bản sao không cài plugin, chạy `bin/da <lệnh>` thay cho `/design-assembly:<lệnh>`, chạy
  chứ không đọc; chủ repo đã chọn skill `logo-design` để dựng dấu, ở thư mục nào, đọc `SKILL.md` của nó và theo nó cùng
  điều repo bảo đọc; không gửi gì của repo ra ngoài; chỗ skill và repo chỉ hai hướng thì nói và nói theo bên nào.
- **Tác tử:** hai tác tử con mới, kiểu `general-purpose`, mỗi ca một tác tử, chạy song song. Mọi lượt trả lời trong bản
  ghi của cả hai là của `claude-opus-5-5`. Không tác tử nào nhận kết luận của phiên điều phối hay biết về lượt trước.
- **Chặng 2:** sau lời chủ repo, phiên điều phối ghi lời đáp lên tờ quyết định của bản sao bằng
  `da decide --answers FILE --by "Manh Phan" --on 2026-11-27`, rồi nhắn tiếp cho đúng tác tử ấy (giữ bối cảnh), báo lời
  đáp nguyên văn, chuyện cài họ chữ, và rằng câu quyền dùng dấu chưa có nên chỉ được chạy lệnh ghi sổ với `--dry-run`.

## Lời chủ repo, nguyên văn

Phiên điều phối gửi chủ repo hai tấm phương án (ảnh `concepts.png` của mỗi ca) và hỏi bằng bốn câu chọn một. Lời đáp:

| Câu                                               | Lời đáp            |
| ------------------------------------------------- | ------------------ |
| Ca A: anh chọn dấu nào cho «Bến Mây»?             | «cloud-pier»       |
| Ca B: anh chọn dấu nào?                           | «o-may»            |
| Chữ «Bến Mây» đi kèm dấu (cả hai ca)              | «Chờ cài Geist»    |
| Ca B: màn của «Bến Mây» lấy biểu tượng từ bộ nào? | «Giữ lucide-react» |

Câu quyền dùng dấu, xin ở ô ghi chú của hai câu đầu, không đến (ô trống). Sau đó, ở phiên này, chủ repo gõ «Download cho
tôi Geist»; phiên này tải tệp phát hành chính thức của Vercel (`geist-font-v1.9.2.zip`, 8,8 MB) vào thư mục nháp và
không dùng nó. Ở phiên điều phối, chủ repo đáp «Cho cài Geist» cho câu nêu đúng lệnh `brew install --cask font-geist`;
phiên này chạy đúng lệnh ấy (font-geist 1.9.2, 18 tệp otf và 2 tệp ttf vào `~/Library/Fonts`). Chủ repo cũng gõ «Cài
đi» ở phiên này, khi họ chữ đã cài; không cài thêm gì. Skill vẫn báo họ chữ thiếu (thước 3). Ở phiên điều phối, chủ repo
đáp «Ghi «Geist»» cho câu ba lối «Ghi «Geist»», «Tạm chỉ dùng dấu», «Dừng ở đây». Sau đó, ở phiên điều phối, chủ repo tự nói, không ai hỏi: «Logo dùng tiếng anh hoặc tiếng việt không dấu. Tôi ưu tiên dùng
tiếng anh.» Hỏi «Cloud Pier» hay «Ben May», hay một tên khác, anh đáp «Cloud Pier». Hỏi quyền dùng dấu hai ca có như nhau
không, anh bấm «Như nhau, tôi gõ câu»; câu ấy không đến. Cuối cùng, hỏi gõ câu ấy hay để lượt đo kết thúc ở bước chạy thử,
anh đáp «Dừng ở đây». Câu ai giữ quyền dùng dấu, dùng ở đâu, không được viết ở cả hai ca.

Tờ quyết định của mỗi bản sao ghi: `logo-concept-ben-may` giữ (phương án đứng đầu), `logo-wordmark-ben-may` một giá trị
«Ghi «Geist»», và ở ca B `icon-set-ben-may` giữ; người đáp Manh Phan, ngày 2026-11-27.

## Lượt chạy

| Chặng                 | Ca A                                                                                           | Ca B                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 1, giờ                | 09:48:20 – 09:56:38, 39 lượt mô hình, 40 lần gọi công cụ                                       | 09:48:30 – 09:58:38, 46 lượt, 46 lần gọi                                                                    |
| 1, kết thúc ở         | 3 phương án (cloud-pier, m-piles, harbour), 2 câu `decide --ask`, dừng                         | 3 phương án (b-nam, thuyen-may, o-may), 3 câu `decide --ask`, ghi dòng bộ biểu tượng theo khuyến nghị, dừng |
| Câu lên hàng chờ      | `logo-concept-ben-may` (khó đảo, `logo:logo`, 3 phương án), `logo-wordmark-ben-may`            | như ca A, cộng `icon-set-ben-may` (dễ đảo, `decision:icons`)                                                |
| 2, giờ                | 10:25:17 – 10:28:41, 15 lượt, 15 lần gọi                                                       | 10:25:15 – 10:29:32, 15 lượt, 18 lần gọi                                                                    |
| 2, kết thúc ở         | `brand.json` một khoá; gói 34 tệp có dấu nhỏ; `verify` 0; `logo-source --dry-run` 1; cổng xanh | `brand.json` một khoá; gói 26 tệp; `verify` 0; `logo-source --dry-run` 1; cổng xanh                         |
| Vòng sửa cổng         | 1 (Prettier từ chối ba tệp bản dựng viết)                                                      | 1 ở chặng 1 (tệp xuất cũ sau `icon-source`), 1 ở chặng 2 (Prettier)                                         |
| `make check` lúc dừng | xanh                                                                                           | xanh                                                                                                        |

Không tác tử nào commit. Không tác tử nào dừng hỏi người trong phiên: mọi câu cho chủ repo đi qua hàng chờ.

**Chặng 3, chữ «Cloud Pier».** Phiên điều phối xếp câu `logo-wordmark-text-ben-may` và ghi lời «Cloud Pier» của chủ repo
lên tờ quyết định của hai bản sao, rồi nhắn tiếp cho hai tác tử. Mỗi tác tử dựng lại gói (6 lượt mô hình, 5 đến 6 lần gọi,
khoảng 2 phút), `verify` 0, `logo-source --package --dry-run` khớp 34/34 và 26/26 tệp, cổng xanh, rồi dừng. Gói 34 tệp mang
chữ «Bến Mây» của ca A (chặng 2) bị thay; số đo của nó giữ ở bảng trên. Skill nhận tên sản phẩm và chữ của dấu thành
hai tham số: chữ «Cloud Pier» chỉ vào chữ và hai khoá; tên «Bến Mây» còn ở `title` của tờ kê, `README.md`, tờ thương hiệu
và ảnh xem trước, và `logo-source` lấy `title` làm tên dòng («mark: Bến Mây»). Lời chủ repo chỉ nói về chữ trong logo,
nên không ai đổi tên ấy; trang của skill lại nói chữ của dấu là tên như người viết.

## Thước 1: giữ được không

Phiên điều phối đo bằng lệnh, không gọi mô hình, trên chính bản sao của mỗi ca:

| Đo gì                                | Ca A                                          | Ca B                                             |
| ------------------------------------ | --------------------------------------------- | ------------------------------------------------ |
| `package.py verify` (lệnh của skill) | 0: mọi tệp khớp tờ kê                         | 0                                                |
| Tờ kê theo hình dạng `LOGO_PACKAGE`  | có `candidate` cloud-pier, `made` logo-design | có `candidate` o-may                             |
| Vai trong gói                        | mark, wordmark, hai khoá, favicon, app-icon   | như ca A                                         |
| `logo-source --package … --dry-run`  | 34/34 tệp khớp; người chọn đọc từ hàng chờ    | 26/26; người chọn đọc từ hàng chờ                |
| `logo-source --package` (ghi thật)   | không chạy, theo lời chủ repo                 | không chạy, theo lời chủ repo                    |
| Cổng có `logo-pins`, `logo-use`      | chưa thấy: không có dòng dấu                  | chưa thấy: không có dòng dấu                     |
| Dòng bộ biểu tượng                   | có sẵn (mốc của ca), chưa có giấy phép        | tác tử ghi bằng `icon-source`, chưa có giấy phép |

Điều không lệnh nào giữ, thấy khi kiểm:

- **Ca A có một dấu chủ repo không thấy.** Sau lời chọn, tác tử thấy chi tiết của cloud-pier mờ ở 16 px và vẽ thêm một
  dấu nhỏ theo luật của skill («a simpler mark for small sizes»). Biểu tượng trang của gói vẽ từ dấu nhỏ ấy, tức chỗ
  dùng đầu tiên mà đề nêu là một hình chủ repo chưa từng thấy. Tờ kê ghi nó là vai `mark`; không gì đòi chủ repo xem lại.
- **Họ chữ của chữ đi kèm dấu không nối với sổ.** Sổ font ghi Geist qua gói `@fontsource-variable/geist` 5.3.0; chữ
  trong gói vẽ từ bản cài Homebrew font-geist 1.9.2. Không phép kiểm nào so hai thứ, và một chữ vẽ bằng họ khác cũng qua.
- **Gói chỉ dựng lại được ngoài repo.** `brand/ben-may/build.py` cần biến `LOGO_DESIGN_HOME` trỏ tới skill nằm ngoài
  repo; mã băm chỉ trùng khi dựng cùng ngày, vì ngày dựng vào tờ kê. Điều skill hứa («whoever has the repository can
  build the mark again») không đứng ở đây; dòng giới hạn `logo-package-rebuild-unchecked` đã nói plugin không kiểm.
- **Bộ định dạng của repo đụng mã băm.** Ở cả hai ca, `make check` đỏ vì Prettier không nhận ba tệp bản dựng viết; định
  dạng lại thì gói hỏng. Hai tác tử cùng tự quyết thêm ba dòng vào `.prettierignore`.
- **Bán kính skill đọc không phải bán kính của repo.** `package.py answers` in `radius = 0.5rem (repo)` (khoá `radius.md`
  của `design/tokens.json`); `--radius` của `src/index.css` là `0.625rem`. Không phương án nào dùng nó, nên không đổi gì
  ở lượt này; đây là điều của kho skill.

## Thước 2: phải đoán mấy chỗ

Luật đếm của [`README.md`](README.md), cùng độ chặt với lần 17: chỗ một trang của repo hay của skill đã nói thì bỏ; chỗ
trùng gộp; chỗ có câu trên hàng chờ vẫn là chỗ phải đoán, tính «vào hàng chờ». Tác tử A khai 14 chỗ ở chặng 1, 9 ở chặng
2 và 1 ở chặng 3; tác tử B khai 12, 9 và 2.

| #   | Chỗ                                                             | Ca A                          | Ca B                          | Vì sao giữ                                                                                    |
| --- | --------------------------------------------------------------- | ----------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Tên «Bến Mây» nghĩa là gì, sản phẩm làm gì                      | lặng lẽ                       | lặng lẽ                       | Không trang nào nói; cả hai đọc nghĩa đen của tên và ghi cách đọc ấy trong lý do câu hỏi      |
| 2   | Ý và hình của các phương án                                     | hàng chờ                      | hàng chờ                      | Chủ repo chọn trên tấm phương án; gộp số phương án, lưới, thứ tự                              |
| 3   | Chữ đi kèm dấu: họ chữ của sổ không có trên máy                 | hàng chờ                      | hàng chờ                      | Skill dừng ở đó và xếp câu                                                                    |
| 4   | Bộ biểu tượng nào                                               | —                             | hàng chờ                      | Câu `icon-set-ben-may`; tác tử ghi dòng theo khuyến nghị trước lời đáp (xem dưới)             |
| 5   | Đọc «Ghi «Geist»» thành họ chữ «Geist»                          | lặng lẽ                       | lặng lẽ                       | Đúng ý câu chủ repo được hỏi, nhưng tác tử không thấy câu ấy; cả hai nêu cách đọc khác        |
| 6   | Dựng lại gói cần skill ngoài repo (`LOGO_DESIGN_HOME`)          | lặng lẽ                       | lặng lẽ                       | Gộp `CHOSEN` ghi cứng trong bản dựng (ca B)                                                   |
| 7   | Ngày dựng vào tờ kê, mã băm đổi theo ngày                       | lặng lẽ                       | lặng lẽ                       |                                                                                               |
| 8   | Ba dòng `.prettierignore` để cổng xanh mà gói không hỏng        | lặng lẽ                       | lặng lẽ                       | Đổi cấu hình của repo, không ai hỏi                                                           |
| 9   | Dấu nhỏ cho cỡ 16 px, hình của nó                               | lặng lẽ                       | — (không vẽ)                  | Skill bảo vẽ khi chi tiết mất; hình của nó không ai thấy                                      |
| 10  | Tên tệp và tên phương án tiếng Việt không dấu, trái `AGENTS.md` | — (tên tiếng Anh)             | lặng lẽ                       | Skill lấy tên từ tên sản phẩm, `AGENTS.md` đòi tên tệp tiếng Anh; B theo skill                |
| 11  | Chữ trong logo viết bằng ngôn ngữ nào                           | lặng lẽ (skill)               | lặng lẽ (skill)               | Skill vẽ tên như được viết, có dấu, không hỏi; chủ repo nói sau khi gói đã dựng, gói dựng lại |
| 12  | Tên sản phẩm còn trong gói khi chữ của dấu đổi                  | lặng lẽ                       | lặng lẽ                       | Cả hai giữ «Bến Mây» ở `title`, tờ thương hiệu, ảnh xem trước; không ai nói                   |
|     | **Cộng**                                                        | **10: 2 hàng chờ, 8 lặng lẽ** | **11: 3 hàng chờ, 8 lặng lẽ** |                                                                                               |

Bỏ, kèm lý do: thư mục `brand/<slug>/`, mã câu hỏi, cờ, câu chữ đi kèm, vẽ lại một phương án mờ, giữ phương án mờ kèm
ghi chú, chữ của dấu viết như tên được viết (skill nói); thứ tự phương án và khuyến nghị đứng đầu (luật của hàng chờ);
không ghi nhật ký wiki, không ghi sổ lỗi lọt, không commit (`AGENTS.md` nói lúc nào làm; đề nói xong khi cổng xanh); câu
`idea` chép từ ghi chú phương án; không gắn biểu tượng trang (skill nói là một thay đổi riêng); không xếp câu giấy phép
(phiên điều phối dặn); gắn mục `decision:icons` vào câu bộ biểu tượng (định danh).

**Con số lung lay tới đâu:**

- Chặt hơn (gộp 6 với 7 thành «gói dựng lại được», bỏ 5 vì lời chủ repo nói đúng điều ấy, bỏ 11 vì skill có luật): ca A 7, ca B 8.
- Lỏng hơn (tính cả chỗ tác tử không khai mà phiên này thấy: tỷ lệ chữ so với dấu, độ đậm, khoảng trống quanh dấu và cỡ
  nhỏ nhất trên tờ thương hiệu đều là giá trị «floor» của skill, không ai đáp): ca A 9, ca B 10.

**Quyết thay chủ repo.** Không tác tử nào ghi lời đáp, giấy phép, tên người hay ngày của chủ repo: lời đáp do phiên điều
phối ghi bằng lời nguyên văn, và cả hai chỉ chạy lệnh ghi dòng dấu với `--dry-run`. Đếm: 0 ở cả hai ca. Hai điều đứng sát
ranh giới, đọc chặt thì mỗi điều là 1:

- ca A, dấu nhỏ của biểu tượng trang (thước 1): chủ repo chọn cloud-pier mà chưa thấy hình sẽ đứng ở thẻ trình duyệt;
- ca B, dòng bộ biểu tượng ghi trước lời đáp: `icon-source --recommended` theo luật của repo «go on with your
  recommendation» cho câu dễ đảo; dòng ở `proposed`, chưa có giấy phép, và chủ repo giữ đúng khuyến nghị ấy.

**Ca B và dòng «xong khi» thứ hai của giai đoạn.** Bộ biểu tượng đã ghim (dòng `lucide-react`, chủ repo giữ), dấu do chủ
repo chọn (o-may), 0 lần quyết thay theo cách đếm trên. Không phải «một lượt ngồi»: chủ repo đáp ba vòng và cài một font.
Dòng dấu không được viết vì câu quyền dùng dấu không có; dòng «xong khi» này chưa đạt.

## Thước 3: chạy được ở đâu

- **Máy:** Python 3 với `cairocffi` và thư viện cairo, đã có sẵn trên máy này. Không mạng, không tài khoản, không khoá;
  kịch bản của skill không gọi mô hình hay dịch vụ nào. Tệp phích hôm nay nói đúng điều ấy bằng lời chung.
- **Họ chữ tiêu đề cài trên máy**, nếu muốn có chữ đi kèm dấu. Repo nạp Geist qua một gói font trang web
  (`@fontsource-variable/geist`, tên «Geist Variable»), nên máy không có nó. Skill không tự thay họ chữ khác (đúng luật của
  nó), nên dừng và hỏi. Sau khi chủ repo cho cài `font-geist` bằng Homebrew, skill vẫn báo thiếu: hàm `font_available` của
  nó trả `False` cho «Geist Variable» và `True` cho «Geist». Chủ repo phải đáp thêm một câu để chữ được vẽ.
- **Skill ngoài repo:** bản dựng trong repo cần đường dẫn tới skill để chạy lại.
- **Bộ máy dựng hình** đến từ một tệp nén không có kho gốc; giấy phép chưa rõ (skill tự nêu ở `limits.json` của nó). Đây
  là điều chủ repo phải xác nhận trước khi phát hành phích; nó không chặn lượt đo.

## Thước 4: tốn bao nhiêu

Đếm bằng [`count-tokens.mjs`](count-tokens.mjs): ngữ cảnh của lượt gọi cuối cộng chữ mô hình viết ở mọi lượt, mỗi lượt
một lần theo mã tin nhắn; chặng 2 của một tác tử là phần tăng (`share`) sau 10:00.

| Ai                       | Token         | Lượt mô hình | Lần gọi công cụ | Thời gian                                                              |
| ------------------------ | ------------- | ------------ | --------------- | ---------------------------------------------------------------------- |
| Tác tử ca A, chặng 1     | 231 845       | 39           | 40              | 8 phút 18 giây                                                         |
| Tác tử ca A, chặng 2     | +33 191       | 15           | 15              | 3 phút 24 giây                                                         |
| Tác tử ca A, chặng 3     | +17 624       | 6            | 6               | khoảng 2 phút                                                          |
| Tác tử ca A, cả ba chặng | 289 898       |              |                 |                                                                        |
| Tác tử ca B, chặng 1     | 246 781       | 46           | 46              | 10 phút 08 giây                                                        |
| Tác tử ca B, chặng 2     | +35 774       | 15           | 18              | 4 phút 17 giây                                                         |
| Tác tử ca B, chặng 3     | +18 638       | 6            | 5               | khoảng 2 phút                                                          |
| Tác tử ca B, cả ba chặng | 308 442       |              |                 |                                                                        |
| Phiên điều phối          | 425 205       |              |                 | 09:41 tới lúc viết bản ghi, phần lớn là chờ tác tử và chờ lời chủ repo |
| **Cả lượt**              | **1 023 545** |              |                 | trần 1,3 triệu                                                         |

Phần lớn token của mỗi tác tử là đọc repo ở chặng 1 (khoảng 230 nghìn), như các lượt đo dựng màn trước (295 nghìn ở lần
17). Chặng 2 rẻ: khoảng 35 nghìn mỗi ca.

## Phía so sánh: sàn của plugin

Sàn của dấu là chữ: tên sản phẩm bằng họ chữ tiêu đề, không tệp nào sinh ra; bản thiết kế không nêu dấu thì đọc là
`text` (`references/contract.md`). Đo bằng lệnh trên trạng thái đầu của ca B (`git archive` của commit mốc, không tác tử):
`status` không nêu gì về dấu hay biểu tượng; `brand-assets` không in gì (repo chưa có dòng nào của hai loại thì không
nói gì); `design/blueprint.json` không có khoá nào về dấu; `index.html` chỉ có `<title>Bến Mây</title>`, không biểu
tượng trang.

| Thước             | Sàn (chữ)                         | Phích logo-design                                                      |
| ----------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Giữ được không    | Không tệp nào để giữ; tên là chữ  | Gói có tờ kê, mã băm, lệnh nhận của plugin so khớp; xem thước 1        |
| Phải đoán mấy chỗ | 0 chỗ, 0 câu: không ai vẽ gì      | 10 và 11 chỗ; 2 và 3 câu cho chủ repo                                  |
| Chạy được ở đâu   | Mọi nơi                           | Máy có Python, cairo, và họ chữ tiêu đề cài trên máy                   |
| Tốn bao nhiêu     | 0 token                           | khoảng 270 và 290 nghìn mỗi ca                                         |
| Để lại gì         | Không biểu tượng trang, không dấu | Dấu, chữ, hai khoá, biểu tượng trang, biểu tượng ứng dụng, ba biến thể |

Sàn thắng ở ba thước vì nó không làm việc mà đề đòi: thẻ trình duyệt vẫn không có dấu. Đây là chỗ bốn thước không tự
phân xử; chủ repo quyết (thước nào nặng hơn là lời của anh, theo tiêu chí 19).

## Điều tìm thấy, chưa sửa

1. Skill vẽ chữ của logo theo tên như được viết, không hỏi ngôn ngữ; tên sản phẩm và chữ của dấu là hai tham số mà trang
   nói là một, và dòng sổ lấy tên từ tờ kê (chặng 3). Dòng giới hạn mới `logo-plug-wordmark-language-unasked`.
2. Skill không nối tên họ chữ của sổ với tên bản cài trên máy (thước 3). Dòng giới hạn mới
   `logo-plug-typeface-name-not-matched`.
3. Biểu tượng trang của gói có thể vẽ từ một dấu nhỏ chủ repo chưa thấy (thước 1). Dòng giới hạn mới
   `logo-plug-small-mark-unseen`.
4. `status` không thấy một gói dấu đã dựng, đã chọn mà chưa có dòng; câu giấy phép chỉ hiện khi dòng đã viết. Dòng giới
   hạn mới `logo-package-unrecorded-unseen`.
5. Bộ định dạng của repo đụng tệp của gói; cả hai tác tử tự thêm `.prettierignore`. Dòng giới hạn mới
   `logo-package-formatter-collides`.
6. `decide --ask --item logo:…` nói «until then the gate is red for it», mà cổng xanh trên bản sao: bản sao đứng ở `main`,
   tường `owner-calls` chỉ giữ nhánh. Cả hai tác tử báo đây là câu không đúng. Dòng giới hạn mới
   `decide-ask-says-red-on-the-main-branch`.
7. Khi việc chờ duy nhất là giấy phép của dòng bộ biểu tượng, `status` nêu bước kế là `/design-assembly:new` (tác tử B báo,
   phiên này thấy lại). Dòng giới hạn mới `status-next-names-new-for-a-licence`.
8. `da help` không có (`help.mjs` không tồn tại); tệp chạy của lượt đo, không phải của plugin. Không ghi.
9. Câu quyền dùng dấu được hỏi nhiều lần mà không được viết; lượt đo dừng ở bước chạy thử. Đây là một điểm vướng của lối
   giao gói, không phải lỗi của người. Dòng giới hạn mới `logo-licence-sentence-stalls-the-row`.
10. Điều của kho skill, không ghi ở sổ của plugin: bán kính đọc nhầm khoá; mã băm theo ngày; bản dựng cần skill ngoài repo;
    phép kiểm ở 16 px chỉ bằng mắt.
