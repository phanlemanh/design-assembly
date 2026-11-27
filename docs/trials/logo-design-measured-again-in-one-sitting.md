# Skill logo-design đo lại ở ổ tài sản thương hiệu, bản 0.4.0 (mục 12.3, lượt hai)

Một lượt, hai ca, ngày 2026-11-27 và 2026-11-28 (giờ máy, UTC+7). Lượt này chạy sau khi skill sửa ba lỗi mà
[lượt đầu](logo-design-measured-at-brand-assets.md) tìm thấy. Trần của lượt: 850 000 token cho phiên đo và tác tử của
nó. Bản quyết định đi kèm: [0132](../../wiki/decisions/0132-logo-design-measured-again-short-of-the-row.md). Đề chuẩn
không đổi một chữ: [`briefs/mark.md`](briefs/mark.md).

**Kết luận ngắn:**

- Ba lỗi của lượt đầu không còn: chữ của dấu không khuyết nét, và lệnh kiểm gói của skill giờ xem nét chữ; skill hỏi
  họ chữ và chữ của logo ngay trong lượt hỏi đầu, không phải sau khi gói đã dựng.
- Chủ repo đáp bốn câu chọn trong một lần bấm. Hai câu chỉ người viết được (quyền dùng dấu, giấy phép bộ biểu tượng)
  được hỏi ba lần và chưa có. Vì thế dòng dấu của cả hai ca **lại dừng ở bước chạy thử**, như lượt đầu.
- Dòng «xong khi» thứ hai của giai đoạn 12 **chưa đạt**: không có dòng dấu nào được ghi, dòng bộ biểu tượng chưa có
  giấy phép, và ở ca B máy tự ghi bộ biểu tượng mà không hỏi chủ repo. Mục 12.3 chưa xong.
- Một lượt sau chỉ cần đúng hai câu của chủ repo để ghi hai dòng; không phải vẽ hay dựng lại gì (xem «Còn thiếu gì»).

## Cách làm

- **Bản đo:** skill `logo-design` 0.4.0 (kho của skill, mã `5adaee03bd08d5447826c288a68ba6798dbf9a1f`), plugin 0.77.0
  (mã `1f09770`). Mỗi ca một tệp `DESIGN_ASSEMBLY_CORES` riêng; không mạng, không cài gì.
- **Ca B, làm mới:** một bản sao bỏ đi dựng lại từ đầu bằng đúng các bước cắt của lượt đầu; cây tệp ở mốc đầu giống hệt
  mốc đầu của lượt trước (`diff -r` không ra dòng nào), `make check` thoát 0. Một tác tử mới (Opus) nhận đề chuẩn và đoạn
  của ca B, không biết gì về lượt trước. Nó dừng khi đã vẽ phương án và xếp câu hỏi; phiên đo mang câu hỏi tới chủ repo
  một lần, ghi lời đáp bằng `decide --answers`, rồi cho chính tác tử ấy chạy tiếp.
- **Ca A, bằng lệnh, không tác tử:** bản sao của ca A lượt đầu, với các lời chủ repo đã đáp ở lượt ấy (dấu
  «cloud-pier», họ chữ «Geist», chữ «Cloud Pier»). Phiên đo dựng lại gói bằng skill 0.4.0 và chạy các lệnh kiểm. Bản
  0.4.0 chỉ đòi thêm một điều so với tờ cũ, là chữ của logo, và tờ quyết định của lượt đầu đã giữ lời ấy.
- **Đếm token** bằng [`count-tokens.mjs`](count-tokens.mjs), như lượt đầu.
- **Điều phiên đo tự làm ngoài đề:** chép lời «Cloud Pier» từ tờ quyết định vào tệp của thương hiệu ở ca A; chép lời
  «16, 14, 12» vào dòng bộ biểu tượng của ca A; chạy `make design-exports` ở ca A sau khi dòng ấy đổi.

## Lời chủ repo, nguyên văn

Phiên điều phối chuyển lời; phần trong «…» là lời của chủ repo.

| Câu trên hàng chờ của ca B    | Lời đáp (nhãn anh bấm, ngày 2026-11-27) |
| ----------------------------- | --------------------------------------- |
| `logo-concept-ben-may`        | «cloud-pier (Recommended)»              |
| `logo-wordmark-ben-may`       | «Geist (Recommended)»                   |
| `logo-wordmark-text-ben-may`  | «Ben May (Recommended)»                 |
| `icon-set-sizes-lucide-react` | «16, 14, 12 (Recommended)»              |

