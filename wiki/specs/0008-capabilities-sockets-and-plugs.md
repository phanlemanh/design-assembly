---
type: spec
title: Năng lực, ổ cắm và phích cắm — Design Assembly giữ lõi, ai làm tốt hơn thì cắm vào
status: approved
tier: 1
links:
  - wiki/specs/0002-meta-layer-for-many-repositories.md
  - wiki/specs/0004-the-command-set.md
  - wiki/specs/0007-widen-the-entry-the-system-and-the-intent.md
  - wiki/decisions/0031-adapters-hold-library-names.md
  - wiki/decisions/0057-the-sources-ledger-joins-the-contract-one-file-per-source.md
  - wiki/decisions/0044-one-contract-for-the-commands-that-exist.md
sources:
  - docs/plan/plan.json
  - docs/trials/outside-tools-hands-on.md
  - plugins/design-assembly/references/layers.json
  - plugins/design-assembly/references/tiers.json
  - plugins/design-assembly/templates/tools/design-assembly/adapters/index.mjs
  - "skill feature-loop bản 3.0.0 của Delivery Loop, đọc trên máy ngày 2026-11-20, chỉ đọc"
  - "skill morphological-scan của kit nghiệm thu bản 3.0.0, làm theo bốn bước của nó ngày 2026-11-20"
  - "chủ repo, 2026-11-20: «Cách Design Assembly làm nên như là một mô hình, framework,...chuẩn hóa năng lực, ổ cắm và phích cắm,...đảm bảo không lủng và trùng lắp. […] Design Assembly cũng sẽ làm nếu việc đấy chúng ta làm tốt hơn và có lợi cho người dùng hơn.»"
  - "chủ repo, 2026-11-20: «Duyệt cả sáu», đáp câu «Duyệt cả sáu khuyến nghị của mô hình ổ cắm và phích cắm?»"
  - "chủ repo, 2026-11-20: «Duyệt cả hai», đáp câu «Nhận năm năng lực mới và bỏ luật «mỗi lệnh một năng lực»?»"
---

# 0008 Năng lực, ổ cắm và phích cắm — Design Assembly giữ lõi, ai làm tốt hơn thì cắm vào

Máy viết ngày 2026-11-20. Chủ repo duyệt sáu khuyến nghị của mô hình cùng ngày («Duyệt cả sáu»). Sau lời duyệt, một
lượt quét cho đủ đã chạy như khuyến nghị 2 hẹn; nó thêm năm năng lực và sửa một luật. Chủ repo duyệt cả hai điều ấy
cùng ngày («Duyệt cả hai»). Danh mục đóng là hai mươi năng lực.

## Intent

Mỗi việc người dùng cần xong là một **năng lực**. Mỗi năng lực có một **ổ cắm** cố định do Design Assembly giữ, và
một hay nhiều **phích cắm** thay được. Design Assembly tự làm một phích khi đo được là nó làm tốt hơn và lợi cho
người dùng hơn; còn lại thì cắm đồ của bên đã làm tốt.

Kho này đã có đúng cách làm ấy ở tầng nền dựng: tám bộ chuyển (Vite, Tailwind, shadcn, React, Playwright, ESLint, và
hai cho Next.js) cho phép đổi thư viện mà lõi không biết tên thư viện nào, và có bài kiểm giữ điều đó (quyết định 0031, tiêu
chí 7 của đề bài 0002). Đề bài này đưa cùng cách làm lên tầng năng lực.

### Ba tầng

- **Lõi:** các sổ của hợp đồng, hàng chờ và cổng kiểm. Không giao ra ngoài.
- **Ổ cắm:** hợp đồng của một năng lực. Nó nói đầu vào là tệp gì, đầu ra là tệp gì, ghi vào sổ nào, lệnh kiểm nào
  giữ, và ai quyết (chủ repo hay máy).
- **Phích cắm:** bên thực hiện. Một lệnh của Design Assembly, hoặc một công cụ ngoài, miễn giao đúng thứ ổ cắm đòi.
  Phích ngoài được gọi ở tầng skill; script của plugin không gọi mô hình và không dùng mạng, như hôm nay.

### Hai luật

- **Không trùng:** mỗi sổ có đúng một bên được ghi, là ổ cắm của nó. Phích ngoài chỉ giao tệp cho ổ cắm, không ghi
  sổ và không ghi stylesheet.
- **Không lủng:** mỗi năng lực có một phích mặc định chạy được khi chưa cài gì thêm. Năng lực chưa có phích thì là
  một dòng trong sổ giới hạn, không được im lặng.

