---
type: decision
title: "ReUI được đo ở ổ linh kiện theo bốn thước"
links:
  - wiki/specs/0014-outside-plugs-set-up-in-one-sitting.md
  - wiki/specs/0008-capabilities-sockets-and-plugs.md
  - wiki/decisions/0062-intake-takes-a-block-in-only-on-the-owners-answer.md
  - wiki/decisions/0088-claude-design-system-measured-on-four-measures.md
sources:
  - docs/trials/reui-components-measured.md
  - docs/trials/briefs/component.md
  - plugins/design-assembly/references/plugs/reui.json
  - "chủ repo, 2026-11-23, mở phiên: «Đo các phích ngoài, kế tiếp là ReUI.»"
  - "chủ repo, 2026-11-23: «Đo đủ, phần miễn phí»"
  - "chủ repo, 2026-11-24, sau soát PR #119: «Gửi sang sửa»"
---

# 0096 ReUI được đo ở ổ linh kiện theo bốn thước

## Status

Accepted, 2026-11-23. Phích thứ hai của mục 10.2, theo thứ tự chủ repo chốt; chủ repo cho đo phần miễn phí sau khi
nghe quy trình và ước tính. Sửa ngày 2026-11-24 theo ba điểm soát PR #119: điều dòng cài đã đổi, tổng cả lượt so với
trần, và điều cần tài khoản là theo tài liệu của ReUI.

Phạm vi thu hẹp ngày 2026-11-24 bởi [0098](0098-choose-before-make-at-the-components-socket.md): số đo giữ nguyên, nhưng
kết luận «không thắng phích của plugin» chỉ là số đo một lần dùng đầu, trên repo chưa có bước chuẩn hoá. Nó không còn
quyết lời khuyên ở ổ linh kiện: ở ổ ấy ReUI là một bậc của thang `intake` khi repo ghim nó, và `plugs` không hỏi gì.
Điểm 3 dưới đây là luật đã áp hôm đo.

## Context

Ổ linh kiện giữ dòng sổ nhập kho của một khối. Phích của plugin là `intake` với kho của repo và bộ khởi đầu
([0062](0062-intake-takes-a-block-in-only-on-the-owners-answer.md)); bậc 2 của nó nhận «nguồn ngoài có ghim», tới nay
mới kiểm bằng một nguồn giả. ReUI là một registry kiểu shadcn, có máy chủ MCP; phần miễn phí là 27 linh kiện và các ví
dụ. Đề bài 0014 đòi mỗi phích được đưa lên «đã đo» có một bản quyết định với số đo bốn thước (tiêu chí 11). Bản 0088 đo
một công cụ lập hệ; ở ổ linh kiện không giá trị nào được chép, nên thước 1 đo khối có qua sàn và được giữ sau lúc nhập
không, thước 2 đo trên một đề mới, `docs/trials/briefs/component.md`, hai nhánh cùng một nhu cầu.
Số đo: [docs/trials/reui-components-measured.md](../../docs/trials/reui-components-measured.md).

## Decision

