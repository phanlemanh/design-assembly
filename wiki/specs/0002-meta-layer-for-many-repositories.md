---
type: spec
title: Design-assembly là lớp meta tạo và giữ design system cho nhiều kho
status: draft
tier: 1
links:
  - wiki/specs/0001-design-system-for-claude-code.md
  - wiki/decisions/0005-output-tiers-and-boundaries.md
  - wiki/decisions/0006-one-ledger-one-layer-list.md
  - wiki/decisions/0007-adopt-existing-values.md
  - wiki/decisions/0022-record-beside-a-list.md
sources:
  - "chủ kho, 2026-11-13: tầm nhìn và ba câu trả lời làm rõ"
  - docs/architecture/meta-layer.html
  - repo-standards/plugins/repo-setup/capabilities/design/preset.toml
  - repo-standards/docs/superpowers/specs/2026-11-09-design-layer-design.md
  - delivery-loop/design-floor/HOP-DONG-NHAP.md
  - delivery-loop/scripts/design-floor-bac.mjs
  - delivery-loop/docs/plans/lo-trinh-kit.json
  - onehub-inventory/wiki/decisions/0023-chon-truoc-tao-sau.md
  - onehub-inventory/tools/proof_gate/check.py
  - onehub-inventory/tools/design_check.py
---

# 0002 Design-assembly là lớp meta tạo và giữ design system cho nhiều kho

Bản nháp, máy viết ngày 2026-11-13 theo tầm nhìn chủ kho nêu cùng ngày. Chủ kho chưa duyệt bản
này. Ba câu trả lời của chủ kho được ghi nguyên ở mục Intent; mọi thứ còn lại là đề xuất của máy.

## Intent

**Tầm nhìn, lời chủ kho (2026-11-13).** Design-assembly được thiết kế như một lớp meta, là một
plugin, để tạo ra design system dùng trên nhiều kho. Inventory hiện làm hệ design bằng tay;
design-assembly sinh ra để lấp đúng khoảng trống đó cho mọi kho. Mỗi lần làm một kho, việc design
bị phân mảnh giữa Repo Standards, Acceptance Gate Kit (sẽ đổi tên thành delivery-loop) và phần tự
dựng bằng tay như Inventory đã làm.

**Ba điều chủ kho đã chốt khi được hỏi lại:**

1. «Meta cho nhiều kho» nghĩa là **chung lõi, riêng phần mở rộng**: các kho cùng họ sản phẩm chia
   một lõi chung; mỗi kho thêm phần riêng; thứ lặp lại ở nhiều kho được nâng lên lõi.
2. **Design-assembly là chủ duy nhất của mọi thứ thuộc design.** Repo Standards chỉ đặt kho và gọi
   nó; delivery-loop chỉ đọc sổ của nó. Phần design đang nằm ở hai kho kia dần chuyển về.
3. Công cụ Inventory tự dựng được **rút vào plugin, và Inventory chuyển sang dùng** plugin.

Câu thứ tư, «mọi kho rộng tới đâu», chủ kho hỏi lại: có giải được cả ba phạm vi không. Phân tích ở tài liệu kiến trúc, mục «Bộ chuyển, và ba mức phục vụ».

### Kiến trúc

Kiến trúc đầy đủ, kèm sáu sơ đồ, nằm ở `docs/architecture/meta-layer.html`: vấn đề phân mảnh đo trên
ba kho, nguyên lý gốc (dòng sổ quyết định), năm nguyên tắc, ba lớp lời đáp và lựa chọn lúc đặt kho,
bộ sổ của hợp đồng, bộ chuyển và ba mức phục vụ, vai của người và Claude Code, ranh giới ba plugin
và những gì chuyển chỗ, vòng đời một kho và đường nhập kho, họ hàng với kho tri thức, và lộ trình.
Trang này chỉ giữ tầm nhìn, tiêu chí, kế hoạch và câu còn mở; hai nơi không chép lẫn nhau.

Tóm tắt: một kho có một hợp đồng design, là một bộ sổ mà chỉ design-assembly ghi; Repo Standards
gọi nó, delivery-loop và tác tử dựng màn đọc nó. Lời đáp của kho đến từ ba lớp: phần riêng của kho,
lõi chung của họ sản phẩm, đề xuất của chuẩn. Thứ gì gắn với một loại kho cụ thể nằm trong bộ
chuyển. Luật đi theo sang mọi kho; mã linh kiện ở lại với thư viện của từng kho.

## Acceptance criteria

Tầm nhìn đạt khi, theo thứ tự:

1. Mỗi sổ của hợp đồng có đúng một hình dạng, viết thành tài liệu, và cả ba bên đọc được hình dạng
   đó. Hôm nay sổ linh kiện có ba, sổ màn có hai.