Khi mặc định của một phích ngoài ngược với sổ, sổ thắng. Lần thử tay cho thấy vì sao cần câu này: một skill của
Stitch ép font và ô bấm 44px, còn loại Design của Claude Design cấm tự kiểm
([trang đo](../../docs/trials/outside-tools-hands-on.md)).

### Cách Delivery Loop ghép đồ ngoài, đọc từ skill của nó

1. Kiểm đồ phụ thuộc một lần; thiếu thì dừng và in đúng lệnh cài.
2. Gọi skill ngoài để nghĩ, nhưng đè một hành vi của nó, và mỗi lựa chọn thành một dòng sổ có căn cứ.
3. Luật của repo thắng mặc định của skill con.
4. Gặt thứ skill ngoài ghi ra vào sổ của mình, bằng một cầu nối.
5. Đồ không bắt buộc thì có lối lùi, và nói rõ là đang lùi.

Design Assembly lấy luật 2 tới 5. Nó không lấy luật 1: nó không có phụ thuộc bắt buộc nào, vì plugin phải chạy được
một mình trên mọi repo.

### Danh mục năng lực, sau lượt quét

Hai trục của lượt quét: **chặng** của vòng đời (sáu giá trị) và **tầng** của hệ (bảy tầng trong
`references/layers.json`). Thước đo độ đủ: tám giai đoạn của một studio và mười ba lệnh ở đề bài 0004, bảy tầng, sáu
bậc trong `references/tiers.json`, và ba hệ thiết kế có thật đối chiếu theo trí nhớ, chưa tra lại hôm nay: GOV.UK
Design System, IBM Carbon, Shopify Polaris.

Cột «Nguồn» ghi năng lực vào danh mục từ đâu: **duyệt** là có trong danh mục 15 của lượt duyệt đầu; **quét** là lượt
quét thêm vào, chủ repo duyệt ở lượt hai. Cả hai mươi nay đều đã duyệt.

| Chặng    | Năng lực                  | Ổ cắm giữ gì                        | Phích mặc định hôm nay              | Phích khác cắm được              | Nguồn |
| -------- | ------------------------- | ----------------------------------- | ----------------------------------- | -------------------------------- | ----- |
| Biết     | Rà soát                   | báo cáo và bậc                      | `audit`, `status`                   | chưa thấy ai                     | duyệt |
| Biết     | Kiểm kê kho               | phát hiện theo sổ                   | `inventory`, `find`                 | chưa thấy ai                     | duyệt |
| Quyết    | Khám phá                  | dòng nguyên tắc, bối cảnh           | `new`                               | skill hỏi-đáp                    | duyệt |
| Quyết    | Tham chiếu                | dòng sổ nguồn, có ghim              | **chưa có**                         | Mobbin, ảnh người dùng đưa       | duyệt |
| Quyết    | Hướng đi                  | ứng viên, rồi dòng quyết định       | danh mục đóng và bảng mẫu           | Claude Design, Stitch            | duyệt |
| Quyết    | Chốt                      | dòng quyết định có tên và ngày      | `decide` (lõi)                      | không cho cắm                    | duyệt |
| Dựng hệ  | Nền                       | stylesheet, token, lệnh kiểm        | `new`, `adopt`                      | Claude Design, Stitch            | duyệt |
| Dựng hệ  | Tài sản thương hiệu       | logo, font, bộ icon, ghi ở sổ nguồn | **chưa có**                         | Claude Design                    | quét  |
| Dựng hệ  | Linh kiện                 | dòng sổ nhập kho                    | `intake`                            | shadcn, ReUI (đã cắm)            | duyệt |
| Dựng hệ  | Mẫu tương tác             | trang hành vi, bảng trạng thái      | `new`                               | chưa thấy ai                     | quét  |
| Dựng hệ  | Nội dung                  | bảng thuật ngữ                      | **chưa có**                         | `design:ux-copy`                 | duyệt |
| Dựng hệ  | Khuôn màn                 | trang của một loại màn              | **chưa có** (viết tay cùng người)   | chưa thấy ai                     | quét  |
| Dùng hệ  | Đề bài dựng màn           | dữ liệu của một màn sắp dựng        | **chưa có** (mục 5.1)               | chưa thấy ai                     | duyệt |
| Dùng hệ  | Dựng màn                  | code qua cổng                       | tác tử đọc trang luật               | `frontend-design`, `ux-ui-craft` | duyệt |
| Dùng hệ  | Soát thiết kế             | phát hiện trỏ về dòng sổ            | cổng kiểm; phần nhìn **chưa có**    | `design-critique`, axe           | duyệt |
| Dùng hệ  | Báo cáo khả năng truy cập | bản báo cáo tuân thủ                | **chưa có** (cổng mới đo, chưa báo) | `accessibility-review`           | quét  |
| Giao     | Trưng bày và bàn giao     | cuốn hướng dẫn, ghi chú phát hành   | `handoff`                           | trang hệ của Claude Design       | duyệt |
| Giao     | Dùng chung giữa các repo  | hồ sơ quyết định, khối nâng hạng    | **chưa có** (giai đoạn 7)           | chưa thấy ai                     | quét  |
| Giữ, đổi | Lên đời và đổi            | sổ đổi theo, cổng xanh              | `upgrade`, `change`                 | chưa thấy ai                     | duyệt |
| Giữ, đổi | Quản trị                  | sổ giới hạn, sổ lỗi lọt             | lõi                                 | không cho cắm                    | duyệt |