1. **Phích `reui` nay là «đã đo» ở ổ linh kiện, không thắng phích của plugin** (`beats_plugin: false`).
2. **Số đo theo bốn thước**, nhu cầu «lọc danh sách theo trạng thái và ngày», linh kiện miễn phí `filters`:
   - **Giữ được không: thua.**
     - Không lệnh nào ghim nguồn: nguồn, danh mục, bản chụp và mã băm viết tay. Chữ của nhu cầu phải trùng chữ của danh
       mục.
     - Dòng cài đưa vào 32 tệp, 19 383 dòng và 2 gói, và hỏi có ghi đè hai linh kiện nền của repo không. Không ai đáp
       thì nó thoát 0 mà chưa chép linh kiện nào, nhưng lúc ấy đã sửa `components.json`, `package.json` và
       `package-lock.json`.
     - Khối như được giao làm cổng đỏ: 226 lỗi lint, 71 lỗi kiểu, 8 lỗi phép kiểm sàn. Để xanh, người dựng tắt sàn và
       kiểm kiểu cho 16 tệp; sàn không còn giữ hình của thanh lọc. Hai lỗi lọt qua cổng.
     - Sau lúc nhập: dòng sổ giữ mã băm của 1 trên 32 tệp; cổng không so bản chụp với ghim; ReUI ra bản mới thì không gì
       báo.
     - Nhánh tự tạo: một tệp 84 dòng, mọi luật của sàn áp nguyên, không lỗi lọt.
   - **Người dùng phải đoán mấy chỗ: thua.** Nhánh ReUI 26 chỗ (tác tử khai 32), nhánh tự tạo 17 (khai 21), sau khi bỏ
     các chỗ chỉ có vì bản sao thiếu plugin. Sáu chỗ của nhánh ReUI là để khối qua được cổng.
   - **Chạy được ở đâu:** tìm qua máy chủ MCP cần mạng; theo tài liệu của ReUI nó cần tài khoản ReUI, kể cả cho phần
     miễn phí, nhưng lượt này không kiểm: mọi lần gọi đi dưới phiên chủ repo đã đăng nhập. Cài cần mạng, không cần
     khoá; sau lúc cài chạy không mạng. Mạng đã đủ làm nó thành phích phụ theo luật của 0008.
   - **Tốn bao nhiêu:** tác tử ReUI 333 978 token theo số công cụ báo (408 265 đã xử lý), 20,6 phút, 5 vòng sửa; tác
     tử tự tạo 236 855 (234 307 đã xử lý), 9,6 phút, 2 vòng. Cả lượt, kể phiên điều phối, đã xử lý 818 026 token,
     **vượt trần 700 nghìn** của lời cho đo; ước tính là khoảng 450 nghìn. Tác tử ReUI cũng vượt trần 300 nghìn của
     nó.
3. **Theo luật chọn của 0008, phích của plugin giữ ổ linh kiện.** ReUI thua ở cả thước 1 và thước 2, nên `plugs` không
   khuyến nghị nó. Nó vẫn được bày, có nhãn «đã đo», và chủ repo vẫn chọn được nó.
4. **Điều ReUI làm tốt hơn:** một khối giàu hơn khối tự tạo (bốn điều kiện cho trạng thái, ba cho ngày, thẻ điều kiện),
   và máy chủ MCP có công cụ đối chiếu cách dùng và danh sách tự soát, lượt này chưa dùng.
5. **Tệp phích ghi điều thước 3 thấy:** `needs` là tài khoản và mạng, `sends` nói chữ tìm và tên linh kiện tới dịch vụ
   ReUI. Mạng là điều lượt này thấy; tài khoản lấy từ tài liệu của ReUI, chưa thấy, và có một dòng giới hạn nói vậy.
   Không lời chủ repo nào được ghi vào tệp phích.
6. **Đo lại** khi có lệnh ghim một nguồn ngoài, khi `intake` kiểm khối ngoài qua sàn trước lúc nhập, hoặc trên một món
   nhẹ hơn `filters`.

## Consequences

- Bảy dòng giới hạn mở ở `references/limits.json` cho điều lượt đo thấy và plugin chưa giữ: một dòng sổ cho nhiều tệp,
  dòng cài làm những gì không ai nói trước, nguồn ngoài ghim tay, cổng không giữ ghim của thư viện, khối ngoài nhập vào
  khi còn đỏ, hai cách hiểu «mã nhà cung cấp» của sàn và của plugin (của Repo Standards), và điều phích cần tài khoản
  lấy từ tài liệu của nơi làm ra nó, chưa đo. Hai dòng có sẵn được nói
  rộng hơn: chữ của nhu cầu phải trùng từng chữ, và `intake` cũng làm các tệp xuất cũ đi.
- Không đổi script hay mẫu của plugin, nên không lên bản. Một bài kiểm của `plugs` đổi theo nhãn mới của ReUI.
- Kế hoạch: mục 10.2 vẫn đang làm, hai trên bảy phích đã đo. Phích kế là frontend-design ở ổ dựng màn.