- Chữ «(Recommended)» là nhãn của hộp hỏi. Lời đáp cỡ biểu tượng dùng cho cả hai bản sao.
- **Giấy phép bộ biểu tượng** (`icon-set-licence-lucide-react`): không có câu nào.
- **Ai giữ quyền dùng dấu, dùng ở đâu:** không có câu nào.
- Ngày 2026-11-28, khi được báo rằng thiếu hai câu thì hai dòng sổ lại dừng ở bước chạy thử, anh đáp: «Chuyển bốn lời
  trước». Lời này không phải lời đáp cho hai câu kia.
- Hai điều anh được cho biết và không nói gì: ở ca B tác tử tự ghi bộ `lucide-react`; ở ca A biểu tượng trang vẽ từ
  một dấu nhỏ mà lượt đầu anh chưa thấy (lượt này anh được gửi ảnh phóng to).

**Số vòng của chủ repo:** một lần đáp cho bốn câu chọn; hai câu phải gõ được hỏi ba lần (hai lần ở phiên điều phối, một
lần ở phiên đo) và chưa có; một lời «Chuyển bốn lời trước»; một câu anh hỏi lại phiên đo («Cầm tôi quyết điều gì?»).
Lượt đầu là năm vòng và một lần cài họ chữ. Lượt này không cần cài gì, nhưng **chưa phải một lượt ngồi trọn**, vì lượt
ngồi chưa cho ra hai câu mà dòng sổ cần.

## Lượt chạy

| Chặng                             | Ca B (tác tử)                                                                  | Ca A (bằng lệnh)                      |
| --------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| Vẽ phương án, xếp câu hỏi         | Ba phương án (cloud-pier, b-cloud, tide); năm câu lên hàng chờ; khoảng 10 phút | Không chạy: dùng lời đáp của lượt đầu |
| Ghi lời chủ repo                  | `decide --answers`: «answers recorded: 4, by Manh Phan on 2026-11-27»          | Không có gì mới để ghi                |
| Dựng gói                          | 34 tệp và tờ kê; dựng hai lần ra cùng mã băm của tờ kê (tác tử báo)            | 34 tệp, dựng lại bằng 0.4.0           |
| `package.py verify`               | thoát 0                                                                        | thoát 0                               |
| `logo-source --package --dry-run` | thoát 1 (chờ câu quyền dùng dấu)                                               | thoát 1 (chờ câu quyền dùng dấu)      |
| `logo-source --package` thật      | **không chạy**: chưa có câu quyền dùng dấu                                     | **không chạy**: như ca B              |
| Cổng (`make design-assembly`)     | thoát 0                                                                        | thoát 0, sau khi viết lại bản xuất    |
| `make check`                      | thoát 0                                                                        | thoát 0                               |

Dòng của từng lệnh, do phiên đo tự chạy và đọc:

- `verify`, cả hai ca: «brand/ben-may/package: every file matches its manifest; the letters of 13 files were looked at
  and have no hole».
- Bước chạy thử, cả hai ca: «its 34 file(s) match the hashes its manifest lists»; «chosen: by Manh Phan on 2026-11-27,
  in logo-concept-ben-may of the waiting list: candidate cloud-pier»; «next: write who holds the right to use the mark,
  and where it may be used, into licence of design/sources/logo.json, in a person's words: until then the row is not
  held and the mark cannot be chosen»; «preview only: nothing was written».
- Cổng, cả hai ca: «design-assembly: 44 decisions held by 88 checks, each seen failing on a changed copy». Cổng **không
  có dòng nào** nói về dấu hay về bộ biểu tượng thiếu giấy phép.
- `make check`, cả hai ca: «make check passed: lint typecheck test ontology design-assembly design-guards ui-floor»; 80
  bài thử trên trình duyệt đạt.
- Ở ca A, lần chạy cổng đầu thoát 2 với một lỗi `design-exports`: thêm cỡ biểu tượng vào dòng làm bản xuất cũ đi.
  `make design-exports` rồi chạy lại thì xanh.
- `status` về hai dòng thiếu lời: ca B, «1 answer waits on the owner (icon-set-licence-lucide-react)», bước tiếp là
  `/design-assembly:decide`; ca A, cùng câu ấy, bước tiếp là `/design-assembly:new`. Về dấu, `status` chỉ nói «logo:logo:
  cloud-pier, by Manh Phan on 2026-11-27»; câu quyền dùng dấu chỉ hiện ở dòng «next» của bước chạy thử.

## Thước 1: giữ được không