Hai mươi năng lực, tám chỗ chưa có phích. Cột «phích khác» là ứng viên, chưa phải phán quyết: nội dung các skill
ngoài chưa được đọc.

**Lượt quét bắt được gì.**

- Hai tầng đã có trong `layers.json` mà danh mục 15 không có dòng nào: mẫu tương tác và khuôn màn.
- Một trong tám giai đoạn của studio bị gộp mất: báo cáo khả năng truy cập.
- Giai đoạn 7 của kế hoạch (lõi của họ sản phẩm) không có năng lực nào đứng tên.
- Tài sản thương hiệu: cả ba hệ thiết kế đối chiếu đều có mục icon hay tài sản; đề bài 0007 cũng nêu logo và font
  không có chỗ vào.

**Ngoài danh mục, có lý do.**

- Nghiên cứu người dùng, và bản thử bấm được: thuộc việc làm sản phẩm; bản thử là bước `design-pass` của Delivery
  Loop.
- Cộng đồng và hỗ trợ người dùng hệ: Design Assembly phục vụ một repo và chủ của nó.
- Phát token cho nền ngoài web: để sau, khi có repo cần.
- Chuyển động, độ nổi, biểu đồ: là nội dung của tầng nền, không phải một năng lực.

**Áp cho mọi ổ cắm.** Đầu ra máy đọc được theo hợp đồng chung của lệnh (0044), để plugin bên cạnh gọi được mà không
cần người. Design Assembly cũng sẽ là phích của người khác: Repo Standards gọi nó sau khi đặt nền, kit nghiệm thu đọc
sổ màn của nó (giai đoạn 6, chưa làm).

### Luật chọn ai làm

Một phích được làm mặc định khi thắng theo bốn thước, đo trên bản sao bằng đề chuẩn:

1. **Giữ được không:** đầu ra có đúng thứ ổ cắm đòi, và kiểm được bằng lệnh.
2. **Người dùng phải đoán mấy chỗ:** con số của chuỗi chạy thử.
3. **Chạy được ở đâu:** cần tài khoản, khoá hay mạng thì chỉ làm phích phụ.
4. **Tốn bao nhiêu:** token và thời gian.

Design Assembly tự làm một phích khi thắng ở thước 1 hoặc 2, hoặc khi không bên nào đủ điều kiện làm mặc định. Mỗi
phán quyết là một bản quyết định kèm số đo, và đo lại khi công cụ ngoài đổi bản.

Phán quyết đầu tiên đã có số đo: ở năng lực **nền**, lập từ code, Claude Design để lại 12 chỗ phải tự quyết và bỏ sáu
nấc bo góc; Stitch ra văn xuôi không lệnh nào kiểm được; `adopt` giữ nguyên giá trị và đặt lệnh kiểm quanh. Nền là
việc Design Assembly tự làm. Các năng lực khác chưa có số đo.

### Sáu khuyến nghị chủ repo đã duyệt

1. Nhận mô hình ba tầng, ổ cắm luôn thuộc Design Assembly.
2. Danh mục năng lực là danh mục đóng; thêm bớt là lời chủ repo. Một lượt quét cho đủ chạy trước khi chốt.
3. Luật chọn bốn thước: mặc định cắm đồ ngoài khi nó đạt ổ cắm; tự làm khi đo được là tốt hơn.
4. Ba phép kiểm bằng máy: không trùng, không lủng, lõi sạch.
5. Tên bên thứ ba chỉ nằm trong thư mục phích cắm, như luật của bộ chuyển.
6. Thứ tự: đề bài này; mục 5.0 dựng bảng năng lực và ba phép kiểm; rồi `review` (mục 5.2) là ổ cắm đầu tiên có
   phích ngoài.

