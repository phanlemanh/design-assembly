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
---

# 0096 ReUI được đo ở ổ linh kiện theo bốn thước

## Status

Accepted, 2026-11-23. Phích thứ hai của mục 10.2, theo thứ tự chủ repo chốt; chủ repo cho đo phần miễn phí sau khi
nghe quy trình và ước tính.

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
     - Dòng cài đưa vào 32 tệp, 19 383 dòng và 2 gói, hỏi ghi đè hai linh kiện nền của repo, và thoát 0 khi không ai
       đáp.
     - Khối như được giao làm cổng đỏ: 226 lỗi lint, 71 lỗi kiểu, 8 lỗi phép kiểm sàn. Để xanh, người dựng tắt sàn và
       kiểm kiểu cho 16 tệp; sàn không còn giữ hình của thanh lọc. Hai lỗi lọt qua cổng.
     - Sau lúc nhập: dòng sổ giữ mã băm của 1 trên 32 tệp; cổng không so bản chụp với ghim; ReUI ra bản mới thì không gì
       báo.
     - Nhánh tự tạo: một tệp 84 dòng, mọi luật của sàn áp nguyên, không lỗi lọt.
   - **Người dùng phải đoán mấy chỗ: thua.** Nhánh ReUI 26 chỗ (tác tử khai 32), nhánh tự tạo 17 (khai 21), sau khi bỏ
     các chỗ chỉ có vì bản sao thiếu plugin. Sáu chỗ của nhánh ReUI là để khối qua được cổng.
   - **Chạy được ở đâu:** tìm qua máy chủ MCP cần mạng và tài khoản ReUI, kể cả phần miễn phí; cài cần mạng, không cần
     khoá; sau lúc cài chạy không mạng. Theo luật của 0008, đó là phích phụ.
   - **Tốn bao nhiêu:** tác tử ReUI 333 978 token, 20,6 phút, 5 vòng sửa; tác tử tự tạo 236 855 token, 9,6 phút, 2
     vòng.
3. **Theo luật chọn của 0008, phích của plugin giữ ổ linh kiện.** ReUI thua ở cả thước 1 và thước 2, nên `plugs` không
   khuyến nghị nó. Nó vẫn được bày, có nhãn «đã đo», và chủ repo vẫn chọn được nó.
4. **Điều ReUI làm tốt hơn:** một khối giàu hơn khối tự tạo (bốn điều kiện cho trạng thái, ba cho ngày, thẻ điều kiện),
   và máy chủ MCP có công cụ đối chiếu cách dùng và danh sách tự soát, lượt này chưa dùng.
5. **Tệp phích ghi điều thước 3 thấy:** `needs` là tài khoản và mạng, `sends` nói chữ tìm và tên linh kiện tới dịch vụ
   ReUI. Không lời chủ repo nào được ghi vào tệp phích.
6. **Đo lại** khi có lệnh ghim một nguồn ngoài, khi `intake` kiểm khối ngoài qua sàn trước lúc nhập, hoặc trên một món
   nhẹ hơn `filters`.

## Consequences

- Sáu dòng giới hạn mở ở `references/limits.json` cho điều lượt đo thấy và plugin chưa giữ: một dòng sổ cho nhiều tệp,
  dòng cài làm những gì không ai nói trước, nguồn ngoài ghim tay, cổng không giữ ghim của thư viện, khối ngoài nhập vào
  khi còn đỏ, và hai cách hiểu «mã nhà cung cấp» của sàn và của plugin (của Repo Standards). Hai dòng có sẵn được nói
  rộng hơn: chữ của nhu cầu phải trùng từng chữ, và `intake` cũng làm các tệp xuất cũ đi.
- Không đổi script hay mẫu của plugin, nên không lên bản. Một bài kiểm của `plugs` đổi theo nhãn mới của ReUI.
- Kế hoạch: mục 10.2 vẫn đang làm, hai trên bảy phích đã đo. Phích kế là frontend-design ở ổ dựng màn.