| Điều                                         | Lượt đầu (0.3.0)                             | Lượt này (0.4.0)                                               |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Chữ của dấu                                  | «u» và «r» khuyết nét, mọi lệnh kiểm vẫn qua | Không khuyết; `verify` xem nét chữ của 13 tệp                  |
| Gói cũ của lượt đầu, kiểm bằng `verify` mới  | (chưa có)                                    | thoát 2, nêu chỗ khuyết ở 13 tệp                               |
| Cùng gói cũ ấy, qua bước chạy thử của plugin | khớp mọi mã băm                              | vẫn khớp mọi mã băm: plugin không xem hình                     |
| Gói mới qua `verify` và bước chạy thử        | đạt                                          | đạt, cả hai ca                                                 |
| Dòng dấu được ghi và được giữ                | chưa thấy                                    | **chưa thấy**                                                  |
| Cổng sau khi ghi dòng dấu                    | chưa thấy                                    | **chưa thấy**                                                  |
| Dòng bộ biểu tượng                           | có ghim, chưa giấy phép                      | có ghim và cỡ, chưa giấy phép: `status` nói dòng chưa được giữ |

**Phiên đo tự xem hình** (ảnh phóng to, không phải lời tác tử):

- Ca B, chữ «Ben May»: nét đặc, không khuyết; lòng chữ «B», «e», «a» mở đúng. Khoảng cách giữa dấu và chữ rộng cỡ
  một bề ngang của dấu.
- Ca B, dấu nhỏ ở 16 px: một vòm, một khe trắng rõ, một vạch mặt bến mảnh. Đám mây đọc thành một vòm đơn, không còn
  hai múi. Tệp là 16×16, phần mực chiếm 12×8.
- Ca B, dấu đầy đủ ở 16 px: khe thành một dải xanh nhạt, không còn trắng. Vì thế skill vẽ dấu nhỏ.
- Ca A, chữ «Cloud Pier»: không khuyết ở «u» và «r»; nét khớp bản dựng tham chiếu của họ Geist.
- Ca A, dấu nhỏ ở 16 px: mây, khe, mặt bến và hai cọc; dấu đầy đủ ở 16 px mất khe.

## Thước 2: phải đoán mấy chỗ

| Điều                       | Lượt đầu, ca B  | Lượt này, ca B                     |
| -------------------------- | --------------- | ---------------------------------- |
| Câu đưa lên hàng chờ       | 3               | 5                                  |
| Chỗ tự quyết, tác tử tự kê | 8               | 23 (17 ở chặng vẽ, 6 ở chặng dựng) |
| Dừng lại hỏi giữa chừng    | 0               | 0                                  |
| Quyết thay chủ repo        | 0 (đọc chặt: 1) | **1** (đọc chặt: 2)                |

- Hai tác tử kê theo độ mịn khác nhau; tác tử lượt này kê cả việc nhỏ (ngôn ngữ của câu hỏi, không viết trang quyết
  định). Con số 23 so với 8 nói về cách kê nhiều hơn là về skill.
- **Một lần quyết thay ở ca B:** tác tử ghi bộ `lucide-react` vào sổ bằng `icon-source --recommended` mà không xếp câu
  chọn bộ nào. Lượt đầu tác tử có hỏi và chủ repo đáp «Giữ lucide-react»; lượt này không có lời anh.
- **Đọc chặt thêm một:** biểu tượng trang của ca B vẽ từ một dấu nhỏ chủ repo chưa thấy.
- **Không tính, nhưng ghi lại:** tác tử soạn sẵn một câu giấy phép làm khuyến nghị cho câu hỏi giấy phép bộ biểu tượng.
  Câu ấy không được chép vào dòng.
- **Ca A** không có tác tử nên không đếm chỗ đoán. Quyết thay: 0 (đọc chặt: 1, dấu nhỏ; lượt này anh đã được xem ảnh
  và không đáp).
- Năm câu của ca B gồm ba câu của skill (dấu, họ chữ, chữ) và hai câu của dòng bộ biểu tượng (giấy phép, cỡ). Câu
  quyền dùng dấu không lên hàng chờ: plugin chỉ đòi nó khi dòng dấu đã viết.

## Thước 3: chạy được ở đâu

Không đổi so với lượt đầu: trên máy, không mạng, không tài khoản, không khoá; cần Python 3 và cairo. Họ chữ «Geist» đã
có trên máy từ lượt đầu. Điểm khác: bản 0.4.0 hỏi tên họ chữ ngay ở lượt hỏi đầu khi tên trong sổ («Geist Variable»)
không có trên máy, thay vì báo thiếu sau khi chủ repo đã chọn dấu. Chủ repo vẫn phải tự nói hai tên là một.

## Thước 4: tốn bao nhiêu