2. Ở Inventory, không cài phần nào của sàn, số câu lõi «máy giữ và chạy lại» lớn hơn 0 và tăng qua
   từng lát; hôm nay là 0 trên 24 câu đã đáp.
3. Bảng mẫu và cuốn sổ vẽ được trên Inventory.
4. Một khối mới vào Inventory qua đường nhập kho của plugin, từ nhu cầu tới dòng sổ, không dùng công
   cụ viết tay nào của Inventory.
5. Số công cụ design viết tay của Inventory giảm, đếm được: mỗi công cụ ở bảng «Những gì chuyển
   chỗ» hoặc bị thay, hoặc được ghi rõ là ở lại và vì sao.
6. Một kho thứ hai cùng họ thừa hưởng lõi của họ: không hỏi lại câu đã trả lời, và dùng lại ít nhất
   một khối đã nâng hạng.
7. Lõi không chứa tên thư viện hay nền dựng nào ngoài thư mục bộ chuyển; có bài kiểm cho điều đó.

## Domain impact

Không đổi mô hình dữ liệu của kho này. Hai sổ mới (nhập kho, nguồn ngoài) là tệp dưới `design/`,
không phải thực thể của ontology. Bảng từ vựng cần thêm tên ngành cho sổ nhập kho và sổ nguồn
ngoài trước khi cuộc dẫn dắt dùng tới.

## Plan

Thay cho chặng 4 tới 6 của lộ trình đã tạm duyệt; chặng 1 tới 3 (khoá phạm vi, màn thứ hai và
khung, thử lần bảy) giữ nguyên và đi trước.

1. **Hợp đồng.** Viết hình dạng của từng sổ thành tài liệu. Phân xử ba hình dạng sổ linh kiện và hai
   hình dạng sổ màn. Tách mọi tên thư viện trong plugin vào bộ chuyển.
2. **Đồng hành với Inventory.** Bộ chuyển Next.js cho bảng mẫu và cuốn sổ; phép đo trình duyệt qua
   dấu chung; nhận thật trên một nhánh riêng. Rồi rút từng công cụ của Inventory theo bảng «Những gì
   chuyển chỗ», bắt đầu từ sổ nguồn ngoài và sổ nhập kho.
3. **Hai kho bên cạnh chuyển sang gọi và đọc.** Repo Standards gọi design-assembly cho tầng design;
   delivery-loop đọc bộ sổ và dùng cơ chế nhập kho ở cổng phạm vi.
4. **Lõi của họ sản phẩm.** Hồ sơ quyết định dùng chung và registry khối nâng hạng; chứng minh trên
   một kho thứ hai.

## Test plan

- Mỗi hình dạng sổ có bài kiểm đọc được cả tệp của kho này lẫn tệp của Inventory.
- Bài kiểm tên thư viện: lõi không chứa tên nào trong danh sách tên của các bộ chuyển.
- Mỗi lát trên Inventory chạy trên bản sao trước, rồi mới trên một nhánh riêng của kho thật.
- Mỗi công cụ viết tay bị thay phải có một lần chạy song song cho ra cùng kết quả trước khi bỏ.
- Chạy thử độc lập như sáu lần trước, thêm một tác tử làm việc trên bản sao Inventory.

## Autonomy tier

Máy tự làm trong kho này sau khi chủ kho duyệt từng bước của Plan. Mọi thay đổi ở Repo Standards,
delivery-loop và Inventory cần chủ kho cho phép riêng, từng kho một. Tạo kho cho lõi của họ sản
phẩm và mọi việc đẩy lên GitHub là việc của chủ kho.

## Open questions

- Lõi của họ sản phẩm nằm ở kho nào, và registry mã của nó phát bằng gì.
- Hình dạng nào thắng cho sổ linh kiện: của kit (để kit đọc không cần đổi), hay một hình dạng mới
  mà kit có bản xuất.
- Trang kiểu màn và chứng minh màn của Inventory dùng khoá và tiêu đề tiếng Việt; plugin chỉ viết
  tiếng Anh. Giữ khoá tiếng Việt như một hình dạng được nhận, hay đổi.
- Thang M0 tới M3 của kit và sáu bậc của design-assembly đo gần cùng một thứ. Gộp thành một, hay để
  thang của kit đọc bậc của design-assembly.
- Phần chứng minh màn bằng ảnh theo từng vòng: đề xuất ở đây là thuộc delivery-loop, nhưng nó đọc
  nhiều sổ design nhất. Chủ kho phân xử.
- Kho không dùng Makefile thì cổng kiểm gắn vào đâu.
- Ai giữ phiên bản: một kho dùng plugin bản cũ và lõi của họ bản mới thì bên nào thắng.