## Acceptance criteria

Cho mục 5.0. Mỗi dòng chứng bằng một lệnh.

1. Plugin có một bảng năng lực máy đọc được: mỗi năng lực nêu ổ cắm (sổ, đầu ra, lệnh kiểm, người quyết) và các
   phích của nó.
2. **Không lủng:** một bài kiểm đỏ khi một năng lực không có phích mặc định mà cũng không có dòng sổ giới hạn.
3. **Không trùng:** một bài kiểm đỏ khi hai ổ cắm cùng khai ghi một sổ, hoặc một script ghi một sổ không thuộc ổ cắm
   của nó.
4. **Lõi sạch:** một bài kiểm đỏ khi tên một công cụ bên thứ ba nằm ngoài thư mục phích cắm.
5. Mỗi tầng của `layers.json` và mỗi bậc của `tiers.json` được ít nhất một năng lực với tới; có bài kiểm.
6. `status` in bảng ổ cắm của repo đang đứng: phích nào đang cắm ở ổ nào, ổ nào còn trống.
7. Hành vi các lệnh đang có không đổi: bộ bài kiểm của plugin xanh, đầu ra chỉ khác ở phần mới của `status`.

## Domain impact

Không đổi mô hình nghiệp vụ của kho này; `ontology/` không đổi. Hợp đồng sổ không thêm sổ nào ở mục 5.0: bảng năng
lực là tệp tham chiếu của plugin, như `layers.json`. Phích ngoài đầu tiên (mục 5.2) có thể thêm loại mục vào hàng
chờ; điều đó thuộc bước ấy.

## Plan

1. **5.0**, mục mới của giai đoạn 5: bảng năng lực, ba phép kiểm, bảng ổ cắm trong `status`. Các lệnh đang có chỉ
   được khai là phích của ổ cắm tương ứng; không lệnh nào viết lại.
2. **5.2 `review`** là ổ cắm đầu tiên có phích ngoài: phần nhìn giao cho một skill soát có sẵn; Design Assembly viết
   phần gặt, tức nối mỗi phát hiện với một dòng sổ, không nối được thì vào hàng chờ.
3. **5.1 `brief`** là dữ liệu của ổ cắm «đề bài dựng màn»; phần dựng do phích «dựng màn» làm.
4. Mỗi phích ngoài được cắm kèm một bản quyết định có số đo theo bốn thước.

## Test plan

- Ba phép kiểm có bài thử làm hỏng: bỏ phích mặc định của một năng lực, cho hai ổ cắm cùng ghi một sổ, đặt tên một
  công cụ ngoài vào lõi; mỗi lần cổng phải đỏ.
- Phích ngoài đo trên bản sao bỏ đi bằng đề chuẩn, so với phích của Design Assembly ở cùng ổ cắm. Lượt thử tốn token
  nên hỏi chủ repo trước mỗi lần.

## Autonomy tier

Máy tự dựng mục 5.0 sau lời duyệt, một PR; gộp là lời của chủ repo. Thêm hay bớt một năng lực, đổi phích mặc định
của một ổ cắm, và cắm một phích ngoài cần tài khoản hay gửi dữ liệu ra ngoài: luôn là lời chủ repo. Không sửa
Delivery Loop, Repo Standards hay repo kiểm chứng.

## Open questions

Mỗi câu kèm một khuyến nghị. Chủ repo đáp cả hai câu theo khuyến nghị ngày 2026-11-20 («Duyệt cả hai»).

1. **Nhận năm năng lực lượt quét thêm vào, để danh mục đóng là hai mươi?** Tài sản thương hiệu, mẫu tương tác,
   khuôn màn, báo cáo khả năng truy cập, dùng chung giữa các repo. Khuyến nghị: nhận cả năm. Bốn cái đã có tên trong
   tài liệu chủ repo từng duyệt (hai tầng, một giai đoạn của studio, một giai đoạn của kế hoạch); chỉ tài sản thương
   hiệu là mới hẳn. Đã nhận: danh mục đóng là hai mươi.
2. **Sửa luật «mỗi lệnh phục vụ đúng một năng lực» máy đã nêu lúc xin duyệt?** `new` và `adopt` đi qua nhiều tầng,
   nên luật ấy sai với chính các lệnh đang có. Khuyến nghị: bỏ luật ấy, giữ luật «mỗi sổ có đúng một bên được ghi»;
   một lệnh dẫn dắt là một lộ trình đi qua nhiều ổ cắm, không phải một phích. Đã nhận: luật ấy bỏ.