| Ai                        | Lượt đầu                   | Lượt này                                              |
| ------------------------- | -------------------------- | ----------------------------------------------------- |
| Tác tử ca B, chặng vẽ     | 246 781                    | 221 387                                               |
| Tác tử ca B, cả hai chặng | 308 442                    | 256 882 (chặng dựng thêm 35 495)                      |
| Tác tử ca A               | 289 898                    | 0: làm bằng lệnh                                      |
| Phiên đo hoặc điều phối   | 425 205                    | 341 270 theo công cụ; 459 547 đếm chặt                |
| Cộng                      | 1 023 545 (trần 1 300 000) | 598 152 theo công cụ; 716 429 đếm chặt (trần 850 000) |

Con số của phiên đo đếm lúc viết bản ghi này. Phiên đo bị nén ngữ cảnh một lần giữa chừng; `count-tokens.mjs` lấy ngữ
cảnh của lần gọi cuối nên không thấy phần đã nén. Số đếm chặt (đỉnh trước khi nén, cộng phần lớn thêm sau khi nén, cộng
chữ đã viết) ghi ngay cạnh số của công cụ.

## Sổ giới hạn sau lượt này

- **Đóng hai dòng:** `logo-package-drawing-unchecked` (lệnh kiểm của skill giờ xem nét chữ) và
  `logo-plug-wordmark-language-unasked` (skill hỏi chữ của logo trước khi dựng).
- **Năm dòng mới:** `logo-package-drawing-checked-by-the-plug-only`, `logo-row-titled-by-the-name-not-the-wordmark`,
  `icon-set-choice-not-asked-of-the-owner`, `decide-ask-takes-a-licence-as-a-recommendation`,
  `status-calls-a-queued-ground-a-measurement`.
- **Mức nặng giữ nguyên:** dòng `logo-package-drawing-checked-by-the-plug-only` thay cho dòng mức nặng vừa đóng và cũng ở mức nặng, theo lời chủ repo («Làm cả hai», 2026-11-28, sau lượt kiểm độc lập của phiên điều phối): một gói có chữ khuyết nét vẫn qua lệnh của plugin với mọi mã băm khớp, tức phép kiểm xanh trong khi thứ nó giữ đã hỏng. Số giới hạn mức nặng mà plugin in ra không đổi.
- **Vẫn mở, lượt này gặp lại:** `logo-design-plug-unmeasured` (câu của nó thêm phần lượt này), `logo-licence-sentence-stalls-the-row`,
  `logo-plug-small-mark-unseen`, `logo-package-unrecorded-unseen`, `logo-package-formatter-collides` (tác tử thêm sáu
  dòng vào tệp bỏ qua của bộ định dạng), `decide-ask-says-red-on-the-main-branch`, `status-next-names-new-for-a-licence`,
  `logo-plug-typeface-name-not-matched`.
- **Tệp phích:** chữ `about` sửa cho đúng bản 0.4.0 (tối đa ba câu hỏi trong một lượt ngồi). **Không thêm `measured`:**
  có mục ấy thì `plugs` sẽ hỏi chủ repo chọn phích, trong khi chưa lượt nào thấy dòng dấu được giữ và nguồn gốc bộ máy
  dựng hình chưa được chủ repo xác nhận.

## Còn thiếu gì, và chưa chứng được gì

**Hai câu của chủ repo, đủ để một lượt sau chỉ ghi hai dòng:**

1. Ai giữ quyền dùng dấu, và dấu được dùng ở đâu (vào `licence` của `design/sources/logo.json`, sau khi chạy
   `logo-source --package brand/ben-may/package` thật ở từng bản sao).
2. Bộ `lucide-react` được dùng theo giấy phép nào (vào `licence` của `design/sources/lucide-react.json`).

**Chưa chứng được:**

- Dòng dấu được ghi, được giữ, và cổng cùng `make check` sau khi ghi, ở cả hai ca. Một bản sao thăm dò (không tính vào
  số đo) cho thấy cổng xanh sau khi ghi dòng mà chưa có giấy phép; có giấy phép rồi thì chưa ai thấy.
- Dòng «xong khi» thứ hai của giai đoạn 12.
- Biểu tượng trang chưa nối vào `index.html` ở cả hai ca; phép kiểm `logo-use` chỉ có việc khi dòng dấu đã có.
- Tác tử báo dựng gói hai lần ra cùng mã băm; phiên đo không tự chạy lại điều này.
- Tác tử nói nó xem `preview.png`; phiên đo xem các ảnh cắt phóng to nêu ở Thước 1, không xem bản đơn sắc và bản nền
  tối.
- Nguồn gốc và giấy phép của bộ máy dựng hình của skill: chờ chủ repo xác nhận, như lượt đầu.

**Việc ngoài lượt này, chưa sửa:** `wiki/index.md` chưa có dòng cho quyết định 0131.
